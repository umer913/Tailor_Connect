import mongoose from "mongoose";
import { baseSchemaOptions, createId } from "./base.js";

const complaintSchema = new mongoose.Schema(
  {
    _id: { type: String, default: createId },
    filed_by_email: { type: String, required: true, index: true },
    filed_by_role: { type: String },
    against_email: { type: String },
    complaint_type: { type: String },
    subject: { type: String },
    description: { type: String },
    order_id: { type: String },
    attachment_url: { type: String },
    admin_response: { type: String },
    resolved_at: { type: Date },
  },
  baseSchemaOptions
);

export default mongoose.model("Complaint", complaintSchema);
