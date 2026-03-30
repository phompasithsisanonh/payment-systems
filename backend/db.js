import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();
const mongoURL = process.env.MONGO_URI; // เช่น mongodb://localhost:27017/cubixpay

mongoose
  .connect(mongoURL)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));

export default mongoose;
