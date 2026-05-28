# TailorX

TailorX is a mobile app that connects customers with tailors. It includes customer, tailor, and admin flows such as booking services, managing orders, and handling payments. The frontend is built with Expo/React Native, and the backend is an Express server connected to MongoDB.

## Tech Stack

- Expo + React Native (frontend)
- Express (backend)
- MongoDB (database)
- Mongoose (ODM)
- Cloudinary (image storage)
- PayFast (card payments)
- Nodemailer (email OTP)

## Project Structure

- app/ - Expo screens and routing
- backend/ - Express API server
- assets/ - Images and static assets

## Key Features

- Role-based flows for customer, tailor, and admin
- Tailor services listing and browsing
- Order creation, tracking, and status updates
- Appointment scheduling
- In-app chat and complaint handling
- PayFast checkout with server-side verification

## Setup

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the Expo app

   ```bash
   npx expo start
   ```

3. Start the backend server (in another terminal)

   ```bash
   node backend/server.js
   ```

## Environment Variables

Create backend/.env with the values below (adjust as needed):

```bash
MONGODB_URI=
MONGODB_DB_NAME=tailorx

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

EMAIL_USER=
EMAIL_PASS=

PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
PAYFAST_SANDBOX=true
PAYFAST_NOTIFY_BASE_URL=http://localhost:3000

PAYMENT_SUCCESS_URL=tailorx://payment-success
PAYMENT_CANCEL_URL=tailorx://payment-cancel
```

## MongoDB Setup

Create a MongoDB database (Atlas or local) and update MONGODB_URI. The backend uses Mongoose models located under backend/models.

Collections used by the backend:

- profiles
- services
- orders
- appointments
- availability
- chatmessages
- tailorreviews
- complaints

Images are uploaded to Cloudinary folders:

- tailorx/fabric (order fabric images)
- tailorx/chat (chat attachments)

## Payments

- PayFast checkout is started from the app and handled in the backend.
- Payment status is stored in backend/payments-store.json and displayed in the app.
- If you delete payments-store.json, the backend will recreate it, but old payment history will be lost.

## Common Scripts

- Start Expo: `npx expo start`
- Android: `npm run android`
- iOS: `npm run ios`
- Web: `npm run web`
- Lint: `npm run lint`

## Notes

- Update API base URL in the app to match your machine/network if needed.
- For PayFast in production, set PAYFAST_SANDBOX=false and update merchant keys.

## Screenshots

Add screenshots under assets/images and link them here. Example placeholders:

- Customer dashboard (add image)
- Tailor services list (add image)
- Payment screen (add image)
