import { createClient } from "@supabase/supabase-js"; //this connects my js project with supabase for communication
import cors from "cors"; //for cross sharing of resource on different ports//backend and frontend
import dotenv from "dotenv"; //secret enviroment keys and variable are stored in .env which are not directly visible as we r not using in the code
import express from "express"; //Nodejs Framework for creating apis,handle http request and response,parsing data
import multer from "multer";
import nodemailer from "nodemailer"; //node.js library to send otp messages


dotenv.config();

const app = express();//creating express instance to add routes,middleware 
app.use(cors());//adding middleware for resource sharing
app.use(express.json());//parsing json body when requested

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);//reading enviroment variables


function hashPassword(password) {
  let hash = "";
  for (let i = 0; i < password.length; i++) {
    hash += password.charCodeAt(i) * 7; //converting every string into Assci code(number then multiplying it by 7)
  }
  return hash; // string of numeric values
}

//function hashPassword(password) { return crypto.createHash("sha256").update(password).digest("hex"); }more secure hash-sha256

function generateOTP() {
  return Math.floor(Math.random() * 900000).toString(); //generates 6-digit OTP ,math.random selects any value between 0-1 decimals imcluded,math.floor eleminates decimals
}


const transporter = nodemailer.createTransport({//building connection with email service provider
  service: "gmail",//sending on gmail server
  auth: {
    user: process.env.EMAIL_USER,//sending mail through this user
    pass: process.env.EMAIL_PASS,
  },
});

