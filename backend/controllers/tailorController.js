export const createTailorController = ({ Profile, Service }) => {
  return {
    getTailors: async (_req, res) => {
      try {
        const data = await Profile.find({ role: "tailor" })
          .select("_id full_name location phone_number email profile_image")
          .exec();
        res.json({ tailors: data });
      } catch (err) {
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    getTailorsWithServices: async (_req, res) => {
      try {
        const tailors = await Profile.find({ role: "tailor" })
          .select("_id full_name location phone_number email profile_image")
          .lean()
          .exec();

        const services = await Service.find({})
          .select("_id tailor_email service_types price_range gender description")
          .lean()
          .exec();

        const servicesByTailorEmail = (services || []).reduce((acc, service) => {
          const email = service.tailor_email;
          if (!email) return acc;
          if (!acc[email]) acc[email] = [];
          acc[email].push({ ...service, id: service._id });
          return acc;
        }, {});

        const tailorsWithServices = (tailors || []).map((tailor) => ({
          ...tailor,
          id: tailor._id,
          services: servicesByTailorEmail[tailor.email] || [],
        }));

        res.json({ tailors: tailorsWithServices });
      } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },
  };
};
