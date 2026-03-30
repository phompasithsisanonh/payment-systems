import crypto from 'crypto'

const SECRET_KEY = 'GQhYwkPyubIMdKL3WDDJHPdNJgtcPIMR'

const data = {
  username:             'malagrob',
  amount:               '100',
  order_number:         'TXN-TEST001',
  system_order_number:  'SO000000001',
  status:               4,
  // ไม่ใส่ sign
}

// กรอง null ออก + sort keys + md5
const filtered = Object.fromEntries(
  Object.entries(data).filter(([_, v]) => v !== null && v !== undefined)
)

const sorted = Object.keys(filtered)
  .sort()
  .reduce((acc, k) => { acc[k] = filtered[k]; return acc }, {})

const str = Object.entries(sorted)
  .map(([k, v]) => `${k}=${v}`)
  .join('&') + `&secret_key=${SECRET_KEY}`

console.log('String to sign:', str)

const sign = crypto.createHash('md5').update(str).digest('hex')
console.log('Sign:', sign)