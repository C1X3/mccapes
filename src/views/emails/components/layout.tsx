import * as React from "react";
import { type ReactNode } from "react";
import {
  Body,
  Button,
  Container,
  Head,
  Html,
  Img,
  Section,
  Preview,
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
    <Html lang="en">
      <Head>
        <meta name="color-scheme" content="light" />
        <meta name="supported-color-schemes" content="light" />
        <style>
          {`
            :root {
              color-scheme: light;
              supported-color-schemes: light;
            }

            @media only screen and (max-width: 640px) {
              .email-shell {
                width: 100% !important;
              }

              .email-outer-pad {
                padding-left: 12px !important;
                padding-right: 12px !important;
              }

              .email-content-pad {
                padding-left: 16px !important;
                padding-right: 16px !important;
              }

              .email-header-pad {
                padding-top: 20px !important;
                padding-bottom: 16px !important;
              }

              .email-heading {
                font-size: 25px !important;
                line-height: 31px !important;
              }

              .email-subheading {
                font-size: 13px !important;
                line-height: 20px !important;
              }
            }

            @media (prefers-color-scheme: dark) {
              .force-bg {
                background-color: #ffffff !important;
              }

              .force-text {
                color: #13221b !important;
              }

              .force-muted {
                color: #4a6658 !important;
              }

              .force-border {
                border-color: #d1e2d8 !important;
              }
            }

            [data-ogsc] .force-bg {
              background-color: #ffffff !important;
            }

            [data-ogsc] .force-text {
              color: #13221b !important;
            }

            [data-ogsc] .force-muted {
              color: #4a6658 !important;
            }

            [data-ogsc] .force-border {
              border-color: #d1e2d8 !important;
            }
          `}
        </style>
      </Head>
      <Preview>{preview}</Preview>
      <Body style={styles.body} className="force-bg">
        <Section style={styles.outerPad} className="email-outer-pad force-bg">
          <Container
            width={640}
            style={styles.container}
            className="email-shell force-bg force-border"
          >
            <Section style={styles.heroWrap}>
              <Img
                src={heroImage}
                alt={heroAlt}
                width="640"
                height="260"
                style={styles.heroImage}
              />
            </Section>

            <Section
              style={styles.header}
              className="email-content-pad email-header-pad force-bg force-border"
            >
              <Text style={styles.meta} className="force-border">
                {metaLabel}
              </Text>
              <Text style={styles.heading} className="email-heading force-text">
                {heading}
              </Text>
              <Text
                style={styles.subheading}
                className="email-subheading force-muted"
              >
                {subheading}
              </Text>
            </Section>

            <Section
              style={styles.contentWrap}
              className="email-content-pad force-bg force-text"
            >
              {children}
            </Section>

            {ctaHref && ctaLabel && (
              <Section
                style={styles.ctaWrap}
                className="email-content-pad force-bg force-text"
              >
                <Button href={ctaHref} style={styles.cta}>
                  {ctaLabel}
                </Button>
              </Section>
            )}

            <Section
              style={styles.footer}
              className="email-content-pad force-bg force-border"
            >
              <Text style={styles.footerText} className="force-muted">
                Need help? Reply directly to this email with your order ID.
              </Text>
              <Text style={styles.footerSmall} className="force-muted">
                MCCapes • {appUrl}
              </Text>
            </Section>
          </Container>
        </Section>
      </Body>
    </Html>
  );
}

const styles = {
  body: {
    margin: 0,
    padding: 0,
    backgroundColor: tokens.color.bg,
    color: tokens.color.text,
    fontFamily: tokens.fontFamily,
  },
  outerPad: {
    margin: 0,
    padding: tokens.spacing.xl,
    backgroundColor: tokens.color.bg,
  },
  container: {
    width: "100%",
    maxWidth: "640px",
    backgroundColor: tokens.color.surface,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.xl,
    margin: "0 auto",
    overflow: "hidden",
    color: tokens.color.text,
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
      "linear-gradient(180deg, #f1f8f4 0%, #f8fcfa 52%, #ffffff 100%)",
    borderBottom: `1px solid ${tokens.color.border}`,
    color: tokens.color.text,
  },
  contentWrap: {
    margin: 0,
    padding: `${tokens.spacing.xl} ${tokens.spacing.xl} 0`,
    backgroundColor: tokens.color.surface,
    color: tokens.color.text,
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
    backgroundColor: tokens.color.surface,
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
    backgroundColor: tokens.color.surface,
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
