import express from "express";
import { requireAuth } from "../middleware/auth.js";
import { getBalance } from "../services/apexpay.js";

const router = express.Router();

// GET /api/wallet
router.get("/", requireAuth, async (req, res) => {
  try {
    const result = await getBalance();
    if (result.http_status_code !== 201)
      return res
        .status(500)
        .json({ success: false, message: "ดึงข้อมูลไม่สำเร็จ" });

    res.json({
      success: true,
      data: {
        balance: parseFloat(result.data.balance),
        frozen_balance: parseFloat(result.data.frozen_balance || 0),
        available_balance: parseFloat(
          result.data.available_balance || result.data.balance
        ),
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
