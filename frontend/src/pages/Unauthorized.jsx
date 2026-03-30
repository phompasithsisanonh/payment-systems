import { useNavigate } from 'react-router-dom'

export default function Unauthorized() {
  const navigate = useNavigate()
  return (
    <div className="unauthorized-page">
      <h2>ไม่มีสิทธิ์เข้าถึง</h2>
      <p>คุณไม่มีสิทธิ์เข้าหน้านี้ครับ</p>
      <button onClick={() => navigate('/dashboard')}>
        กลับหน้าหลัก
      </button>
    </div>
  )
}