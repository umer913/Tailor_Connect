export const createProfileController = ({ Profile, hashPassword }) => {
  return {
    getProfile: async (req, res) => {
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
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    updateProfile: async (req, res) => {
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
    },

    getProfile2: async (req, res) => {
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
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },
  };
};
