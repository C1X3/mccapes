import { mnemonicToSeedSync } from 'bip39';
import BIP32Factory from 'bip32';
import * as ecc from 'tiny-secp256k1';
import * as bitcoin from 'bitcoinjs-lib';
import ECPairFactory from 'ecpair';
import axios, { AxiosError } from 'axios';
import { prisma } from '@/utils/prisma';

// Litecoin network parameters
const litecoinNetwork: bitcoin.Network = {
    messagePrefix: '\x19Litecoin Signed Message:\n',
    bech32: 'ltc',
    bip32: {
        public: 0x019da462,
        private: 0x019d9cfe,
    },
    pubKeyHash: 0x30,
    scriptHash: 0x32,
    wif: 0xb0,
};

// Helper function to wait
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry function for API calls with rate limit handling
async function fetchWithRetry<T>(
    url: string,
    maxRetries: number = 3
): Promise<T> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const response = await axios.get(url);
            return response.data;
        } catch (error) {
            const axiosError = error as AxiosError;
            
            // Check if it's a rate limit error (429)
            if (axiosError.response?.status === 429) {
                if (attempt < maxRetries) {
                    // Check for Retry-After header, or use exponential backoff
                    const retryAfter = axiosError.response.headers['retry-after'];
                    const waitTime = retryAfter 
                        ? parseInt(retryAfter) * 1000 
                        : Math.min(1000 * Math.pow(2, attempt), 30000); // Exponential backoff, max 30s
                    
                    console.log(`  ⏳ Rate limited. Waiting ${waitTime / 1000}s before retry ${attempt}/${maxRetries}...`);
                    await sleep(waitTime);
                    continue;
                }
            }
            
            // If not a rate limit error, or we've exhausted retries, throw
            throw error;
        }
    }
    
    throw new Error('Max retries exceeded');
}

export async function sendLitecoin(TARGET_ADDRESS: string) {
    const bip32 = BIP32Factory(ecc);
    const ECPair = ECPairFactory(ecc);
    const NETWORK = litecoinNetwork;
    const MNEMONIC = process.env.MNEMONIC;

    if (!MNEMONIC) {
        console.error('❌ MNEMONIC is not set in env');
        process.exit(1);
    }

    const seed = mnemonicToSeedSync(MNEMONIC);
    const root = bip32.fromSeed(seed);

    const wallets = await prisma.wallet.findMany({
        where: { chain: "LITECOIN", withdrawn: false },
        select: { id: true, depositIndex: true, address: true },
    });
    if (wallets.length === 0) {
        console.log('No unswept LTC wallets found.');
        return;
    }

    type UTXOInfo = {
        txid: string;
        vout: number;
        value: number;
        depositIndex: number;
        rawTxHex: string;
        address: string;
    };
    const utxos: UTXOInfo[] = [];

    for (const { depositIndex, address } of wallets) {
        console.log(`Fetching UTXOs for ${address}…`);
        
        try {
            // Fetch UTXOs from BlockCypher with retry logic
            const utxoUrl = `https://api.blockcypher.com/v1/ltc/main/addrs/${address}?unspentOnly=true`;
            const utxoData = await fetchWithRetry<{ txrefs?: Array<{ tx_hash: string; tx_output_n: number; value: number }> }>(utxoUrl);
            const txrefs = utxoData.txrefs || [];

            for (const ref of txrefs) {
                const { tx_hash, tx_output_n, value } = ref;
                console.log(`  found UTXO ${tx_hash}:${tx_output_n} (${value} litoshis)`);
                
                // Fetch raw transaction hex with retry logic
                const rawTxUrl = `https://api.blockcypher.com/v1/ltc/main/txs/${tx_hash}?includeHex=true`;
                const rawTxData = await fetchWithRetry<{ hex?: string }>(rawTxUrl);
                const rawTxHex = rawTxData.hex;
                
                if (!rawTxHex) {
                    console.error(`  ❌ Could not fetch raw tx hex for ${tx_hash}`);
                    continue;
                }

                utxos.push({ 
                    txid: tx_hash, 
                    vout: tx_output_n, 
                    value, 
                    depositIndex, 
                    rawTxHex,
                    address
                });
            }
        } catch (error) {
            console.error(`  ❌ Error fetching UTXOs for ${address}:`, error);
        }
    }

    if (utxos.length === 0) {
        console.log('No UTXOs to sweep.');
        return;
    }

    const psbt = new bitcoin.Psbt({ network: NETWORK });
    let totalLitoshis = 0;
    for (const { txid, vout, value, rawTxHex } of utxos) {
        totalLitoshis += value;
        psbt.addInput({
            hash: txid,
            index: vout,
            nonWitnessUtxo: Buffer.from(rawTxHex, 'hex'),
        });
    }

    // Use a conservative fee rate for Litecoin (1 litoshi/vbyte is typical)
    const feeRateLitoshiPerVbyte = 1;
    const vbytes = utxos.length * 148 + 34 + 10;
    const fee = Math.ceil(vbytes * feeRateLitoshiPerVbyte);

    const sendLitoshis = totalLitoshis - fee;
    if (sendLitoshis <= 0) {
        console.error(`❌ Insufficient funds (${totalLitoshis} litoshis) to cover fee (${fee} litoshis)`);
        process.exit(1);
    }
    console.log(`Total: ${totalLitoshis} litoshis, fee: ${fee} litoshis, sending: ${sendLitoshis} litoshis`);

    psbt.addOutput({
        address: TARGET_ADDRESS,
        value: sendLitoshis,
    });

    utxos.forEach((u, i) => {
        const path = `m/44'/2'/0'/0/${u.depositIndex}`;
        const child = root.derivePath(path);
        if (!child.privateKey) throw new Error(`No private key at ${path}`);

        const keyPair = ECPair.fromPrivateKey(child.privateKey, { network: NETWORK });

        const signer: bitcoin.Signer = {
            publicKey: Buffer.from(keyPair.publicKey),
            sign: (hash: Buffer, lowR?: boolean): Buffer => {
                const sigUint8 = keyPair.sign(hash, lowR);
                return Buffer.from(sigUint8);
            },
        };

        psbt.signInput(i, signer);
    });

    psbt.validateSignaturesOfAllInputs((pubkey, msgHash, signature) => {
        return ECPair.fromPublicKey(pubkey, { network: NETWORK }).verify(msgHash, signature);
    });
    psbt.finalizeAllInputs();

    const txHex = psbt.extractTransaction().toHex();
    console.log('🖊️  Raw TX hex:', txHex);

    console.log('Broadcasting transaction…');
    const txid = await axios.post(
        'https://api.blockcypher.com/v1/ltc/main/txs/push',
        { tx: txHex },
        { headers: { 'Content-Type': 'application/json' } }
    ).then(res => res.data.tx.hash as string);
    console.log(`✅ Broadcasted TXID: ${txid}`);

    // Only mark wallets as withdrawn if their UTXOs were actually included in the transaction
    const sweptAddresses = Array.from(new Set(utxos.map(u => u.address)));
    await prisma.wallet.updateMany({
        where: { 
            chain: "LITECOIN",
            address: { in: sweptAddresses }
        },
        data: { withdrawn: true, txHash: txid },
    });

    console.log(`Marked ${sweptAddresses.length} address(es) as swept.`);
}