import { Link, Section, Text } from "@react-email/components";
import {
  Banner,
  CodeBlock,
  DetailRow,
  ProductLineItem,
} from "@/views/emails/components/blocks";
import { EmailLayout } from "@/views/emails/components/layout";
import { tokens } from "@/views/emails/components/tokens";

export interface CodeReplacedTemplateProps {
  customerName: string;
  customerEmail: string;
  orderId: string;
  productName: string;
  productImage?: string;
  oldCode: string;
  newCode: string;
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mccapes.net";

export function CodeReplacedTemplate(props: CodeReplacedTemplateProps) {
  const orderUrl = `${appUrl}/order/${props.orderId}`;
  const faqUrl = `${appUrl}/faq`;

  return (
    <EmailLayout
      preview={`Code replacement for order #${props.orderId.substring(0, 8)}`}
      metaLabel="Code Replacement"
      heading="Your code was updated"
      subheading="A replacement was issued for your order. Use only the new active code below."
      heroImage={`${appUrl}/images/email-header.jpg`}
      heroAlt="MCCapes hero"
      ctaHref={orderUrl}
      ctaLabel="View Order Status"
    >
      <Section style={styles.section}>
        <Banner
          tone="warning"
          text={`Action completed: one code on order #${props.orderId.substring(0, 8)} has been replaced.`}
        />

        <Section style={styles.card}>
          <Text style={styles.greeting}>Hey {props.customerName},</Text>
          <Text style={styles.text}>
            We replaced one code for {props.productName}. The old code is invalid and should not
            be used.
          </Text>

          <Text style={styles.subheading}>Replacement snapshot</Text>
          <Section style={styles.panel}>
            <DetailRow label="Order" value={`#${props.orderId.substring(0, 8)}`} />
            <DetailRow label="Email" value={props.customerEmail} />
            <DetailRow label="Product" value={props.productName} />
            <DetailRow label="Updated At" value={new Date().toUTCString()} />
          </Section>

          <ProductLineItem
            image={props.productImage}
            name={props.productName}
            meta="Inventory refreshed and reassigned"
          />

          <Text style={styles.subheading}>Deactivated code</Text>
          <CodeBlock code={props.oldCode} isOld label="Do not use" />

          <Text style={styles.subheading}>Active replacement code</Text>
          <CodeBlock code={props.newCode} label="Use this code" />

          <Section style={styles.linksBox}>
            <Text style={styles.linksText}>
              Need help? Reply to this email and include order #
              {props.orderId.substring(0, 8)}.
            </Text>
            <Text style={styles.linksText}>
              <Link href={orderUrl} style={styles.link}>
                View your order
              </Link>
              {"  •  "}
              <Link href={faqUrl} style={styles.link}>
                FAQ
              </Link>
            </Text>
          </Section>
        </Section>
      </Section>
    </EmailLayout>
  );
}

export function buildCodeReplacedText(props: CodeReplacedTemplateProps) {
  return [
    "MCCapes - Code Replacement",
    `Order: #${props.orderId.substring(0, 8)}`,
    `Customer: ${props.customerName}`,
    `Email: ${props.customerEmail}`,
    `Product: ${props.productName}`,
    `Order Link: ${appUrl}/order/${props.orderId}`,
    `FAQ: ${appUrl}/faq`,
    "Support: Reply to this email and include your order ID.",
    "",
    "Old code (deactivated):",
    props.oldCode,
    "",
    "New code (active):",
    props.newCode,
  ].join("\n");
}

const styles = {
  section: {
    padding: `${tokens.spacing.xl} 0 0`,
  },
  card: {
    margin: `${tokens.spacing.lg} ${tokens.spacing.xl} 0`,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.lg,
    padding: tokens.spacing.xl,
    backgroundColor: tokens.color.surface,
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
  linksBox: {
    marginTop: tokens.spacing.lg,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    backgroundColor: tokens.color.brandInk,
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
  },
  linksText: {
    margin: 0,
    color: tokens.color.text,
    fontSize: "13px",
    lineHeight: "20px",
  },
  link: {
    color: tokens.color.brandDark,
    textDecoration: "underline",
    fontWeight: "700",
  },
};
