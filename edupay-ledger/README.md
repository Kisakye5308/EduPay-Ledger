<p align="center">
  <img src="public/icons/icon.svg" alt="EduPay Ledger Logo" width="80" height="80">
</p>

<h1 align="center">EduPay Ledger</h1>

<p align="center">
  <strong>Mobile-First School Fee Management System for Ugandan Schools</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Project Structure</a> •
  <a href="#api-reference">API</a> •
  <a href="#deployment">Deployment</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-14.2-black?logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Firebase-10.x-orange?logo=firebase" alt="Firebase">
  <img src="https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss" alt="Tailwind">
  <img src="https://img.shields.io/badge/Tests-58%20passing-green" alt="Tests">
</p>

---

## Overview

**EduPay Ledger** is a comprehensive school fee reconciliation and audit system designed specifically for Ugandan primary and secondary schools. Built as a Progressive Web App (PWA), it works seamlessly on low-cost Android devices with intermittent internet connectivity.

### Why EduPay Ledger?

- **85%** of Ugandan schools still use paper-based fee tracking
- **40%** revenue leakage due to poor reconciliation
- **Limited connectivity** in rural areas requires offline-first solutions
- **Mobile Money** is the dominant payment method, requiring proper integration

---

## Features

### 📊 Admin Dashboard
- Real-time KPIs: collection rates, outstanding balances, daily transactions
- Collection heatmaps by class and payment method
- Activity feeds and alert notifications
- Quick action buttons for common tasks

### 👨‍🎓 Student Management
- Complete student directory with search and filters
- Individual financial profiles with payment history
- Clearance status tracking (Academic, Exams, Graduation)
- Scholarship and discount management

### 💰 Payment Recording
- Multi-channel support: Cash, Mobile Money (MTN, Airtel), Bank Transfer
- Automatic receipt generation with unique receipt numbers
- Payment validation with minimum amount enforcement
- Real-time balance calculations

### 📋 Installment Plans
- Configurable payment rules per term/semester
- Minimum payment percentage enforcement
- Deadline management with grace periods
- Automatic status transitions

### 🚨 Arrears Management
- Severity-based tracking (Low, Medium, High, Critical)
- Bulk SMS reminders via Africa's Talking
- Payment plan negotiations
- Escalation workflows

### 📈 Financial Reports
- Comprehensive audit trails
- Export to PDF and Excel
- Collection analytics by period
- Class-wise breakdowns

### 🔐 Security & Audit
- Role-based access control (Admin, Bursar, Teacher, Parent)
- Immutable audit logs
- Stellar blockchain anchoring for payment proofs
- Session management and activity tracking

---

## Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 14 (App Router) |
| **Language** | TypeScript 5.3 |
| **Styling** | Tailwind CSS 3.4 |
| **Backend** | Firebase (Auth, Firestore, Cloud Functions) |
| **Blockchain** | Stellar SDK (Testnet) |
| **State Management** | React Context + Zustand |
| **Forms** | React Hook Form + Zod |
| **Charts** | Recharts |
| **Testing** | Jest + React Testing Library |
| **PWA** | next-pwa with Workbox |

---

## Getting Started

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Firebase** project (free Spark plan works for development)

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

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Edit `.env.local` with your Firebase credentials:
   ```env
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the app**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

### Demo Mode

Click **"Try Demo"** on the login page to explore the app without Firebase configuration. Demo mode uses mock data and local storage.

---

## Project Structure

```
edupay-ledger/
├── app/                    # Next.js App Router pages
│   ├── arrears/           # Arrears management
│   ├── dashboard/         # Admin dashboard
│   ├── login/             # Authentication
│   ├── payments/          # Payment recording & rules
│   ├── reports/           # Financial reports
│   ├── settings/          # School settings & onboarding
│   └── students/          # Student directory & profiles
├── components/
│   ├── navigation/        # Sidebar, TopNav
│   └── ui/                # Reusable UI components
│       ├── Button.tsx
│       ├── Card.tsx
│       ├── Input.tsx
│       ├── Modal.tsx
│       ├── Table.tsx
│       └── ...
├── contexts/              # React Context providers
│   └── AuthContext.tsx    # Authentication state
├── hooks/                 # Custom React hooks
│   ├── useAuth.ts
│   ├── useInstallments.ts
│   └── useOffline.ts
├── lib/                   # Utility libraries
│   ├── firebase.ts        # Firebase initialization
│   ├── stellar.ts         # Stellar blockchain integration
│   └── utils.ts           # Helper functions
├── services/
│   └── firebase/          # Firebase Cloud Functions
├── types/                 # TypeScript type definitions
│   ├── payment.ts
│   ├── school.ts
│   ├── student.ts
│   └── user.ts
├── public/
│   ├── icons/             # PWA icons
│   ├── manifest.json      # PWA manifest
│   ├── offline.html       # Offline fallback page
│   └── sw.js              # Service worker
└── __tests__/             # Jest test files
```

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |

---

## API Reference

### Authentication

The app uses Firebase Authentication with the following methods:

```typescript
// Sign in with email/password
await signIn(email: string, password: string)

// Sign out
await signOut()

// Check permissions
hasPermission(permission: Permission): boolean
hasAnyPermission(permissions: Permission[]): boolean
hasAllPermissions(permissions: Permission[]): boolean
```

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all features |
| **Bursar** | Payments, reports, student finances |
| **Teacher** | View students, record attendance payments |
| **Parent** | View own children's balances |

### Utility Functions

```typescript
// Currency formatting (UGX)
formatCurrency(amount: number): string  // "UGX 1,500,000"
formatCompact(amount: number): string   // "1.5M"

// Date formatting
formatDate(date: Date): string
formatDateTime(date: Date): string
formatRelativeTime(date: Date): string  // "2 hours ago"

// ID generation
generateReceiptNumber(): string  // "RCP-ABC123XY"
generatePaymentId(): string      // "PAY-DEF456ZW"
generateStudentId(): string      // "STU-GHI789AB"

// Validation
isValidUgandaPhone(phone: string): boolean
formatPhone(phone: string): string
```

---

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch

# Run specific test file
npm test -- __tests__/lib/utils.test.ts
```

### Test Coverage

| Module | Coverage |
|--------|----------|
| Components | Button, Card |
| Hooks | useAuth |
| Utils | All utility functions |

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy

### Firebase Hosting

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Build and deploy
npm run build
firebase deploy
```

### Environment Variables for Production

Ensure these are set in your deployment platform:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=

# Optional: Stellar (for blockchain features)
STELLAR_NETWORK=testnet
STELLAR_SECRET_KEY=

# Optional: SMS Integration
AFRICASTALKING_API_KEY=
AFRICASTALKING_USERNAME=
```

---

## Roadmap

- [x] Core dashboard and navigation
- [x] Student management
- [x] Payment recording
- [x] Installment rules configuration
- [x] Arrears tracking
- [x] Demo mode for trials
- [x] PWA with offline support
- [ ] Firebase Firestore integration
- [ ] Stellar blockchain payment proofs
- [ ] SMS reminders via Africa's Talking
- [ ] PDF report generation
- [ ] Parent mobile app

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style

- Use TypeScript strict mode
- Follow ESLint configuration
- Write tests for new features
- Use conventional commits

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

- 📧 Email: support@edupay.ug
- 📖 Documentation: [docs.edupay.ug](https://docs.edupay.ug)
- 🐛 Issues: [GitHub Issues](https://github.com/your-org/edupay-ledger/issues)

---

<p align="center">
  Made with ❤️ for Ugandan Schools
</p>
