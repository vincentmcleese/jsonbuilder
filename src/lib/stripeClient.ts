// Stripe client setup (Node.js)
import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("Stripe Secret Key is not defined in environment variables.");
}

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20", // Use the latest API version
  typescript: true, // Enable TypeScript support
});

// For client-side Stripe.js, you might use loadStripe from '@stripe/stripe-js'
// import { loadStripe } from '@stripe/stripe-js';
// const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
