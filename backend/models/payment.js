import mongoose from "mongoose";
import { baseSchemaOptions, createId } from "./base.js";

const paymentSchema = new mongoose.Schema(
    {
        _id: { type: String, default: createId },
        order_id: { type: String, required: true, unique: true, index: true },
        status: { type: String, required: true, default: "unpaid" },
        method: { type: String },
        customer_email: { type: String },
        amount: { type: Number },
        currency: { type: String },
        paid_at: { type: Date },
        stripe_payment_id: { type: String },
        stripe_status: { type: String },
    },
    baseSchemaOptions
);

export default mongoose.model("Payment", paymentSchema);
