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
  return Math.floor( Math.random() * 900000).toString(); //generates 6-digit OTP ,math.random selects any value between 0-1 decimals imcluded,math.floor eleminates decimals
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
      .update({ password: hashed,verified:true, otp: null })
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
// ---------------- Save Availability ----------------
app.post("/save-availability", async (req, res) => {
  try {
    const { email, availability } = req.body;

    
    if (!availability ) {
      // Delete availability if no slot iis selected
      const { error: deleteError } = await supabase
        .from("availability")
        .delete()
        .eq("tailor_email", email);

      if (deleteError) {
        return res.status(500).json({ error: "Database delete error" });
      }

      return res.json({ message: "Availability deleted" });
    }

    // Upsert availability
    const { data, error } = await supabase
      .from("availability")
      .upsert(
        {
          tailor_email: email,
          availability,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "tailor_email" }//update if you find more then 1 row with same email
      )
      .select();

    if (error) {
      return res.status(500).json({ error: "Database error" });
    }

    res.json({ message: "Availability saved", data });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
// ---------------- Get Availability(Tailor) ----------------
app.get("/get-availability", async (req, res) => {
      const email = req.query.email; 
  try {
    const { data, error } = await supabase
      .from("availability")
      .select("availability")
      .eq("tailor_email", email)
      .single();
    res.json({ availability: data ? data.availability : {} });
  } catch (err) {
    console.error("Server error:", err);
    res.status(500).json({ error: "Internal server error" });
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
    const { CustomerEmail, tailorEmail,full_name, address, phone, orderId } = req.body;

 const {  error } = await supabase
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
    const query = supabase
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
    const { error } = await supabase
      .from("orders")
      .delete()
      .eq("id", id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: "Order deleted successfully" });
  } catch (err) {
    console.error("Delete order error:", err);
    res.status(500).json({ error: "Internal Server Error" });
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

// ---------------- START SERVER ----------------
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
