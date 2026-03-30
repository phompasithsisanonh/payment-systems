import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import {
  requireSuperAdmin,
  requireSuperAdminWithCsrf,
} from "../middleware/auth.js";
import { validatePassword } from "../utils/validate.js";

const router = express.Router();

// ── GET /api/users ────────────────────────────────────────────────────────────
router.get("/", requireSuperAdmin, async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json({ success: true, data: users });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/users ───────────────────────────────────────────────────────────
router.post("/", requireSuperAdminWithCsrf, async (req, res) => {
  const { username, password, role } = req.body;

  if (!username || !password)
    return res.status(400).json({ message: "กรุณากรอก username และ password" });

  if (!["superadmin", "admin"].includes(role))
    return res.status(400).json({ message: "role ไม่ถูกต้อง" });

  // ── Validate password complexity ──────────────────────────────────────
  const pwErr = validatePassword(password);
  if (pwErr) return res.status(400).json({ message: pwErr });

  // ── Validate username ─────────────────────────────────────────────────
  if (username.length < 3 || username.length > 30)
    return res.status(400).json({ message: "username ต้องมี 3-30 ตัวอักษร" });
  if (!/^[a-zA-Z0-9_]+$/.test(username))
    return res
      .status(400)
      .json({ message: "username ใช้ได้เฉพาะ a-z, 0-9, _ เท่านั้น" });

  try {
    const exists = await User.findOne({ username });
    if (exists)
      return res.status(400).json({ message: "username นี้มีอยู่แล้ว" });

    const user = await User.create({ username, password, role });
    res.json({ success: true, data: user.toJSON() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PATCH /api/users/:id ──────────────────────────────────────────────────────
router.patch("/:id", requireSuperAdminWithCsrf, async (req, res) => {
  const { username, password, role, isActive } = req.body;

  if (req.params.id === req.user.id)
    return res.status(400).json({ message: "ไม่สามารถแก้ไขตัวเองได้" });

  // ── Validate password ถ้ามีการเปลี่ยน ─────────────────────────────────
  if (password) {
    const pwErr = validatePassword(password);
    if (pwErr) return res.status(400).json({ message: pwErr });
  }

  try {
    const update = {};
    if (username) {
      if (username.length < 3 || username.length > 30)
        return res
          .status(400)
          .json({ message: "username ต้องมี 3-30 ตัวอักษร" });
      if (!/^[a-zA-Z0-9_]+$/.test(username))
        return res
          .status(400)
          .json({ message: "username ใช้ได้เฉพาะ a-z, 0-9, _ เท่านั้น" });
      update.username = username;
    }
    if (role) update.role = role;
    if (typeof isActive === "boolean") update.isActive = isActive;
    if (password) update.password = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(req.params.id, update, {
      returnDocument: "after",
    }).select("-password");

    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    res.json({ success: true, data: user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────
router.delete("/:id", requireSuperAdminWithCsrf, async (req, res) => {
  if (req.params.id === req.user.id)
    return res.status(400).json({ message: "ไม่สามารถลบตัวเองได้" });

  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "ไม่พบผู้ใช้" });

    res.json({ success: true, message: "ลบผู้ใช้แล้ว" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

export default router;
