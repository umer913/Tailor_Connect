import express from "express";
import { createProfileController } from "../controllers/profileController.js";
import { authenticateToken } from "../middleware/auth.js";

export const createProfileRouter = ({ Profile, hashPassword, upload, uploadBufferToCloudinary }) => {
  const router = express.Router();
  const controller = createProfileController({ Profile, hashPassword, uploadBufferToCloudinary });

  // Apply authentication middleware to all profile routes
  router.use(authenticateToken);

  router.get("/get-profile", controller.getProfile);
  router.put("/update-profile", upload.single("profilepic"), controller.updateProfile);
  router.get("/get-profile2", controller.getProfile2);

  return router;
};
