import Stripe from "stripe";

export const createPaymentController = ({
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
  const stripe = new Stripe(stripeSecretKey);

  return {
    getOrderDetails: async (req, res) => {
      const { orderId } = req.params;
      const { customer_email } = req.query;

      try {
        const order = await Order.findById(orderId)
          .select("_id customer_email service_type price quantity options tailor_name status")
          .exec();

        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }

        if (customer_email && customer_email !== order.customer_email) {
          return res.status(403).json({ error: "Order access denied" });
        }

        const totals = resolveOrderTotals(order);
        const payment = await getPaymentByOrderId(order.id);

        res.json({
          order: {
            ...order.toJSON(),
            quantity: totals.quantity,
            unit_price: totals.unitPrice,
            total_amount: totals.totalAmount,
          },
          payment: payment || { status: "unpaid", method: null },
        });
      } catch (err) {
        console.error("Payment order lookup failed:", err.message);
        res.status(500).json({ error: "Failed to fetch payment details" });
      }
    },

    getInvoice: async (req, res) => {
      const { orderId } = req.params;
      const { customer_email } = req.query;

      try {
        const order = await Order.findById(orderId)
          .select("_id customer_email service_type price quantity options tailor_name created_at")
          .exec();

        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }

        if (customer_email && customer_email !== order.customer_email) {
          return res.status(403).json({ error: "Order access denied" });
        }

        const payment = await getPaymentByOrderId(order.id);
        if (!payment || payment.status !== "paid") {
          return res.status(403).json({ error: "Invoice is available after payment" });
        }

        const totals = resolveOrderTotals(order);
        const issuedAt = new Date().toISOString().slice(0, 10);

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `inline; filename="TailorX-Invoice-${order.id}.pdf"`
        );

        const doc = new PDFDocument({ size: "A4", margin: 50 });
        doc.pipe(res);

        doc.fontSize(22).text("TailorX Invoice", { align: "center" });
        doc.moveDown(0.5);
        doc
          .fontSize(12)
          .fillColor("#555")
          .text("Thank you for your payment.", { align: "center" });

        doc.moveDown(1.5);
        doc.fillColor("#000").fontSize(12);
        doc.text(`Invoice No: TX-${order._id}`);
        doc.text(`Date: ${issuedAt}`);
        doc.text(`Customer: ${order.customer_email}`);
        doc.text(`Tailor: ${order.tailor_name || "TailorX"}`);

        doc.moveDown(1);
        doc.fontSize(13).text("Order Details", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Service: ${order.service_type || "Tailor Order"}`);
        doc.text(`Quantity: ${totals.quantity}`);
        doc.text(`Unit Price: ${totals.unitPrice.toFixed(2)} PKR`);
        doc.text(`Total: ${totals.totalAmount.toFixed(2)} PKR`);

        doc.moveDown(1);
        doc.fontSize(13).text("Payment", { underline: true });
        doc.moveDown(0.5);
        doc.fontSize(12);
        doc.text(`Method: ${String(payment.method || "Stripe").toUpperCase()}`);
        doc.text(`Status: ${payment.status}`);
        if (payment.paid_at) {
          doc.text(
            `Paid At: ${String(payment.paid_at).slice(0, 19).replace("T", " ")}`
          );
        }
        if (payment.stripe_payment_id) {
          doc.text(`Stripe Payment ID: ${payment.stripe_payment_id}`);
        }

        doc.moveDown(2);
        doc
          .fontSize(11)
          .fillColor("#777")
          .text("TailorX - Custom Tailoring Services", { align: "center" });
        doc.end();
      } catch (err) {
        console.error("Invoice generation failed:", err.message);
        res.status(500).json({ error: "Failed to generate invoice" });
      }
    },

    getBulkStatus: async (req, res) => {
      const orderIds = String(req.query.order_ids || "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean);

      if (orderIds.length === 0) {
        return res.json({ statuses: {} });
      }

      try {
        const payments = await Payment.find({ order_id: { $in: orderIds } }).exec();
        const statuses = {};

        for (const id of orderIds) {
          const found = payments.find((p) => p.order_id === id);
          statuses[id] = found?.status || "unpaid";
        }

        res.json({ statuses });
      } catch (err) {
        console.error("Bulk payment status failed:", err.message);
        res.status(500).json({ error: "Failed to fetch payment statuses" });
      }
    },

    stripeCheckout: async (req, res) => {
      const { order_id, customer_email } = req.body;

      if (!order_id) {
        return res.status(400).json({ error: "order_id is required" });
      }

      try {
        const order = await Order.findById(order_id)
          .select("_id customer_email service_type price quantity options tailor_name")
          .exec();

        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }

        if (customer_email && customer_email !== order.customer_email) {
          return res.status(403).json({ error: "Order access denied" });
        }

        const { quantity, unitPrice, totalAmount } = resolveOrderTotals(order);

        if (unitPrice <= 0 || totalAmount <= 0) {
          return res.status(400).json({ error: "Order amount is invalid for payment" });
        }

        // Create Stripe Checkout Session
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ["card"],
          line_items: [
            {
              price_data: {
                currency: "pkr",
                product_data: {
                  name: `${order.service_type || "Tailor"} Order #${order._id}`.slice(0, 100),
                  description: `Order from ${order.tailor_name || "TailorX"} — Qty: ${quantity}`.slice(0, 255),
                },
                unit_amount: Math.round(totalAmount * 100), // Stripe expects amount in cents/paisas
              },
              quantity: 1,
            },
          ],
          mode: "payment",
          success_url: `${req.protocol}://${req.get("host")}/payments/stripe-success/${order._id}?session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `${req.protocol}://${req.get("host")}/payments/stripe-cancel/${order._id}`,
          customer_email: order.customer_email,
          metadata: {
            order_id: String(order._id),
          },
        });

        await upsertPayment(order._id, {
          status: "initiated",
          method: "stripe",
          customer_email: order.customer_email,
          amount: totalAmount,
          currency: "PKR",
          stripe_payment_id: session.id,
          stripe_status: session.payment_status,
        });

        console.log(
          `[Stripe] Checkout session created for order ${order._id}, session_id: ${session.id}`
        );

        res.json({
          payment_url: session.url,
          amount: totalAmount,
          currency: "PKR",
        });
      } catch (err) {
        console.error("Stripe checkout session creation failed:", err.message);
        res.status(500).json({ error: "Failed to start Stripe checkout session" });
      }
    },

    stripeSuccess: async (req, res) => {
      const { orderId } = req.params;
      const { session_id } = req.query;

      try {
        let isPaid = false;
        let stripeStatus = "unknown";

        if (session_id) {
          const session = await stripe.checkout.sessions.retrieve(session_id);
          isPaid = session.payment_status === "paid";
          stripeStatus = session.payment_status;
        }

        if (isPaid) {
          await upsertPayment(orderId, {
            status: "paid",
            paid_at: new Date(),
            stripe_status: stripeStatus,
          });

          await Order.updateOne({ _id: orderId }, { status: "paid" });
          console.log(`[Stripe Success] Order ${orderId} marked as PAID`);
        } else {
          console.warn(`[Stripe Success] Session for order ${orderId} was not fully paid. Status: ${stripeStatus}`);
        }
      } catch (err) {
        console.error("Stripe success handler failed:", err.message);
      }

      res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Payment Successful - TailorX</title>
        <meta http-equiv="refresh" content="2;url=${stripeSuccessRedirectUrl}?order_id=${orderId}">
        <style>
          body { font-family: -apple-system, sans-serif; background: #0f0f13; color: #e0e7ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { text-align: center; padding: 40px 30px; background: rgba(157,42,75,0.12); border: 1px solid rgba(157,42,75,0.3); border-radius: 24px; max-width: 380px; }
          .icon { font-size: 64px; margin-bottom: 16px; }
          h1 { font-size: 22px; margin: 0 0 8px; color: #fff; }
          p { color: #E6B0B0; font-size: 15px; margin: 0 0 24px; }
          .note { color: #6ee7b7; font-size: 13px; background: rgba(16,185,129,0.1); padding: 12px; border-radius: 12px; border: 1px solid rgba(16,185,129,0.2); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">✅</div>
          <h1>Payment Successful!</h1>
          <p>Order #${orderId}</p>
          <div class="note">You can close this window and return to the TailorX app.</div>
        </div>
        <script>
          setTimeout(function () {
            window.location.href = "${stripeSuccessRedirectUrl}?order_id=${orderId}";
          }, 1200);
        </script>
      </body>
      </html>
    `);
    },

    stripeCancel: async (req, res) => {
      const { orderId } = req.params;

      try {
        const payment = await getPaymentByOrderId(orderId);
        if (payment && payment.status === "initiated") {
          await upsertPayment(orderId, {
            status: "cancelled",
            stripe_status: "cancelled",
          });
        }
      } catch (err) {
        console.error("Error cancelling Stripe payment:", err.message);
      }

      res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>Payment Cancelled - TailorX</title>
        <meta http-equiv="refresh" content="2;url=${stripeCancelRedirectUrl}?order_id=${orderId}">
        <style>
          body { font-family: -apple-system, sans-serif; background: #0f0f13; color: #e0e7ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
          .card { text-align: center; padding: 40px 30px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3); border-radius: 24px; max-width: 380px; }
          .icon { font-size: 64px; margin-bottom: 16px; }
          h1 { font-size: 22px; margin: 0 0 8px; color: #fff; }
          p { color: #f59e0b; font-size: 15px; margin: 0 0 24px; }
          .note { color: #fcd34d; font-size: 13px; background: rgba(245,158,11,0.1); padding: 12px; border-radius: 12px; border: 1px solid rgba(245,158,11,0.2); }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="icon">❌</div>
          <h1>Payment Cancelled</h1>
          <p>Order #${orderId}</p>
          <div class="note">You can close this window and return to the TailorX app to try again.</div>
        </div>
        <script>
          setTimeout(function () {
            window.location.href = "${stripeCancelRedirectUrl}?order_id=${orderId}";
          }, 1200);
        </script>
      </body>
      </html>
    `);
    },

    verifyStripe: async (req, res) => {
      const { order_id } = req.body;

      if (!order_id) {
        return res.status(400).json({ error: "order_id is required" });
      }

      try {
        let payment = await getPaymentByOrderId(order_id);

        if (!payment) {
          return res.json({ verified: false, status: "unpaid", payment: null });
        }

        // If initiated but not yet paid in DB, double check with Stripe session status
        if (payment.status === "initiated" && payment.stripe_payment_id) {
          const session = await stripe.checkout.sessions.retrieve(payment.stripe_payment_id);
          if (session.payment_status === "paid") {
            payment = await upsertPayment(order_id, {
              status: "paid",
              paid_at: new Date(),
              stripe_status: session.payment_status,
            });
            await Order.updateOne({ _id: order_id }, { status: "paid" });
          }
        }

        const isPaid = payment.status === "paid";

        res.json({
          verified: isPaid,
          status: payment.status,
          payment,
        });
      } catch (err) {
        console.error("Verify Stripe payment failed:", err.message);
        res.status(500).json({ error: "Failed to verify Stripe payment" });
      }
    },
  };
};
