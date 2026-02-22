import { derivePath } from "ed25519-hd-key";
import { HDNodeWallet } from "ethers";
import { mnemonicToSeedSync } from "bip39";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import { Keypair } from "@solana/web3.js";
import { CheckoutPayload, WalletDetails } from "./types";
import { prisma } from "@/utils/prisma";
import axios from "axios";
import { CryptoType, Prisma } from "@generated/client";
import Coingecko from "@coingecko/coingecko-typescript";
import { createHelius } from "helius-sdk";

const bip32 = BIP32Factory(ecc);

const litecoinNetwork: bitcoin.Network = {
  messagePrefix: "\x19Litecoin Signed Message:\n",
  bech32: "ltc",
  pubKeyHash: 0x30,
  scriptHash: 0x32,
  wif: 0xb0,
  bip32: {
    public: 0x019da462,
    private: 0x019d9cfe,
  },
};

const CG_IDS = {
  [CryptoType.BITCOIN]: "bitcoin",
  [CryptoType.ETHEREUM]: "ethereum",
  [CryptoType.LITECOIN]: "litecoin",
  [CryptoType.SOLANA]: "solana",
} as const;

const BIP44_COIN = {
  [CryptoType.BITCOIN]: 0,
  [CryptoType.ETHEREUM]: 60,
  [CryptoType.LITECOIN]: 2,
  [CryptoType.SOLANA]: 501,
} as const;

const CHAIN_DECIMALS: Record<CryptoType, number> = {
  [CryptoType.BITCOIN]: 8,
  [CryptoType.ETHEREUM]: 8,
  [CryptoType.LITECOIN]: 8,
  [CryptoType.SOLANA]: 9,
};

type CryptoRatesCache = Record<(typeof CG_IDS)[CryptoType], number>;

const DEFAULT_RATES_CACHE: CryptoRatesCache = {
  bitcoin: 60000,
  ethereum: 3000,
  litecoin: 80,
  solana: 150,
};

const coingeckoClient = new Coingecko({
  environment: "demo",
  demoAPIKey: process.env.COINGECKO_DEMO_API_KEY || undefined,
  timeout: 10000,
});

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

declare global {
  var CRYPTO_RATES_CACHE: CryptoRatesCache | undefined;
  var CRYPTO_RATES_CACHE_INTERVAL: NodeJS.Timeout | undefined;
}

globalThis.CRYPTO_RATES_CACHE ??= { ...DEFAULT_RATES_CACHE };

function getWebhookCallbackUrl() {
  const base = new URL(process.env.NEXT_PUBLIC_APP_URL!);
  return `${base.origin}/api/webhooks/crypto`;
}

export async function updateCryptoRates() {
  try {
    const resp = await coingeckoClient.simple.price.get({
      ids: "bitcoin,ethereum,litecoin,solana",
      vs_currencies: "usd",
    });

    const nextRates: CryptoRatesCache = {
      bitcoin: Number(resp.bitcoin?.usd),
      ethereum: Number(resp.ethereum?.usd),
      litecoin: Number(resp.litecoin?.usd),
      solana: Number(resp.solana?.usd),
    };

    if (
      Object.values(nextRates).every(
        (value) => Number.isFinite(value) && value > 0,
      )
    ) {
      globalThis.CRYPTO_RATES_CACHE = nextRates;
    }
  } catch (error) {
    console.error(
      "Failed to refresh CRYPTO_RATES_CACHE, retaining previous rates",
      error,
    );
  }
}

if (!globalThis.CRYPTO_RATES_CACHE_INTERVAL) {
  void updateCryptoRates();
  globalThis.CRYPTO_RATES_CACHE_INTERVAL = setInterval(() => {
    void updateCryptoRates();
  }, 60000);
}

function getCachedUsdRate(crypto: CryptoType) {
  const cgId = CG_IDS[crypto];
  const rate = globalThis.CRYPTO_RATES_CACHE?.[cgId];

  if (!rate || !Number.isFinite(rate) || rate <= 0) {
    const fallbackRate = DEFAULT_RATES_CACHE[cgId];
    globalThis.CRYPTO_RATES_CACHE = {
      ...DEFAULT_RATES_CACHE,
      ...globalThis.CRYPTO_RATES_CACHE,
      [cgId]: fallbackRate,
    };
    return fallbackRate;
  }

  return rate;
}

