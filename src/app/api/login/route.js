"use server";

import connectDB from "@/app/lib/db";
import User from "@/app/models/user";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user }, { status: 200 });
  } catch (error) {
    console.log("inside cath");
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    await connectDB();

    const { name, email, premium } = await req.json();

    if (!name || !email) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "All fields are required" }),
        { status: 400 }
      );
    }

    const newUser = new User({ name, email, premium });

    await newUser.save();

    return new NextResponse(JSON.stringify({ success: true, data: newUser }), {
      status: 201,
    });
  } catch (err) {
    if (err.code === 11000) {
      return new NextResponse(
        JSON.stringify({ success: false, error: "User already exists" }),
        { status: 400 }
      );
    }

    return new NextResponse(
      JSON.stringify({ success: false, error: err.message }),
      { status: 500 }
    );
  }
}

