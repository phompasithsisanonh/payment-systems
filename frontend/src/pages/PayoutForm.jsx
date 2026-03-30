import { useState } from "react";
import { createPayout } from "../services/cubixpay"; // ✅ แก้ import
import WalletCard from "../components/WalletCard";

const BANKS = [
  { code: "The Siam Commercial Bank", name: "ไทยพาณิชย์ (SCB)" },
  { code: "Kasikornbank", name: "กสิกรไทย (KBANK)" },
  { code: "Krung Thai Bank", name: "กรุงไทย (KTB)" },
  { code: "BANGKOK BANK", name: "กรุงเทพ (BBL)" },
  { code: "Krungsri", name: "กรุงศรีอยุธยา (BAY)" },
  { code: "TMBThanachart Bank", name: "ทหารไทยธนชาต (TTB)" },
  { code: "Government Savings Bank", name: "ออมสิน (GSB)" },
  { code: "Government Housing Bank", name: "อาคารสงเคราะห์ (GHB)" },
  {
    code: "Bank for Agriculture and Agricultural Cooperatives",
    name: "ธ.ก.ส. (BAAC)",
  },
  { code: "CIMB Thai Bank", name: "ซีไอเอ็มบี (CIMB)" },
];

const ERROR_MESSAGES = {
  1: "ยอดเงินใน wallet ไม่เพียงพอ",
  2: "ฟังก์ชันถอนเงินไม่ได้เปิดใช้งาน",
  5: "Signature ไม่ถูกต้อง กรุณาติดต่อผู้ดูแลระบบ",
  6: "มีรายการซ้ำ กรุณารอสักครู่",
  8: "เลข Order ซ้ำ กรุณารีเฟรชหน้า",
  9: "ระบบถอนเงินปิดอยู่",
  10: "จำนวนเงินต่ำกว่าขั้นต่ำ",
  11: "จำนวนเงินเกินวงเงินสูงสุด",
  13: "ช่องทางอยู่ระหว่างปิดปรับปรุง",
  18: "IP ไม่ได้รับอนุญาต กรุณาติดต่อผู้ดูแลระบบ",
  22: "ไม่รองรับธนาคารนี้",
};

