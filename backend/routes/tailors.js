import express from "express";
import { createTailorController } from "../controllers/tailorController.js";

export const createTailorRouter = ({ Profile, Service }) => {
  const router = express.Router();
  const controller = createTailorController({ Profile, Service });

  // Public routes (for browsing tailors and tailors with services)
  router.get("/get-tailors", controller.getTailors);
  router.get("/get-tailors-with-services", controller.getTailorsWithServices);

  return router;
};
