export const createProfileController = ({ Profile, hashPassword, uploadBufferToCloudinary }) => {
  return {
    getProfile: async (req, res) => {
      const { email } = req.query;
      try {
        const user = await Profile.findOne({ email })
          .select("full_name cnic phone_number location profilepic")
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
      let profilepicUrl = req.body.profilepic;

      try {
        if (req.file) {
          const uploadResult = await uploadBufferToCloudinary(
            req.file.buffer,
            {
              folder: "tailorx/profiles",
              resource_type: "image",
            },
            req
          );
          profilepicUrl = uploadResult.secure_url;
        }

        if (profilepicUrl && typeof profilepicUrl === "string") {
          // Normalize URL: remove hardcoded backend domain if present
          profilepicUrl = profilepicUrl.replace("https://tailorconnect-production.up.railway.app", "");
        }

        const updateData = { full_name, cnic, phone_number, location };
        if (profilepicUrl !== undefined) {
          updateData.profilepic = profilepicUrl;
        }

        await Profile.updateOne(
          { email },
          updateData
        );

        if (password && password.trim() !== "") {
          const hashed = hashPassword(password);
          await Profile.updateOne({ email }, { password: hashed });
        }

        res.json({ message: "Profile updated successfully!", profilepic: profilepicUrl });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message || "Internal Server Error" });
      }
    },

    getProfile2: async (req, res) => {
      const { email } = req.query;
      try {
        const user = await Profile.findOne({ email })
          .select("full_name location phone_number profilepic")
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
