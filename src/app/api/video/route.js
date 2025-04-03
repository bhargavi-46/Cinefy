import { NextResponse } from "next/server";
import dbConnect from "@/app/lib/db";
import video from "@/app/models/Content";

export async function GET() {
    try {
        await dbConnect();
        const videos = await video.find();
        return NextResponse.json({ success: true, videos });
    } catch (error) {
        return NextResponse.json({ success: false, message: "Error fetching videos", error: error.message }, { status: 500 });
    }
}
