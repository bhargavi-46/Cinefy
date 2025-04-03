import dbConnect from "@/app/lib/db";
import user from "@/app/models/user";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return new NextResponse(JSON.stringify({ success: false, error: "Missing email" }), { status: 400 });
    }

    const User = await user.findOne({ email }).populate("fav.Content_id");

    if (!User) {
      return new NextResponse(JSON.stringify({ success: false, error: "User not found" }), { status: 400 });
    }

    return new NextResponse(JSON.stringify({ success: true, favorites: User.fav }), { status: 200 });

  } catch (err) {
    return new NextResponse(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function POST(req) {
  try {
    await dbConnect();
    const { email, id } = await req.json();

    if (!email || !id) {
      return new NextResponse(JSON.stringify({ success: false, error: "Missing email or id" }), { status: 400 });
    }

    const User = await user.findOne({ email });
    console.log(User);

    if (!User) {
      return new NextResponse(JSON.stringify({ success: false, error: "User not found" }), { status: 400 });
    }

    User.fav.push({ Content_id: id });
    await User.save();

    return new NextResponse(JSON.stringify({ success: true, user: User }), { status: 200 });

  } catch (err) {
    return new NextResponse(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    await dbConnect();
    const { email, id } = await req.json();

    if (!email || !id) {
      return new NextResponse(JSON.stringify({ success: false, error: "Missing email or id" }), { status: 400 });
    }

    const User = await user.findOne({ email });

    if (!User) {
      return new NextResponse(JSON.stringify({ success: false, error: "User not found" }), { status: 400 });
    }

    User.fav = User.fav.filter((item) => item.Content_id !== id);
    await User.save();

    return new NextResponse(JSON.stringify({ success: true, message: "Removed from favorites" }), { status: 200 });

  } catch (err) {
    return new NextResponse(JSON.stringify({ success: false, error: err.message }), { status: 500 });
  }
}