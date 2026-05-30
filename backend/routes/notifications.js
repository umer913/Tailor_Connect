import express from "express";
import { createNotificationController } from "../controllers/notificationController.js";
import { authenticateToken } from "../middleware/auth.js";

export const createNotificationRouter = ({ Order, Appointment }) => {
  const router = express.Router();
  const controller = createNotificationController({ Order, Appointment });

  // Apply authentication middleware to all notification routes
  router.use(authenticateToken);

  router.get("/get-notifications", controller.getNotifications);
  router.put("/clear-all-notifications", controller.clearAllNotifications);
  router.put("/dismiss-notification", controller.dismissNotification);
  router.get("/get-appointment-notifications", controller.getAppointmentNotifications);
  router.put("/dismiss-appointment-notification", controller.dismissAppointmentNotification);
  router.get("/tailor-notifications", controller.tailorNotifications);
  router.put("/clear-all-tailor-notifications", controller.clearAllTailorNotifications);
  router.put("/dismiss-tailor-notification", controller.dismissTailorNotification);
  router.get("/tailor-appointment-notifications", controller.tailorAppointmentNotifications);
  router.put("/dismiss-tailor-appointment-notification", controller.dismissTailorAppointmentNotification);

  return router;
};
