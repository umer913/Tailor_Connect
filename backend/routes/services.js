import express from "express";

export const createServiceRouter = ({ Service }) => {
  const router = express.Router();

  // ---------------- ADD SERVICES ----------------
  router.post("/add-services", async (req, res) => {
    const { email, services } = req.body;

    try {
      const insertData = services.map((s) => ({
        tailor_email: email,
        service_types: s.service_types,
        gender: s.gender,
        description: s.description,
        price_range: s.price_range,
      }));

      await Service.insertMany(insertData);

      res.json({ message: "Services added successfully!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- GET SERVICES ----------------
  router.get("/get-services", async (req, res) => {
    const { email } = req.query;
    try {
      const data = await Service.find({ tailor_email: email }).lean().exec();
      res.json({ services: data.map((s) => ({ ...s, id: s._id })) });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- UPDATE SERVICE ----------------
  router.put("/update-service", async (req, res) => {
    const { email, id, service_types, gender, description, price_range } =
      req.body;

    try {
      const updated = await Service.findOneAndUpdate(
        { _id: id, tailor_email: email },
        { service_types, gender, description, price_range },
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
  });

  // ---------------- DELETE SERVICE ----------------
  router.delete("/delete-service/:id", async (req, res) => {
    const { id } = req.params;

    try {
      await Service.deleteOne({ _id: id });

      res.json({ message: "Service deleted successfully!" });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- GET TAILOR SERVICES ----------------
  router.get("/get-tailor-services", async (req, res) => {
    const { email } = req.query;

    try {
      const services = await Service.find({ tailor_email: email }).lean().exec();
      res.json({ services: services.map((s) => ({ ...s, id: s._id })) });
    } catch (err) {
      console.log(err);
      res.status(500).json({ error: "Failed to fetch tailor services" });
    }
  });

  return router;
};
