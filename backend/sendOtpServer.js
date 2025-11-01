import { createClient } from "@supabase/supabase-js";
import cors from "cors";
import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

// ---------------- Hash function ----------------
function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

// ---------------- OTP generator ----------------
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP
}

// ---------------- Nodemailer ----------------
const transporter = nodemailer.createTransport({
  service: "gmail", // or any email service
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Hash incoming password
    const hashed = hashPassword(password);

    // Get user from DB by email
    const { data: user, error } = await supabase
      .from("profiles")
      .select("id, email, password, full_name, role, verified")
      .eq("email", email)
      .single();

    if (error || !user) return res.status(400).json({ error: "Invalid email or password" });

    if (!user.verified) return res.status(400).json({ error: "Email not verified" });

    // Check password hash
    if (user.password !== hashed) return res.status(400).json({ error: "Invalid email or password" });

    // Return user data without password
    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };

    res.json({ user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// ---------------- Signup ----------------
app.post("/signup", async (req, res) => {
  const { email, password, full_name, cnic, role } = req.body;

  try {
    // Check if user exists
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existing) return res.status(400).json({ error: "User already exists" });

    // Hash password
    const hashed = hashPassword(password);

    // Generate OTP
    const otp = generateOTP();

    // Save user with OTP
    const { data, error } = await supabase.from("profiles").insert([
      {
        email,
        full_name,
        cnic,
        role,
        password: hashed,
        otp,
        verified: false, // will be true after OTP verification
      },
    ]);

    if (error) return res.status(400).json({ error: error.message });

    // Send OTP email
    await transporter.sendMail({
      from: `"TailorX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Verification Code",
      text: `Hello ${full_name}, your OTP is: ${otp}`,
    });

    return res.json({ message: "OTP sent to your email!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- Verify OTP ----------------
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const { data: user, error } = await supabase
      .from("profiles")
      .select("id, otp")
      .eq("email", email)
      .single();

    if (error || !user) return res.status(400).json({ error: "User not found" });

    if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

    // Update verified status and remove OTP
    await supabase.from("profiles").update({ verified: true, otp: null }).eq("email", email);

    res.json({ message: "Email verified successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- Start Server ----------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
