export const createOrderController = ({
  Order,
  Profile,
  transporter,
  uploadBufferToCloudinary,
  toSafeQuantity,
  parseNumericPrice,
  getPriceMeta,
}) => {
  return {
    placeOrder: async (req, res) => {
      try {
        const {
          customer_email,
          tailor_email,
          service_type,
          gender,
          price,
          quantity,
          measurements,
          options,
          tailor_name,
        } = req.body;

        console.log(
          "Received quantity from frontend:",
          quantity,
          "Type:",
          typeof quantity
        );
        console.log("All request body:", req.body);

        let fabricImageUrl = null;

        if (req.file) {
          const uploadResult = await uploadBufferToCloudinary(
            req.file.buffer,
            {
              folder: "tailorx/fabric",
              resource_type: "image",
            },
            req
          );

          fabricImageUrl = uploadResult.secure_url;
        }

        const parsedMeasurements = measurements ? JSON.parse(measurements) : {};
        const parsedOptions = options ? JSON.parse(options) : {};

        const finalQuantity = toSafeQuantity(quantity);
        const unitPrice = parseNumericPrice(price);
        const totalPrice = Number((unitPrice * finalQuantity).toFixed(2));
        const enrichedOptions = {
          ...(parsedOptions && typeof parsedOptions === "object" ? parsedOptions : {}),
          __unit_price: unitPrice,
          __price_mode: "total",
        };
        console.log(
          "Final quantity to save:",
          finalQuantity,
          "Type:",
          typeof finalQuantity
        );

        const order = await Order.create({
          customer_email,
          tailor_email,
          service_type,
          gender,
          price: totalPrice,
          quantity: finalQuantity,
          measurements: parsedMeasurements,
          options: enrichedOptions,
          fabric_image_url: fabricImageUrl,
          tailor_name,
          status: "pending",
          is_notified: false,
        });

        res.json({
          message: "Order placed successfully",
          order_id: order._id,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Failed to place order" });
      }
    },

    placeOrder2: async (req, res) => {
      try {
        const { CustomerEmail, tailorEmail, full_name, address, phone, orderId } =
          req.body;

        const updated = await Order.updateOne(
          { _id: orderId },
          { full_name, address, phone }
        );
        if (!updated || updated.matchedCount === 0) {
          return res.status(404).json({ error: "Order not found" });
        }

        // Respond immediately — don't wait on emails
        res.status(200).json({ message: "Order placed successfully!" });

        // Fire emails in background (non-blocking)
        transporter.sendMail({
          from: `"TailorX" <${process.env.BREVO_FROM}>`,
          to: CustomerEmail,
          subject: "Order Confirmation - TailorX",
          text: `Hello ${full_name},\n\nYour order has been successfully placed.\nThank you for choosing TailorX!`,
        }).catch((err) => console.error("[EMAIL] Customer notification failed:", err.message));

        transporter.sendMail({
          from: `"TailorX" <${process.env.BREVO_FROM}>`,
          to: tailorEmail,
          subject: "New Order Received - TailorX",
          text: "Hello,\n\nYou have received a new order.",
        }).catch((err) => console.error("[EMAIL] Tailor notification failed:", err.message));

      } catch (err) {
        console.error("[PLACE ORDER2 ERROR]", err);
        res.status(500).json({ error: err.message || "Failed to place order" });
      }
    },

    getOrders: async (req, res) => {
      const { email } = req.query;
      try {
        const filter = email ? { customer_email: email, is_deleted: { $ne: true } } : { is_deleted: { $ne: true } };
        const data = await Order.find(filter).sort({ created_at: -1 }).exec();
        res.json({ orders: data });
      } catch (error) {
        console.error("Error fetching orders:", error.message);
        res.status(500).json({ error: "Internal server error" });
      }
    },


    deleteOrder: async (req, res) => {
      const { id } = req.params;

      try {
        console.log(`\n[DELETE ORDER] Soft-deleting order ${id}`);

        const order = await Order.findById(id).exec();

        if (!order) {
          console.error(`[DELETE ORDER ERROR] Order not found: ${id}`);
          return res.status(404).json({ error: "Order not found" });
        }

        const customerEmail = order.customer_email;
        const serviceType = order.service_type || "Order";
        console.log(`[DELETE ORDER] Found order for customer: ${customerEmail}`);

        // Soft delete — mark as deleted so earnings history is preserved
        await Order.updateOne({ _id: id }, { is_deleted: true });
        console.log("[DELETE ORDER] Order soft-deleted in DB");

        try {
          await transporter.sendMail({
            from: `"TailorX" <${process.env.BREVO_FROM}>`,
            to: customerEmail,
            subject: "Order Cancelled - TailorX",
            text: `Hello,\n\nYour order for ${serviceType} has been Canceled .\n\nBest regards,\nTailorX Team`,
          });
          console.log(`[DELETE ORDER] Email sent to ${customerEmail}`);
        } catch (emailErr) {
          console.error(`[DELETE ORDER EMAIL ERROR] ${emailErr.message}`);
        }

        res.json({ message: "Order deleted successfully and notification sent" });
      } catch (err) {
        console.error("[DELETE ORDER FATAL ERROR]", err);
        res
          .status(500)
          .json({ error: "Internal Server Error", details: err.message });
      }
    },

    tailorOrders: async (req, res) => {
      const { email } = req.query;

      try {
        const data = await Order.find({ tailor_email: email, is_deleted: { $ne: true } })
          .sort({ created_at: -1 })
          .exec();

        res.json({ orders: data || [] });
      } catch (err) {
        console.error("Error fetching tailor orders:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    // Earnings endpoint — includes soft-deleted orders so earnings are never lost
    tailorEarnings: async (req, res) => {
      const { email } = req.query;

      try {
        const data = await Order.find({ tailor_email: email })
          .sort({ created_at: -1 })
          .exec();

        res.json({ orders: data || [] });
      } catch (err) {
        console.error("Error fetching tailor earnings:", err);
        res.status(500).json({ error: "Internal Server Error" });
      }
    },

    updateOrderStatus: async (req, res) => {
      const { id, status, description } = req.body;

      if (!id || !status) {
        return res.status(400).json({ error: "Missing id or status" });
      }
      if (!description || !description.trim()) {
        return res.status(400).json({ error: "Missing description" });
      }

      try {
        console.log(
          `\n[UPDATE STATUS] Starting status update for order ${id} to "${status}"`
        );
        const normalized = String(status).toLowerCase();

        const order = await Order.findById(id).exec();

        if (!order) {
          console.error(`[UPDATE STATUS ERROR] Order not found: ${id}`);
          throw new Error("Order not found");
        }

        const existingStatus = String(order.status || "").toLowerCase();
        if (existingStatus === "paid" || existingStatus === "completed") {
          return res.status(409).json({
            error: "Order status is locked after completion/payment",
          });
        }

        const customerEmail = order.customer_email;
        const tailorName = order.tailor_name || "Tailor";
        const serviceType = order.service_type || "Order";
        console.log(`[UPDATE STATUS] Customer: ${customerEmail}, Tailor: ${tailorName}`);

        if (normalized === "cancelled" || normalized === "rejected") {
          await Order.updateOne(
            { _id: id },
            { status, description, is_notified: false }
          );
          console.log(
            `[UPDATE STATUS] Order status set to ${normalized} and description updated`
          );

          try {
            await transporter.sendMail({
              from: `"TailorX" <${process.env.BREVO_FROM}>`,
              to: customerEmail,
              subject: `Your Order Has Been ${normalized.toUpperCase()} - TailorX`,
              text: `Hello,\n\nYour order for ${serviceType} has been ${normalized} by ${tailorName}.\n\nReason: ${description}\n\nWe appreciate your understanding.\n\nBest regards,\nTailorX Team`,
            });
            console.log(
              `[UPDATE STATUS] Cancellation email sent to ${customerEmail}`
            );
          } catch (emailErr) {
            console.error(
              `[UPDATE STATUS EMAIL ERROR] Failed to send email: ${emailErr.message}`
            );
          }

          return res.json({
            message:
              "Order status updated to cancelled/rejected and description saved",
            emailSent: true,
          });
        }

        await Order.updateOne(
          { _id: id },
          { status, description, is_notified: false }
        );
        console.log(
          "[UPDATE STATUS] Order updated in DB with is_notified: false and description updated"
        );

        const statusMessages = {
          accepted: "Your order has been accepted and will be started soon!",
          in_progress: "Your order is now in progress. We are working on it!",
          completed: "Your order is completed! Please arrange pickup or delivery.",
          pending: "Your order is pending review.",
        };

        const message =
          statusMessages[normalized] ||
          `Your order status has been updated to: ${status}`;

        try {
          await transporter.sendMail({
            from: `"TailorX" <${process.env.BREVO_FROM}>`,
            to: customerEmail,
            subject: `Order Update: ${status.toUpperCase()} - TailorX`,
            text: `Hello,\n\n${message}\n\nTailor: ${tailorName}\nService: ${serviceType}\n\nThank you for choosing TailorX!\n\nBest regards,\nTailorX Team`,
          });
          console.log(`[UPDATE STATUS] Status update email sent to ${customerEmail}`);
        } catch (emailErr) {
          console.error(
            `[UPDATE STATUS EMAIL ERROR] Failed to send email: ${emailErr.message}`
          );
        }

        res.json({ message: "Order status updated and notification sent" });
      } catch (err) {
        console.error("[UPDATE STATUS FATAL ERROR]", err.message);
        res.status(500).json({
          error: "Internal Server Error",
          details: err.message,
        });
      }
    },

    updateOrder: async (req, res) => {
      try {
        const { orderId, measurements, quantity } = req.body;

        if (!orderId) {
          return res.status(400).json({ error: "Missing orderId" });
        }

        // Safely parse measurements — guard against undefined/null/"undefined" strings
        let parsedMeasurements = {};
        if (measurements && measurements !== "undefined" && measurements !== "null") {
          try {
            parsedMeasurements = JSON.parse(measurements);
          } catch {
            parsedMeasurements = {};
          }
        }

        const updateData = {
          measurements: parsedMeasurements,
          updated_at: new Date().toISOString(),
        };

        if (quantity) {
          const existingOrder = await Order.findById(orderId)
            .select("price options quantity")
            .exec();

          if (!existingOrder) {
            return res.status(404).json({ error: "Order not found" });
          }

          const nextQuantity = toSafeQuantity(quantity);
          const { options: currentOptions, unitPrice } = getPriceMeta(existingOrder);

          updateData.quantity = nextQuantity;
          updateData.price = Number((unitPrice * nextQuantity).toFixed(2));
          updateData.options = {
            ...currentOptions,
            __unit_price: unitPrice,
            __price_mode: "total",
          };
        }

        if (req.file) {
          const uploadResult = await uploadBufferToCloudinary(
            req.file.buffer,
            {
              folder: "tailorx/fabric",
              resource_type: "image",
            },
            req
          );

          updateData.fabric_image_url = uploadResult.secure_url;
        }

        await Order.updateOne({ _id: orderId }, updateData);

        res.json({ message: "Order updated successfully!" });
      } catch (err) {
        console.error("Update failed:", err);
        res.status(500).json({ error: "Update failed" });
      }
    },
  };
};