export default function PayoutForm({ onSuccess }) {
  const [form, setForm] = useState({
    bankCode: "",
    accountNumber: "",
    accountName: "",
    amount: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [step, setStep] = useState("form");
  const [result, setResult] = useState(null);

  // ✅ ลบ useProviderConfig ออก — ไม่ใช้ fee แล้ว
  const amt = parseFloat(form.amount) || 0;

  const set = (k, v) => {
    setError(null);
    setForm((f) => ({ ...f, [k]: v }));
  };

  const validate = () => {
    if (!form.bankCode) return "กรุณาเลือกธนาคาร";
    if (!form.accountNumber) return "กรุณากรอกเลขบัญชี";
    if (!/^\d{10,15}$/.test(form.accountNumber.replace(/-/g, "")))
      return "เลขบัญชีไม่ถูกต้อง (10-15 หลัก)";
    if (!form.accountName.trim()) return "กรุณากรอกชื่อบัญชี";
    if (!form.amount || amt <= 0) return "กรุณากรอกจำนวนเงินที่ถูกต้อง";
    if (amt < 1) return "จำนวนเงินขั้นต่ำ ฿1";
    return null;
  };

  const handleNext = () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setStep("confirm");
  };

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await createPayout({
        bankName: form.bankCode,
        accountNumber: form.accountNumber.replace(/-/g, ""),
        accountName: form.accountName.trim(),
        amount: amt,
        note: form.note,
      });

      if (!res.success) {
        setError(
          ERROR_MESSAGES[res.error_code] || res.message || "เกิดข้อผิดพลาด"
        );
        setStep("form");
        return;
      }

      const txn = {
        orderId: res.data?.order_number,
        systemOrderId: res.data?.system_order_number,
        bankName:
          BANKS.find((b) => b.code === form.bankCode)?.name || form.bankCode,
        accountNumber: form.accountNumber,
        accountName: form.accountName,
        amount: amt,
        status: "PROCESSING",
        createdAt: res.data?.created_at || new Date().toISOString(),
        note: form.note,
      };

      setResult(txn);
      setStep("done");
      onSuccess?.(txn);
    } catch (e) {
      const errData = e?.response?.data;
      setError(
        ERROR_MESSAGES[errData?.error_code] ||
          errData?.message ||
          "เกิดข้อผิดพลาด กรุณาลองใหม่"
      );
      setStep("form");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({
      bankCode: "",
      accountNumber: "",
      accountName: "",
      amount: "",
      note: "",
    });
    setError(null);
    setResult(null);
    setStep("form");
  };

  // ─── Step: Form ───────────────────────────────────────────
  if (step === "form")
    return (
      <div className="payout-form">
        <WalletCard/>
        <div className="form-section">
          <label>ธนาคารปลายทาง</label>
          <select
            value={form.bankCode}
            onChange={(e) => set("bankCode", e.target.value)}
          >
            <option value="">-- เลือกธนาคาร --</option>
            {BANKS.map((b) => (
              <option key={b.code} value={b.code}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-section">
          <label>เลขบัญชีปลายทาง</label>
          <input
            type="text"
            placeholder="000-0-00000-0"
            value={form.accountNumber}
            maxLength={20}
            onChange={(e) =>
              set("accountNumber", e.target.value.replace(/[^\d-]/g, ""))
            }
          />
        </div>

        <div className="form-section">
          <label>ชื่อบัญชีปลายทาง</label>
          <input
            type="text"
            placeholder="ชื่อ นามสกุล"
            value={form.accountName}
            onChange={(e) => set("accountName", e.target.value)}
          />
        </div>

        <div className="form-section">
          <label>จำนวนเงิน (บาท)</label>
          <div className="amount-wrapper">
            <span className="currency-prefix">฿</span>
            <input
              type="number"
              placeholder="0.00"
              min="1"
              step="0.01"
              value={form.amount}
              onChange={(e) => set("amount", e.target.value)}
              className="amount-input"
            />
          </div>
        </div>

        {/* ✅ ลบ fee-summary ออกทั้งกล่อง */}

        <div className="form-section">
          <label>หมายเหตุ (ถ้ามี)</label>
          <input
            type="text"
            placeholder="เช่น ชำระค่าสินค้า"
            value={form.note}
            maxLength={100}
            onChange={(e) => set("note", e.target.value)}
          />
        </div>

        {error && <div className="error-msg">{error}</div>}

        <button className="submit-btn" onClick={handleNext}>
          ถัดไป →
        </button>
      </div>
    );

  // ─── Step: Confirm ────────────────────────────────────────
  if (step === "confirm")
    return (
      <div className="payout-form">
        <div className="confirm-box">
          <p className="confirm-title">ตรวจสอบข้อมูลก่อนโอน</p>
          <table className="confirm-table">
            <tbody>
              <tr>
                <td>ธนาคาร</td>
                <td>{BANKS.find((b) => b.code === form.bankCode)?.name}</td>
              </tr>
              <tr>
                <td>เลขบัญชี</td>
                <td>{form.accountNumber}</td>
              </tr>
              <tr>
                <td>ชื่อบัญชี</td>
                <td>{form.accountName}</td>
              </tr>
              <tr className="total-row">
                <td>จำนวนโอน</td>
                {/* ✅ ลบ fee และ total ออก เหลือแค่จำนวนเงิน */}
                <td>
                  ฿{amt.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </td>
              </tr>
              {form.note && (
                <tr>
                  <td>หมายเหตุ</td>
                  <td>{form.note}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <div className="btn-row">
          <button
            className="back-btn"
            onClick={() => setStep("form")}
            disabled={loading}
          >
            ← แก้ไข
          </button>
          <button
            className="submit-btn"
            onClick={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <span className="spinner-row">
                <span className="spinner" />
                กำลังโอน...
              </span>
            ) : (
              "ยืนยันโอนเงิน"
            )}
          </button>
        </div>
      </div>
    );

  // ─── Step: Done ───────────────────────────────────────────
  if (step === "done")
    return (
      <div className="payout-form done-box">
        <div className="done-icon">✓</div>
        <p className="done-title">ส่งคำสั่งโอนเงินแล้ว</p>
        <p className="done-sub">Order ID: {result?.orderId}</p>
        <p className="done-status">สถานะ: {result?.status}</p>
        <button className="back-btn" onClick={handleReset}>
          โอนรายการใหม่
        </button>
      </div>
    );
}
