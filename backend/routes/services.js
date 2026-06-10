import express from "express";
import { createServiceController } from "../controllers/serviceController.js";
import { authenticateToken } from "../middleware/auth.js";

export const createServiceRouter = ({ Service, upload, uploadBufferToCloudinary }) => {
  const router = express.Router();
  const controller = createServiceController({ Service, uploadBufferToCloudinary });

  // Public routes (for browsing services of a tailor)
  router.get("/get-tailor-services", controller.getTailorServices);

  // Protected routes (tailor modifications/management)
  router.post("/add-services", authenticateToken, controller.addServices);
  router.get("/get-services", authenticateToken, controller.getServices);
  router.put("/update-service", authenticateToken, controller.updateService);
  router.delete("/delete-service/:id", authenticateToken, controller.deleteService);

  // Custom service image upload
  router.post(
    "/upload-custom-images",
    authenticateToken,
    upload.array("images", 5),
    controller.uploadCustomServiceImages
  );

  return router;
};
