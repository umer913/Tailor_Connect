import { createClient } from "@supabase/supabase-js";
import cors from "cors"; //use to share resource between frontend and backend
import dotenv from "dotenv";
import express from "express"; //backend framework to create custom Api,s
import nodemailer from "nodemailer";

dotenv.config();//reading envirment varibale(supabase keys)

const app = express();//activating middleware by backend and frontend
app.use(cors());
app.use(express.json());//let backend read all data which is in json format

// Supabase connection
const supabase = createClient(
  process.env.SUPABASE_URL,//directly accesing varibales through global object of Node.js(process)
  process.env.SUPABASE_SERVICE_KEY
);


//  Login API
app.post("/login", async (req, res) => {//when fetch is executed in Login page this function runs,post is use to respond the hhtp network request sent to the the server.
  const { email, password } = req.body;//data is extrected from json frontend

  const { data, error } = await supabase.auth.signInWithPassword({//supabase inbuilt auth validates crenditials 
    email,
    password,
  });

  if (error) {
    return res.status(400).json({ error: error.message });//server sends response which is converted in json format
  }


  const { data: userData } = await supabase//data is fetch from datbase table
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)

  res.json({//send this message and user details to backend
    message: "Login successful",
    user: data.user,
    role: userData.role,
  });
});


//  Signup Api
app.post("/signup", async (req, res) => {//when fetch is executed in signup page this function runs,post is use to respond the hhtp request sent to the the server.(req) is for request while (res) is for respond
  const { email, password, full_name, cnic, role } = req.body;//data is extracted from json frontend

  try {
    // Create user in Supabase Authencation(it always needs admin level privlages)email is not verfied by default
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: false,
    });

    if (authError) {
      console.error("Auth Error:", authError.message);
      return res.status(400).json({ error: authError.message });
    }

   
    await supabase.auth.admin.inviteUserByEmail(email);
    const verifiedStatus = role === "customer";

    // Insert into profiles table
    const { error: insertError } = await supabase.from("profiles").insert([
      {
        id: authData.user.id,
        email,
        full_name,
        cnic,
        role,
        verified: verifiedStatus, // true for customer, false for tailor
      },
    ]);

    if (insertError) {
      console.error("Insert Error:", insertError.message);
      return res.status(400).json({ error: insertError.message });
    }

    //Success Message popup on frontend after signup 
    res.json({
      message:
        role === "tailor"
          ? "Signup successful! Verification email sent. Please wait for admin approval."
          : "Signup successful! Verification email sent.",
    });
  } catch (err) {
    console.error("Server Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// temporary in-memory storage for OTPs
const otps = {};

// ✅ Forgot Password: send OTP
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  // check if email exists in profiles
  const { data: user, error } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("email", email)
    .single();

  if (error || !user) return res.status(400).json({ error: "Email not found" });

  // generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000);
  otps[email] = otp;

  // setup mail transport
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  // send mail
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "TailorX Password Reset OTP",
    text: `Your password reset OTP is ${otp}. It will expire in 10 minutes.`,
  });

  // expire OTP after 10 minutes
  setTimeout(() => delete otps[email], 10 * 60 * 1000);

  res.json({ message: "OTP sent to your email" });
});

// ✅ Verify OTP and Reset Password
app.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!otps[email] || otps[email] != otp)
    return res.status(400).json({ error: "Invalid or expired OTP" });

  // find user by email
  const { data: user, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", email)
    .single();

  if (error || !user) return res.status(400).json({ error: "User not found" });

  // update password in Supabase Auth
  const { error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: newPassword }
  );

  if (updateError)
    return res.status(400).json({ error: updateError.message });

  // remove OTP
  delete otps[email];

  res.json({ message: "Password reset successfully" });
});


// ✅ Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 TailorX Server Running on port ${PORT}`));
