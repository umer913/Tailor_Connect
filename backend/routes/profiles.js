import express from "express";

export const createProfileRouter = ({ Profile, hashPassword }) => {
  const router = express.Router();

  // ---------------- GET PROFILE ----------------
  router.get("/get-profile", async (req, res) => {
    const { email } = req.query;
    try {
      const user = await Profile.findOne({ email })
        .select("full_name cnic phone_number location")
        .exec();
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      res.json({ user });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- UPDATE PROFILE ----------------
  router.put("/update-profile", async (req, res) => {
    const { email, full_name, cnic, phone_number, location, password } = req.body;

    try {
      await Profile.updateOne(
        { email },
        { full_name, cnic, phone_number, location }
      );

      if (password && password.trim() !== "") {
        const hashed = hashPassword(password);
        await Profile.updateOne({ email }, { password: hashed });
      }

      res.json({ message: "Profile updated successfully!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- GET PROFILE2 ----------------
  router.get("/get-profile2", async (req, res) => {
    const { email } = req.query;
    try {
      const user = await Profile.findOne({ email })
        .select("full_name location phone_number")
        .exec();
      if (!user) {
        return res.status(400).json({ error: "User not found" });
      }
      res.json({ user });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  return router;
};
