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
app.post("/signup", async (req, res) => {//pausing function until fetching is completed
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
    // Update profile fields
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ full_name, cnic, phone_number, location })
      .eq("email", email);

    if (updateError) return res.status(400).json({ error: updateError.message });

    // Update password if provided
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

// ---------------- GET SERVICES FOR TAILOR ----------------
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


// ---------------- Get Tailors Service ----------------
app.get('/get-tailor-services', async (req, res) => {
  const { email } = req.query;

  if (!email) return res.status(400).json({ error: "Tailor email is required" });

  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('tailor_email', email); // get all services for this tailor

    if (error) throw error;

    res.json({ services: data }); // send array of services
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'Failed to fetch tailor services' });
  }
});

// ---------------- PLACE ORDER ----------------
const upload = multer({ storage: multer.memoryStorage() });

app.post("/place-order", upload.single("fabric"), async (req, res) => {
  try {
    const { customer_email, tailor_email, service_type, gender, price, measurements, options } = req.body;

    let fabricImageUrl = null;

    if (req.file) {
      const fileName = `fabric_${Date.now()}.jpg`;

      const { error: uploadError } = await supabase.storage
        .from("Fabric")
        .upload(fileName, req.file.buffer, {
          contentType: req.file.mimetype,
        });

      if (uploadError) throw uploadError;

      const { data, error: urlError } = supabase.storage
        .from("Fabric")
        .getPublicUrl(fileName);

      if (urlError) throw urlError;

      fabricImageUrl = data.publicUrl;
    }

    let parsedMeasurements = {};
    let parsedOptions = {};

    try {
      parsedMeasurements = JSON.parse(measurements);
    } catch (e) {
      console.warn("Invalid measurements JSON", e);
    }

    try {
      parsedOptions = JSON.parse(options);
    } catch (e) {
      console.warn("Invalid options JSON", e);
    }

    const { error } = await supabase.from("orders").insert([
      {
        customer_email,
        tailor_email,
        service_type,
        gender,
        price,
        measurements: parsedMeasurements,
        options: parsedOptions,
        fabric_image_url: fabricImageUrl,
      },
    ]);

    if (error) throw error;

    res.json({ message: "Order placed successfully!" });
  } catch (err) {
    console.error("Place order error:", err);
    res.status(500).json({ error: "Failed to place order" });
  }
});


// ---------------- START SERVER ----------------
const PORT = process.env.PORT;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
