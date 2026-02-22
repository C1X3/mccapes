import axios from "axios";
import { CryptoType } from "@generated/client";
import { createHelius } from "helius-sdk";

let heliusClient: ReturnType<typeof createHelius> | null = null;

function getHeliusClient() {
  if (heliusClient) {
    return heliusClient;
  }

  const heliusApiKey = process.env.HELIUS_API_KEY;
  if (!heliusApiKey) {
    throw new Error("HELIUS_API_KEY is not configured");
  }

  heliusClient = createHelius({ apiKey: heliusApiKey });
  return heliusClient;
}

export async function deleteCryptoWebhook(
  chain: CryptoType,
  webhookId: string,
): Promise<void> {
  if (!webhookId) {
    return;
  }

  if (chain === CryptoType.SOLANA) {
    if (!process.env.HELIUS_API_KEY) {
      console.warn("HELIUS_API_KEY missing, skipping SOL webhook deletion");
      return;
    }

    const helius = getHeliusClient();
    await helius.webhooks.delete(webhookId);
    return;
  }

  const token = process.env.BLOCKCYPHER_TOKEN;
  if (!token) {
    console.warn("BLOCKCYPHER_TOKEN missing, skipping BlockCypher webhook deletion");
    return;
  }

  const chainPath =
    chain === CryptoType.BITCOIN
      ? "btc"
      : chain === CryptoType.LITECOIN
        ? "ltc"
        : "eth";

  await axios.delete(
    `https://api.blockcypher.com/v1/${chainPath}/main/hooks/${webhookId}?token=${token}`,
  );
}
