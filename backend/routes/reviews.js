import express from "express";
import { createReviewController } from "../controllers/reviewController.js";
import { authenticateToken } from "../middleware/auth.js";

export const createReviewRouter = ({ TailorReview, Order, toSafeRating }) => {
  const router = express.Router();
  const controller = createReviewController({ TailorReview, Order, toSafeRating });

  // Public routes (useful when browsing tailors before login)
  router.get("/tailor-reviews", controller.getTailorReviews);
  router.get("/tailor-reviews/summary", controller.getTailorReviewsSummary);

  // Protected routes
  router.get("/customer-reviews", authenticateToken, controller.getCustomerReviews);
  router.post("/tailor-reviews", authenticateToken, controller.submitTailorReview);

  return router;
};
