import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

interface CodeReplacedTemplateProps {
  customerName: string;
  customerEmail: string;
  orderId: string;
  productName: string;
  oldCode: string;
  newCode: string;
}

export const CodeReplacedTemplate = ({
  customerName,
  customerEmail,
  orderId,
  productName,
  oldCode,
  newCode,
}: CodeReplacedTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>Code Replacement - Your product code has been updated</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>MCCapes</Text>
            <Hr style={divider} />
          </Section>

          <Section>
            <Text style={heading}>Code Replacement Notice 🔄</Text>

            {/* Replacement Confirmation Banner */}
            <Section style={confirmationBanner}>
              <Text style={confirmationBannerText}>
                Your product code has been successfully replaced for order #
                {orderId.substring(0, 8)}
              </Text>
            </Section>

            <Section style={messageCard}>
              <div style={senderInfo}>
                <Text style={senderName}>{customerName}</Text>
                <Text style={senderEmail}>{customerEmail}</Text>
              </div>
              <Hr style={messageDivider} />
              <Text style={messageText}>
                We&apos;ve replaced one of your product codes with a fresh new
                code. Please use the new code below and discard the previous
                one.
              </Text>

              {/* Order Details */}
              <Section style={orderDetailsSection}>
                <Text style={orderDetailTitle}>Replacement Details</Text>
                <div style={orderDetailRow}>
                  <Text style={orderDetailLabel}>Order ID</Text>
                  <Text style={orderDetailValue}>
                    <span style={orderDetailLabel}>: </span>#
                    {orderId.substring(0, 8)}
                  </Text>
                </div>
                <div style={orderDetailRow}>
                  <Text style={orderDetailLabel}>Product</Text>
                  <Text style={orderDetailValue}>
                    <span style={orderDetailLabel}>: </span>
                    {productName}
                  </Text>
                </div>
                <div style={orderDetailRow}>
                  <Text style={orderDetailLabel}>Replacement Date</Text>
                  <Text style={orderDetailValue}>
                    <span style={orderDetailLabel}>: </span>
                    {new Date().toLocaleDateString()}
                  </Text>
                </div>
              </Section>

              {/* Code Replacement Section */}
              <Text style={sectionHeading}>Code Replacement</Text>
              <Section style={itemSection}>
                <div style={itemContainer}>
                  <div style={itemDetailsContainer}>
                    <Text style={itemName}>{productName}</Text>
                  </div>
                </div>

                {/* Display Old and New Codes */}
                <div style={codesContainer}>
                  <Text style={codesTitle}>Previous Code (Deactivated):</Text>
                  <div style={oldCodeBox}>
                    <Text style={oldCodeText}>{oldCode}</Text>
                  </div>

                  <Text style={codesTitle}>New Code (Active):</Text>
                  <div style={newCodeBox}>
                    <Text style={newCodeText}>{newCode}</Text>
                  </div>
                </div>
              </Section>
            </Section>

            <Section style={nextStepsSection}>
              <Text style={nextStepsTitle}>Important Information</Text>
              <Text style={nextStepsText}>
                • Your previous code has been deactivated and can no longer be
                used{"\n"}• If you need any assistance, contact our support team
                with your order ID
              </Text>
            </Section>

            <Hr style={divider} />
            <Text style={footer}>
              Thank you for your business!
              <br />
              If you have any questions, please contact our support team.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#F8FAFC",
  padding: "40px 0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E2E8F0",
  borderRadius: "16px",
  boxShadow: "0 4px 24px rgba(0, 0, 0, 0.05)",
  padding: "48px 24px",
  maxWidth: "600px",
  margin: "0 auto",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const headerText = {
  fontSize: "28px",
  fontWeight: "700",
  color: "#5897FB",
  margin: "0 0 16px",
  textAlign: "center" as const,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const divider = {
  borderColor: "#E2E8F0",
  margin: "20px 0",
};

const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#2C3245",
  margin: "24px 0",
  textAlign: "center" as const,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const confirmationBanner = {
  backgroundColor: "#FEF3C7",
  padding: "16px",
  borderRadius: "8px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const confirmationBannerText = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#D97706",
  margin: "0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const messageCard = {
  backgroundColor: "#F1F5F9",
  borderRadius: "12px",
  padding: "24px",
  margin: "20px 0",
  border: "1px solid #E2E8F0",
};

const senderInfo = {
  marginBottom: "16px",
};

const senderName = {
  fontSize: "18px",
  fontWeight: "600",
  color: "#5897FB",
  margin: "0 0 4px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const senderEmail = {
  fontSize: "14px",
  color: "#64748B",
  margin: "0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const messageDivider = {
  borderColor: "#E2E8F0",
  margin: "16px 0",
};

const messageText = {
  fontSize: "16px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  color: "#2C3245",
  lineHeight: "26px",
  margin: "16px 0",
  whiteSpace: "pre-wrap" as const,
};

const orderDetailsSection = {
  backgroundColor: "#FFFFFF",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "20px",
  border: "1px solid #E2E8F0",
};

const orderDetailTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#2C3245",
  margin: "0 0 12px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const orderDetailRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
};

const orderDetailLabel = {
  fontSize: "14px",
  color: "#64748B",
  margin: "0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const orderDetailValue = {
  fontSize: "14px",
  color: "#2C3245",
  fontWeight: "500",
  margin: "0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const sectionHeading = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#2C3245",
  margin: "24px 0 12px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const itemSection = {
  backgroundColor: "#FFFFFF",
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "10px",
  border: "1px solid #E2E8F0",
};

const itemContainer = {
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
};

const itemDetailsContainer = {
  width: "100%",
};

const itemName = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#10B981",
  margin: "0 0 8px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const codesContainer = {
  marginTop: "12px",
  borderTop: "1px dashed #E2E8F0",
  paddingTop: "12px",
};

const codesTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#2C3245",
  margin: "12px 0 8px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const oldCodeBox = {
  backgroundColor: "#FEF2F2",
  padding: "8px 12px",
  margin: "8px 0",
  borderRadius: "6px",
  border: "1px solid #FECACA",
};

const oldCodeText = {
  fontSize: "14px",
  fontFamily: "monospace",
  color: "#DC2626",
  margin: "0",
  wordBreak: "break-all" as const,
  textDecoration: "line-through",
};

const newCodeBox = {
  backgroundColor: "#ECFDF5",
  padding: "8px 12px",
  margin: "8px 0",
  borderRadius: "6px",
  border: "1px solid #D1FAE5",
};

const newCodeText = {
  fontSize: "14px",
  fontFamily: "monospace",
  color: "#10B981",
  margin: "0",
  wordBreak: "break-all" as const,
  fontWeight: "600",
};

const nextStepsSection = {
  backgroundColor: "#F1F5F9",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const nextStepsTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#2C3245",
  margin: "0 0 12px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const nextStepsText = {
  fontSize: "14px",
  color: "#2C3245",
  margin: "0",
  lineHeight: "1.5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  whiteSpace: "pre-line" as const,
};

const footer = {
  fontSize: "14px",
  color: "#64748B",
  margin: "32px 0 0",
  textAlign: "center" as const,
  lineHeight: "24px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};
