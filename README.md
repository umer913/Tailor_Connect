# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Start backend server

   ```bash
   node backend/server.js
   ```

## Payment Setup

This project now supports:

- Card payments using Stripe Checkout
- EasyPaisa manual transfer submission
- JazzCash manual transfer submission
- Bank transfer submission

To enable card charging:

1. Open backend/.env
2. Set STRIPE_SECRET_KEY with your Stripe secret key
3. Keep PAYMENT_SUCCESS_URL and PAYMENT_CANCEL_URL as deep-link values (default already added)

For transfer methods, set your merchant/account values in backend/.env:

- EASYPAISA_ACCOUNT_TITLE, EASYPAISA_ACCOUNT_NUMBER
- JAZZCASH_ACCOUNT_TITLE, JAZZCASH_ACCOUNT_NUMBER
- BANK_NAME, BANK_ACCOUNT_TITLE, BANK_ACCOUNT_NUMBER, BANK_IBAN

Payment status is tracked server-side in backend/payments-store.json and shown in My Orders.

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
