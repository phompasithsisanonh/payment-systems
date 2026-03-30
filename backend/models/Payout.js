import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    referenceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    referenceNo: {
      type: String, // referenceNo จาก AnyPayTH
      index: true,
    },
    payoutId: {
      type: String, // ID จาก CubixPay
      index: true,
    },
    accountName: {
      type: String,
      required: true,
    },
    accountNumber: {
      type: String,
      required: true,
    },
    bankCode: {
      type: String,
      required: true,
      // ✅ ลบ enum ออกทั้งหมด — validate ที่ Frontend แทน
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: "THB",
    },
    status: {
      type: String,
      enum: ["PENDING", "SUCCESS", "FAILED"],
      default: "PENDING",
      index: true,
    },
    failReason: String, // เก็บเหตุผลถ้า FAILED
    webhookReceivedAt: Date, // เวลาที่ได้รับ callback
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Payout", payoutSchema);
