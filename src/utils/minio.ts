import "server-only";

// Third-party Imports
import { S3Client } from "@aws-sdk/client-s3";

// Ensure these environment variables are set!
export const S3_ENDPOINT = process.env.NEXT_PUBLIC_MINIO_ENDPOINT;
const S3_ACCESS_KEY_ID = process.env.MINIO_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.MINIO_SECRET_ACCESS_KEY;
export const S3_BUCKET_NAME = process.env.DATA_BUCKET;
const S3_REGION = process.env.MINIO_REGION || "local";

if (
  !S3_ENDPOINT ||
  !S3_ACCESS_KEY_ID ||
  !S3_SECRET_ACCESS_KEY ||
  !S3_BUCKET_NAME
) {
  throw new Error(
    "Missing required S3 configuration in environment variables.",
  );
}

export const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
  forcePathStyle: true, // Often needed for MinIO/local S3
});
