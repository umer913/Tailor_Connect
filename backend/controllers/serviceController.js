export const createServiceController = ({ Service, uploadBufferToCloudinary }) => {
  return {
    addServices: async (req, res) => {
      const { email, services } = req.body;

      try {
        const insertData = services.map((s) => ({
          tailor_email: email,
          service_types: s.service_types || [],
          gender: s.gender,
          description: s.description,
          price_range: s.price_range,
          is_custom: s.is_custom || false,
          custom_name: s.custom_name || null,
          custom_images: s.custom_images || [],
          measurements_required: s.measurements_required || [],
        }));

        await Service.insertMany(insertData);

        res.json({ message: "Services added successfully!" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    getServices: async (req, res) => {
      const { email } = req.query;
      try {
        const data = await Service.find({ tailor_email: email }).lean().exec();
        res.json({ services: data.map((s) => ({ ...s, id: s._id })) });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    updateService: async (req, res) => {
      const {
        email, id, service_types, gender, description, price_range,
        custom_name, custom_images, measurements_required,
      } = req.body;

      try {
        const updated = await Service.findOneAndUpdate(
          { _id: id, tailor_email: email },
          {
            service_types: service_types || [],
            gender,
            description,
            price_range,
            ...(custom_name !== undefined && { custom_name }),
            ...(custom_images !== undefined && { custom_images }),
            ...(measurements_required !== undefined && { measurements_required }),
          },
          { new: true }
        );

        if (!updated) {
          return res.status(400).json({ error: "Service not found" });
        }

        res.json({ message: "Service updated successfully!" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    deleteService: async (req, res) => {
      const { id } = req.params;

      try {
        await Service.deleteOne({ _id: id });

        res.json({ message: "Service deleted successfully!" });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    getTailorServices: async (req, res) => {
      const { email } = req.query;

      try {
        const services = await Service.find({ tailor_email: email }).lean().exec();
        res.json({ services: services.map((s) => ({ ...s, id: s._id })) });
      } catch (err) {
        console.log(err);
        res.status(500).json({ error: "Failed to fetch tailor services" });
      }
    },

    uploadCustomServiceImages: async (req, res) => {
      try {
        if (!req.files || req.files.length === 0) {
          return res.status(400).json({ error: "No images provided" });
        }

        const uploadPromises = req.files.map((file) =>
          uploadBufferToCloudinary(file.buffer, { folder: "custom_services" }, req)
        );

        const results = await Promise.all(uploadPromises);
        const urls = results.map((r) => r.secure_url);

        res.json({ urls });
      } catch (err) {
        console.error("Image upload error:", err);
        res.status(500).json({ error: "Failed to upload images" });
      }
    },
  };
};
