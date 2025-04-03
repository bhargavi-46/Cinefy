// src/app/api/verify-payment/route.js
import { NextResponse } from "next/server";
import connectDB from "@/app/lib/db";
import User from "@/app/models/user";
import Razorpay from "razorpay";
import crypto from "crypto";

export async function POST(req) {
  try {
    // Parse the request body
    const body = await req.json();
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, email, duration } = body;

    // Log the request payload
    console.log("Request Payload:", {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      email,
      duration,
    });

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !email || !duration) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify Razorpay signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      throw new Error("RAZORPAY_KEY_SECRET is not defined in .env.local");
    }

    const generated_signature = crypto
      .createHmac("sha256", secret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Log the signatures for debugging
    console.log("Generated Signature:", generated_signature);
    console.log("Razorpay Signature:", razorpay_signature);

    if (generated_signature !== razorpay_signature) {
      return NextResponse.json(
        { status: "verification_failed", message: "Invalid signature" },
        { status: 400 }
      );
    }

    // Connect to the database
    await connectDB();

    // Calculate start and end dates for the premium membership
    const startDate = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + duration);

    // Update the user's premium status in the database
    const user = await User.findOneAndUpdate(
      { email },
      {
        premium: true, // ✅ Correct field name
        premiumStartDate: startDate.toISOString(), // ✅ Correct field name
        premiumEndDate: endDate.toISOString(), // ✅ Correct field name
      },
      { new: true }
    );

    // Log the updated user
    console.log("Updated User:", user);

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        status: "ok",
        message: "Payment verified and user updated successfully",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error verifying payment:", error);
    return NextResponse.json(
      { message: "Error verifying payment" },
      { status: 500 }
    );
  }
}