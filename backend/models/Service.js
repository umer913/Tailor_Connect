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
  },
  baseSchemaOptions
);

export default mongoose.model("Service", serviceSchema);
