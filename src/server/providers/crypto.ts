import { HDNodeWallet, parseUnits } from "ethers";
import bip39 from "bip39";
import BIP32Factory from "bip32";
import * as ecc from "tiny-secp256k1";
import * as bitcoin from "bitcoinjs-lib";
import { Keypair } from "@solana/web3.js";
import QRCode from "qrcode";
import { CheckoutPayload, WalletDetails } from "./types";
import { prisma } from "@/utils/prisma";
import axios from "axios";
import { CryptoType } from "@generated";

const bip32 = BIP32Factory(ecc);

const litecoinNetwork: bitcoin.Network = {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'ltc',
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
};
const BIP44_COIN = {
    [CryptoType.BITCOIN]: 0,
    [CryptoType.ETHEREUM]: 60,
    [CryptoType.LITECOIN]: 2,
    [CryptoType.SOLANA]: 501,
};

export async function createWalletDetails(
    payload: CheckoutPayload,
    crypto: CryptoType
): Promise<WalletDetails> {
    // A) Compute USD total
    const usdTotal = payload.items
        .reduce((sum, item) => sum + item.price * item.quantity, 0)
        .toFixed(2);

    // B) Fetch current USD→crypto rate
    const cgId = CG_IDS[crypto];
    const resp = await axios.get(
        `https://api.coingecko.com/api/v3/simple/price?ids=${cgId}&vs_currencies=usd`
    );
    if (!resp.data[cgId]) {
        throw new Error(`Failed to fetch price for ${cgId}`);
    }
    const priceUsd = resp.data[cgId].usd;
    const amountCrypto = (Number(usdTotal) / priceUsd).toFixed(8);

    // C) Derive a fresh child address and persist
    const last = await prisma.wallet.findFirst({
        where: { chain: crypto },
        orderBy: { depositIndex: "desc" },
        select: { depositIndex: true },
    });
    const depositIndex = (last?.depositIndex ?? 0) + 1;

    const MNEMONIC = process.env.MNEMONIC!;
    const seed = bip39.mnemonicToSeedSync(MNEMONIC);
    const root = bip32.fromSeed(seed);

    let address: string;
    switch (crypto) {
        case CryptoType.ETHEREUM: {
            const hdNode = HDNodeWallet.fromPhrase(MNEMONIC, undefined, `m/44'/${BIP44_COIN[crypto]}'/0'/0/${depositIndex}`);
            address = hdNode.address;
            break;
        }

        case CryptoType.BITCOIN:
        case CryptoType.LITECOIN: {
            const node = root.derivePath(`m/44'/${BIP44_COIN[crypto]}'/0'/0/${depositIndex}`);
            const network =
                crypto === CryptoType.LITECOIN ? litecoinNetwork : bitcoin.networks.bitcoin;
            address = bitcoin.payments.p2pkh({ pubkey: Buffer.from(node.publicKey), network }).address!;
            break;
        }

        case CryptoType.SOLANA: {
            const pair = Keypair.fromSeed(seed.subarray(0, 32));
            address = pair.publicKey.toBase58();
            break;
        }
    }

    await prisma.wallet.create({
        data: {
            orderId: payload.orderId,
            chain: crypto,
            depositIndex,
            address,
            expectedAmount: amountCrypto,
        },
    });

    // D) Build URI + QR code
    let uri: string;
    switch (crypto) {
        case CryptoType.BITCOIN:
            uri = `bitcoin:${address}?amount=${amountCrypto}`;
            break;
        case CryptoType.LITECOIN:
            uri = `litecoin:${address}?amount=${amountCrypto}`;
            break;
        case CryptoType.ETHEREUM:
            const weiHex = parseUnits(amountCrypto, 18).toString(16);
            uri = `ethereum:${address}?value=${weiHex}`;
            break;
        case CryptoType.SOLANA:
            uri = `solana:${address}?amount=${amountCrypto}`;
            break;
        default:
            throw new Error('Unsupported crypto type');
    }

    const qrCodeDataUrl = await QRCode.toDataURL(uri);
    return { address, amount: amountCrypto, url: qrCodeDataUrl };
}