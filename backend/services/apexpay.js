import axios from 'axios'
import crypto from 'crypto'
import dotenv from 'dotenv'
dotenv.config()

const BASE_URL   = process.env.APEXPAY_BASE_URL  // ขอจาก ApexPay
const USERNAME   = process.env.APEXPAY_USERNAME  // Merchant ID
const SECRET_KEY = process.env.APEXPAY_SECRET_KEY

// ─── Signature ตาม docs ───────────────────────────────────────
// 1. sort keys ASCII
// 2. key1=value1&key2=value2&secret_key={key}
// 3. MD5
function generateSign(params) {
  // กรอง null/undefined ออก — ตาม docs "if value is null, skip"
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([_, v]) => v !== null && v !== undefined)
  )

  // sort keys ASCII
  const sorted = Object.keys(filtered)
    .sort()
    .reduce((acc, k) => { acc[k] = filtered[k]; return acc }, {})

  // สร้าง query string + secret_key
  const str = Object.entries(sorted)
    .map(([k, v]) => `${k}=${v}`)
    .join('&') + `&secret_key=${SECRET_KEY}`

  return crypto.createHash('md5').update(str).digest('hex')
}

// ─── POST /api/v1/third-party/agency-withdraws ────────────────
export async function sendPayout({
  orderNumber,
  amount,
  bankName,
  bankCardNumber,
  bankCardHolderName,
  notifyUrl,
}) {
  const params = {
    username:             USERNAME,
    amount:               String(amount), // docs ใช้ string
    order_number:         orderNumber,
    notify_url:           notifyUrl || process.env.APEXPAY_CALLBACK_URL,
    bank_name:            bankName,
    bank_card_number:     bankCardNumber,
    bank_card_holder_name: bankCardHolderName,
  }

  params.sign = generateSign(params)

  const res = await axios.post(
    `${BASE_URL}/api/v1/third-party/agency-withdraws`,
    params,
    { headers: { 'Content-Type': 'application/json' } }
  )

  // ตรวจสอบ response
  if (![200, 201].includes(res.data.http_status_code)) {
    throw {
      status:  400,
      message: res.data.message || 'Withdrawal failed',
      error_code: res.data.error_code,
    }
  }

  return res.data
}

// ─── POST /api/v1/third-party/withdraw-queries ────────────────
export async function getPayoutStatus({ orderNumber }) {
  const params = {
    username:     USERNAME,
    order_number: orderNumber,
  }
  params.sign = generateSign(params)

  const res = await axios.post(
    `${BASE_URL}/api/v1/third-party/withdraw-queries`,
    params,
    { headers: { 'Content-Type': 'application/json' } }
  )

  return res.data
}

// ─── POST /api/v1/third-party/profile-queries (balance) ───────
export async function getBalance() {
  const params = { username: USERNAME }
  params.sign  = generateSign(params)

  const res = await axios.post(
    `${BASE_URL}/api/v1/third-party/profile-queries`,
    params,
    { headers: { 'Content-Type': 'application/json' } }
  )

  return res.data
}

// ─── Verify Webhook Signature ─────────────────────────────────
// ตาม docs: remove sign → sort → md5 → compare
export function verifyWebhookSignature(data) {
  const { sign, ...rest } = data

  // กรอง null ออก
  const filtered = Object.fromEntries(
    Object.entries(rest).filter(([_, v]) => v !== null && v !== undefined)
  )

  const expectedSign = generateSign(filtered)
  return expectedSign === sign
}

// ─── Map status number → string ───────────────────────────────
export function mapStatus(statusCode) {
  const code = Number(statusCode)
  if ([4, 5].includes(code))       return 'SUCCESS'
  if ([6, 7, 8].includes(code))    return 'FAILED'
  if ([1,2,3,11].includes(code))   return 'PROCESSING'
  return 'PROCESSING'
}

// ─── Error code → Thai message ────────────────────────────────
export const ERROR_MESSAGES = {
  1:  'ยอดเงินไม่เพียงพอ',
  2:  'ฟังก์ชันถอนเงินไม่ได้เปิดใช้งาน',
  3:  'ข้อมูลไม่ครบถ้วน',
  4:  'ไม่พบผู้ใช้งาน',
  5:  'Signature ไม่ถูกต้อง',
  6:  'มีรายการซ้ำ กรุณารอสักครู่',
  8:  'เลข Order ซ้ำ',
  9:  'ระบบถอนเงินปิดอยู่',
  10: 'จำนวนเงินต่ำกว่าขั้นต่ำ',
  11: 'จำนวนเงินเกินวงเงินสูงสุด',
  13: 'ช่องทางอยู่ระหว่างปิดปรับปรุง',
  18: 'IP ไม่ได้รับอนุญาต กรุณาติดต่อผู้ดูแลระบบ',
  22: 'ไม่รองรับธนาคารนี้',
}