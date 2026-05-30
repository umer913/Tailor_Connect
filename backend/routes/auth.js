import express from "express";
import { createAuthController } from "../controllers/authController.js";

export const createAuthRouter = ({
  Profile,
  transporter,
  hashPassword,
  generateOTP,
}) => {
  const router = express.Router();
  const controller = createAuthController({
    Profile,
    transporter,
    hashPassword,
    generateOTP,
  });

  router.post("/signup", controller.signup);
  router.post("/verify-otp", controller.verifyOtp);
  router.post("/login", controller.login);
  router.post("/forgot-password", controller.forgotPassword);
  router.post("/reset-password", controller.resetPassword);

  return router;
};
