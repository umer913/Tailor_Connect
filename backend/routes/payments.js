import crypto from "crypto";
import express from "express";

export const createPaymentRouter = ({
  Order,
  PDFDocument,
  buildPayFastParamString,
  buildPayFastNotifyParamString,
  generatePayFastSignature,
  encodePayFastValue,
  getPaymentByOrderId,
  upsertPayment,
  readPaymentStore,
  resolveOrderTotals,
  PAYFAST_MERCHANT_ID,
  PAYFAST_MERCHANT_KEY,
  PAYFAST_PASSPHRASE,
  PAYFAST_PROCESS_URL,
  PAYFAST_NOTIFY_BASE_URL,
  PAYMENT_SUCCESS_URL,
  PAYMENT_CANCEL_URL,
}) => {
  const router = express.Router();

  // ---------------- PAYMENT ORDER DETAILS ----------------
  router.get("/order/:orderId", async (req, res) => {
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
  });

  // ---------------- PAYMENT INVOICE (PDF) ----------------
  router.get("/invoice/:orderId", async (req, res) => {
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
      doc.text(`Unit Price: ${totals.unitPrice.toFixed(2)} ZAR`);
      doc.text(`Total: ${totals.totalAmount.toFixed(2)} ZAR`);

      doc.moveDown(1);
      doc.fontSize(13).text("Payment", { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Method: ${payment.method || "payfast"}`);
      doc.text(`Status: ${payment.status}`);
      if (payment.paid_at) {
        doc.text(
          `Paid At: ${String(payment.paid_at).slice(0, 19).replace("T", " ")}`
        );
      }
      if (payment.payfast_payment_id) {
        doc.text(`Transaction ID: ${payment.payfast_payment_id}`);
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
  });

  // ---------------- BULK PAYMENT STATUS ----------------
  router.get("/status", async (req, res) => {
    const orderIds = String(req.query.order_ids || "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (orderIds.length === 0) {
      return res.json({ statuses: {} });
    }

    try {
      const store = await readPaymentStore();
      const statuses = {};

      for (const id of orderIds) {
        statuses[id] = store[id]?.status || "unpaid";
      }

      res.json({ statuses });
    } catch (err) {
      console.error("Bulk payment status failed:", err.message);
      res.status(500).json({ error: "Failed to fetch payment statuses" });
    }
  });

  // ---------------- PAYFAST CHECKOUT ----------------
  router.post("/payfast-checkout", async (req, res) => {
    const { order_id, customer_email } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: "order_id is required" });
    }

    if (!PAYFAST_MERCHANT_ID || !PAYFAST_MERCHANT_KEY) {
      return res.status(500).json({ error: "PayFast is not configured on server" });
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

      const paymentData = {
        merchant_id: PAYFAST_MERCHANT_ID,
        merchant_key: PAYFAST_MERCHANT_KEY,
        return_url: `${PAYFAST_NOTIFY_BASE_URL}/payments/payfast-return/${order._id}`,
        cancel_url: `${PAYFAST_NOTIFY_BASE_URL}/payments/payfast-cancel/${order._id}`,
        notify_url: `${PAYFAST_NOTIFY_BASE_URL}/payments/payfast-notify`,
        email_address: order.customer_email || "",
        m_payment_id: String(order._id),
        amount: totalAmount.toFixed(2),
        item_name: `${order.service_type || "Tailor"} Order #${order._id}`.slice(0, 100),
        item_description: `Order from ${order.tailor_name || "TailorX"} — Qty: ${quantity}`.slice(0, 255),
      };

      const cleanPaymentData = Object.fromEntries(
        Object.entries(paymentData).filter(
          ([, value]) => value !== "" && value !== undefined && value !== null
        )
      );

      const signature = generatePayFastSignature(cleanPaymentData, "");
      cleanPaymentData.signature = signature;

      const queryString = buildPayFastParamString(cleanPaymentData);

      const paymentUrl = `${PAYFAST_PROCESS_URL}?${queryString}`;

      await upsertPayment(order._id, {
        status: "initiated",
        method: "payfast",
        customer_email: order.customer_email,
        amount: totalAmount,
        currency: "PKR",
        payfast_payment_id: String(order._id),
      });

      console.log(
        `[PAYFAST] Checkout initiated for order ${order._id}, amount: ${totalAmount}`
      );

      res.json({
        payment_url: paymentUrl,
        amount: totalAmount,
        currency: "PKR",
      });
    } catch (err) {
      console.error("PayFast checkout failed:", err.message);
      res.status(500).json({ error: "Failed to start PayFast checkout" });
    }
  });

  // ---------------- PAYFAST RETURN ----------------
  router.get("/payfast-return/:orderId", async (req, res) => {
    const orderId = req.params.orderId || "";

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Payment Successful - TailorX</title>
      <meta http-equiv="refresh" content="2;url=${PAYMENT_SUCCESS_URL}?order_id=${orderId}">
      <style>
        body { font-family: -apple-system, sans-serif; background: #0a0e27; color: #e0e7ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { text-align: center; padding: 40px 30px; background: rgba(79,70,229,0.12); border: 1px solid rgba(79,70,229,0.3); border-radius: 24px; max-width: 380px; }
        .icon { font-size: 64px; margin-bottom: 16px; }
        h1 { font-size: 22px; margin: 0 0 8px; }
        p { color: #818cf8; font-size: 15px; margin: 0 0 24px; }
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
          window.location.href = "${PAYMENT_SUCCESS_URL}?order_id=${orderId}";
        }, 1200);
      </script>
    </body>
    </html>
  `);
  });

  // ---------------- PAYFAST CANCEL ----------------
  router.get("/payfast-cancel/:orderId", async (req, res) => {
    const orderId = req.params.orderId || "";

    try {
      const payment = await getPaymentByOrderId(orderId);
      if (payment && payment.status === "initiated") {
        await upsertPayment(orderId, { status: "cancelled" });
      }
    } catch (err) {
      console.error("Error cancelling payment:", err);
    }

    res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <title>Payment Cancelled - TailorX</title>
      <meta http-equiv="refresh" content="2;url=${PAYMENT_CANCEL_URL}?order_id=${orderId}">
      <style>
        body { font-family: -apple-system, sans-serif; background: #0a0e27; color: #e0e7ff; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
        .card { text-align: center; padding: 40px 30px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.3); border-radius: 24px; max-width: 380px; }
        .icon { font-size: 64px; margin-bottom: 16px; }
        h1 { font-size: 22px; margin: 0 0 8px; }
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
          window.location.href = "${PAYMENT_CANCEL_URL}?order_id=${orderId}";
        }, 1200);
      </script>
    </body>
    </html>
  `);
  });

  // ---------------- PAYFAST ITN ----------------
  router.post("/payfast-notify", async (req, res) => {
    res.status(200).send("OK");

    try {
      const data = req.body;
      console.log(
        "[PAYFAST ITN] Received notification:",
        JSON.stringify(data, null, 2)
      );

      const receivedSignature = data.signature;
      if (!receivedSignature) {
        console.error("[PAYFAST ITN] No signature in notification");
        return;
      }

      const { signature: _sig, ...paramsWithoutSig } = data;
      const notifyParamString = buildPayFastNotifyParamString(paramsWithoutSig);
      const notifyWithPassphrase = PAYFAST_PASSPHRASE
        ? `${notifyParamString}&passphrase=${encodePayFastValue(PAYFAST_PASSPHRASE)}`
        : notifyParamString;
      const expectedSignature = crypto
        .createHash("md5")
        .update(notifyWithPassphrase)
        .digest("hex");

      if (receivedSignature !== expectedSignature) {
        console.error(
          `[PAYFAST ITN] Signature mismatch! Received: ${receivedSignature}, Expected: ${expectedSignature}`
        );
        return;
      }

      console.log("[PAYFAST ITN] Signature verified successfully");

      const orderId = data.m_payment_id;
      const paymentStatus = String(data.payment_status || "").toUpperCase();
      const amountGross = Number(data.amount_gross) || 0;

      if (!orderId) {
        console.error("[PAYFAST ITN] Missing m_payment_id");
        return;
      }

      const isPaid = paymentStatus === "COMPLETE";

      await upsertPayment(orderId, {
        status: isPaid ? "paid" : "initiated",
        method: "payfast",
        payfast_payment_id: data.pf_payment_id || null,
        amount: amountGross || undefined,
        currency: "PKR",
        paid_at: isPaid ? new Date().toISOString() : null,
        payfast_status: paymentStatus,
      });

      if (isPaid) {
        await Order.updateOne({ _id: orderId }, { status: "paid" });
      }

      console.log(
        `[PAYFAST ITN] Order ${orderId} — status: ${paymentStatus}, paid: ${isPaid}`
      );
    } catch (err) {
      console.error("[PAYFAST ITN] Error processing notification:", err.message);
    }
  });

  // ---------------- VERIFY PAYFAST PAYMENT ----------------
  router.post("/verify-payfast", async (req, res) => {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: "order_id is required" });
    }

    try {
      const payment = await getPaymentByOrderId(order_id);

      if (!payment) {
        return res.json({ verified: false, status: "unpaid", payment: null });
      }

      const isPaid = payment.status === "paid";

      res.json({
        verified: isPaid,
        status: payment.status,
        payment,
      });
    } catch (err) {
      console.error("Verify PayFast payment failed:", err.message);
      res.status(500).json({ error: "Failed to verify PayFast payment" });
    }
  });

  return router;
};
