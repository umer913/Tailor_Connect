import mongoose from "mongoose";
import { baseSchemaOptions, createId } from "./base.js";

const tailorReviewSchema = new mongoose.Schema(
  {
    _id: { type: String, default: createId },
    tailor_id: { type: String, required: true, index: true },
    customer_id: { type: String, required: true, index: true },
    rating: { type: Number, required: true },
    description: { type: String },
    order_id: { type: String },
    is_visible: { type: Boolean, default: true },
  },
  baseSchemaOptions
);

export default mongoose.model("TailorReview", tailorReviewSchema);
