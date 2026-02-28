This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

## Google Sheets invoice sync

This project can sync `PAID` and `DELIVERED` invoices to a Google Sheet tab on an interval.

Required env vars:

```bash
GOOGLE_SHEETS_SYNC_ENABLED=true
GOOGLE_SHEETS_SYNC_INTERVAL_MS=3600000
GOOGLE_SHEETS_REQUEST_TIMEOUT_MS=15000
GOOGLE_SHEETS_SPREADSHEET_ID=1v3kO9_7eqceSmSZe26hj-gpK10AIps3pQ3k1dYwRXDM
GOOGLE_SHEETS_TAB_NAME=Transactions
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

Notes:

- `GOOGLE_SHEETS_SYNC_INTERVAL_MS` defaults to 1 hour when missing/invalid.
- `GOOGLE_SHEETS_REQUEST_TIMEOUT_MS` defaults to 15000ms and prevents hanging requests.
- The sync writes the newest invoices at the top by fully refreshing `Transactions!A1:K`.
- Column order matches the Transactions table: `Product, Codes, Date Sold, Payment Method, Amount, Discount, Fees, Buyer Email, Buyer Discord, Order ID, Notes`.
- Share the spreadsheet with the `GOOGLE_SERVICE_ACCOUNT_EMAIL` as an editor.

Run once manually:

```bash
pnpm sync:invoices:sheets
```
