import express from "express";
import crypto from "crypto";
import speakeasy from "speakeasy";
import { requireAuth } from "../middleware/auth.js";
import Withdraw from "../models/Withdraw.js";
import User from "../models/User.js";
import {
  validateAmount,
  validateNote,
  validateBankCard,
} from "../utils/validate.js";

const router = express.Router();

const GATEWAY_URL = process.env.GATEWAY_URL;
const MERCHANT_ID = process.env.MERCHANT_ID;
const SECRET_KEY = process.env.SECRET_KEY;
const CALLBACK_URL = process.env.WITHDRAW_CALLBACK_URL;

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

// ── POST /api/withdraw/create ─────────────────────────────────────────────────
router.post("/create", requireAuth, async (req, res) => {
  try {
    const {
      amount,
      bankName,
      bankCardNumber,
      bankCardHolder,
      totpCode,
      note,
    } = req.body;
    const userId = req.user._id ?? req.user.id;

    const cleanCardNumber = bankCardNumber?.trim();
    const cleanCardHolder = bankCardHolder?.trim();
    const cleanBankName = bankName?.trim();
    const cleanNote = note?.trim() || "";

    // ── Input validation ──────────────────────────────────────────────────
    if (!cleanBankName || !cleanCardNumber)
      return res.status(400).json({ message: "กรุณากรอกข้อมูลให้ครบ" });

    const amountErr = validateAmount(amount);
    if (amountErr) return res.status(400).json({ message: amountErr });

    const cardErr = validateBankCard(cleanCardNumber);
    if (cardErr) return res.status(400).json({ message: cardErr });

    const noteErr = validateNote(cleanNote);
    if (noteErr) return res.status(400).json({ message: noteErr });

    // if (cleanCardHolder.length > 100)
    //   return res
    //     .status(400)
    //     .json({ message: "ชื่อเจ้าของบัญชียาวเกิน 100 ตัวอักษร" });

    // ── 2FA verify ───────────────────────────────────────────────────────
    // const user = await User.findById(userId);
    // if (!user?.totpSecret)
    //   return res
    //     .status(400)
    //     .json({ message: "ยังไม่ได้ตั้งค่า Google Authenticator" });

    // const valid = speakeasy.totp.verify({
    //   secret: user.totpSecret,
    //   encoding: "base32",
    //   token: totpCode,
    //   window: 1,
    // });
    // if (!valid) return res.status(400).json({ message: "รหัส OTP ไม่ถูกต้อง" });

    const orderNumber = `WD${Date.now()}${Math.floor(Math.random() * 1000)}`;

    const params = {
      username: MERCHANT_ID,
      amount: String(Number(amount)),
      order_number: orderNumber,
      notify_url: CALLBACK_URL,
      bank_name: cleanBankName,
      bank_card_number: cleanCardNumber,
      bank_card_holder_name: cleanCardHolder,
      note: cleanNote,
    };
    params.sign = makeSign(params);

    console.log(
      ">>> withdraw create payload:",
      JSON.stringify(params, null, 2)
    );

    const response = await fetch(
      `${GATEWAY_URL}/api/v1/third-party/agency-withdraws`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );
    const data = await response.json();

    console.log(
      ">>> withdraw gateway response:",
      JSON.stringify(data, null, 2)
    );

    if (![200, 201].includes(data.http_status_code)) {
      return res
        .status(400)
        .json({ message: data.message, error_code: data.error_code });
    }

    await Withdraw.create({
      userId,
      orderNumber,
      systemOrderNumber: data.data?.system_order_number ?? null,
      amount: Number(amount),
      fee: Number(data.data?.fee ?? 0),
      bankName: cleanBankName,
      bankCardNumber: cleanCardNumber,
      bankCardHolder: cleanCardHolder,
      status: data.data?.status ?? 1,
      note: cleanNote,
    });

    res.json({
      orderNumber,
      amount: Number(amount),
      fee: data.data?.fee ?? "0",
      status: data.data?.status ?? 1,
      bankName: cleanBankName,
      bankCardNumber: cleanCardNumber,
      bankCardHolder: cleanCardHolder,
      note: cleanNote,
    });
  } catch (err) {
    console.error("Withdraw create error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ── GET /api/withdraw/status?orderNumber=xxx ──────────────────────────────────
router.get("/status", requireAuth, async (req, res) => {
  try {
    const { orderNumber } = req.query;
    if (!orderNumber)
      return res.status(400).json({ message: "ต้องระบุ orderNumber" });

    const params = { username: MERCHANT_ID, order_number: orderNumber };
    params.sign = makeSign(params);

    const response = await fetch(
      `${GATEWAY_URL}/api/v1/third-party/withdraw-queries`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      }
    );
    const data = await response.json();

    if (![200, 201].includes(data.http_status_code))
      return res
        .status(400)
        .json({ message: data.message, error_code: data.error_code });

    res.json(data.data);
  } catch (err) {
    console.error("Withdraw status error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

// ── POST /api/withdraw/callback ───────────────────────────────────────────────
router.post("/callback", express.json(), async (req, res) => {
  try {
    const { data: cbData } = req.body;
    if (!cbData) return res.send("failed");

    if (!verifySign(cbData)) {
      console.warn("Withdraw callback: signature mismatch");
      return res.send("failed");
    }

    const withdraw = await Withdraw.findOne({
      orderNumber: cbData.order_number,
    });
    if (!withdraw) return res.send("failed");

    withdraw.status = Number(cbData.status);
    if (cbData.system_order_number)
      withdraw.systemOrderNumber = cbData.system_order_number;
    if ([4, 5].includes(Number(cbData.status)))
      withdraw.confirmedAt = new Date();
    await withdraw.save();

    res.send("success");
  } catch (err) {
    console.error("Withdraw callback error:", err);
    res.send("failed");
  }
});

// ── GET /api/withdraw/history ─────────────────────────────────────────────────
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
    const total = await Withdraw.countDocuments(filter);

    const withdraws = await Withdraw.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .select(
        "orderNumber userId amount fee bankName bankCardNumber bankCardHolder status note createdAt"
      )
      .populate("userId", "username");

    const results = await Promise.allSettled(
      withdraws.map(async (w) => {
        const params = { username: MERCHANT_ID, order_number: w.orderNumber };
        params.sign = makeSign(params);
        const r = await fetch(
          `${GATEWAY_URL}/api/v1/third-party/withdraw-queries`,
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
              userId: String(w.userId?._id ?? w.userId),
              username: w.userId?.username ?? null,
              note: w.note,
              bankName: w.bankName,
              bankCardNumber: w.bankCardNumber,
              bankCardHolder: w.bankCardHolder,
            }
          : null;
      })
    );

    const list = results
      .filter((r) => r.status === "fulfilled" && r.value)
      .map((r) => r.value);

    res.json({ total, page: Number(page), limit: Number(limit), data: list });
  } catch (err) {
    console.error("Withdraw history error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});

export default router;
