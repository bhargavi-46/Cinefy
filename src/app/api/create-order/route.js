import Razorpay from "razorpay";
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ message: "API is working! Use POST to create an order." });
}

export async function POST(req) {
  try {
    const { amount, currency } = await req.json();

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: amount * 100, 
      currency,
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);
    return NextResponse.json(order);
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ message: "Error creating order" }, { status: 500 });
  }
}