import mongoose from "mongoose";
import { baseSchemaOptions, createId } from "./base.js";

const serviceSchema = new mongoose.Schema(
  {
    _id: { type: String, default: createId },
    tailor_email: { type: String, required: true, index: true },
    service_types: { type: [String], default: [] },
    gender: { type: String },
    description: { type: String },
    price_range: { type: String },
    // Custom service fields
    is_custom: { type: Boolean, default: false },
    custom_name: { type: String },
    custom_images: { type: [String], default: [] },
    measurements_required: { type: [String], default: [] },
  },
  baseSchemaOptions
);

export default mongoose.model("Service", serviceSchema);
