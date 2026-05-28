import express from "express";

export const createAuthRouter = ({
  Profile,
  transporter,
  hashPassword,
  generateOTP,
}) => {
  const router = express.Router();

  // ---------------- SIGNUP ----------------
  router.post("/signup", async (req, res) => {
    const { email, password, full_name, cnic, role } = req.body;

    try {
      const existing = await Profile.findOne({ email }).select("_id").exec();

      if (existing) {
        return res.status(400).json({ error: "User already exists" });
      }

      const hashed = hashPassword(password);
      const otp = generateOTP();
      const finalCnic =
        role === "tailor" && cnic?.trim() !== "" ? cnic.trim() : null;

      await Profile.create({
        email,
        full_name,
        cnic: finalCnic,
        role,
        password: hashed,
        otp,
        verified: false,
      });

      await transporter.sendMail({
        from: `"TailorX" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Your OTP Verification Code",
        text: `Hello ${full_name}, your OTP is: ${otp}`,
      });

      res.json({ message: "OTP sent to your email!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- VERIFY OTP ----------------
  router.post("/verify-otp", async (req, res) => {
    const { email, otp } = req.body;

    try {
      const user = await Profile.findOne({ email }).select("_id otp").exec();

      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      if (user.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      user.verified = true;
      user.otp = null;
      await user.save();

      res.json({ message: "E mail verified successfully!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- LOGIN ----------------
  router.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
      const hashed = hashPassword(password);

      const user = await Profile.findOne({ email })
        .select("_id email password full_name role verified")
        .exec();

      if (!user) {
        return res.status(400).json({ error: "Invalid email or password" });
      }
      if (!user.verified) {
        return res.status(400).json({ error: "Email not verified" });
      }
      if (user.password !== hashed) {
        return res.status(400).json({ error: "Invalid password" });
      }

      const userData = {
        id: user._id,
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

  // ---------------- FORGOT PASSWORD ----------------
  router.post("/forgot-password", async (req, res) => {
    const { email } = req.body;

    try {
      const user = await Profile.findOne({ email })
        .select("_id full_name email")
        .exec();

      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      const otp = generateOTP();

      await Profile.updateOne({ email }, { otp });

      await transporter.sendMail({
        from: `"TailorX" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Password Reset OTP",
        text: `Hello ${user.full_name}, your password reset OTP is: ${otp}`,
      });

      res.json({ message: "OTP sent to your email!" });
    } catch (err) {
      console.error("Forgot Password Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- RESET PASSWORD ----------------
  router.post("/reset-password", async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
      const user = await Profile.findOne({ email }).select("_id otp").exec();

      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }

      if (user.otp !== otp) {
        return res.status(400).json({ error: "Invalid OTP" });
      }

      const hashed = hashPassword(newPassword);

      await Profile.updateOne(
        { email },
        { password: hashed, verified: true, otp: null }
      );

      res.json({ message: "Password reset successfully!" });
    } catch (err) {
      console.error("Reset Password Error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  return router;
};
