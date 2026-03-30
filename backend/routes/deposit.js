import express from "express";
import crypto from "crypto";
import { requireAuth } from "../middleware/auth.js";
import Deposit from "../models/deposit.js";
import User from "../models/User.js";
import { validateAmount } from "../utils/validate.js";

const router = express.Router();

const GATEWAY_URL = process.env.GATEWAY_URL;
const MERCHANT_ID = process.env.MERCHANT_ID;
const SECRET_KEY = process.env.SECRET_KEY;
const CALLBACK_URL = process.env.DEPOSIT_CALLBACK_URL;

function makeSign(params) {
  const filtered = Object.fromEntries(
    Object.entries(params).filter(([, v]) => v !== null && v !== undefined)
  );
  const str =
    Object.keys(filtered)
      .sort()
      .map((k) => `${k}=${filtered[k]}`)
      .join("&") + `&secret_key=${SECRET_KEY}`;
  return crypto.createHash("md5").update(str).digest("hex");
}

function verifySign(data) {
  const { sign, ...rest } = data;
  const filtered = Object.fromEntries(
    Object.entries(rest).filter(([, v]) => v !== null && v !== undefined)
  );
  return makeSign(filtered) === sign;
}

// ── POST /api/deposit/create ─────────────────────────────────────────────────
router.post("/create", requireAuth, async (req, res) => {
  try {
    const { amount, channelCode = "PROMPTPAY" } = req.body;
    const userId = req.user._id ?? req.user.id;

    // ── Validate amount ───────────────────────────────────────────────────
    const amountErr = validateAmount(amount);
    if (amountErr) return res.status(400).json({ message: amountErr });

    // ── Validate channelCode whitelist ────────────────────────────────────
    const ALLOWED_CHANNELS = [
      "BANK_CARD",
      "FA_BANK_CARD",
      "TRUEMONEY",
      "PROMPTPAY",
      "E_BANK_CARD",
    ];
    if (!ALLOWED_CHANNELS.includes(channelCode))
      return res.status(400).json({ message: "channel ไม่ถูกต้อง" });

    const orderNumber = `DEP${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const amountStr = String(Number(amount));

    const params = {
      channel_code: channelCode,
      username: MERCHANT_ID,
      amount: amountStr,
      order_number: orderNumber,
      notify_url: CALLBACK_URL,
      client_ip: req.ip?.replace("::ffff:", "") || "127.0.0.1",
    };
    params.sign = makeSign(params);

    console.log(">>> deposit create payload:", JSON.stringify(params, null, 2));

    const response = await fetch(
      `${GATEWAY_URL}/api/v1/third-party/create-transactions`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );
    const data = await response.json();

    console.log(">>> gateway response:", JSON.stringify(data, null, 2));

    if (![200, 201].includes(data.http_status_code)) {
      return res
        .status(400)
        .json({ message: data.message, error_code: data.error_code });
    }

    await Deposit.create({
      userId,
      orderNumber,
      systemOrderNumber: data.data?.system_order_number ?? null,
      amount: Number(amount),
      channelCode,
      status: data.data?.status ?? 1,
      cashierUrl: data.data?.casher_url ?? null,
      qrcodeUrl: data.data?.qrcode_url ?? null,
      notifyUrl: CALLBACK_URL,
      receiverBankName: data.data?.receiver_bank_name,
      receiverName: data.data?.receiver_name,
      receiverAccount: data.data?.receiver_account,
    });

    res.json({
      orderNumber,
      cashierUrl: data.data?.casher_url,
      qrcodeUrl: data.data?.qrcode_url,
      amount: Number(amount),
      receiverBankName: data.data?.receiver_bank_name,
      receiverName: data.data?.receiver_name,
      receiverAccount: data.data?.receiver_account,
    });
  } catch (err) {
    console.error("Deposit create error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ── POST /api/deposit/callback ───────────────────────────────────────────────
router.post("/callback", express.json(), async (req, res) => {
  try {
    const { data: cbData } = req.body;
    if (!cbData) return res.send("failed");

    if (!verifySign(cbData)) {
      console.warn("Deposit callback: signature mismatch");
      return res.send("failed");
    }

    const deposit = await Deposit.findOne({ orderNumber: cbData.order_number });
    if (!deposit) return res.send("failed");

    const prevStatus = deposit.status;
    deposit.status = Number(cbData.status);
    if (cbData.actual_amount)
      deposit.actualAmount = Number(cbData.actual_amount);
    if (cbData.system_order_number)
      deposit.systemOrderNumber = cbData.system_order_number;
    if ([4, 5].includes(Number(cbData.status)))
      deposit.confirmedAt = new Date();
    await deposit.save();

    const wasSuccess = [4, 5].includes(prevStatus);
    const isSuccess = [4, 5].includes(Number(cbData.status));
    if (!wasSuccess && isSuccess) {
      const credited = deposit.actualAmount ?? deposit.amount;
      await User.findByIdAndUpdate(deposit.userId, {
        $inc: { balance: credited },
      });
      console.log(`>>> credited ${credited} to user ${deposit.userId}`);
    }

    res.send("success");
  } catch (err) {
    console.error("Deposit callback error:", err);
    res.send("failed");
  }
});

// ── GET /api/deposit/qr?orderNumber=xxx ──────────────────────────────────────
router.get("/qr", requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.query;
    if (!orderNumber)
      return res.status(400).json({ message: "ต้องระบุ orderNumber" });

    const deposit = await Deposit.findOne({ orderNumber });
    if (!deposit) return res.status(404).json({ message: "ไม่พบรายการ" });

    // ── Ownership check ───────────────────────────────────────────────────
    // admin/superadmin ดูได้ทุก order, user ดูได้เฉพาะของตัวเอง
    const role = req.user.role;
    const selfId = String(req.user._id ?? req.user.id);
    if (role !== "admin" && role !== "superadmin") {
      if (String(deposit.userId) !== selfId)
        return res.status(403).json({ message: "ไม่มีสิทธิ์ดูรายการนี้" });
    }

    const params = { username: MERCHANT_ID, order_number: orderNumber };
    params.sign = makeSign(params);

    const response = await fetch(
      `${GATEWAY_URL}/api/v1/third-party/transaction-queries`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );

    const data = await response.json();
    if (![200, 201].includes(data.http_status_code))
      return res.status(400).json({ message: data.message });

    const g = data.data;
    deposit.status = g.status;
    deposit.actualAmount = g.actual_amount
      ? Number(g.actual_amount)
      : deposit.actualAmount;
    if ([4, 5].includes(Number(g.status))) deposit.confirmedAt = new Date();
    await deposit.save();

    res.json({
      order_number: deposit.orderNumber,
      status: deposit.status,
      amount: deposit.amount,
      qrcode_url: deposit.qrcodeUrl,
      cashier_url: deposit.cashierUrl,
      receiver_bank_name: deposit.receiverBankName,
      receiver_name: deposit.receiverName,
      receiver_account: deposit.receiverAccount,
    });
  } catch (err) {
    console.error("Deposit QR error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ── GET /api/deposit/history ──────────────────────────────────────────────────
//  Role      | เห็นข้อมูลของ   | ?userId ได้
//  user      | ตัวเอง (บังคับ) | ❌
//  admin     | ทุกคน           | ✅
//  superadmin| ทุกคน           | ✅
router.get("/history", requireAuth, async (req, res) => {
  try {
    const role = req.user.role;
    const selfId = String(req.user._id ?? req.user.id);
    const { userId, page = 1, limit = 20 } = req.query;

    let filter = {};
    if (role === "superadmin") {
      // ดูทั้งหมด หรือ filter ตาม userId ก็ได้
      if (userId) {
        filter.userId = userId;
      }
    } else {
      // admin + user → ดูได้เฉพาะของตัวเองเท่านั้น
      filter.userId = selfId;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const total = await Deposit.countDocuments(filter);

    const deposits = await Deposit.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select("orderNumber userId amount status createdAt channelCode")
      .populate("userId", "username");

    const results = await Promise.allSettled(
      deposits.map(async (d) => {
        const params = { username: MERCHANT_ID, order_number: d.orderNumber };
        params.sign = makeSign(params);
        const r = await fetch(
          `${GATEWAY_URL}/api/v1/third-party/transaction-queries`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(params),
          }
        );
        const json = await r.json();
        return json.data
          ? {
              ...json.data,
              userId: String(d.userId?._id ?? d.userId),
              username: d.userId?.username ?? null,
              channelCode: d.channelCode,
            }
          : null;
      })
    );

    const list = results
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);

    res.json({ total, page: Number(page), limit: Number(limit), data: list });
  } catch (err) {
    console.error("Deposit history error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
