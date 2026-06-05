export const createProfileController = ({ Profile, hashPassword }) => {
  return {
    getProfile: async (req, res) => {
      const { email } = req.query;
      try {
        const user = await Profile.findOne({ email })
          .select("full_name cnic phone_number location profile_image")
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

    uploadProfileImage: async (req, res) => {
      const { email } = req.body;
      try {
        if (!req.file) {
          return res.status(400).json({ error: "No image file provided." });
        }
        if (!email) {
          return res.status(400).json({ error: "Email is required." });
        }

        // Use the same GridFS upload helper that orders/chat use
        const { uploadBufferToCloudinary } = req;
        if (!uploadBufferToCloudinary) {
          return res.status(500).json({ error: "Upload helper not available." });
        }

        const result = await uploadBufferToCloudinary(req.file.buffer, {}, req);
        const imageUrl = result.secure_url;

        await Profile.updateOne({ email }, { profile_image: imageUrl });

        res.json({ message: "Profile image updated.", profile_image: imageUrl });
      } catch (err) {
        console.error("Upload profile image error:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    getProfile2: async (req, res) => {
      const { email } = req.query;
      try {
        const user = await Profile.findOne({ email })
          .select("full_name location phone_number profile_image")
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
