# EduPay Ledger Uganda

A **mobile-first school fee reconciliation and audit system** for Ugandan primary and secondary schools. Built with Next.js 14, Firebase, and Stellar blockchain for immutable audit trails.

![EduPay Ledger](./public/screenshots/dashboard.png)

## Features

### Core Functionality
- 📊 **Admin Dashboard** - Real-time KPIs, collection heatmaps, and activity feeds
- 👨‍🎓 **Student Management** - Directory with financial profiles and payment history
- 💰 **Payment Recording** - Multi-channel support (Cash, Mobile Money, Bank Transfer)
- 📋 **Installment Plans** - Configurable rules with minimum payment enforcement
- 🚨 **Arrears Management** - Severity-based tracking with bulk SMS reminders
- 📈 **Financial Reports** - Comprehensive audit trails and export options

### Technical Features
- 📱 **Mobile-First PWA** - Optimized for Android phones common in Uganda
- 🔄 **Offline Support** - Full functionality without internet, auto-sync when online
- 🔐 **Blockchain Audit** - Stellar network anchoring for immutable payment proofs
- 🔥 **Firebase Backend** - Auth, Firestore with offline persistence, Cloud Functions
- 📲 **SMS Integration** - Payment receipts and arrears reminders

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Backend**: Firebase (Auth, Firestore, Cloud Functions)
- **Blockchain**: Stellar SDK (Testnet for development)
- **State**: Zustand, React Query
- **Forms**: React Hook Form + Zod validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Firebase project (free tier works)
- Stellar testnet account (optional for development)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/edupay-ledger.git
   cd edupay-ledger
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Fill in your Firebase and Stellar credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   
   NEXT_PUBLIC_STELLAR_NETWORK=TESTNET
   STELLAR_ISSUER_SECRET=your_stellar_secret_key
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open [http://localhost:3000](http://localhost:3000)**

### Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** (Email/Password and Phone)
3. Create a **Firestore** database
4. Copy your config to `.env.local`
5. Deploy Firestore rules:
   ```bash
   firebase deploy --only firestore:rules
   ```

### Stellar Setup (Optional)

The Stellar integration is for **audit proofs only** - no actual money movement. For development:

1. Create a testnet account at [laboratory.stellar.org](https://laboratory.stellar.org)
2. Fund it with testnet XLM (free)
3. Add the secret key to `.env.local`

## Project Structure

```
edupay-ledger/
├── app/                    # Next.js App Router pages
│   ├── dashboard/         # Main admin dashboard
│   ├── students/          # Student directory & profiles
│   ├── payments/          # Payment recording & rules
│   ├── reports/           # Financial reports & audit
│   ├── arrears/           # Debt management
│   └── settings/          # School configuration
├── components/
│   ├── ui/               # Reusable UI components
│   └── navigation/       # Sidebar, TopNav, MobileNav
├── lib/
│   ├── firebase.ts       # Firebase configuration
│   ├── stellar.ts        # Stellar blockchain integration
│   └── utils.ts          # Utility functions
├── hooks/                 # Custom React hooks
├── types/                 # TypeScript interfaces
└── public/               # Static assets, PWA manifest
```

## Key Design Decisions

### Installment Rules
The system enforces a **minimum 30% first payment** rule by default. Schools can configure:
- Minimum first payment percentage (25-75%)
- Maximum number of installments (2-4)
- Per-class/stream rules

### Stellar Integration
Payments are **hashed and anchored** to Stellar, not transferred:
```typescript
// Creates SHA-256 hash of payment data
const hash = createPaymentHash(payment);
// Anchors hash as memo in self-transaction
await anchorToStellar(hash);
```

This provides:
- Immutable audit trail
- Cryptographic proof of payment
- No regulatory issues (no money movement)

### Offline Support
- Firestore offline persistence enabled
- Service worker caches critical assets
- Payment queue syncs when online
- Visual indicators for offline status

## API Reference

### Firestore Collections

| Collection | Description |
|------------|-------------|
| `schools` | School profiles and settings |
| `schools/{id}/students` | Student records |
| `schools/{id}/payments` | Payment transactions |
| `schools/{id}/installmentRules` | Payment plan configurations |
| `users` | Admin user profiles |

### Cloud Functions

| Function | Trigger | Purpose |
|----------|---------|---------|
| `onPaymentCreated` | Firestore | Validate installment rules, update balances |
| `anchorToStellar` | HTTPS | Anchor payment hash to blockchain |
| `sendSmsReceipt` | Firestore | Send payment confirmation SMS |

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Firebase Hosting

```bash
npm run build
firebase deploy --only hosting
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@edupay.ug or join our Slack channel.

---

**Built with ❤️ for Ugandan Schools**

*EduPay Ledger - Transparent, Secure, Offline-Ready*
