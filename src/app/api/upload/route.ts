import { env } from "@/env";
import { auth } from "@/lib/auth";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const Bucket = env.S3_STORAGE_BUCKET;
const s3 = new S3Client({
  region: env.S3_STORAGE_REGION,
  endpoint: env.S3_STORAGE_ENDPOINT,
  credentials: {
    accessKeyId: env.S3_STORAGE_ACCESS_KEY_ID as string,
    secretAccessKey: env.S3_STORAGE_SECRET_ACCESS_KEY as string,
  },
  forcePathStyle: env.S3_STORAGE_FORCE_PATH_STYLE,
});

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (session?.user.role !== "admin")
    return NextResponse.json([], { status: 401 });

  const formData = await request.formData();
  const files = formData.getAll("file") as File[];

  const response = await Promise.all(
    files.map(async (file) => {
      const Body = Buffer.from(await file.arrayBuffer());
      const result = await s3.send(
        new PutObjectCommand({ Bucket, Key: file.name, Body }),
      );
      const url = `https://media-minio.nexirift.com/${Bucket}/${file.name}`;
      return { ...result, url };
    }),
  );

  return NextResponse.json(response);
}
