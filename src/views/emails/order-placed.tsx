import {
  Body,
  Column,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Preview,
  Row,
  Section,
  Text,
} from "@react-email/components";
import { PaymentType } from "@generated";

interface OrderPlacedTemplateProps {
  customerName: string;
  customerEmail: string;
  orderId: string;
  items: Array<{
    name: string;
    price: number;
    quantity: number;
    image?: string;
  }>;
  totalPrice: number;
  paymentFee: number;
  totalWithFee: number;
  paymentType: PaymentType;
  paymentDetails?: {
    address?: string;
    note?: string;
    cryptoType?: string;
    url?: string;
  };
}

export const OrderPlacedTemplate = ({
  customerName,
  customerEmail,
  orderId,
  items,
  totalPrice,
  paymentFee,
  totalWithFee,
  paymentType,
  paymentDetails,
}: OrderPlacedTemplateProps) => {
  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  return (
    <Html>
      <Head />
      <Preview>Order Confirmation - Your purchase has been received!</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Logo Header */}
          <Section style={logoContainer}>
            <Img
              src="https://mccapes.net/logo.png"
              width="120"
              height="40"
              alt="MCCapes"
              style={logo}
            />
          </Section>

          <Section style={header}>
            <Hr style={divider} />
          </Section>

          <Section>
            <Text style={heading}>Purchase Successful! 🛒</Text>

            <Section style={messageCard}>
              <div style={senderInfo}>
                <Text style={senderName}>{customerName}</Text>
                <Text style={senderEmail}>{customerEmail}</Text>
              </div>
              <Hr style={messageDivider} />
              <Text style={messageText}>
                Thank you for your purchase! Your order has been received and is being processed.
              </Text>

              {/* Order Details */}
              <Section style={orderDetailsSection}>
                <Text style={orderDetailTitle}>Order Details</Text>
                <div style={orderDetailRow}>
                  <Text style={orderDetailLabel}>Order ID:</Text>
                  <Text style={orderDetailValue}>#{orderId.substring(0, 8)}</Text>
                </div>
                <div style={orderDetailRow}>
                  <Text style={orderDetailLabel}>Order Date:</Text>
                  <Text style={orderDetailValue}>{new Date().toLocaleDateString()}</Text>
                </div>
                <div style={orderDetailRow}>
                  <Text style={orderDetailLabel}>Payment Method:</Text>
                  <Text style={orderDetailValue}>{paymentType.replace('_', ' ')}</Text>
                </div>
              </Section>

              {/* Order Items */}
              <Text style={sectionHeading}>Order Items</Text>

              {items.map((item, index) => (
                <Section key={index} style={itemSection}>
                  <Row>
                    {/* Item Image */}
                    <Column style={itemImageColumn}>
                      <Img
                        src={item.image || "https://mccapes.net/placeholder.png"}
                        width="64"
                        height="64"
                        alt={item.name}
                        style={itemImage}
                      />
                    </Column>

                    {/* Item Details */}
                    <Column style={itemDetailsColumn}>
                      <Text style={itemName}>{item.name}</Text>
                      <div style={itemPriceContainer}>
                        <div style={itemPriceRow}>
                          <Text style={itemPrice}>{formatPrice(item.price)} × {item.quantity}</Text>
                          <Text style={itemTotal}>{formatPrice(item.price * item.quantity)}</Text>
                        </div>
                      </div>
                    </Column>
                  </Row>
                </Section>
              ))}

              {/* Order Summary */}
              <Section style={summarySection}>
                <div style={summaryRow}>
                  <Text style={summaryLabel}>Subtotal:</Text>
                  <Text style={summaryValue}>{formatPrice(totalPrice)}</Text>
                </div>
                {paymentFee > 0 && (
                  <div style={summaryRow}>
                    <Text style={summaryLabel}>Payment Fee:</Text>
                    <Text style={summaryValue}>{formatPrice(paymentFee)}</Text>
                  </div>
                )}
                <div style={totalRow}>
                  <Text style={totalLabel}>Total:</Text>
                  <Text style={totalValue}>{formatPrice(totalWithFee)}</Text>
                </div>
              </Section>
            </Section>

            {/* Payment Instructions */}
            <Section style={paymentInstructionsSection}>
              <Text style={paymentTypeHeading}>
                Payment Method: {paymentType.replace('_', ' ')}
              </Text>

              {paymentType === PaymentType.PAYPAL && (
                <>
                  {paymentDetails?.url && (
                    <div style={qrCodeContainer}>
                      <Img
                        src="https://mccapes.net/paypalqrcode.png"
                        width="150"
                        height="150"
                        alt="PayPal QR Code"
                        style={qrCode}
                      />
                    </div>
                  )}
                  <Text style={paymentInstructionText}>
                    Please complete your payment by sending {formatPrice(totalWithFee)} via PayPal using the &quot;Friends and Family&quot; option to:
                  </Text>
                  <Text style={paymentAddressText}>
                    {paymentDetails?.address || "payment@example.com"}
                  </Text>
                  {paymentDetails?.note && (
                    <>
                      <Text style={paymentInstructionText}>
                        Important: Include this exact note with your payment:
                      </Text>
                      <Text style={paymentNoteText}>
                        {paymentDetails.note}
                      </Text>
                    </>
                  )}
                  <Text style={paymentWarningText}>
                    Your order will NOT be processed if payment is not sent using the &quot;Friends and Family&quot; option.
                  </Text>
                </>
              )}

              {paymentType === PaymentType.CRYPTO && (
                <>
                  {paymentDetails?.address && (
                    <div style={qrCodeContainer}>
                      <Img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(paymentDetails.address)}`}
                        width="150"
                        height="150"
                        alt="Crypto QR Code"
                        style={qrCode}
                      />
                    </div>
                  )}
                  <Text style={paymentInstructionText}>
                    Please complete your payment by sending {formatPrice(totalWithFee)} worth of {paymentDetails?.cryptoType || "cryptocurrency"} to:
                  </Text>
                  <Text style={paymentAddressText}>
                    {paymentDetails?.address || "crypto_address_here"}
                  </Text>
                  <Text style={paymentInstructionText}>
                    Once your payment is confirmed, your order will be processed.
                  </Text>
                </>
              )}
            </Section>

            <Hr style={divider} />
            <Text style={footer}>
              Thank you for your purchase!
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
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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

const logoContainer = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const logo = {
  margin: "0 auto",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "24px",
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
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const messageCard = {
  backgroundColor: "#F1F5F9",
  borderRadius: "12px",
  padding: "24px",
  margin: "32px 0",
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
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const senderEmail = {
  fontSize: "14px",
  color: "#64748B",
  margin: "0",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const messageDivider = {
  borderColor: "#E2E8F0",
  margin: "16px 0",
};

const messageText = {
  fontSize: "16px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const orderDetailValue = {
  fontSize: "14px",
  color: "#2C3245",
  fontWeight: "500",
  margin: "0",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const sectionHeading = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#2C3245",
  margin: "24px 0 12px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const itemSection = {
  backgroundColor: "#FFFFFF",
  borderRadius: "8px",
  padding: "12px",
  marginBottom: "10px",
  border: "1px solid #E2E8F0",
};

const itemImageColumn = {
  width: "80px",
  verticalAlign: "top",
};

const itemImage = {
  borderRadius: "8px",
  objectFit: "cover" as const,
  border: "1px solid #E2E8F0",
  backgroundColor: "#F8FAFC",
};

const itemDetailsColumn = {
  verticalAlign: "top",
  paddingLeft: "12px",
};

const itemName = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#10B981",
  margin: "0 0 8px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const itemPriceContainer = {
  display: "flex",
  flexDirection: "column" as const,
};

const itemPriceRow = {
  display: "flex",
  justifyContent: "space-between",
  width: "100%",
};

const itemPrice = {
  fontSize: "14px",
  color: "#64748B",
  margin: "0",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const itemTotal = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#2C3245",
  margin: "0",
  textAlign: "right" as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const summaryValue = {
  fontSize: "14px",
  color: "#2C3245",
  margin: "0",
  textAlign: "right" as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const totalValue = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#5897FB",
  margin: "0",
  textAlign: "right" as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const paymentInstructionsSection = {
  backgroundColor: "#F1F5F9",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
};

const qrCodeContainer = {
  textAlign: "center" as const,
  marginBottom: "16px",
};

const qrCode = {
  borderRadius: "8px",
  border: "1px solid #E2E8F0",
  padding: "8px",
  backgroundColor: "#FFFFFF",
};

const paymentTypeHeading = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#2C3245",
  margin: "0 0 16px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const paymentInstructionText = {
  fontSize: "14px",
  color: "#2C3245",
  margin: "12px 0",
  lineHeight: "1.5",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const paymentAddressText = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#5897FB",
  margin: "12px 0",
  backgroundColor: "#EFF6FF",
  padding: "12px",
  borderRadius: "6px",
  wordBreak: "break-all" as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const paymentNoteText = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#10B981",
  margin: "12px 0",
  backgroundColor: "#ECFDF5",
  padding: "12px",
  borderRadius: "6px",
  wordBreak: "break-all" as const,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const paymentWarningText = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#EF4444",
  margin: "16px 0 0",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const footer = {
  fontSize: "14px",
  color: "#64748B",
  margin: "32px 0 0",
  textAlign: "center" as const,
  lineHeight: "24px",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};