// ---------------- SIGNUP ----------------
app.post("/signup", async (req, res) => {
  const { email, password, full_name, cnic, role } = req.body;

  try {
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .single();

    if (existing)
      return res.status(400).json({ error: "User already exists" });

    // Hash password manually
    const hashed = hashPassword(password);

    // Generate OTP
    const otp = generateOTP();

    // store new user in profilles table
    const { error } = await supabase.from("profiles").insert([
      {
        email,
        full_name,
        cnic,
        role,
        password: hashed,
        otp,
        verified: false,//user is unverified as a default
      },
    ]);

    if (error) return res.status(400).json({ error: error.message });

    // Send OTP via email
    await transporter.sendMail({
      from: `"TailorX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Your OTP Verification Code",
      text: `Hello ${full_name}, your OTP is: ${otp}`,
    });

    res.json({ message: "OTP sent to your email!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- VERIFY OTP ----------------
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const { data: user, error } = await supabase
      .from("profiles")
      .select("id, otp")
      .eq("email", email)
      .single();


    if (user.otp !== otp) return res.status(400).json({ error: "Invalid OTP" });

    await supabase.from("profiles").update({ verified: true, otp: null }).eq("email", email);

    res.json({ message: "E mail verified successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- LOGIN ----------------
app.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Hash incoming password 
    const hashed = hashPassword(password);

    // Fetch user
    const { data: user, error } = await supabase
      .from("profiles")
      .select("id, email, password, full_name, role, verified")
      .eq("email", email)
      .single();

    if (!user) return res.status(400).json({ error: "Invalid email or password" });
    if (!user.verified) return res.status(400).json({ error: "Email not verified" });
    if (user.password !== hashed) return res.status(400).json({ error: "Invalid password" });

    const userData = {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    };

    res.json({ user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- FORGOT PASSWORD ----------------
app.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // check user exists
    const { data: user, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("email", email)
      .single();

    if (error || !user)
      return res.status(400).json({ error: "User not found" });

    // generate OTP
    const otp = generateOTP();

    // save OTP in database
    await supabase
      .from("profiles")
      .update({ otp })
      .eq("email", email);

    // send OTP via email
    await transporter.sendMail({
      from: `"TailorX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP",
      text: `Hello ${user.full_name}, your password reset OTP is: ${otp}`,
    });

    res.json({ message: "OTP sent to your email!" });
  } catch (err) {
    console.error("Forgot Password Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- RESET PASSWORD ----------------
app.post("/reset-password", async (req, res) => {
  const { email, otp, newPassword } = req.body;

  try {
    // fetch user and OTP
    const { data: user, error } = await supabase
      .from("profiles")
      .select("id, otp")
      .eq("email", email)
      .single();

    if (error || !user)
      return res.status(400).json({ error: "User not found" });

    if (user.otp !== otp)
      return res.status(400).json({ error: "Invalid OTP" });

    // hash new password
    const hashed = hashPassword(newPassword);

    // update password & clear OTP
    await supabase
      .from("profiles")
      .update({ password: hashed, verified: true, otp: null })
      .eq("email", email);

    res.json({ message: "Password reset successfully!" });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
//Tailor/Customer Dashbaord
// ---------------- GET PROFILE ----------------
app.get("/get-profile", async (req, res) => {
  const { email } = req.query;
  try {
    const { data: user, error } = await supabase
      .from("profiles")
      .select("full_name, cnic, phone_number, location")
      .eq("email", email)
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// ---------------- UPDATE PROFILE ----------------
app.put("/update-profile", async (req, res) => {
  const { email, full_name, cnic, phone_number, location, password } = req.body;

  try {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name, cnic, phone_number, location })
      .eq("email", email);

    if (updateError) return res.status(400).json({ error: updateError.message });

    if (password && password.trim() !== "") {
      const hashed = hashPassword(password);
      const { error: pwError } = await supabase
        .from("profiles")
        .update({ password: hashed })
        .eq("email", email);

      if (pwError) return res.status(400).json({ error: pwError.message });
    }

    res.json({ message: "Profile updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Tailor
// ---------------- ADD SERVICES ----------------
app.post("/add-services", async (req, res) => {
  const { email, services } = req.body;

  try {

    const insertData = services.map(s => ({
      tailor_email: email,
      service_types: s.service_types,
      gender: s.gender,
      description: s.description,
      price_range: s.price_range
    }));

    const { error } = await supabase.from("services").insert(insertData);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Services added successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- GET SERVICES ----------------
app.get("/get-services", async (req, res) => {
  const { email } = req.query;
  try {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("tailor_email", email);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ services: data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- UPDATE SERVICE ----------------
app.put("/update-service", async (req, res) => {
  const { email, id, service_types, gender, description, price_range } = req.body;

  try {
    const { error } = await supabase
      .from("services")
      .update({ service_types, gender, description, price_range })
      .eq("tailor_email", email)
      .eq("id", id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Service updated successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------------- DELETE SERVICE ----------------
app.delete("/delete-service/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from("services")
      .delete()
      .eq("id", id);

    if (error) return res.status(400).json({ error: error.message });

    res.json({ message: "Service deleted successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Customer
// ---------------- BrowseTailors ----------------
app.get("/get-tailors", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name,location,phone_number ,email")
      .eq("role", "tailor");

    if (error) return res.status(400).json({ error: error.message });

    res.json({ tailors: data });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/get-tailors-with-services", async (req, res) => {
  try {
    const { data: tailors, error: tailorsError } = await supabase
      .from("profiles")
      .select("id, full_name, location, phone_number, email")
      .eq("role", "tailor");

    if (tailorsError) {
      return res.status(400).json({ error: tailorsError.message });
    }

    const { data: services, error: servicesError } = await supabase
      .from("services")
      .select("id, tailor_email, service_types, price_range, gender, description");

    if (servicesError) {
      return res.status(400).json({ error: servicesError.message });
    }

    const servicesByTailorEmail = (services || []).reduce((acc, service) => {
      const email = service.tailor_email;
      if (!email) {
        return acc;
      }

      if (!acc[email]) {
        acc[email] = [];
      }

      acc[email].push(service);
      return acc;
    }, {});

    const tailorsWithServices = (tailors || []).map((tailor) => ({
      ...tailor,
      services: servicesByTailorEmail[tailor.email] || [],
    }));

    res.json({ tailors: tailorsWithServices });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// ---------------- Get Tailors Service ----------------
app.get('/get-tailor-services', async (req, res) => {
  const { email } = req.query;

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('tailor_email', email);

    if (error) throw error;

    res.json({ services: data });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch tailor services' });
  }
});
// ---------------- PLACE ORDER ----------------
const upload = multer({ storage: multer.memoryStorage() });// Configure multer to store uploaded files temporarily in memory as buffers,
// so we can directly upload them to cloud storage without saving to disk.

const CHATBOX_TABLE_CANDIDATES = ["chatbox", "Chatbox"];
const CHAT_PREFIX_REGEX = /^\[\[(customer|tailor)\]\]/i;

const encodeChatMessage = (senderRole, message) => {
  const normalizedRole = senderRole === "tailor" ? "tailor" : "customer";
  return `[[${normalizedRole}]]${String(message || "").trim()}`;
};

const decodeChatMessage = (storedMessage) => {
  const rawValue = String(storedMessage || "");
  const prefixMatch = rawValue.match(CHAT_PREFIX_REGEX);

  if (!prefixMatch) {
    return {
      sender_role: null,
      message: rawValue,
    };
  }

  return {
    sender_role: prefixMatch[1].toLowerCase(),
    message: rawValue.slice(prefixMatch[0].length),
  };
};

const getConversationKey = (tailorEmail, customerEmail) => `${tailorEmail || ""}::${customerEmail || ""}`;

const runChatboxQuery = async (queryFactory) => {
  let lastResult = null;

  for (const tableName of CHATBOX_TABLE_CANDIDATES) {
    const result = await queryFactory(tableName);
    lastResult = result;

    if (!result?.error) {
      return { ...result, tableName };
    }

    const normalizedMessage = String(result.error.message || "").toLowerCase();
    const isMissingTableError = normalizedMessage.includes("relation") && normalizedMessage.includes("does not exist");

    if (!isMissingTableError) {
      return { ...result, tableName };
    }
  }

  return { ...(lastResult || {}), tableName: CHATBOX_TABLE_CANDIDATES[0] };
};

app.get("/chat-conversations", async (req, res) => {
  const { email, role } = req.query;
  const normalizedRole = String(role || "").toLowerCase();

  if (!email || !["customer", "tailor"].includes(normalizedRole)) {
    return res.status(400).json({ error: "email and role (customer|tailor) are required" });
  }

  const column = normalizedRole === "customer" ? "customer_email" : "tailor_email";

  try {
    const { data, error } = await runChatboxQuery((tableName) =>
      supabase
        .from(tableName)
        .select("id, tailor_email, customer_email, tailor_name, customer_name, message, image_url, is_read, datetime")
        .eq(column, email)
        .order("datetime", { ascending: false })
    );

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const conversationMap = new Map();

    for (const row of data || []) {
      const key = getConversationKey(row.tailor_email, row.customer_email);
      const decoded = decodeChatMessage(row.message);
      const isUnreadIncoming = Boolean(decoded.sender_role && decoded.sender_role !== normalizedRole && !row.is_read);

      if (!conversationMap.has(key)) {
        conversationMap.set(key, {
          conversation_id: key,
          tailor_email: row.tailor_email,
          customer_email: row.customer_email,
          tailor_name: row.tailor_name,
          customer_name: row.customer_name,
          last_message: decoded.message || (row.image_url ? "[Image]" : ""),
          last_image_url: row.image_url,
          last_datetime: row.datetime,
          unread_count: isUnreadIncoming ? 1 : 0,
        });
      } else if (isUnreadIncoming) {
        const existing = conversationMap.get(key);
        existing.unread_count += 1;
      }
    }

    res.json({ conversations: Array.from(conversationMap.values()) });
  } catch (err) {
    console.error("Chat conversations error:", err);
    res.status(500).json({ error: "Failed to fetch conversations" });
  }
});

app.get("/chat-messages", async (req, res) => {
  const { tailor_email, customer_email, viewer_role } = req.query;
  const normalizedViewerRole = String(viewer_role || "").toLowerCase();

  if (!tailor_email || !customer_email) {
    return res.status(400).json({ error: "tailor_email and customer_email are required" });
  }

  try {
    const { data, error } = await runChatboxQuery((tableName) =>
      supabase
        .from(tableName)
        .select("id, tailor_email, customer_email, tailor_name, customer_name, message, image_url, is_read, datetime")
        .eq("tailor_email", tailor_email)
        .eq("customer_email", customer_email)
        .order("datetime", { ascending: true })
    );

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const messages = (data || []).map((row) => {
      const decoded = decodeChatMessage(row.message);
      return {
        ...row,
        sender_role: decoded.sender_role,
        message: decoded.message,
      };
    });

    if (["customer", "tailor"].includes(normalizedViewerRole)) {
      const incomingRole = normalizedViewerRole === "customer" ? "tailor" : "customer";

      await runChatboxQuery((tableName) =>
        supabase
          .from(tableName)
          .update({ is_read: true })
          .eq("tailor_email", tailor_email)
          .eq("customer_email", customer_email)
          .eq("is_read", false)
          .like("message", `[[${incomingRole}]]%`)
      );
    }

    res.json({ messages });
  } catch (err) {
    console.error("Chat messages error:", err);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});

app.post("/chat-send-message", async (req, res) => {
  const {
    tailor_email,
    customer_email,
    tailor_name,
    customer_name,
    sender_role,
    message,
    image_url,
  } = req.body;

  const normalizedSenderRole = String(sender_role || "").toLowerCase();
  const messageText = typeof message === "string" ? message.trim() : "";

  if (!tailor_email || !customer_email || !tailor_name || !customer_name) {
    return res.status(400).json({ error: "tailor/customer names and emails are required" });
  }

  if (!["customer", "tailor"].includes(normalizedSenderRole)) {
    return res.status(400).json({ error: "sender_role must be customer or tailor" });
  }

  if (!messageText && !image_url) {
    return res.status(400).json({ error: "message text or image is required" });
  }

  try {
    const encodedMessage = encodeChatMessage(normalizedSenderRole, messageText);

    const { data, error } = await runChatboxQuery((tableName) =>
      supabase
        .from(tableName)
        .insert([
          {
            tailor_email,
            customer_email,
            tailor_name,
            customer_name,
            message: encodedMessage,
            image_url: image_url || null,
            is_read: false,
          },
        ])
        .select("id, tailor_email, customer_email, tailor_name, customer_name, message, image_url, is_read, datetime")
        .single()
    );

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    const decoded = decodeChatMessage(data.message);

    const isSenderCustomer = normalizedSenderRole === "customer";
    const recipientEmail = isSenderCustomer ? tailor_email : customer_email;
    const senderName = isSenderCustomer ? customer_name : tailor_name;
    const senderRoleLabel = isSenderCustomer ? "customer" : "tailor";
    const preview = decoded.message?.trim()
      ? decoded.message.trim().slice(0, 160)
      : image_url
        ? "[Image message]"
        : "[New message]";

    // Email notification should not block chat delivery.
    transporter.sendMail({
      from: `"TailorX" <${process.env.EMAIL_USER}>`,
      to: recipientEmail,
      subject: `New message from ${senderRoleLabel}: ${senderName}`,
      text:
        `You have received a new message on TailorX.\n\n` +
        `From: ${senderName} (${senderRoleLabel})\n` +
        `Message preview: ${preview}\n\n` +
        `Open the app to reply.`,
    }).catch((mailError) => {
      console.error("Chat notification email error:", mailError.message);
    });

    res.json({
      message: "Message sent",
      chat: {
        ...data,
        sender_role: decoded.sender_role,
        message: decoded.message,
      },
    });
  } catch (err) {
    console.error("Send chat message error:", err);
    res.status(500).json({ error: "Failed to send message" });
  }
});

app.post("/chat-upload-image", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }

  const fileExtension = (req.file.mimetype || "image/jpeg").split("/")[1] || "jpg";
  const fileName = `chat_${Date.now()}_${Math.round(Math.random() * 1_000_000)}.${fileExtension}`;
  const bucketCandidates = ["chat-images", "Chat", "Fabric"];

  let lastError = null;

  for (const bucketName of bucketCandidates) {
    const { error: uploadError } = await supabase.storage
      .from(bucketName)
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) {
      lastError = uploadError;
      continue;
    }

    const { data } = supabase.storage.from(bucketName).getPublicUrl(fileName);
    return res.json({ image_url: data.publicUrl, bucket: bucketName });
  }

  res.status(500).json({ error: lastError?.message || "Failed to upload image" });
});

app.post("/place-order", upload.single("fabric"), async (req, res) => {
  try {
    // 1️⃣ Get data from request body
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

    // Debug: Log received data
    console.log("Received quantity from frontend:", quantity, "Type:", typeof quantity);
    console.log("All request body:", req.body);

    // 2️⃣ Default fabric image URL
    let fabricImageUrl = null;

    // 3️⃣ If fabric image exists, upload to Supabase
    if (req.file) {
      const fileName = `fabric_${Date.now()}`;

      await supabase.storage
        .from("Fabric")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      const { data } = supabase.storage
        .from("Fabric")
        .getPublicUrl(fileName);

      fabricImageUrl = data.publicUrl;
    }

    // 4️⃣ Convert JSON strings to objects (safe)
    const parsedMeasurements = measurements
      ? JSON.parse(measurements)
      : {};

    const parsedOptions = options
      ? JSON.parse(options)
      : {};

    const finalQuantity = quantity ? parseInt(quantity, 10) : 1;
    console.log("Final quantity to save:", finalQuantity, "Type:", typeof finalQuantity);

    // 5️⃣ Save order in database
    const { data, error } = await supabase
      .from("orders")
      .insert({
        customer_email,
        tailor_email,
        service_type,
        gender,
        price,
        quantity: finalQuantity,
        measurements: parsedMeasurements,
        options: parsedOptions,
        fabric_image_url: fabricImageUrl,
        tailor_name,
        status: "pending",
        is_notified: false,
      })
      .select("id")
      .single();

    if (error) throw error;

    // 6️⃣ Success response
    res.json({
      message: "Order placed successfully",
      order_id: data.id,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to place order" });
  }
});
// ---------------- PLACE ORDER2 ----------------
app.post("/place-order2", async (req, res) => {


  try {
    const { CustomerEmail, tailorEmail, full_name, address, phone, orderId } = req.body;

    const { error } = await supabase
      .from("orders")
      .update({ full_name, address, phone })
      .eq("id", orderId)
      .select();



    if (error) throw error;
    await transporter.sendMail({
      from: `"TailorX" <${process.env.EMAIL_USER}>`,
      to: CustomerEmail,
      subject: "Order Confirmation - TailorX",
      text: `Hello ${full_name},\n\nYour order has been successfully placed.\nThank you for choosing TailorX!`,
    });

    // Send new order notification email to Tailor
    await transporter.sendMail({
      from: `"TailorX" <${process.env.EMAIL_USER}>`,
      to: tailorEmail,
      subject: "New Order Received - TailorX",
      text: `Hello,\n\nYou have received a new order`,
    });

    res.json({ message: "Order placed successfully!" });
  } catch (err) {
    res.status(500).json({ error: "Failed to place order" });
  }
});
// ---------------- Get Profile2 ----------------
app.get("/get-profile2", async (req, res) => {
  const { email } = req.query;
  try {
    const { data: user, error } = await supabase
      .from("profiles")
      .select("full_name, location, phone_number")
      .eq("email", email)
      .single();
    if (error) return res.status(400).json({ error: error.message });
    res.json({ user });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// ---------------- Get Availability (Customer) ----------------
app.get("/get-availability", async (req, res) => {
  const { email } = req.query;

  const { data, error } = await supabase
    .from("availability")
    .select("availability")
    .eq("tailor_email", email)
    .single();

  if (error) {
    console.error("Supabase error:", error);
    return res.status(500).json({ availability: {} });
  }

  res.json({ availability: data ? data.availability : {} });
});
// ---------------- Get Booked Slots ----------------
app.get("/get-booked-slots", async (req, res) => {
  const { email } = req.query;

  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("day, time")
      .eq("tailor_email", email)
      .eq("status", "pending");

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ booked: data || [] });
  } catch (err) {
    console.error("Error fetching booked slots:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// Removed old endpoint - replaced by updated version below
// ---------------- DELETE APPOINTMENT ----------------
app.delete("/delete-appointment/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const { error } = await supabase
      .from("appointments")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: "Appointment deleted successfully" });
  } catch (err) {
    console.error("Delete appointment error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});
// ---------------- GET CUSTOMER ORDERS ----------------
app.get('/get-orders', async (req, res) => {
  const { email } = req.query;
  try {
    let query = supabase
      .from('orders')
      .select(`
        id,
        customer_email,
        tailor_email,
        service_type,
        gender,
        price,
        quantity,
        measurements,
        options,
        fabric_image_url,
        status,
        created_at,
        full_name,
        tailor_name
      `);

    // Filter by customer email if provided
    if (email) {
      query = query.eq('customer_email', email);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ orders: data });
  } catch (error) {
    console.error('Error fetching orders:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ---------------- Delete Order ----------------
app.delete("/delete-order/:id", async (req, res) => {
  const { id } = req.params;

  try {
    console.log(`\n[DELETE ORDER] Deleting order ${id}`);

    // Fetch order details first to get customer email
    const { data: order, error: fetchError } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !order) {
      console.error(`[DELETE ORDER ERROR] Order not found: ${id}`);
      return res.status(404).json({ error: "Order not found" });
    }

    const customerEmail = order.customer_email;
    const tailorName = order.tailor_name || 'Tailor';
    const serviceType = order.service_type || 'Order';
    console.log(`[DELETE ORDER] Found order for customer: ${customerEmail}`);

    // Delete the order
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    if (deleteError) {
      console.error(`[DELETE ORDER DB ERROR] ${deleteError.message}`);
      return res.status(500).json({ error: deleteError.message });
    }
    console.log(`[DELETE ORDER] Order deleted from DB`);

    // Send deletion notification email
    try {
      await transporter.sendMail({
        from: `"TailorX" <${process.env.EMAIL_USER}>`,
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
    res.status(500).json({ error: "Internal Server Error", details: err.message });
  }
});
// ---------------- GET TAILOR ORDERS ----------------
app.get('/tailor-orders', async (req, res) => {
  const { email } = req.query;

  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('tailor_email', email)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ orders: data || [] });
  } catch (err) {
    console.error('Error fetching tailor orders:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// ---------------- UPDATE ORDER STATUS ----------------
app.put('/update-order-status', async (req, res) => {
  const { id, status } = req.body;

  if (!id || !status) return res.status(400).json({ error: 'Missing id or status' });

  try {
    console.log(`\n[UPDATE STATUS] Starting status update for order ${id} to "${status}"`);
    const normalized = String(status).toLowerCase();

    // Fetch order details first
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !order) {
      console.error(`[UPDATE STATUS ERROR] Order not found: ${id}`);
      throw new Error('Order not found');
    }

    const customerEmail = order.customer_email;
    const tailorName = order.tailor_name || 'Tailor';
    const serviceType = order.service_type || 'Order';
    console.log(`[UPDATE STATUS] Customer: ${customerEmail}, Tailor: ${tailorName}`);

    // If status indicates cancellation/rejection, delete the order
    if (normalized === 'cancelled' || normalized === 'rejected') {
      const { error: deleteError } = await supabase
        .from('orders')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;
      console.log(`[UPDATE STATUS] Order deleted (${normalized})`);

      // Send cancellation email
      try {
        await transporter.sendMail({
          from: `"TailorX" <${process.env.EMAIL_USER}>`,
          to: customerEmail,
          subject: `Your Order Has Been ${normalized.toUpperCase()} - TailorX`,
          text: `Hello,\n\nYour order for ${serviceType} has been ${normalized} by ${tailorName}.\n\nWe appreciate your understanding.\n\nBest regards,\nTailorX Team`,
        });
        console.log(`[UPDATE STATUS] Cancellation email sent to ${customerEmail}`);
      } catch (emailErr) {
        console.error(`[UPDATE STATUS EMAIL ERROR] Failed to send email: ${emailErr.message}`);
      }

      return res.json({ message: 'Order deleted due to cancelled/rejected status', emailSent: true });
    }

    // Update order status and mark as unnotified
    const { error: updateError } = await supabase
      .from('orders')
      .update({ status, is_notified: false })
      .eq('id', id);

    if (updateError) throw updateError;
    console.log(`[UPDATE STATUS] Order updated in DB with is_notified: false`);

    // Send status update email
    const statusMessages = {
      'accepted': 'Your order has been accepted and will be started soon!',
      'in_progress': 'Your order is now in progress. We are working on it!',
      'completed': 'Your order is completed! Please arrange pickup or delivery.',
      'pending': 'Your order is pending review.',
    };

    const message = statusMessages[normalized] || `Your order status has been updated to: ${status}`;

    try {
      await transporter.sendMail({
        from: `"TailorX" <${process.env.EMAIL_USER}>`,
        to: customerEmail,
        subject: `Order Update: ${status.toUpperCase()} - TailorX`,
        text: `Hello,\n\n${message}\n\nTailor: ${tailorName}\nService: ${serviceType}\n\nThank you for choosing TailorX!\n\nBest regards,\nTailorX Team`,
      });
      console.log(`[UPDATE STATUS] Status update email sent to ${customerEmail}`);
    } catch (emailErr) {
      console.error(`[UPDATE STATUS EMAIL ERROR] Failed to send email: ${emailErr.message}`);
    }

    res.json({ message: 'Order status updated and notification sent' });
  } catch (err) {
    console.error('[UPDATE STATUS FATAL ERROR]', err.message);
    res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});
// ✅ Updated Book Appointment Endpoint
app.post("/book-appointment", async (req, res) => {
  console.log("Received body:", req.body);

  const { tailor_email, customer_email, datetime, tailor_name } = req.body;

  // Validation
  if (!tailor_email || !customer_email || !datetime || !tailor_name) {
    console.error("Missing fields:", { tailor_email, customer_email, datetime, tailor_name });
    return res.status(400).json({
      success: false,
      message: "Missing required fields (tailor_email, customer_email, datetime, tailor_name)"
    });
  }

  try {
    const { data, error } = await supabase
      .from("appointments")
      .insert([{
        tailor_email,
        customer_email,
        datetime,
        tailor_name,
        status: "pending"
      }])
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ success: false, message: error.message });
    }

    res.json({ success: true, message: "Appointment booked successfully", appointment: data });
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ success: false, message: error.message || "Server error" });
  }
});

// ---------------- GET CUSTOMER APPOINTMENTS ----------------
app.get("/my-appointments", async (req, res) => {
  const { email } = req.query;

  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("customer_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      return res.status(500).json({ error: error.message });
    }

    // Send the raw data from Supabase directly
    res.json({ appointments: data });
  } catch (err) {
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Admin 
// ---------------- GET TAILORS ----------------
app.get("/get-tailors", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, full_name, cnic, phone_number, location")
      .eq("role", "tailor");

    if (error) throw error;

    res.json({ tailors: data });
  } catch (err) {
    res.status(500).json({ message: "Error fetching tailors" });
  }
});
// ---------------- Remove TAILORS ----------------
app.delete("/remove-tailor", async (req, res) => {
  const { email } = req.body;


  try {
    const { error: ordersError } = await supabase
      .from("orders")
      .delete()
      .eq("tailor_email", email);

    if (ordersError) throw ordersError;

    // Now delete the tailor profile
    const { error: profileError } = await supabase
      .from("profiles")
      .delete()
      .eq("email", email)
      .eq("role", "tailor");

    if (profileError) throw profileError;

    res.json({ message: "Tailor and related orders removed successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error removing tailor" });
  }
});
// ---------------- GET Customers ----------------
app.get("/get-customers", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("email, full_name, phone_number, location")
      .eq("role", "customer");

    if (error) throw error;

    res.json({ customers: data });
  } catch (err) {
    console.error("Get customers error:", err);
    res.status(500).json({ message: "Error fetching customers" });
  }
});

// ---------------- Remove Customer ----------------
app.delete("/remove-customer", async (req, res) => {
  const { email } = req.body;

  try {

    const { error } = await supabase
      .from("profiles")
      .delete()
      .eq("email", email)
      .eq("role", "customer");

    if (error) throw error;

    res.json({ message: "Customer removed successfully" });
  } catch (err) {
    console.error("Remove customer error:", err);
    res.status(500).json({ message: "Error removing customer" });
  }
});
// ---------------- Remove Order ----------------
app.delete("/remove-order/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // delete the order
    const { error: deleteError } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    res.json({ message: "Order removed successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// ---------- UPDATE ORDER ----------
app.put("/update-order", upload.single("fabric"), async (req, res) => {
  try {
    const { orderId, measurements, quantity } = req.body;

    if (!orderId || !measurements) {
      return res.status(400).json({ error: "Missing data" });
    }

    const updateData = {
      measurements: JSON.parse(measurements),
      updated_at: new Date().toISOString(), // ✅ timestamp
    };

    // Add quantity if provided
    if (quantity) {
      updateData.quantity = parseInt(quantity, 10);
    }

    // Upload fabric image if provided
    if (req.file) {
      const fileName = `${orderId}_${Date.now()}.jpg`;

      await supabase.storage
        .from("Fabric")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
          upsert: true,
        });

      const { data } = supabase.storage
        .from("Fabric")
        .getPublicUrl(fileName);

      updateData.fabric_image_url = data.publicUrl;
    }

    await supabase
      .from("orders")
      .update(updateData)
      .eq("id", orderId);

    res.json({ message: "Order updated successfully!" });
  } catch (err) {
    console.error("Update failed:", err);
    res.status(500).json({ error: "Update failed" });
  }
});

// ============ NOTIFICATION SYSTEM ============
// ---------------- GET CUSTOMER NOTIFICATIONS ----------------
app.get("/get-notifications", async (req, res) => {
  const { email } = req.query;

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("id, customer_email, tailor_email, service_type, gender, price, quantity, status, created_at, tailor_name")
      .eq("customer_email", email)
      .eq("is_notified", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ notifications: data || [] });
  } catch (err) {
    console.error("Get notifications error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============ CLEAR ALL NOTIFICATIONS ============
app.put("/clear-all-notifications", async (req, res) => {
  const { email } = req.body;

  try {
    const { error } = await supabase
      .from("orders")
      .update({ is_notified: true })
      .eq("customer_email", email)
      .eq("is_notified", false);

    if (error) throw error;

    res.json({ message: "All notifications cleared" });
  } catch (err) {
    console.error("Clear notifications error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============ DISMISS SINGLE NOTIFICATION ============
app.put("/dismiss-notification", async (req, res) => {
  const { order_id } = req.body;

  try {
    const { error } = await supabase
      .from("orders")
      .update({ is_notified: true })
      .eq("id", order_id);

    if (error) throw error;

    res.json({ message: "Notification dismissed" });
  } catch (err) {
    console.error("Dismiss notification error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============ GET APPOINTMENT NOTIFICATIONS ============
app.get("/get-appointment-notifications", async (req, res) => {
  const { email } = req.query;

  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("customer_email", email)
      .eq("is_notified", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ notifications: data || [] });
  } catch (err) {
    console.error("Get appointment notifications error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============ DISMISS APPOINTMENT NOTIFICATION ============
app.put("/dismiss-appointment-notification", async (req, res) => {
  const { appointment_id } = req.body;

  try {
    const { error } = await supabase
      .from("appointments")
      .update({ is_notified: true })
      .eq("id", appointment_id);

    if (error) throw error;

    res.json({ message: "Notification dismissed" });
  } catch (err) {
    console.error("Dismiss appointment notification error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============ TAILOR NOTIFICATIONS ============
// ---------- GET TAILOR NOTIFICATIONS ----------
app.get("/tailor-notifications", async (req, res) => {
  const { email } = req.query;

  try {
    const { data, error } = await supabase
      .from("orders")
      .select("id, customer_email, tailor_email, service_type, gender, price, quantity, status, created_at, customer_name")
      .eq("tailor_email", email)
      .eq("is_notified", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ notifications: data || [] });
  } catch (err) {
    console.error("Get tailor notifications error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============ CLEAR ALL TAILOR NOTIFICATIONS ============
app.put("/clear-all-tailor-notifications", async (req, res) => {
  const { email } = req.body;

  try {
    const { error } = await supabase
      .from("orders")
      .update({ is_notified: true })
      .eq("tailor_email", email)
      .eq("is_notified", false);

    if (error) throw error;

    res.json({ message: "All notifications cleared" });
  } catch (err) {
    console.error("Clear tailor notifications error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============ DISMISS TAILOR TAILOR NOTIFICATION ============
app.put("/dismiss-tailor-notification", async (req, res) => {
  const { order_id } = req.body;

  try {
    const { error } = await supabase
      .from("orders")
      .update({ is_notified: true })
      .eq("id", order_id);

    if (error) throw error;

    res.json({ message: "Notification dismissed" });
  } catch (err) {
    console.error("Dismiss tailor notification error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============ GET TAILOR APPOINTMENT NOTIFICATIONS ============
app.get("/tailor-appointment-notifications", async (req, res) => {
  const { email } = req.query;

  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("tailor_email", email)
      .eq("is_notified", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ notifications: data || [] });
  } catch (err) {
    console.error("Get tailor appointment notifications error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============ DISMISS TAILOR APPOINTMENT NOTIFICATION ============
app.put("/dismiss-tailor-appointment-notification", async (req, res) => {
  const { appointment_id } = req.body;

  try {
    const { error } = await supabase
      .from("appointments")
      .update({ is_notified: true })
      .eq("id", appointment_id);

    if (error) throw error;

    res.json({ message: "Notification dismissed" });
  } catch (err) {
    console.error("Dismiss tailor appointment notification error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ============ TAILOR APPOINTMENTS ============
// ---------- GET TAILOR APPOINTMENTS ----------
app.get("/tailor-appointments", async (req, res) => {
  const { email } = req.query;

  try {
    const { data, error } = await supabase
      .from("appointments")
      .select("*")
      .eq("tailor_email", email)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ appointments: data || [] });
  } catch (err) {
    console.error("Error fetching tailor appointments:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ---------- UPDATE APPOINTMENT STATUS ----------
app.put("/update-appointment-status", async (req, res) => {
  const { id, status, tailor_name, customer_email } = req.body;

  if (!id || !status) {
    return res.status(400).json({ error: "Missing appointment ID or status" });
  }

  try {
    // Get appointment details
    const { data: appointment, error: fetchError } = await supabase
      .from("appointments")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError || !appointment) throw new Error("Appointment not found");

    // Update appointment status and set is_notified to false to trigger notification
    const { error: updateError } = await supabase
      .from("appointments")
      .update({ status, is_notified: false })
      .eq("id", id);

    if (updateError) throw updateError;

    res.json({ message: "Appointment status updated successfully" });
  } catch (err) {
    console.error("Error updating appointment status:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
  // ---------- File Complain(Customer) ----------
});
app.post("/file-complaint", async (req, res) => {
  try {
    const {
      filed_by_email,
      filed_by_role,
      against_email,
      complaint_type,
      subject,
      description,
      order_id,
      attachment_url
    } = req.body;

    const specialIssues = [
      "Payment Issue",
      "Late Delivery",
      "Wrong Measurement",
      "Bad Stitching",
      "Misbehaviour"
    ];

    /* ================= BASIC VALIDATION ================= */

    if (!filed_by_email || !subject || !description || !complaint_type) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    /* ================= CONDITIONAL VALIDATION ================= */

    if (specialIssues.includes(complaint_type)) {

      if (!against_email || !order_id) {
        return res.status(400).json({
          error: "Tailor email and Order ID are required for this complaint type"
        });
      }

      /* ===== CHECK IF EMAIL EXISTS IN profiles ===== */
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("email")
        .eq("email", against_email)
        .single();

      if (profileError || !profileData) {
        return res.status(400).json({
          error: "Tailor email not found in system"
        });
      }

      /* ===== CHECK IF ORDER EXISTS IN orders ===== */
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .select("id")
        .eq("id", order_id)
        .single();

      if (orderError || !orderData) {
        return res.status(400).json({
          error: "Order ID not found"
        });
      }
    }

    /* ================= INSERT COMPLAINT ================= */

    const { data, error } = await supabase
      .from("complaints")
      .insert([{
        filed_by_email,
        filed_by_role,
        against_email: against_email || null,
        complaint_type,
        subject,
        description,
        order_id: order_id || null,
        attachment_url
      }])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: "Complaint submitted successfully",
      data
    });

  } catch (err) {
    console.log("🔥 Server Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   GET MY COMPLAINTS
=============================== */
app.get("/my-complaints/:email", async (req, res) => {
  try {
    const { email } = req.params;
    console.log("📥 Fetching complaints for:", email);

    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .eq("filed_by_email", email)
      .order("created_at", { ascending: false });

    if (error) {
      console.log("❌ Supabase Fetch Error:", error);
      throw error;
    }

    console.log("✅ Complaints Found:", data.length);

    res.json(data);

  } catch (err) {
    console.log("🔥 Fetch Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
// ---------------- DELETE COMPLAINT ----------------
app.delete("/delete-complaint/:id/:email", async (req, res) => {
  try {
    const { id, email } = req.params;

    const { error } = await supabase
      .from("complaints")
      .delete()
      .eq("id", id)
      .eq("filed_by_email", email);

    if (error) throw error;

    res.status(200).json({ message: "Complaint deleted successfully" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   GET ALL COMPLAINTS
=============================== */
app.get("/admin/complaints", async (req, res) => {
  try {
    console.log("👑 Admin fetching all complaints");

    const { data, error } = await supabase
      .from("complaints")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log("✅ Total Complaints:", data.length);
    res.json(data);

  } catch (err) {
    console.log("🔥 Admin Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   RESOLVE COMPLAINT & SEND MESSAGE
=============================== */
app.put("/admin/respond-complaint/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { admin_response } = req.body;

    const { data, error } = await supabase
      .from("complaints")
      .update({
        admin_response,
        resolved_at: new Date(), // mark as resolved
      })
      .eq("id", id)
      .select();

    if (error) throw error;

    console.log(`✅ Complaint ${id} resolved with message: ${admin_response}`);
    res.json({ message: "Resolved and message sent", data });

  } catch (err) {
    console.log("🔥 Resolve Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

/* ===============================
   SEND MESSAGE ONLY
=============================== */
app.post("/admin/send-message", async (req, res) => {
  try {
    const { complaint_id, message } = req.body;

    const { data, error } = await supabase
      .from("complaints")
      .update({ admin_response: message }) // update response only
      .eq("id", complaint_id)
      .select();

    if (error) throw error;

    console.log(`💬 Message sent for complaint ${complaint_id}: ${message}`);
    res.json({ message: "Message sent successfully", data });

  } catch (err) {
    console.log("🔥 Send Message Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------- START SERVER ----------------
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
