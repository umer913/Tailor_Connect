import express from "express";
import { createOrderController } from "../controllers/orderController.js";
import { authenticateToken } from "../middleware/auth.js";

export const createOrderRouter = ({
  Order,
  Profile,
  transporter,
  upload,
  uploadBufferToCloudinary,
  toSafeQuantity,
  parseNumericPrice,
  getPriceMeta,
}) => {
  const router = express.Router();
  const controller = createOrderController({
    Order,
    Profile,
    transporter,
    uploadBufferToCloudinary,
    toSafeQuantity,
    parseNumericPrice,
    getPriceMeta,
  });

  // Apply authentication middleware to all order routes
  router.use(authenticateToken);

  router.post("/place-order", upload.single("fabric"), controller.placeOrder);
  router.post("/place-order2", controller.placeOrder2);
  router.get("/get-orders", controller.getOrders);
  router.delete("/delete-order/:id", controller.deleteOrder);
  router.get("/tailor-orders", controller.tailorOrders);
  router.put("/update-order-status", controller.updateOrderStatus);
  router.put("/update-order", upload.single("fabric"), controller.updateOrder);

  return router;
};
