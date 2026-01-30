import { s3Client, S3_BUCKET_NAME, S3_ENDPOINT } from "@/utils/minio";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { createId } from "@paralleldrive/cuid2";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  // Check authentication
  const cooks = await cookies();
  const authenticatedCookie = cooks.get("authenticated");
  const isAuthenticated =
    authenticatedCookie?.value === process.env.ADMIN_PASSWORD;

  if (!isAuthenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // Validate content-type (must be video)
  const contentType = request.headers.get("content-type") || "";
  const isVideo = contentType.startsWith("video/");

  if (!isVideo) {
    return NextResponse.json(
      { error: "Content must be a video file" },
      { status: 400 },
    );
  }

  // Read the entire body as an ArrayBuffer
  const arrayBuffer = await request.arrayBuffer();
  const fileBuffer = Buffer.from(arrayBuffer);

  // Build S3 key with appropriate directory structure
  const ext = contentType.split("/")[1];
  const videoId = createId();
  const objectKey = `${videoId}.${ext}`;
  const displayUrl = `${S3_ENDPOINT}/${S3_BUCKET_NAME}/${objectKey}`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: S3_BUCKET_NAME,
        Key: objectKey,
        Body: fileBuffer,
        ContentType: contentType,
        ACL: "public-read",
      }),
    );

    return NextResponse.json({
      success: true,
      objectKey,
      url: displayUrl,
    });
  } catch (err) {
    console.error("S3 upload failed:", err);
    return NextResponse.json(
      {
        success: false,
        error: "Upload failed",
      },
      { status: 500 },
    );
  }
}
