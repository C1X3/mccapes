import { Link, Section, Text } from "@react-email/components";
import { PaymentType } from "@generated/client";
import {
  Banner,
  CodeBlock,
  DetailRow,
  ProductLineItem,
} from "@/views/emails/components/blocks";
import { EmailLayout } from "@/views/emails/components/layout";
import { tokens } from "@/views/emails/components/tokens";

export interface OrderCompleteTemplateProps {
  customerName: string;
  customerEmail: string;
  orderId: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    codes?: string[];
    image?: string;
  }>;
  totalPrice: number;
  paymentFee: number;
  totalWithFee: number;
  paymentType: PaymentType;
  orderDate: string;
}

const money = (value: number) => `$${value.toFixed(2)}`;
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mccapes.net";

export function OrderCompleteTemplate(props: OrderCompleteTemplateProps) {
  const orderUrl = `${appUrl}/order/${props.orderId}`;
  const faqUrl = `${appUrl}/faq`;

  return (
    <EmailLayout
      preview={`Order #${props.orderId.substring(0, 8)} is complete`}
      metaLabel="Order Delivery"
      heading="Your order is ready"
      subheading="Payment confirmed and delivery completed. Your access codes are below."
      heroImage={`${appUrl}/images/email-header.jpg`}
      heroAlt="MCCapes hero"
      ctaHref={orderUrl}
      ctaLabel="View Order Status"
    >
      <Section style={styles.section}>
        <Banner
          text={`Payment received: ${money(props.totalWithFee)} via ${props.paymentType.replace("_", " ")}.`}
        />

        <Section style={styles.card}>
          <Text style={styles.greeting}>Hey {props.customerName},</Text>
          <Text style={styles.text}>
            Your purchase has been delivered. Keep these codes private and store them securely.
          </Text>

          <Text style={styles.subheading}>Order snapshot</Text>
          <Section style={styles.panel}>
            <DetailRow label="Order" value={`#${props.orderId.substring(0, 8)}`} />
            <DetailRow label="Email" value={props.customerEmail} />
            <DetailRow label="Date" value={new Date(props.orderDate).toUTCString()} />
            <DetailRow
              label="Payment Method"
              value={props.paymentType.replace("_", " ")}
            />
          </Section>

          <Text style={styles.subheading}>Items and code vault</Text>
          {props.items.map((item, itemIndex) => (
            <Section key={`${item.name}-${itemIndex}`}>
              <ProductLineItem
                image={item.image}
                name={item.name}
                meta={`${money(item.price)} x ${item.quantity} = ${money(item.price * item.quantity)}`}
              />
              {(item.codes ?? []).map((code, codeIndex) => (
                <CodeBlock
                  key={`${item.name}-code-${codeIndex}`}
                  code={code}
                  label={`Code ${codeIndex + 1}`}
                />
              ))}
            </Section>
          ))}

          <Text style={styles.subheading}>Payment summary</Text>
          <Section style={styles.panel}>
            <DetailRow label="Subtotal" value={money(props.totalPrice)} />
            <DetailRow label="Payment Fee" value={money(props.paymentFee)} />
            <DetailRow label="Total Paid" value={money(props.totalWithFee)} />
          </Section>

          <Section style={styles.tipBox}>
            <Text style={styles.tipTitle}>Next step</Text>
            <Text style={styles.tipText}>
              If you need help redeeming your item, reply to this email and include order
              #{props.orderId.substring(0, 8)}.
            </Text>
            <Text style={styles.tipLinks}>
              <Link href={orderUrl} style={styles.tipLink}>
                View your order
              </Link>
              {"  •  "}
              <Link href={faqUrl} style={styles.tipLink}>
                FAQ
              </Link>
            </Text>
          </Section>
        </Section>
      </Section>
    </EmailLayout>
  );
}

export function buildOrderCompleteText(props: OrderCompleteTemplateProps) {
  const lines = [
    "MCCapes - Order Complete",
    `Order: #${props.orderId.substring(0, 8)}`,
    `Customer: ${props.customerName}`,
    `Email: ${props.customerEmail}`,
    `Date: ${new Date(props.orderDate).toUTCString()}`,
    `Payment Method: ${props.paymentType.replace("_", " ")}`,
    `Order Link: ${appUrl}/order/${props.orderId}`,
    `FAQ: ${appUrl}/faq`,
    "Support: Reply to this email and include your order ID.",
    "",
    "Items:",
    ...props.items.flatMap((item) => [
      `- ${item.name}: ${money(item.price)} x ${item.quantity} = ${money(item.price * item.quantity)}`,
      ...(item.codes ?? []).map((code) => `  Code: ${code}`),
    ]),
    "",
    `Subtotal: ${money(props.totalPrice)}`,
    `Payment Fee: ${money(props.paymentFee)}`,
    `Total Paid: ${money(props.totalWithFee)}`,
  ];

  return lines.join("\n");
}

const styles = {
  section: {
    padding: 0,
  },
  card: {
    margin: `${tokens.spacing.lg} 0 0`,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.xl,
    backgroundColor: tokens.color.surface,
    color: tokens.color.text,
  },
  greeting: {
    margin: "0 0 8px",
    color: tokens.color.text,
    fontSize: "17px",
    lineHeight: "24px",
    fontWeight: "700",
  },
  text: {
    margin: `0 0 ${tokens.spacing.md}`,
    color: tokens.color.textMuted,
    fontSize: "14px",
    lineHeight: "22px",
    wordBreak: "break-word" as const,
  },
  subheading: {
    margin: `${tokens.spacing.lg} 0 ${tokens.spacing.sm}`,
    color: tokens.color.brandDark,
    fontSize: "15px",
    fontWeight: "800",
  },
  panel: {
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.surfaceSoft,
    padding: `0 ${tokens.spacing.md}`,
  },
  tipBox: {
    marginTop: tokens.spacing.lg,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.brandInk,
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
  },
  tipTitle: {
    margin: "0 0 4px",
    color: tokens.color.brandDark,
    fontSize: "13px",
    fontWeight: "800",
    textTransform: "uppercase" as const,
    letterSpacing: "0.4px",
  },
  tipText: {
    margin: 0,
    color: tokens.color.text,
    fontSize: "13px",
    lineHeight: "20px",
    wordBreak: "break-word" as const,
  },
  tipLinks: {
    margin: `${tokens.spacing.sm} 0 0`,
    color: tokens.color.text,
    fontSize: "13px",
    lineHeight: "20px",
    wordBreak: "break-word" as const,
  },
  tipLink: {
    color: tokens.color.brandDark,
    textDecoration: "underline",
    fontWeight: "700",
  },
};
