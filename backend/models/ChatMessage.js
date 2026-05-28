import mongoose from "mongoose";
import { baseSchemaOptions, createId } from "./base.js";

const chatMessageSchema = new mongoose.Schema(
  {
    _id: { type: String, default: createId },
    tailor_email: { type: String, required: true, index: true },
    customer_email: { type: String, required: true, index: true },
    tailor_name: { type: String },
    customer_name: { type: String },
    message: { type: String },
    image_url: { type: String },
    is_read: { type: Boolean, default: false },
    datetime: { type: Date, default: () => new Date() },
  },
  baseSchemaOptions
);

export default mongoose.model("ChatMessage", chatMessageSchema);
