import mongoose from "mongoose";
import { baseSchemaOptions, createId } from "./base.js";

const appointmentSchema = new mongoose.Schema(
  {
    _id: { type: String, default: createId },
    tailor_email: { type: String, required: true, index: true },
    customer_email: { type: String, required: true, index: true },
    tailor_name: { type: String },
    datetime: { type: Date },
    day: { type: String },
    time: { type: String },
    status: { type: String },
    is_notified: { type: Boolean, default: false },
  },
  baseSchemaOptions
);

export default mongoose.model("Appointment", appointmentSchema);
