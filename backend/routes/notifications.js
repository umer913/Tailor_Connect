import express from "express";

export const createNotificationRouter = ({ Order, Appointment }) => {
  const router = express.Router();

  // ---------------- GET CUSTOMER NOTIFICATIONS ----------------
  router.get("/get-notifications", async (req, res) => {
    const { email } = req.query;

    try {
      const data = await Order.find({ customer_email: email, is_notified: false })
        .sort({ created_at: -1 })
        .exec();

      res.json({ notifications: data || [] });
    } catch (err) {
      console.error("Get notifications error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- CLEAR ALL NOTIFICATIONS ----------------
  router.put("/clear-all-notifications", async (req, res) => {
    const { email } = req.body;

    try {
      await Order.updateMany(
        { customer_email: email, is_notified: false },
        { is_notified: true }
      );

      res.json({ message: "All notifications cleared" });
    } catch (err) {
      console.error("Clear notifications error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- DISMISS SINGLE NOTIFICATION ----------------
  router.put("/dismiss-notification", async (req, res) => {
    const { order_id } = req.body;

    try {
      await Order.updateOne({ _id: order_id }, { is_notified: true });

      res.json({ message: "Notification dismissed" });
    } catch (err) {
      console.error("Dismiss notification error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- GET APPOINTMENT NOTIFICATIONS ----------------
  router.get("/get-appointment-notifications", async (req, res) => {
    const { email } = req.query;

    try {
      const data = await Appointment.find({ customer_email: email, is_notified: false })
        .sort({ created_at: -1 })
        .exec();

      res.json({ notifications: data || [] });
    } catch (err) {
      console.error("Get appointment notifications error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- DISMISS APPOINTMENT NOTIFICATION ----------------
  router.put("/dismiss-appointment-notification", async (req, res) => {
    const { appointment_id } = req.body;

    try {
      await Appointment.updateOne({ _id: appointment_id }, { is_notified: true });

      res.json({ message: "Notification dismissed" });
    } catch (err) {
      console.error("Dismiss appointment notification error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- GET TAILOR NOTIFICATIONS ----------------
  router.get("/tailor-notifications", async (req, res) => {
    const { email } = req.query;

    try {
      const data = await Order.find({ tailor_email: email, is_notified: false })
        .sort({ created_at: -1 })
        .exec();

      res.json({ notifications: data || [] });
    } catch (err) {
      console.error("Get tailor notifications error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- CLEAR ALL TAILOR NOTIFICATIONS ----------------
  router.put("/clear-all-tailor-notifications", async (req, res) => {
    const { email } = req.body;

    try {
      await Order.updateMany(
        { tailor_email: email, is_notified: false },
        { is_notified: true }
      );

      res.json({ message: "All notifications cleared" });
    } catch (err) {
      console.error("Clear tailor notifications error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- DISMISS TAILOR NOTIFICATION ----------------
  router.put("/dismiss-tailor-notification", async (req, res) => {
    const { order_id } = req.body;

    try {
      await Order.updateOne({ _id: order_id }, { is_notified: true });

      res.json({ message: "Notification dismissed" });
    } catch (err) {
      console.error("Dismiss tailor notification error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- GET TAILOR APPOINTMENT NOTIFICATIONS ----------------
  router.get("/tailor-appointment-notifications", async (req, res) => {
    const { email } = req.query;

    try {
      const data = await Appointment.find({ tailor_email: email, is_notified: false })
        .sort({ created_at: -1 })
        .exec();

      res.json({ notifications: data || [] });
    } catch (err) {
      console.error("Get tailor appointment notifications error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- DISMISS TAILOR APPOINTMENT NOTIFICATION ----------------
  router.put("/dismiss-tailor-appointment-notification", async (req, res) => {
    const { appointment_id } = req.body;

    try {
      await Appointment.updateOne({ _id: appointment_id }, { is_notified: true });

      res.json({ message: "Notification dismissed" });
    } catch (err) {
      console.error("Dismiss tailor appointment notification error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  return router;
};
