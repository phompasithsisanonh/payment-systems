import mongoose from "mongoose";

const withdrawSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  orderNumber: { type: String, required: true, unique: true },
  systemOrderNumber: { type: String, default: null },
  amount: { type: Number, required: true },
  fee: { type: Number, default: 0 },
  bankName: { type: String, required: true },
  bankCardNumber: { type: String, required: true },
  bankCardHolder: { type: String, required: true },
  status: { type: Number, default: 1 },
  confirmedAt: { type: Date, default: null },
  note: { type: String, default: "" }, // ✅ เพิ่ม note ลงใน schema
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Withdraw", withdrawSchema);
