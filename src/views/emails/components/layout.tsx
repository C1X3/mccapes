import { type ReactNode } from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { tokens } from "@/views/emails/components/tokens";

type EmailLayoutProps = {
  preview: string;
  metaLabel: string;
  heading: string;
  subheading: string;
  heroImage: string;
  heroAlt: string;
  ctaHref?: string;
  ctaLabel?: string;
  children: ReactNode;
};

const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mccapes.net";

export function EmailLayout({
  preview,
  metaLabel,
  heading,
  subheading,
  heroImage,
  heroAlt,
  ctaHref,
  ctaLabel,
  children,
}: EmailLayoutProps) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={styles.body}>
        <Container style={styles.container}>
          <Section style={styles.heroWrap}>
            <Img
              src={heroImage}
              alt={heroAlt}
              width="640"
              height="260"
              style={styles.heroImage}
            />
          </Section>

          <Section style={styles.header}>
            <Text style={styles.meta}>{metaLabel}</Text>
            <Text style={styles.heading}>{heading}</Text>
            <Text style={styles.subheading}>{subheading}</Text>
          </Section>

          {children}

          {ctaHref && ctaLabel && (
            <Section style={styles.ctaWrap}>
              <Button href={ctaHref} style={styles.cta}>
                {ctaLabel}
              </Button>
            </Section>
          )}

          <Section style={styles.footer}>
            <Text style={styles.footerText}>
              Need help? Reply directly to this email with your order ID.
            </Text>
            <Text style={styles.footerSmall}>MCCapes • {appUrl}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    margin: 0,
    padding: tokens.spacing.xl,
    backgroundColor: tokens.color.bg,
    fontFamily: tokens.fontFamily,
  },
  container: {
    backgroundColor: tokens.color.surface,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.xl,
    margin: "0 auto",
    maxWidth: "640px",
    overflow: "hidden",
    boxShadow: "0 14px 45px rgba(16, 42, 29, 0.15)",
  },
  heroWrap: {
    backgroundColor: "#1f3d2f",
    lineHeight: "0",
    fontSize: "0",
  },
  heroImage: {
    width: "100%",
    maxWidth: "640px",
    height: "auto",
    display: "block",
    verticalAlign: "top",
    margin: "0",
  },
  header: {
    padding: `${tokens.spacing.xl} ${tokens.spacing.xl} ${tokens.spacing.lg}`,
    textAlign: "center" as const,
    background:
      "linear-gradient(180deg, rgba(31, 61, 47, 0.34) 0%, rgba(78, 136, 104, 0.16) 28%, rgba(255, 255, 255, 1) 72%), radial-gradient(circle at 12% 0%, rgba(34, 197, 94, 0.12), transparent 44%), radial-gradient(circle at 88% 8%, rgba(21, 128, 61, 0.08), transparent 46%)",
    borderBottom: `1px solid ${tokens.color.border}`,
  },
  meta: {
    margin: "0 auto",
    display: "inline-block",
    backgroundColor: tokens.color.brandInk,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.pill,
    color: tokens.color.brandDark,
    fontSize: "11px",
    letterSpacing: "0.6px",
    fontWeight: "800",
    lineHeight: "16px",
    textTransform: "uppercase" as const,
    padding: "4px 10px",
  },
  heading: {
    margin: `${tokens.spacing.md} 0 0`,
    color: tokens.color.text,
    fontSize: "30px",
    lineHeight: "36px",
    fontWeight: "800",
  },
  subheading: {
    margin: `${tokens.spacing.sm} auto 0`,
    color: tokens.color.textMuted,
    fontSize: "14px",
    lineHeight: "22px",
    maxWidth: "540px",
  },
  ctaWrap: {
    padding: `${tokens.spacing.xl} ${tokens.spacing.xl} 0`,
    textAlign: "center" as const,
  },
  cta: {
    backgroundColor: tokens.color.brandDark,
    borderRadius: tokens.radius.md,
    color: "#ffffff",
    fontSize: "14px",
    fontWeight: "700",
    textDecoration: "none",
    padding: "12px 24px",
  },
  footer: {
    borderTop: `1px solid ${tokens.color.border}`,
    marginTop: tokens.spacing.xl,
    padding: `${tokens.spacing.lg} ${tokens.spacing.xl} ${tokens.spacing.xl}`,
    textAlign: "center" as const,
  },
  footerText: {
    margin: 0,
    color: tokens.color.textMuted,
    fontSize: "13px",
    lineHeight: "20px",
  },
  footerSmall: {
    margin: `${tokens.spacing.sm} 0 0`,
    color: "#6e8578",
    fontSize: "12px",
    lineHeight: "18px",
  },
};
