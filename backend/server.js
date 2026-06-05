
import cors from "cors";
import crypto from "crypto";
import dns from "dns";
import dotenv from "dotenv";
import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import nodemailer from "nodemailer";
import path from "path";
import PDFDocument from "pdfkit";
import { fileURLToPath } from "url";


import {
    Appointment,
    ChatMessage,
    Complaint,
    Order,
    Payment,
    Profile,
    Service,
    TailorReview,
} from "./models/index.js";
import { createAdminRouter } from "./routes/admin.js";
import { createAppointmentRouter } from "./routes/appointments.js";
import { createAuthRouter } from "./routes/auth.js";
import { createChatRouter } from "./routes/chat.js";
import { createComplaintRouter } from "./routes/complaints.js";
import { createNotificationRouter } from "./routes/notifications.js";
import { createOrderRouter } from "./routes/orders.js";
import { createPaymentRouter } from "./routes/payments.js";
import { createProfileRouter } from "./routes/profiles.js";
import { createReviewRouter } from "./routes/reviews.js";
import { createServiceRouter } from "./routes/services.js";
import { createTailorRouter } from "./routes/tailors.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Server] TailorX backend listening on port ${PORT}`);

  // Attempt to connect to MongoDB in the background
  console.log(`[DB] Connecting to MongoDB Atlas...`);
  mongoose
    .connect(MONGODB_URI, { dbName: MONGODB_DB_NAME })
    .then(() => {
      console.log(`[DB] Successfully connected to database: ${MONGODB_DB_NAME}`);
    })
    .catch((err) => {
      console.error("[DB] MongoDB connection failed:", err.message);
      // We don't exit the process here so the server stays alive 
      // for you to check logs and fix any IP whitelist issues.
    });
});
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
dns.setDefaultResultOrder("ipv4first");
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PAYMENT_STORE_PATH = path.join(__dirname, "payments-store.json");

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "tailorx";
app.get('/', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'TailorX Backend',
    time: new Date().toISOString()
  });
});


const PAYMENT_SUCCESS_URL =
  process.env.PAYMENT_SUCCESS_URL || "tailorx://payment-success";
const PAYMENT_CANCEL_URL =
  process.env.PAYMENT_CANCEL_URL || "tailorx://payment-cancel";


const toSafeQuantity = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
};

const parseNumericPrice = (rawPrice) => {
  const firstMatch = String(rawPrice || "").match(/\d+(?:\.\d+)?/);
  return firstMatch ? Number.parseFloat(firstMatch[0]) : 0;
};

const toSafeRating = (value) => {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) ? parsed : null;
};

const getPriceMeta = (order) => {
  const options =
    order?.options && typeof order.options === "object" ? order.options : {};
  const parsedUnitPrice = Number(options.__unit_price);
  const unitPrice =
    Number.isFinite(parsedUnitPrice) && parsedUnitPrice > 0
      ? parsedUnitPrice
      : parseNumericPrice(order?.price);
  return { options, unitPrice };
};

const resolveOrderTotals = (order) => {
  const quantity = toSafeQuantity(order?.quantity);
  const { unitPrice } = getPriceMeta(order);
  const totalAmount = Number((unitPrice * quantity).toFixed(2));

  return { quantity, unitPrice, totalAmount };
};

async function getPaymentByOrderId(orderId) {
  return await Payment.findOne({ order_id: String(orderId) }).exec();
}

async function upsertPayment(orderId, patch) {
  return await Payment.findOneAndUpdate(
    { order_id: String(orderId) },
    { ...patch, order_id: String(orderId) },
    { new: true, upsert: true }
  ).exec();
}

function hashPassword(password) {
  let hash = "";
  for (let i = 0; i < password.length; i++) {
    hash += password.charCodeAt(i) * 7; //converting every string into Assci code(number then multiplying it by 7)
  }
  return hash; // string of numeric values
}

// function hashPassword(password) {
//   return crypto.createHash("sha256").update(password).digest("hex");
// }

