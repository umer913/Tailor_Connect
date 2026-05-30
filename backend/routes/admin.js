import express from "express";
import { createAdminController } from "../controllers/adminController.js";
import { authenticateToken, adminOnly } from "../middleware/auth.js";

export const createAdminRouter = ({ Profile, Order, Complaint }) => {
  const router = express.Router();
  const controller = createAdminController({ Profile, Order, Complaint });

  // Apply authentication and admin-only middleware to all admin routes
  router.use(authenticateToken);
  router.use(adminOnly);

  router.get("/get-tailors", controller.getTailors);
  router.delete("/remove-tailor", controller.removeTailor);
  router.get("/get-customers", controller.getCustomers);
  router.delete("/remove-customer", controller.removeCustomer);
  router.delete("/remove-order/:id", controller.removeOrder);
  router.get("/complaints", controller.getComplaints);
  router.put("/respond-complaint/:id", controller.respondComplaint);
  router.post("/send-message", controller.sendMessage);

  return router;
};
