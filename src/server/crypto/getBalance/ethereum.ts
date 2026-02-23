import { CryptoType } from "@generated/client";
import { prisma } from "@/utils/prisma";
import axios from "axios";
import { formatEther } from "ethers";

export async function getTotalEthereumBalance(): Promise<number> {
  const wallets = await prisma.wallet.findMany({
    where: {
      chain: CryptoType.ETHEREUM,
      paid: true,
      withdrawn: false,
    },
    select: { address: true },
  });

  // 2) Flatten & dedupe addresses
  const uniqueAddrs = Array.from(new Set(wallets.map((w) => w.address)));

  // 3) Fetch balances via public Ethereum RPC (FREE, no rate limits on public nodes)
  let totalWei = BigInt(0);

  const rpcEndpoints = [
    "https://cloudflare-eth.com",
    "https://eth.llamarpc.com",
    "https://rpc.ankr.com/eth",
  ];

  for (const address of uniqueAddrs) {
    let balanceWei: bigint | null = null;
    for (const url of rpcEndpoints) {
      try {
        const resp = await axios.post(
          url,
          {
            jsonrpc: "2.0",
            method: "eth_getBalance",
            params: [address, "latest"],
            id: 1,
          },
          { timeout: 6000 },
        );
        const hex = resp.data?.result;
        if (hex !== undefined && hex !== null) {
          balanceWei = BigInt(hex);
          break;
        }
      } catch {
        // Try next endpoint
      }
    }
    if (balanceWei !== null) {
      totalWei += balanceWei;
    }
  }

  // 4) Convert wei to ETH string then parse to number
  const totalEthString = formatEther(totalWei);
  return parseFloat(totalEthString);
}
