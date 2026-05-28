# TailorX — Digital Tailoring Management System

TailorX is an enterprise-grade, professionally structured tailoring management system designed to bridge the gap between customers and tailoring service providers. Built with a modular, highly scalable codebase, TailorX addresses the limitations of standard monolithic applications by utilizing modern design systems, clean folder structures, robust authentication, and seamless payment integrations.

---

## 🌟 Why TailorX: Enterprise Architecture & Core Pillars

TailorX is engineered from the ground up to solve scalability, responsiveness, and performance issues typical of legacy tailoring platforms. Here are the core pillars that define its architecture:

### 📐 1. Proper MVC Architecture
The system follows a strict Model-View-Controller (MVC) pattern that splits responsibility cleanly:
- **Models (`Mongoose / MongoDB`):** Located at [`backend/models/`](file:///Users/umerfarooq/Desktop/Fyp/CLONE/backend/models), these define structured data schemas and index parameters for efficient querying.
- **Views (`Expo / React Native`):** Located at [`app/screens/`](file:///Users/umerfarooq/Desktop/Fyp/CLONE/app/screens) and [`app/(tabs)/`](file:///Users/umerfarooq/Desktop/Fyp/CLONE/app/(tabs)), these construct native screens, layouts, and responsive interfaces.
- **Controllers (`Express Routes`):** Located at [`backend/routes/`](file:///Users/umerfarooq/Desktop/Fyp/CLONE/backend/routes), these handle business logic, process requests, perform operations, and return structured JSON responses.

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
- **Card Lists & Interactive Cells:** Uniform design blocks displaying tailors, customer orders, service details, and chat previews.

### 📦 4. Global State & Storage Management
State is propagated predictably throughout the Expo ecosystem:
- **React Navigation Parameters:** Router parameters dynamically carry context (such as verified user emails) between screens without polluting global namespaces.
- **Persistent Local Caching:** Secure device caching via [`@react-native-async-storage/async-storage`](file:///Users/umerfarooq/Desktop/Fyp/CLONE/package.json#L16) is used to maintain shopping carts, draft orders, and credentials locally.

### 🎨 5. Responsive Modern UI
A high-fidelity design system that ensures outstanding aesthetics:
- **Premium Themes:** Dark mode layout with curated linear gradients (e.g. deep space `#0f0f13` to wine-cherry `#2a0a18`) and glassmorphism cards.
- **Micro-Animations:** Fluid screen-entry and button animations powered by `react-native-reanimated` and custom native interpolation configurations.
- **Responsive Layouts:** Flexible grid and flex layouts designed with `SafeAreaView` parameters to support multiple screen orientations, form factors, and notches (iOS/Android).

### 🛠️ 6. Modular & Scalable Codebase
The application logic is decoupled to make refactoring simple:
- **Dependency Injection:** Routers are initialized as closures that accept schema models and middleware parameters (e.g. `createAuthRouter({...})`). This simplifies unit testing and database mocking.
- **Decoupled API Services:** The central API base configuration resides in a single file ([`app/api.js`](file:///Users/umerfarooq/Desktop/Fyp/CLONE/app/api.js)), allowing developers to swap staging, sandbox, and production hosts instantly.

---

## 📁 Clean Folder Structure

```
TailorX/
├── app/                        # Expo/React Native App Routing & Screens
│   ├── (tabs)/                 # Main Bottom Tab Navigation
│   │   ├── _layout.tsx         # Routing structure and visual styling
│   │   └── index.jsx           # Application entrypoint
│   ├── screens/                # Modular role-based view layers
│   │   ├── Admin/              # Admin workflows (customers, complaints, orders)
│   │   │   ├── AdminDashboard.jsx
│   │   │   └── ManageComplain.jsx
│   │   ├── Customer/           # Customer flows (browsing, ordering, booking)
│   │   │   ├── BrowseTailors.jsx
│   │   │   ├── CustomerOrders.jsx
│   │   │   ├── OrderForm.jsx
│   │   │   └── Payment.jsx
│   │   ├── Tailor/             # Tailor flows (appointments, orders, dashboard)
│   │   │   ├── AddServices.jsx
│   │   │   └── TailorDashboard.jsx
│   │   ├── Login.jsx           # Credentials login screen
│   │   ├── Signup.jsx          # Register screen
│   │   ├── Forgot.jsx          # OTP request for password reset
│   │   └── Start.jsx           # Landing/splash screen
│   ├── _layout.tsx             # Root Stack Navigator & theme provider
│   └── api.js                  # Central HTTP / image resolution module
│
├── backend/                    # Express.js REST API Server
│   ├── middleware/             # HTTP custom request interceptors
│   │   └── upload.js           # Multer middleware for file buffers
│   ├── models/                 # Mongoose schemas (Data persistence / Model layer)
│   │   ├── Appointment.js      # Customer-to-tailor bookings
│   │   ├── ChatMessage.js      # In-app chat rows with role identifiers
│   │   ├── Order.js            # Custom measurements and pricing
│   │   └── Profile.js          # Accounts, authentication, roles
│   ├── routes/                 # Service handlers (Controller layer)
│   │   ├── auth.js             # OTP, signup, login, reset functions
│   │   ├── payments.js         # PayFast integration & PDF generators
│   │   ├── orders.js           # Fabric attachments and order state machine
│   │   └── chat.js             # Real-time message storage
│   ├── server.js               # Express application and DB listener entry
│   └── payments-store.json     # Backup local store for payment histories
│
├── assets/                     # App icons, vectors, and static branding images
├── constants/                  # Color configurations, fonts, and grid paddings
└── hooks/                      # Custom React hooks (e.g. keyboard triggers, layout sizes)
```

---

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

### Integrations
- **Cloud Storage:** Cloudinary (Dynamic storage of fabric and chat media)
- **Payments:** PayFast Sandbox Integration (Card & EFT transactions)
- **Mailing:** Nodemailer (SMTP OTP transmission)

---

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

# Cloudinary credentials for chat attachments and fabric pictures (optional, falls back to GridFS)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

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

## 💳 Payment Flow (PayFast Integration)

TailorX includes secure online checkouts via the **PayFast** gateway:
1. **Invoice Compilation:** Customers initiate order payments. The system calculates quantities and unit rates, then signs the request with an MD5 hash.
2. **Gateway Redirection:** The React Native client opens the checkout screen within an `expo-web-browser` container.
3. **Instant Transaction Notification (ITN):** PayFast POSTs transaction responses to our server backend. The server validates signatures, reconciles orders, updates payment records, and triggers local notifications.
4. **Client Callback:** The client browser closes, using deep linking to return customers to their respective App dashboard with fresh transaction state.
