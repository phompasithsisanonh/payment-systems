import express from 'express'
import { requireAuth, requireAuthWithCsrf } from '../middleware/auth.js'
import Payout from '../models/Payout.js'
import {
  sendPayout,
  getPayoutStatus,
  verifyWebhookSignature,
  mapStatus,
  ERROR_MESSAGES,
} from '../services/apexpay.js'

const router = express.Router()

// ─── POST /api/payout/transfer ────────────────────────────────
router.post('/transfer', requireAuthWithCsrf, async (req, res) => {
  const orderNumber = 'TXN-' + Date.now()

  try {
    // บันทึก PENDING ก่อน
    const payout = await Payout.create({
      referenceId:   orderNumber,
      accountName:   req.body.accountName,
      accountNumber: req.body.accountNumber,
      bankCode:      req.body.bankName, // ApexPay ใช้ชื่อธนาคารเต็ม
      amount:        req.body.amount,
      note:          req.body.note,
      status:        'PENDING',
      createdBy:     req.user.id,
    })

    const result = await sendPayout({
      orderNumber,
      amount:             req.body.amount,
      bankName:           req.body.bankName,
      bankCardNumber:     req.body.accountNumber,
      bankCardHolderName: req.body.accountName,
    })

    // บันทึก system_order_number จาก ApexPay
    await Payout.findByIdAndUpdate(payout._id, {
      payoutId:    result.data?.system_order_number,
      referenceNo: orderNumber,
      status:      'PROCESSING',
    })

    res.json({ success: true, data: result.data })

  } catch (err) {
    await Payout.findOneAndUpdate(
      { referenceId: orderNumber },
      {
        status:     'FAILED',
        failReason: ERROR_MESSAGES[err.error_code] || err.message,
      }
    )
    res.status(err.status || 500).json({
      success:    false,
      error_code: err.error_code,
      message:    ERROR_MESSAGES[err.error_code] || err.message,
    })
  }
})

// ─── GET /api/payout/list ─────────────────────────────────────
router.get('/list', requireAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query
    const filter = status ? { status: status.toUpperCase() } : {}

    const [payouts, total] = await Promise.all([
      Payout.find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .populate('createdBy', 'username'),
      Payout.countDocuments(filter),
    ])

    res.json({ success: true, data: payouts, total, page: Number(page) })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── GET /api/payout/status/:id ──────────────────────────────
router.get('/status/:id', requireAuth, async (req, res) => {
  try {
    const local = await Payout.findOne({
      $or: [
        { referenceId: req.params.id },
        { referenceNo: req.params.id },
        { payoutId:    req.params.id },
      ]
    })

    if (!local)
      return res.status(404).json({ success: false, message: 'ไม่พบรายการ' })

    // ถ้ายัง PROCESSING → ถาม ApexPay
    if (local.status === 'PROCESSING') {
      const remote = await getPayoutStatus({ orderNumber: local.referenceId })
      if ([200, 201].includes(remote.http_status_code)) {
        const newStatus = mapStatus(remote.data?.status)
        await Payout.findByIdAndUpdate(local._id, { status: newStatus })
        local.status = newStatus
      }
    }

    res.json({ success: true, data: local })
  } catch (err) {
    res.status(500).json({ success: false, message: err.message })
  }
})

// ─── POST /api/payout/webhook ─────────────────────────────────
router.post('/webhook', express.json(), async (req, res) => {
  const { data } = req.body

  if (!data)
    return res.status(400).json({ message: 'Invalid payload' })

  // Verify signature ตาม docs
  if (!verifyWebhookSignature(data)) {
    console.warn('[Webhook] Invalid signature')
    return res.status(401).json({ message: 'Invalid signature' })
  }

  const { order_number, system_order_number, status } = data
  const dbStatus = mapStatus(status)

  await Payout.findOneAndUpdate(
    {
      $or: [
        { referenceId: order_number },
        { payoutId:    system_order_number },
      ]
    },
    {
      status:            dbStatus,
      webhookReceivedAt: new Date(),
      ...(dbStatus === 'FAILED' && { failReason: 'โอนไม่สำเร็จ' }),
    }
  )

  console.log(`[Webhook] order:${order_number} → ${dbStatus}`)

  // ตาม docs ต้องตอบกลับ lowercase "success"
  res.status(200).send('success')
})

export default router