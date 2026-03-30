import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: { type: String, required: true, minlength: 8 },
    role: {
      type: String,
      enum: ["superadmin", "admin"],
      default: "admin",
    },
    isActive: { type: Boolean, default: true },
    lastLoginAt: Date,
    totpSecret: { type: String, default: null }, // ✅ เพิ่ม
    totpEnabled: { type: Boolean, default: false }, // ✅ เพิ่ม
  },
  { timestamps: true }
);

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.comparePassword = function (plainText) {
  return bcrypt.compare(plainText, this.password);
};

userSchema.set("toJSON", {
  transform: (_, obj) => {
    delete obj.password;
    delete obj.totpSecret; // ✅ ไม่ส่ง secret ออกไปด้วย
    return obj;
  },
});

export default mongoose.model("User", userSchema);
