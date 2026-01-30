import Image from "next/image";
import { PaymentType, CryptoType } from "@generated/browser";
import { SiBitcoin, SiEthereum, SiLitecoin, SiSolana } from "react-icons/si";

interface PaymentMethodLogoProps {
  paymentType: PaymentType;
  cryptoType?: CryptoType;
  size?: "sm" | "md" | "lg";
}

export const PaymentMethodLogo = ({
  paymentType,
  cryptoType,
  size = "sm",
}: PaymentMethodLogoProps) => {
  // Size configurations
  const sizeConfig = {
    sm: { container: "w-5 h-5", image: 20 },
    md: { container: "w-6 h-6", image: 24 },
    lg: { container: "w-8 h-8", image: 32 },
  };

  const config = sizeConfig[size];

  // Handle crypto currencies with SI icons
  if (paymentType === PaymentType.CRYPTO && cryptoType) {
    const iconSize = config.container;

    switch (cryptoType) {
      case CryptoType.BITCOIN:
        return (
          <div
            className={`${config.container} flex items-center justify-center`}
          >
            <SiBitcoin className={`${iconSize} text-[#f7931a]`} />
          </div>
        );
      case CryptoType.ETHEREUM:
        return (
          <div
            className={`${config.container} flex items-center justify-center`}
          >
            <SiEthereum className={`${iconSize} text-[#627eea]`} />
          </div>
        );
      case CryptoType.LITECOIN:
        return (
          <div
            className={`${config.container} flex items-center justify-center`}
          >
            <SiLitecoin className={`${iconSize} text-[#a6a9aa]`} />
          </div>
        );
      case CryptoType.SOLANA:
        return (
          <div
            className={`${config.container} flex items-center justify-center`}
          >
            <SiSolana className={`${iconSize} text-[#14f195]`} />
          </div>
        );
      default:
        return (
          <div
            className={`${config.container} flex items-center justify-center`}
          >
            <SiBitcoin className={`${iconSize} text-[#f7931a]`} />
          </div>
        );
    }
  }

  // Handle PayPal and Stripe with favicons
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