function deriveAddressForIndex(
  mnemonic: string,
  seedHex: string,
  root: ReturnType<typeof bip32.fromSeed>,
  crypto: CryptoType,
  depositIndex: number,
) {
  switch (crypto) {
    case CryptoType.ETHEREUM: {
      const hdNode = HDNodeWallet.fromPhrase(
        mnemonic,
        undefined,
        `m/44'/${BIP44_COIN[crypto]}'/0'/0/${depositIndex}`,
      );
      return hdNode.address;
    }

    case CryptoType.BITCOIN:
    case CryptoType.LITECOIN: {
      const node = root.derivePath(
        `m/44'/${BIP44_COIN[crypto]}'/0'/0/${depositIndex}`,
      );
      const network =
        crypto === CryptoType.LITECOIN
          ? litecoinNetwork
          : bitcoin.networks.bitcoin;

      return bitcoin.payments.p2pkh({
        pubkey: Buffer.from(node.publicKey),
        network,
      }).address!;
    }

    case CryptoType.SOLANA: {
      const path = `m/44'/${BIP44_COIN[crypto]}'/${depositIndex}'/0'`;
      const derivedSeed = derivePath(path, seedHex);
      const privateKeyBytes = Buffer.from(derivedSeed.key.slice(0, 32));
      const pair = Keypair.fromSeed(privateKeyBytes);
      return pair.publicKey.toBase58();
    }
  }
}

async function registerCryptoWebhook(
  crypto: CryptoType,
  address: string,
): Promise<string | null> {
  const callbackUrl = getWebhookCallbackUrl();

  if (crypto === CryptoType.SOLANA) {
    const helius = getHeliusClient();
    const webhook = await helius.webhooks.create({
      webhookURL: callbackUrl,
      transactionTypes: ["ANY"],
      accountAddresses: [address],
      webhookType: "enhanced",
    });

    return webhook.webhookID || null;
  }

  const blockcypherToken = process.env.BLOCKCYPHER_TOKEN;
  if (!blockcypherToken) {
    throw new Error("BLOCKCYPHER_TOKEN is not configured");
  }

  const blockcypherChain =
    crypto === CryptoType.BITCOIN
      ? "btc"
      : crypto === CryptoType.LITECOIN
        ? "ltc"
        : "eth";

  const response = await axios.post(
    `https://api.blockcypher.com/v1/${blockcypherChain}/main/hooks?token=${blockcypherToken}`,
    {
      event: "unconfirmed-tx",
      address,
      url: callbackUrl,
    },
  );

  return response.data?.id ?? null;
}

async function createWalletWithAtomicIndex(
  orderId: string,
  crypto: CryptoType,
  expectedAmount: string,
) {
  const mnemonic = process.env.MNEMONIC;
  if (!mnemonic) {
    throw new Error("MNEMONIC is not set in env");
  }

  const seed = mnemonicToSeedSync(mnemonic);
  const root = bip32.fromSeed(seed);
  const seedHex = seed.toString("hex");

  const createAttempt = async () => {
    return prisma.$transaction(
      async (tx) => {
        const last = await tx.wallet.findFirst({
          where: { chain: crypto },
          orderBy: { depositIndex: "desc" },
          select: { depositIndex: true },
        });

        const depositIndex = last !== null ? last.depositIndex + 1 : 0;
        const address = deriveAddressForIndex(
          mnemonic,
          seedHex,
          root,
          crypto,
          depositIndex,
        );

        const wallet = await tx.wallet.create({
          data: {
            orderId,
            chain: crypto,
            depositIndex,
            address,
            expectedAmount,
          },
        });

        return wallet;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  };

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await createAttempt();
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        (error.code === "P2002" || error.code === "P2034") &&
        attempt < 2
      ) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to create wallet with atomic deposit index");
}

export async function createWalletDetails(
  payload: CheckoutPayload,
  crypto: CryptoType,
): Promise<WalletDetails> {
  const expectedUsdTotal =
    payload.totalPrice + payload.paymentFee - (payload.discountAmount ?? 0);

  const discountInfo =
    payload.discountAmount && payload.discountAmount > 0
      ? `Discount: $${payload.discountAmount.toFixed(2)}${payload.couponCode ? ` - Coupon: ${payload.couponCode}` : ""}`
      : "";

  const priceUsd = getCachedUsdRate(crypto);
  const amountCrypto = (expectedUsdTotal / priceUsd).toFixed(
    CHAIN_DECIMALS[crypto],
  );

  const wallet = await createWalletWithAtomicIndex(
    payload.orderId,
    crypto,
    amountCrypto,
  );

  const webhookId = await registerCryptoWebhook(crypto, wallet.address);
  if (webhookId) {
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { webhookId },
    });
  }

  return {
    address: wallet.address,
    amount: amountCrypto,
    url: "",
    note: discountInfo || undefined,
  };
}
