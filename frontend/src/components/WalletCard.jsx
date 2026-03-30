import { useWalletBalance } from "../hooks/useWalletBalance.jsuseWalletBalance"
import "../assets/WalletCard.css"
export default function WalletCard() {
  const { balance, loading, error, lastUpdate, refresh } = useWalletBalance(10000)

  if (loading) return (
    <div className="wallet-card">
      <p className="wallet-label">กำลังโหลด...</p>
    </div>
  )

  if (error) return (
    <div className="wallet-card error">
      <p className="wallet-label">{error}</p>
      <button onClick={refresh}>ลองใหม่</button>
    </div>
  )

  return (
    <div className="wallet-card">
      <div className="wallet-header">
        <span className="wallet-title">กระเป๋าเงิน ApexPay</span>
        <button className="refresh-btn" onClick={refresh} title="รีเฟรช">
          ↻
        </button>
      </div>

      <div className="wallet-balances">
        <div className="wallet-item">
          <span className="wallet-label">ยอดรวม</span>
          <span className="wallet-amount">
            ฿{balance.balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="wallet-item">
          <span className="wallet-label">ถูกระงับ</span>
          <span className="wallet-amount frozen">
            ฿{balance.frozen_balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <div className="wallet-item highlight">
          <span className="wallet-label">ใช้ได้</span>
          <span className="wallet-amount available">
            ฿{balance.available_balance.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {lastUpdate && (
        <p className="wallet-updated">
          อัปเดต: {lastUpdate.toLocaleTimeString('th-TH')}
        </p>
      )}
    </div>
  )
}