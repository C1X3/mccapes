import { render } from "@react-email/render";
import nodemailer from "nodemailer";
// import { OrderPlacedTemplate } from "@/views/emails/order-placed";
import { OrderCompleteTemplate } from "@/views/emails/order-complete";
import { PaymentType } from "@generated";
// import { WalletDetails } from "@/server/providers/types";

// Configure the email transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.zeptomail.com",
  port: parseInt(process.env.SMTP_PORT || "465", 10),
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Base email sending function
async function sendEmail({
  from = "noreply@mccapes.net",
  to,
  subject,
  html,
}: {
  from?: string;
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const result = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });

    console.log(`Email sent successfully: ${result.messageId}`);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

// Specific email sending functions
// export async function sendOrderPlacedEmail({
//   customerName,
//   customerEmail,
//   orderId,
//   items,
//   totalPrice,
//   paymentFee,
//   totalWithFee,
//   paymentType,
//   paymentDetails,
// }: {
//   customerName: string;
//   customerEmail: string;
//   orderId: string;
//   items: Array<{
//     name: string;
//     price: number;
//     quantity: number;
//     image?: string;
//   }>;
//   totalPrice: number;
//   paymentFee: number;
//   totalWithFee: number;
//   paymentType: PaymentType;
//   paymentDetails: WalletDetails;
// }) {
//   const html = await render(
//     OrderPlacedTemplate({
//       customerName,
//       customerEmail,
//       orderId,
//       items,
//       totalPrice,
//       paymentFee,
//       totalWithFee,
//       paymentType,
//       paymentDetails,
//     })
//   );

//   return sendEmail({
//     to: customerEmail,
//     subject: `Order Confirmation: #${orderId.substring(0, 8)}`,
//     html,
//   });
// }

export async function sendOrderCompleteEmail({
  customerName,
  customerEmail,
  orderId,
  items,
  totalPrice,
  paymentFee,
  totalWithFee,
  paymentType,
  orderDate,
}: {
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
}) {
  const html = await render(
    OrderCompleteTemplate({
      customerName,
      customerEmail,
      orderId,
      items,
      totalPrice,
      paymentFee,
      totalWithFee,
      paymentType,
      orderDate,
    })
  );

  return sendEmail({
    to: customerEmail,
    subject: `Order Complete: Your purchase is ready!`,
    html,
  });
}