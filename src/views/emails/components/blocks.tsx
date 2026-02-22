import * as React from "react";
import { Column, Img, Row, Section, Text } from "@react-email/components";
import { tokens } from "@/views/emails/components/tokens";

type BannerTone = "success" | "warning";

export function Banner({
  text,
  tone = "success",
}: {
  text: string;
  tone?: BannerTone;
}) {
  const backgroundColor =
    tone === "success" ? tokens.color.successBg : tokens.color.warningBg;
  const color =
    tone === "success" ? tokens.color.successText : tokens.color.warningText;

  return (
    <Section style={{ ...styles.banner, backgroundColor }}>
      <Text style={{ ...styles.bannerText, color }}>{text}</Text>
    </Section>
  );
}

export function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <Section style={styles.detailRow}>
      <Row>
        <Column align="left">
          <Text style={styles.detailLabel}>{label}</Text>
        </Column>
        <Column align="right">
          <Text style={styles.detailValue}>{value}</Text>
        </Column>
      </Row>
    </Section>
  );
}

export function ProductLineItem({
  image,
  name,
  meta,
}: {
  image?: string;
  name: string;
  meta: string;
}) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://mccapes.net";
  const fallbackTexture = `${appUrl}/cape renders/experience-cape.png`;
  const rawSrc = image || fallbackTexture;
  const resolvedSrc = resolveEmailProductImageSrc(rawSrc, appUrl);

  return (
    <Section style={styles.item}>
      <Row>
        <Column style={styles.itemImageCol}>
          <Img
            src={resolvedSrc}
            width="56"
            height="90"
            alt={name}
            style={styles.itemImage}
          />
        </Column>
        <Column>
          <Text style={styles.itemName}>{name}</Text>
          <Text style={styles.itemMeta}>{meta}</Text>
        </Column>
      </Row>
    </Section>
  );
}

function resolveEmailProductImageSrc(src: string, appUrl: string) {
  if (src.startsWith("data:")) {
    return src;
  }

  if (src.startsWith("/cape renders/")) {
    return `${appUrl}/api/email/cape-flat?src=${encodeURIComponent(src)}`;
  }

  if (src.startsWith("http://") || src.startsWith("https://")) {
    try {
      const url = new URL(src);
      if (url.pathname.startsWith("/cape renders/")) {
        return `${appUrl}/api/email/cape-flat?src=${encodeURIComponent(url.pathname)}`;
      }
    } catch {
      return src;
    }
  }

  return src;
}

export function CodeBlock({
  code,
  isOld = false,
  label,
}: {
  code: string;
  isOld?: boolean;
  label?: string;
}) {
  return (
    <Section style={isOld ? styles.oldCode : styles.code}>
      {label ? <Text style={styles.codeLabel}>{label}</Text> : null}
      <Text style={isOld ? styles.oldCodeText : styles.codeText}>{code}</Text>
    </Section>
  );
}

const styles = {
  banner: {
    borderRadius: tokens.radius.md,
    border: `1px solid ${tokens.color.border}`,
    margin: 0,
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
    backgroundColor: tokens.color.surface,
  },
  bannerText: {
    margin: 0,
    fontSize: "14px",
    fontWeight: "700",
    lineHeight: "22px",
    wordBreak: "break-word" as const,
  },
  detailRow: {
    margin: 0,
    padding: `${tokens.spacing.sm} 0`,
    borderBottom: `1px dashed ${tokens.color.border}`,
  },
  detailLabel: {
    margin: 0,
    color: tokens.color.textMuted,
    fontSize: "13px",
    fontWeight: "600",
    lineHeight: "20px",
  },
  detailValue: {
    margin: 0,
    color: tokens.color.text,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: "700",
    textAlign: "right" as const,
    wordBreak: "break-word" as const,
  },
  item: {
    margin: `${tokens.spacing.md} 0 0`,
    border: `1px solid ${tokens.color.border}`,
    borderRadius: tokens.radius.md,
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
    backgroundColor: tokens.color.surfaceSoft,
  },
  itemImageCol: {
    width: "74px",
    minWidth: "74px",
    verticalAlign: "top" as const,
  },
  itemImage: {
    borderRadius: tokens.radius.sm,
    border: `1px solid ${tokens.color.border}`,
    width: "56px",
    height: "90px",
    display: "block",
  },
  itemName: {
    margin: "0 0 4px",
    color: tokens.color.text,
    fontSize: "14px",
    lineHeight: "20px",
    fontWeight: "700",
    wordBreak: "break-word" as const,
  },
  itemMeta: {
    margin: 0,
    color: tokens.color.textMuted,
    fontSize: "13px",
    lineHeight: "20px",
    wordBreak: "break-word" as const,
  },
  code: {
    margin: `${tokens.spacing.sm} 0 0`,
    backgroundColor: tokens.color.codeBg,
    borderRadius: tokens.radius.sm,
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
  },
  oldCode: {
    margin: `${tokens.spacing.sm} 0 0`,
    backgroundColor: tokens.color.oldCodeBg,
    borderRadius: tokens.radius.sm,
    border: "1px solid #fecdd3",
    padding: `${tokens.spacing.md} ${tokens.spacing.lg}`,
  },
  codeLabel: {
    margin: "0 0 6px",
    color: "#94a3b8",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.4px",
    textTransform: "uppercase" as const,
  },
  codeText: {
    margin: 0,
    color: tokens.color.codeText,
    fontSize: "13px",
    lineHeight: "20px",
    wordBreak: "break-word" as const,
    overflowWrap: "anywhere" as const,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
  },
  oldCodeText: {
    margin: 0,
    color: tokens.color.oldCodeText,
    fontSize: "13px",
    lineHeight: "20px",
    wordBreak: "break-word" as const,
    overflowWrap: "anywhere" as const,
    fontFamily:
      'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Courier New", monospace',
  },
};
