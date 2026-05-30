import express from "express";
import { createPaymentController } from "../controllers/paymentController.js";
import { authenticateToken } from "../middleware/auth.js";

export const createPaymentRouter = ({
  Order,
  Payment,
  PDFDocument,
  getPaymentByOrderId,
  upsertPayment,
  resolveOrderTotals,
  stripeSecretKey,
  stripeSuccessRedirectUrl,
  stripeCancelRedirectUrl,
}) => {
  const router = express.Router();
  const controller = createPaymentController({
    Order,
    Payment,
    PDFDocument,
    getPaymentByOrderId,
    upsertPayment,
    resolveOrderTotals,
    stripeSecretKey,
    stripeSuccessRedirectUrl,
    stripeCancelRedirectUrl,
  });

  // Protected API routes
  router.get("/order/:orderId", authenticateToken, controller.getOrderDetails);
  router.get("/invoice/:orderId", authenticateToken, controller.getInvoice);
  router.get("/status", authenticateToken, controller.getBulkStatus);
  router.post("/stripe-checkout", authenticateToken, controller.stripeCheckout);
  router.post("/verify-stripe", authenticateToken, controller.verifyStripe);

  // Public Callback/Redirect routes (accessed via browser redirect)
  router.get("/stripe-success/:orderId", controller.stripeSuccess);
  router.get("/stripe-cancel/:orderId", controller.stripeCancel);

  return router;
};
