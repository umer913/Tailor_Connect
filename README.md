# TailorX — Digital Tailoring Management System

TailorX is an enterprise-grade, professionally structured tailoring management system designed to bridge the gap between customers and tailoring service providers. 

---

## 🌟 Why TailorX: Enterprise Architecture & Core Pillars

 Here are the core pillars that define its architecture:

### 📐 1. Proper MVC Architecture
The system follows a strict Model-View-Controller (MVC) pattern that splits responsibility cleanly:

### 🔑 2. JWT Authentication & Authorization
Secure access is maintained across all client and server interactions:
- **Registration OTP Verification:** Email verification is processed via Nodemailer OTP codes to validate user identities before profile activation.
- **Role-Based Authorization:** Custom logic validates routes based on customer, tailor, or admin credentials to restrict unauthorized access to dashboards.
- **Password Hashing:** Passwords are encoded using custom cryptographic hashing algorithms on the server before database ingestion.
- **Token Security:** Designed to support JSON Web Tokens (JWT) for stateless session handling and stateless authorization headers across endpoints.

### 🧩 3. Reusable Components
To guarantee styling uniformity and decrease codebase clutter, the frontend utilizes modular reusable components:
- **Input Fields & Password Fields:** Secure and custom input blocks with built-in visibility toggles, clear error prompts, and modern typography.
- **Unified Action Buttons:** Standardized tactile elements with consistent scaling and shadow attributes matching the active theme colors.

### 📦 4. Global State & Storage Management
State is propagated predictably throughout the Expo ecosystem:
- **React Navigation Parameters:** Router parameters dynamically carry context (such as verified user emails) between screens without polluting global namespaces.

## 🛠️ Technology Stack & Dependencies

### Frontend
- **Framework:** [Expo](https://expo.dev/) (SDK 54) + [React Native](https://reactnative.dev/) (v0.81)
- **Navigation:** React Navigation (Drawer, Stack, and Bottom Tabs)
- **Styling & Assets:** Vanilla React Native Styles, Linear Gradients, Expo Blur, Expo Symbols, Vector Icons
- **HTTP Client:** Axios (API interactions with automated JSON mapping)

### Backend
- **Framework:** Express.js (Modular Route Exports)
- **Database ODM:** Mongoose (MongoDB connection wrapper)
- **File Upload:** Multer (memory buffer storage)
- **Invoices:** PDFKit (server-side generation of downloadable client invoices)

## 🚀 Setting Up the Project

### 1. Prerequisites
Ensure you have the following installed on your machine:
- **Node.js:** v18 or later (npm v9+)
- **MongoDB:** Local server instance OR a MongoDB Atlas cluster URL
- **Expo Go:** Installed on your physical Android or iOS device to test layout components

### 2. Install Dependencies
Clone the repository and install packages in the root directory:
```bash
# Installs core dependencies for both mobile components and backend dependencies
npm install
```

### 3. Environment Configuration
Create a `.env` file under the `/backend` folder. Copy and populate the credentials below:
```env
MONGODB_URI=your_mongodb_connection_uri
MONGODB_DB_NAME=TailorX

PORT=3001
EMAIL_USER=your_gmail_smtp_email
EMAIL_PASS=your_gmail_app_password

# PayFast Gateway details
PAYFAST_MERCHANT_ID=your_merchant_id
PAYFAST_MERCHANT_KEY=your_merchant_key
PAYFAST_PASSPHRASE=your_passphrase
PAYFAST_SANDBOX=true

# Local server URL or ngrok link for PayFast Instant Transaction Notifications (ITN)
PAYFAST_NOTIFY_BASE_URL=https://your-ngrok-subdomain.ngrok-free.dev
```

### 4. Running the Application

Open two separate terminal panels:

* **Terminal 1: Start the Backend Server**
  ```bash
  node backend/server.js
  ```
  *The backend will automatically start listening on the designated PORT (e.g. `3001`).*

* **Terminal 2: Start the Expo Bundler**
  ```bash
  npx expo start
  ```
  *Scan the generated QR code on your phone using Expo Go, or type `a` for Android Emulator / `i` for iOS Simulator.*

---

## 📂 Database Collections & Schema Layout

TailorX relies on structured document patterns in MongoDB. Key tables include:

1. **`profiles`:** Stores system users. Uses strict role tags (`customer`, `tailor`, `admin`).
2. **`orders`:** Holds measurement configurations, pricing amounts, delivery dates, fabric image URLs, and statuses (`pending`, `accepted`, `completed`, `cancelled`).
3. **`appointments`:** Handles tailor booking sessions, schedules, slots, and confirmation flags.
4. **`chatmessages`:** Thread messages encoded with custom prefixes (`[[customer]]` / `[[tailor]]`) for layout side-rendering.
5. **`complaints`:** Houses user grievances, resolutions, and associated orders.

---


