import dbConnect from "@/app/lib/db";
import Content from "../../models/Content";
import { NextResponse } from "next/server";
import { BlobServiceClient } from "@azure/storage-blob";
import { Readable } from "stream";
import path from "path";
import fs from "fs";
import { writeFile } from "fs/promises";

// Azure Blob Storage Configuration
const AZURE_STORAGE_CONNECTION_STRING = process.env.AZURE_STORAGE_CONNECTION_STRING;
const CONTAINER_NAME = "videos"; // Container name in Azure Storage
const Azure_SAS = process.env.Azure_SAS;

const blobServiceClient = BlobServiceClient.fromConnectionString(AZURE_STORAGE_CONNECTION_STRING);
const containerClient = blobServiceClient.getContainerClient(CONTAINER_NAME);

// Ensure the container exists
async function ensureContainer() {
  const exists = await containerClient.exists();
  if (!exists) await containerClient.create();
}
await ensureContainer();

// Function to Upload Large Files to Azure Blob Storage
async function uploadVideoToAzure(file) {
  const blobName = `${Date.now()}-${file.name}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobName);
  const stream = Readable.from(Buffer.from(await file.arrayBuffer()));

  await blockBlobClient.uploadStream(stream, undefined, 5 * 1024 * 1024, {
    blobHTTPHeaders: { blobContentType: file.type },
  });

  return blockBlobClient.url+'?'+Azure_SAS;
}

// GET: Fetch all content
export async function GET() {
  try {
    await dbConnect();
    const content = await Content.find();
    return NextResponse.json({ success: true, content });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Add new content
export async function POST(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const name = formData.get("name");
    const desc = formData.get("desc");
    const genre = formData.get("genre");
    const thumbnailFile = formData.get("thumbnail");
    const premium = formData.get("premium") === "true";

    if (!name || !desc || !genre || !thumbnailFile) {
      return NextResponse.json({ success: false, error: "All fields are required!" });
    }

    const validMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    if (!validMimeTypes.includes(thumbnailFile.type)) {
      return NextResponse.json({ success: false, error: "Invalid image format!" });
    }

    const thumbnailsDir = path.join(process.cwd(), "public/thumbnails");
    if (!fs.existsSync(thumbnailsDir)) {
      fs.mkdirSync(thumbnailsDir, { recursive: true });
    }

    const filename = `${Date.now()}-${thumbnailFile.name}`;
    const filePath = path.join(thumbnailsDir, filename);
    const buffer = Buffer.from(await thumbnailFile.arrayBuffer());
    await writeFile(filePath, buffer);

    const newContent = new Content({
      name,
      desc,
      genre,
      thumbnail: `/thumbnails/${filename}`,
      premium: premium,
      seasons: [],
    });

    await newContent.save();
    return NextResponse.json({ success: true, data: newContent });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

// PUT: Add episode to existing content
export async function PUT(req) {
  try {
    await dbConnect();
    const formData = await req.formData();

    const _id = formData.get("_id");
    const seasonNumber = parseInt(formData.get("seasonNumber"));
    const episodeName = formData.get("episodeName");
    const episodeDesc = formData.get("episodeDesc");
    const episodeVideo = formData.get("episodeVideo");

    if (!_id || !seasonNumber || !episodeName || !episodeDesc || !episodeVideo) {
      throw new Error("All fields are required");
    }

    const videoUrl = await uploadVideoToAzure(episodeVideo);

    const content = await Content.findById(_id);
    if (!content) throw new Error("Content not found");

    const seasonIndex = content.seasons.findIndex(s => s.seasonNumber === seasonNumber);

    if (seasonIndex !== -1) {
      content.seasons[seasonIndex].episodes.push({ name: episodeName, desc: episodeDesc, link: videoUrl });
    } else {
      content.seasons.push({ seasonNumber, episodes: [{ name: episodeName, desc: episodeDesc, link: videoUrl }] });
    }

    await content.save();
    return NextResponse.json({ success: true, message: "Episode added successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}

// DELETE: Remove content & delete video from Azure
export async function DELETE(req) {
  try {
    await dbConnect();
    const { _id } = await req.json();
    if (!_id) throw new Error("Need an ID to delete Content");

    const content = await Content.findById(_id);
    if (!content) return NextResponse.json({ success: false, error: "Content not found" });

    // Extract all Azure video blob URLs
    const fileUrls = content.seasons.flatMap(season => season.episodes.map(ep => ep.link)).filter(Boolean);

    // Delete each file from Azure Blob Storage
    for (const fileUrl of fileUrls) {
      const blobName = fileUrl.split("/").pop();
      const blobClient = containerClient.getBlobClient(blobName);
      await blobClient.deleteIfExists();
    }

    await Content.findByIdAndDelete(_id);
    return NextResponse.json({ success: true, message: "Content deleted successfully" });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message });
  }
}
