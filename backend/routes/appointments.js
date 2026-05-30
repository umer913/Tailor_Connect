import express from "express";
import { createAppointmentController } from "../controllers/appointmentController.js";
import { authenticateToken } from "../middleware/auth.js";

export const createAppointmentRouter = ({ Appointment }) => {
  const router = express.Router();
  const controller = createAppointmentController({ Appointment });

  // Apply authentication middleware to all appointment routes
  router.use(authenticateToken);

  router.get("/get-booked-slots", controller.getBookedSlots);
  router.delete("/delete-appointment/:id", controller.deleteAppointment);
  router.post("/book-appointment", controller.bookAppointment);
  router.get("/my-appointments", controller.myAppointments);
  router.get("/tailor-appointments", controller.tailorAppointments);
  router.put("/update-appointment-status", controller.updateAppointmentStatus);

  return router;
};