function generateOTP() {
  return Math.floor(Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const upload = multer({ storage: multer.memoryStorage() });

const saveToGridFS = (buffer, req) => {
  return new Promise((resolve, reject) => {
    if (!mongoose.connection.db) {
      return reject(new Error("Database connection not ready"));
    }

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}.jpg`;
    const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: "images",
    });

    const uploadStream = bucket.openUploadStream(filename);
    uploadStream.end(buffer);

    uploadStream.on("finish", () => {
      const secure_url = `/images/${filename}`;
      console.log(`[GridFS] Saved uploaded file (relative): ${secure_url}`);
      resolve({ secure_url });
    });

    uploadStream.on("error", (error) => {
      reject(error);
    });
  });
};

const uploadBufferToCloudinary = (buffer, options = {}, req = null) => {
  return saveToGridFS(buffer, req);
};


// Simple wrapper that executes a Mongoose query — used by the chat router
const runChatboxQuery = async (queryFn) => {
  return queryFn();
};

const CHAT_IMAGE_FOLDER = "tailorx/chat";
const CHAT_ROLES = ["customer", "tailor"];
const CHAT_PREFIX_REGEX = /^\[\[(customer|tailor)\]\]/i;

const normalizeChatRole = (value) => String(value || "").toLowerCase();
const isSupportedChatRole = (value) => CHAT_ROLES.includes(value);

const encodeChatMessage = (senderRole, message) => {
  const normalizedRole = senderRole === "tailor" ? "tailor" : "customer";
  return `[[${normalizedRole}]]${String(message || "").trim()}`;
};

const decodeChatMessage = (storedMessage) => {
  const rawValue = String(storedMessage || "");
  const prefixMatch = rawValue.match(CHAT_PREFIX_REGEX);
  return prefixMatch
    ? {
      sender_role: prefixMatch[1].toLowerCase(),
      message: rawValue.slice(prefixMatch[0].length),
    }
    : { sender_role: null, message: rawValue };
};

const getConversationKey = (tailorEmail, customerEmail) =>
  `${tailorEmail || ""}::${customerEmail || ""}`;
const toDecodedChatRow = (row) => {
  const raw = typeof row?.toJSON === "function" ? row.toJSON() : row;
  const decoded = decodeChatMessage(raw.message);
  return { ...raw, sender_role: decoded.sender_role, message: decoded.message };
};
const getChatPreview = (decodedMessage, imageUrl) => {
  const trimmedMessage = decodedMessage?.trim();
  return trimmedMessage
    ? trimmedMessage.slice(0, 160)
    : imageUrl
      ? "[Image message]"
      : "[New message]";
};

const authRouter = createAuthRouter({
  Profile,
  transporter,
  hashPassword,
  generateOTP,
});
const profileRouter = createProfileRouter({ Profile, hashPassword, upload, uploadBufferToCloudinary });
const serviceRouter = createServiceRouter({ Service });
const tailorRouter = createTailorRouter({ Profile, Service });
const reviewRouter = createReviewRouter({ TailorReview, Order, toSafeRating });
const chatRouter = createChatRouter({
  ChatMessage,
  transporter,
  upload,
  uploadBufferToCloudinary,
  CHAT_IMAGE_FOLDER,
  normalizeChatRole,
  isSupportedChatRole,
  encodeChatMessage,
  decodeChatMessage,
  getConversationKey,
  toDecodedChatRow,
  getChatPreview,
  runChatboxQuery,
});
const orderRouter = createOrderRouter({
  Order,
  Profile,
  transporter,
  upload,
  uploadBufferToCloudinary,
  toSafeQuantity,
  parseNumericPrice,
  getPriceMeta,
});
const paymentRouter = createPaymentRouter({
  Order,
  Payment,
  PDFDocument,
  getPaymentByOrderId,
  upsertPayment,
  resolveOrderTotals,
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,
  stripeSuccessRedirectUrl: process.env.STRIPE_SUCCESS_REDIRECT_URL,
  stripeCancelRedirectUrl: process.env.STRIPE_CANCEL_REDIRECT_URL,
});
const appointmentRouter = createAppointmentRouter({ Appointment });
const adminRouter = createAdminRouter({ Profile, Order, Complaint });
const notificationRouter = createNotificationRouter({ Order, Appointment });
const complaintRouter = createComplaintRouter({ Complaint, Profile, Order });

app.use("/auth", authRouter);
app.use("/profiles", profileRouter);
app.use("/services", serviceRouter);
app.use("/tailors", tailorRouter);
app.use("/reviews", reviewRouter);
app.use("/chat", chatRouter);
app.use("/orders", orderRouter);
app.use("/payments", paymentRouter);
app.use("/appointments", appointmentRouter);
app.use("/admin", adminRouter);
app.use("/notifications", notificationRouter);
app.use("/complaints", complaintRouter);

app.get("/images/:filename", (req, res) => {
  if (!mongoose.connection.db) {
    return res.status(500).json({ error: "Database connection not ready" });
  }

  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "images",
  });

  const downloadStream = bucket.openDownloadStreamByName(req.params.filename);

  res.set("Content-Type", "image/jpeg");
  downloadStream.pipe(res);

  downloadStream.on("error", (err) => {
    console.error("GridFS download error:", err.message);
    res.status(404).json({ error: "File not found" });
  });
});
