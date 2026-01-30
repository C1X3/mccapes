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
import { PaymentType } from "@generated/client";

interface OrderCompleteTemplateProps {
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

export const OrderCompleteTemplate = ({
  customerName,
  customerEmail,
  orderId,
  items,
  totalPrice,
  paymentFee,
  totalWithFee,
  paymentType,
  orderDate,
}: OrderCompleteTemplateProps) => {
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <Html>
      <Head />
      <Preview>Order Complete - Your payment has been confirmed!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={headerText}>MCCapes</Text>
            <Hr style={divider} />
          </Section>

          <Section>
            <Text style={heading}>Payment Confirmed! 🎉</Text>

            {/* Payment Confirmation Banner */}
            <Section style={confirmationBanner}>
              <Text style={confirmationBannerText}>
                Your payment for {formatPrice(totalWithFee)} via{" "}
                {paymentType.replace("_", " ")} has been successfully processed!
              </Text>
            </Section>

            <Section style={messageCard}>
              <div style={senderInfo}>
                <Text style={senderName}>{customerName}</Text>
                <Text style={senderEmail}>{customerEmail}</Text>
              </div>
              <Hr style={messageDivider} />
              <Text style={messageText}>
                Great news! Your payment has been confirmed and your order is
                now complete.
              </Text>

              {/* Order Details */}
              <Section style={orderDetailsSection}>
                <Text style={orderDetailTitle}>Order Details</Text>
                <div style={orderDetailRow}>
                  <Text style={orderDetailLabel}>Order ID</Text>
                  <Text style={orderDetailValue}>
                    <span style={orderDetailLabel}>: </span>#
                    {orderId.substring(0, 8)}
                  </Text>
                </div>
                <div style={orderDetailRow}>
                  <Text style={orderDetailLabel}>Order Date</Text>
                  <Text style={orderDetailValue}>
                    <span style={orderDetailLabel}>: </span>
                    {orderDate}
                  </Text>
                </div>
                <div style={orderDetailRow}>
                  <Text style={orderDetailLabel}>Payment Method</Text>
                  <Text style={orderDetailValue}>
                    <span style={orderDetailLabel}>: </span>
                    {paymentType.replace("_", " ")}
                  </Text>
                </div>
              </Section>

              {/* Order Items with Codes */}
              <Text style={sectionHeading}>Order Items</Text>
              {items.map((item, index) => (
                <Section key={index} style={itemSection}>
                  <div style={itemContainer}>
                    <div style={itemDetailsContainer}>
                      <Text style={itemName}>{item.name}</Text>
                      <table
                        style={{ width: "100%", borderCollapse: "collapse" }}
                      >
                        <tr>
                          <td style={{ ...itemPrice, width: "60%" }}>
                            {formatPrice(item.price)} × {item.quantity}
                          </td>
                          <td style={{ ...itemTotal, width: "40%" }}>
                            {formatPrice(item.price * item.quantity)}
                          </td>
                        </tr>
                      </table>
                    </div>
                  </div>

                  {/* Display Codes */}
                  {item.codes && item.codes.length > 0 && (
                    <div style={codesContainer}>
                      <Text style={codesTitle}>
                        Your {item.codes.length > 1 ? "Codes" : "Code"}:
                      </Text>
                      {item.codes.map((code, codeIndex) => (
                        <div key={codeIndex} style={codeBox}>
                          <Text style={codeText}>{code}</Text>
                        </div>
                      ))}
                    </div>
                  )}
                </Section>
              ))}

              {/* Order Summary */}
              <Section style={summarySection}>
                <div style={summaryRow}>
                  <Text style={summaryLabel}>Subtotal</Text>
                  <Text style={summaryValue}>
                    <span style={summaryLabel}>: </span>
                    {formatPrice(totalPrice)}
                  </Text>
                </div>
                {paymentFee > 0 && (
                  <div style={summaryRow}>
                    <Text style={summaryLabel}>Payment Fee</Text>
                    <Text style={summaryValue}>
                      <span style={summaryLabel}>: </span>
                      {formatPrice(paymentFee)}
                    </Text>
                  </div>
                )}
                <div style={totalRow}>
                  <Text style={totalLabel}>Total Paid</Text>
                  <Text style={totalValue}>
                    <span style={totalLabel}>: </span>
                    {formatPrice(totalWithFee)}
                  </Text>
                </div>
              </Section>
            </Section>

            <Section style={nextStepsSection}>
              <Text style={nextStepsTitle}>What&apos;s Next?</Text>
              <Text style={nextStepsText}>
                Please save your codes in a secure location. If you need any
                assistance with your purchase, contact our support team with
                your order ID for reference.
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
  backgroundColor: "#ECFDF5",
  padding: "16px",
  borderRadius: "8px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const confirmationBannerText = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#10B981",
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

const itemPrice = {
  fontSize: "14px",
  color: "#64748B",
  margin: "0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const itemTotal = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#2C3245",
  margin: "0",
  textAlign: "right" as const,
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
  margin: "0 0 8px",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const codeBox = {
  backgroundColor: "#ECFDF5",
  padding: "8px 12px",
  margin: "8px 0",
  borderRadius: "6px",
  border: "1px solid #D1FAE5",
};

const codeText = {
  fontSize: "14px",
  fontFamily: "monospace",
  color: "#10B981",
  margin: "0",
  wordBreak: "break-all" as const,
};

const summarySection = {
  marginTop: "20px",
  backgroundColor: "#F8FAFC",
  borderRadius: "8px",
  padding: "16px",
};

const summaryRow = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "8px",
};

const summaryLabel = {
  fontSize: "14px",
  color: "#64748B",
  margin: "0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const summaryValue = {
  fontSize: "14px",
  color: "#2C3245",
  margin: "0",
  textAlign: "right" as const,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const totalRow = {
  display: "flex",
  justifyContent: "space-between",
  marginTop: "8px",
  paddingTop: "8px",
  borderTop: "1px solid #E2E8F0",
};

const totalLabel = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#2C3245",
  margin: "0",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const totalValue = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#10B981",
  margin: "0",
  textAlign: "right" as const,
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
