import mongoose from "mongoose";

const depositSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

  orderNumber: { type: String, required: true, unique: true },
  systemOrderNumber: { type: String, default: null },

  amount: { type: Number, required: true },
  actualAmount: { type: Number, default: null },

  channelCode: { type: String, default: "PROMPTPAY" },
  status: { type: Number, default: 1 },

  cashierUrl: { type: String, default: null },
  qrcodeUrl: { type: String, default: null },

  notifyUrl: { type: String },
  returnUrl: { type: String, default: null },

  // 🔥 เพิ่มใหม่
  message: { type: String, default: null },
  note: { type: String, default: null },

  receiverAccount: { type: String, default: null },
  receiverBankName: { type: String, default: null },
  receiverBankBranch: { type: String, default: null },
  receiverName: { type: String, default: null },

  sign: { type: String, default: null },

  createdAt: { type: Date, default: Date.now },
  confirmedAt: { type: Date, default: null },
});

export default mongoose.model("Deposit", depositSchema);
