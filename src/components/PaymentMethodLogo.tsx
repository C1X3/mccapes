import Image from "next/image";
import { PaymentType, CryptoType } from "@generated";

interface PaymentMethodLogoProps {
  paymentType: PaymentType;
  cryptoType?: CryptoType;
  size?: 'sm' | 'md' | 'lg';
}

export const PaymentMethodLogo = ({ paymentType, cryptoType, size = 'sm' }: PaymentMethodLogoProps) => {
  const logoSrc = () => {
    if (paymentType === PaymentType.STRIPE) {
      return "https://stripe.com/favicon.ico";
    }
    
    if (paymentType === PaymentType.PAYPAL) {
      return "https://paypal.com/favicon.ico";
    }
    
    if (paymentType === PaymentType.CRYPTO && cryptoType) {
      switch (cryptoType) {
        case CryptoType.BITCOIN:
          return "https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg";
        case CryptoType.ETHEREUM:
          return "https://ethereum.org/favicon.ico";
        case CryptoType.LITECOIN:
          return "https://upload.wikimedia.org/wikipedia/commons/f/f8/LTC-400.png";
        case CryptoType.SOLANA:
          return "https://solana.com/favicon.ico";
        default:
          return "https://upload.wikimedia.org/wikipedia/commons/4/46/Bitcoin.svg";
      }
    }
    
    return null;
  };

  const src = logoSrc();
  if (!src) return null;

  // Size configurations
  const sizeConfig = {
    sm: { container: "w-5 h-5", image: 20 },
    md: { container: "w-6 h-6", image: 24 },
    lg: { container: "w-8 h-8", image: 32 }
  };

  const config = sizeConfig[size];

  return (
    <div className={`${config.container} flex items-center justify-center`}>
      <Image
        src={src}
        alt={`${paymentType} ${cryptoType || ''} logo`}
        width={config.image}
        height={config.image}
        className="object-contain"
        unoptimized
      />
    </div>
  );
};
