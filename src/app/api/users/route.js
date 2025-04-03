"use server";

import connectDB from "@/app/lib/db";
import User from "@/app/models/user";
import { NextResponse } from "next/server";

// GET all users or single user by email
export async function GET(req) {
  try {
    await connectDB();
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (email) {
      // Get single user by email
      if (!email) {
        return NextResponse.json(
          { success: false, error: "Email is required" }, 
          { status: 400 }
        );
      }

      const user = await User.findOne({ email });

      if (!user) {
        return NextResponse.json(
          { success: false, error: "User not found" }, 
          { status: 404 }
        );
      }

      return NextResponse.json(
        { success: true, user }, 
        { status: 200 }
      );
    } else {
      // Get all users
      const users = await User.find({});
      return NextResponse.json(
        { success: true, users }, 
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error in GET users:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" }, 
      { status: 500 }
    );
  }
}