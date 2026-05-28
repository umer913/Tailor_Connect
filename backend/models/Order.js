import mongoose from "mongoose";
import { baseSchemaOptions, createId } from "./base.js";

const orderSchema = new mongoose.Schema(
  {
    _id: { type: String, default: createId },
    customer_email: { type: String, required: true, index: true },
    tailor_email: { type: String, index: true },
    service_type: { type: String },
    gender: { type: String },
    price: { type: Number },
    quantity: { type: Number },
    measurements: { type: mongoose.Schema.Types.Mixed },
    options: { type: mongoose.Schema.Types.Mixed },
    fabric_image_url: { type: String },
    tailor_name: { type: String },
    status: { type: String },
    is_notified: { type: Boolean, default: false },
    full_name: { type: String },
    address: { type: String },
    phone: { type: String },
    description: { type: String },
  },
  baseSchemaOptions
);

export default mongoose.model("Order", orderSchema);
