import { env } from "@/env";
import { auth } from "@/lib/auth";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

// Initialize S3 client with configuration
const s3 = new S3Client({
  region: env.S3_STORAGE_REGION,
  endpoint: env.S3_STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_STORAGE_ACCESS_KEY_ID!,
    secretAccessKey: env.S3_STORAGE_SECRET_ACCESS_KEY!,
  },
  forcePathStyle: env.S3_STORAGE_FORCE_PATH_STYLE,
});

const Bucket = env.S3_STORAGE_BUCKET;

/**
 * Handles file upload requests to S3 storage
 * Only accessible to admin users
 */
export async function POST(request: NextRequest) {
  // Authentication check
  const session = await auth.api.getSession({ headers: await headers() });

  if (session?.user.role !== "admin") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const files = formData.getAll("file") as File[];

    if (files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const uploadResults = await Promise.all(
      files.map(async (file) => {
        // Convert file to buffer
        const Body = Buffer.from(await file.arrayBuffer());
        const Key = file.name;

        // Upload to S3
        const result = await s3.send(
          new PutObjectCommand({ Bucket, Key, Body }),
        );

        // Generate URL for the uploaded file
        const url = `${env.S3_STORAGE_ENDPOINT}/${Bucket}/${Key}`;

        return {
          filename: Key,
          url,
          ...result,
        };
      }),
    );

    return NextResponse.json({ success: true, files: uploadResults });
  } catch (error) {
    console.error("File upload error:", error);
    return NextResponse.json(
      { error: "Failed to upload files" },
      { status: 500 },
    );
  }
}
