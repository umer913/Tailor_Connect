import express from "express";

export const createAppointmentRouter = ({ Appointment }) => {
  const router = express.Router();

  // ---------------- GET BOOKED SLOTS ----------------
  router.get("/get-booked-slots", async (req, res) => {
    const { email } = req.query;

    try {
      const data = await Appointment.find({ tailor_email: email, status: "pending" })
        .select("day time")
        .exec();

      res.json({ booked: data || [] });
    } catch (err) {
      console.error("Error fetching booked slots:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ---------------- DELETE APPOINTMENT ----------------
  router.delete("/delete-appointment/:id", async (req, res) => {
    const { id } = req.params;

    try {
      await Appointment.deleteOne({ _id: id });

      res.json({ message: "Appointment deleted successfully" });
    } catch (err) {
      console.error("Delete appointment error:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- BOOK APPOINTMENT ----------------
  router.post("/book-appointment", async (req, res) => {
    console.log("Received body:", req.body);

    const { tailor_email, customer_email, datetime, tailor_name } = req.body;

    if (!tailor_email || !customer_email || !datetime || !tailor_name) {
      console.error("Missing fields:", {
        tailor_email,
        customer_email,
        datetime,
        tailor_name,
      });
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields (tailor_email, customer_email, datetime, tailor_name)",
      });
    }

    try {
      const data = await Appointment.create({
        tailor_email,
        customer_email,
        datetime: datetime ? new Date(datetime) : null,
        tailor_name,
        status: "pending",
      });

      res.json({
        success: true,
        message: "Appointment booked successfully",
        appointment: data,
      });
    } catch (error) {
      console.error("Server error:", error);
      res.status(500).json({ success: false, message: error.message || "Server error" });
    }
  });

  // ---------------- GET CUSTOMER APPOINTMENTS ----------------
  router.get("/my-appointments", async (req, res) => {
    const { email } = req.query;

    try {
      const data = await Appointment.find({ customer_email: email })
        .sort({ created_at: -1 })
        .exec();

      res.json({ appointments: data });
    } catch (err) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- GET TAILOR APPOINTMENTS ----------------
  router.get("/tailor-appointments", async (req, res) => {
    const { email } = req.query;

    try {
      const data = await Appointment.find({ tailor_email: email })
        .sort({ created_at: -1 })
        .exec();

      res.json({ appointments: data || [] });
    } catch (err) {
      console.error("Error fetching tailor appointments:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // ---------------- UPDATE APPOINTMENT STATUS ----------------
  router.put("/update-appointment-status", async (req, res) => {
    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: "Missing appointment ID or status" });
    }

    try {
      const appointment = await Appointment.findById(id).exec();

      if (!appointment) {
        throw new Error("Appointment not found");
      }

      await Appointment.updateOne({ _id: id }, { status, is_notified: false });

      res.json({ message: "Appointment status updated successfully" });
    } catch (err) {
      console.error("Error updating appointment status:", err);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  return router;
};
