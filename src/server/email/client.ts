import "server-only";

import { Resend } from "resend";

let cachedResendClient: Resend | null = null;

export function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not set");
  }

  if (!cachedResendClient) {
    cachedResendClient = new Resend(apiKey);
  }

  return cachedResendClient;
}
