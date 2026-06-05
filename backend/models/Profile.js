import mongoose from "mongoose";
import { baseSchemaOptions, createId } from "./base.js";

const profileSchema = new mongoose.Schema(
  {
    _id: { type: String, default: createId },
    email: { type: String, required: true, unique: true, index: true },
    password: { type: String },
    full_name: { type: String },
    cnic: { type: String },
    role: { type: String, index: true },
    otp: { type: String },
    verified: { type: Boolean, default: false },
    phone_number: { type: String },
    location: { type: String },
    profile_image: { type: String },
  },
  baseSchemaOptions
);

export default mongoose.model("Profile", profileSchema);
