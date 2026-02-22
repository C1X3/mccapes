"use client";

import Image from "next/image";
import { PaymentType, CryptoType } from "@generated/browser";
import { SiBitcoin, SiEthereum, SiLitecoin, SiSolana } from "react-icons/si";
import { QRCodeSVG } from "qrcode.react";

interface PaymentMethodLogoProps {
  paymentType: PaymentType;
  cryptoType?: CryptoType;
  size?: "sm" | "md" | "lg";
}

interface CryptoPaymentQrProps {
  address: string;
  expectedAmount: string;
  chain: CryptoType;
  size?: number;
  className?: string;
}

function buildCryptoUri({
  address,
  expectedAmount,
  chain,
}: {
  address: string;
  expectedAmount: string;
  chain: CryptoType;
}) {
  switch (chain) {
    case CryptoType.BITCOIN:
      return `bitcoin:${address}?amount=${expectedAmount}`;
    case CryptoType.LITECOIN:
      return `litecoin:${address}?amount=${expectedAmount}`;
    case CryptoType.ETHEREUM:
      return `ethereum:${address}?value=${expectedAmount}`;
    case CryptoType.SOLANA:
      return `solana:${address}?amount=${expectedAmount}`;
    default:
      return `${address}`;
  }
}

export const CryptoPaymentQr = ({
  address,
  expectedAmount,
  chain,
  size = 200,
  className,
}: CryptoPaymentQrProps) => {
  const uri = buildCryptoUri({ address, expectedAmount, chain });

  return (
    <QRCodeSVG
      value={uri}
      size={size}
      level="H"
      fgColor="#000000"
      bgColor="#ffffff"
      className={className}
    />
  );
};

export const PaymentMethodLogo = ({
  paymentType,
  cryptoType,
  size = "sm",
}: PaymentMethodLogoProps) => {
  const sizeConfig = {
    sm: { container: "w-5 h-5", image: 20 },
    md: { container: "w-6 h-6", image: 24 },
    lg: { container: "w-8 h-8", image: 32 },
  };

  const config = sizeConfig[size];

  if (paymentType === PaymentType.CRYPTO && cryptoType) {
    const iconSize = config.container;

    switch (cryptoType) {
      case CryptoType.BITCOIN:
        return (
          <div className={`${config.container} flex items-center justify-center`}>
            <SiBitcoin className={`${iconSize} text-crypto-bitcoin`} />
          </div>
        );
      case CryptoType.ETHEREUM:
        return (
          <div className={`${config.container} flex items-center justify-center`}>
            <SiEthereum className={`${iconSize} text-crypto-ethereum`} />
          </div>
        );
      case CryptoType.LITECOIN:
        return (
          <div className={`${config.container} flex items-center justify-center`}>
            <SiLitecoin className={`${iconSize} text-crypto-litecoin`} />
          </div>
        );
      case CryptoType.SOLANA:
        return (
          <div className={`${config.container} flex items-center justify-center`}>
            <SiSolana className={`${iconSize} text-crypto-solana`} />
          </div>
        );
      default:
        return (
          <div className={`${config.container} flex items-center justify-center`}>
            <SiBitcoin className={`${iconSize} text-crypto-bitcoin`} />
          </div>
        );
    }
  }

  const logoSrc = () => {
    if (paymentType === PaymentType.STRIPE) {
      return "https://stripe.com/favicon.ico";
    }

    if (paymentType === PaymentType.PAYPAL) {
      return "https://paypal.com/favicon.ico";
    }

    return null;
  };

  const src = logoSrc();
  if (!src) return null;

  return (
    <div className={`${config.container} flex items-center justify-center`}>
      <Image
        src={src}
        alt={`${paymentType} ${cryptoType || ""} logo`}
        width={config.image}
        height={config.image}
        className="object-contain"
        unoptimized
      />
    </div>
  );
};
