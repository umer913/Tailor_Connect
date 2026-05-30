import express from "express";
import { createComplaintController } from "../controllers/complaintController.js";
import { authenticateToken } from "../middleware/auth.js";

export const createComplaintRouter = ({ Complaint, Profile, Order }) => {
  const router = express.Router();
  const controller = createComplaintController({ Complaint, Profile, Order });

  // Apply authentication middleware to all complaint routes
  router.use(authenticateToken);

  router.post("/file-complaint", controller.fileComplaint);
  router.get("/my-complaints/:email", controller.getMyComplaints);
  router.post("/follow-up", controller.followUp);
  router.delete("/delete-complaint/:id/:email", controller.deleteComplaint);

  return router;
};
