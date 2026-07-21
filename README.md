# 🚀 Boostly

### Earn Rewards. Play Games. Grow Together.

<div align="center">

**Modern Reward & Earning Platform**

Watch videos • Play games • Complete surveys • Refer friends • Earn real rewards

Built with Next.js 14, Drizzle ORM, Turso, and TypeScript.

</div>

---

## 📖 Overview

Boostly is a modern rewards platform that empowers users to earn real money by completing engaging activities. Whether watching videos, playing games, completing surveys, or referring friends, Boostly makes earning rewards simple, fun, and accessible.

The platform combines gamification with real-world value, creating an ecosystem where users are rewarded for their time and engagement.

---

## ✨ Features

### 🎮 Earn Activities

**📺 Watch Videos**

- Watch short educational and entertaining videos
- Earn rewards for each video watched
- Track watch progress and completion
- Various categories: Business, Finance, Tech, Education, Entertainment, Lifestyle

**🎮 Play Games**

- Play fun and engaging games
- Earn rewards based on performance
- Daily play limits
- Various game categories: Puzzle, Action, Casual, Strategy, Quiz, Racing

**📋 Complete Surveys**

- Participate in sponsored surveys
- Earn rewards for your opinions
- Brand-sponsored opportunities
- Question-based responses
- Progress tracking

**📢 Watch Ads**

- Watch short sponsored advertisements
- Earn rewards for ad completion
- Daily ad limits

**🎁 Daily Bonus**

- Claim daily check-in rewards
- Build and maintain streaks
- Bonus multipliers for consistent engagement

**👥 Refer Friends**

- Invite friends using unique referral codes
- Earn rewards for each successful referral
- Referral milestones and bonuses

### 👛 Wallet & Payments

**💰 Wallet Management**

- Real-time balance tracking
- Transaction history
- Earnings breakdown by activity
- Crypto wallet support

**💸 Withdrawals**

- Multiple withdrawal methods:
  - Mobile Money
  - Bank Transfer
  - Crypto (BTC, ETH, USDT, etc.)
- Secure processing
- Withdrawal history

**📊 Earnings Statistics**

- Daily, weekly, monthly earnings
- Activity breakdown charts
- Performance analytics
- Earnings goals tracking

### 🏅 Gamification & Rewards

**🥇 Badges**

- Silver Badge (+15% earnings boost)
- Gold Badge (+30% earnings boost)
- Platinum Badge (+30% + VIP support)
- One-time purchase, lifetime access

**📋 Subscription Plans**

- Starter Plan
- Silver Plan
- Gold Plan
- Platinum Plan
- Daily earnings multipliers
- Priority withdrawals
- VIP support

**🔥 Streak System**

- Daily check-in rewards
- Streak milestones
- Bonus rewards for consistent engagement

### 👥 Social & Community

**📊 Leaderboard**

- Weekly and monthly rankings
- Top earners recognition
- Community engagement

**🔗 Referral System**

- Unique referral codes
- Referral rewards
- Milestone bonuses
- Friend tracking

---

## 🏗️ Architecture

Boostly follows a modern, modular architecture designed for scalability and maintainability.

```
┌─────────────────────────────────────────────────────────────┐
│                            Users                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Application                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │   Frontend  │  │    API      │  │   Authentication     │  │
│  │   (React)   │  │  Routes     │  │   (JWT/2FA)           │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Modules Layer                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │ Content  │ │ Rewards  │ │  Wallet  │ │   Referrals  │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────┐    │
│  │  Badges  │ │   Auth   │ │   Admin  │ │     Users    │    │
│  └──────────┘ └──────────┘ └──────────┘ └──────────────┘    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Services Layer                          │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Repository │ Service │ Validation │ Permissions        │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                        Drizzle ORM                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Turso Database                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Technology Stack

| Category       | Technology      | Purpose                       |
| -------------- | --------------- | ----------------------------- |
| Framework      | Next.js 14      | Full-stack React framework    |
| Language       | TypeScript      | Type-safe JavaScript          |
| Database       | Turso (SQLite)  | Edge-native database          |
| ORM            | Drizzle ORM     | Type-safe database operations |
| Storage        | Cloudflare R2   | File storage (CDN)            |
| Styling        | Tailwind CSS    | Utility-first CSS             |
| UI Components  | ShadCN UI       | Accessible component library  |
| Validation     | Zod             | Schema validation             |
| Authentication | JWT + 2FA       | Secure authentication         |
| Forms          | React Hook Form | Form management               |
| State          | Zustand         | Client state management       |
| Deployment     | VPS / Cloud     | Production hosting            |

---

## 📁 Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Authentication pages
│   │   ├── login/
│   │   ├── register/
│   │   ├── 2fa/
│   │   └── verify/
│   ├── (dashboard)/              # Main application
│   │   ├── dashboard/            # Home dashboard
│   │   ├── earn/                 # Earning activities
│   │   │   ├── videos/           # Watch videos
│   │   │   ├── games/            # Play games
│   │   │   └── surveys/          # Complete surveys
│   │   ├── wallet/               # Wallet management
│   │   │   ├── withdraw/         # Withdraw funds
│   │   │   └── history/          # Transaction history
│   │   ├── referrals/            # Referral program
│   │   ├── badges/               # Badges & subscriptions
│   │   └── settings/             # User settings
│   ├── admin/                    # Admin dashboard
│   │   └── dashboard/
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication
│   │   ├── content/               # Videos, games, surveys
│   │   ├── rewards/               # Reward management
│   │   ├── wallet/                 # Wallet operations
│   │   ├── referrals/              # Referral management
│   │   ├── badges/                 # Badge operations
│   │   ├── subscriptions/          # Subscription management
│   │   ├── crypto/                 # Crypto support
│   │   └── admin/                  # Admin operations
│   ├── layout.tsx                # Root layout
│   └── providers.tsx             # Context providers
│
├── components/                   # Reusable components
│   ├── dashboard/                # Dashboard components
│   ├── earn/                     # Earning components
│   ├── wallet/                   # Wallet components
│   ├── ui/                       # Base UI components
│   └── shared/                   # Shared components
│
├── modules/                      # Business logic modules
│   ├── content/                  # Video, game, survey logic
│   │   ├── repository.ts
│   │   ├── service.ts
│   │   ├── validation.ts
│   │   └── permissions.ts
│   ├── rewards/                  # Reward logic
│   ├── wallet/                   # Wallet logic
│   ├── referrals/                # Referral logic
│   ├── badges/                   # Badge logic
│   ├── auth/                     # Authentication logic
│   └── rbac/                     # Role-based access control
│
├── lib/                          # Core libraries
│   ├── db/                       # Database
│   │   ├── schema/               # Drizzle schemas
│   │   └── seeds/                # Seed data
│   ├── auth/                     # Authentication
│   ├── audit/                    # Audit logging
│   ├── mail/                     # Email services
│   ├── jwt/                      # JWT utilities
│   └── utils/                    # Utility functions
│
├── hooks/                        # Custom React hooks
├── contexts/                     # React contexts
├── types/                        # Type definitions
└── middleware.ts                 # Next.js middleware
```

### Module Structure

```
module/
├── permissions.ts    # Permission definitions
├── repository.ts     # Database operations
├── service.ts        # Business logic
└── validation.ts     # Zod validation schemas
```

---

## 🗄️ Core Modules

**🎯 Content Module**

- Videos: Manage and track video content
- Games: Game management and play tracking
- Surveys: Survey creation and response management

**🏆 Rewards Module**

- Reward creation and management
- Claim tracking
- Earning statistics
- Daily bonus system
- Ad watch tracking

**👛 Wallet Module**

- Balance management
- Transaction history
- Withdrawal processing (Fiat & Crypto)
- Payment methods
- Crypto wallet support

**👥 Referrals Module**

- Referral code generation
- Referral tracking
- Reward distribution
- Milestone management

**🏅 Badges Module**

- Badge tiers (Silver, Gold, Platinum)
- Badge purchasing
- Active badge management
- Earnings boost application

**📋 Subscriptions Module**

- Subscription plans
- Plan management
- Subscription lifecycle
- Benefits application

**🔐 Auth Module**

- User registration & login
- Email verification
- 2FA (TOTP & Email)
- Password reset
- Session management
- Sudo mode

**👑 Admin Module**

- User management
- Content management
- Withdrawal approvals
- Analytics
- System settings

**🪙 Crypto Module**

- Crypto currency support
- Crypto wallets
- Deposits & withdrawals
- Exchange rates

---

## 🔒 Security Features

**🔐 Authentication**

- JWT-based authentication
- Two-factor authentication (TOTP & Email)
- Email verification
- Password reset flow
- Session management
- Sudo mode for sensitive actions

**🛡️ Authorization**

- Role-based access control (RBAC)
- Permission-based authorization
- Route protection
- API endpoint protection

**📝 Audit Logging**

- Complete audit trail
- User activity tracking
- System event logging
- Export capabilities

**🔐 Data Protection**

- Password hashing (bcrypt)
- Secure cookie handling
- CSRF protection
- Input validation (Zod)
- SQL injection protection (Drizzle)

---

## 👥 Roles & Permissions

**🛡️ SUPER_ADMIN**

- Full system control
- User management
- Role & permission management
- Audit log access
- System configuration

**🎯 ADMIN**

- Content management (videos, games, surveys)
- User moderation
- Withdrawal approvals
- Analytics access
- Badge & subscription management

**👤 USER**

- View and earn rewards
- Watch videos, play games, complete surveys
- Manage wallet and withdrawals
- Refer friends
- Purchase badges and subscriptions
- Personal profile management

---

## 💰 Crypto Support

### Supported Currencies

- Bitcoin (BTC)
- Ethereum (ETH)
- Tether (USDT)
- USD Coin (USDC)
- Solana (SOL)
- XRP
- Cardano (ADA)
- Polkadot (DOT)
- Avalanche (AVAX)
- Polygon (MATIC)

### Features

- Crypto wallet creation
- Deposit tracking
- Withdrawal processing
- Real-time exchange rates
- Multiple network support

---

## 🛠️ Getting Started

### Prerequisites

```
Node.js 18+
npm or yarn
Turso account (or local SQLite)
Cloudflare R2 account (optional)
```

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/boostly.git
cd boostly

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.development

# Set up database
npm run db:push:dev

# Seed database
npm run seed:dev

# Start development server
npm run dev
```

### Environment Variables

```env
# Database
DATABASE_URL=libsql://your-database.turso.io
DB_AUTH_TOKEN=your-turso-token

# JWT
JWT_SECRET=your-jwt-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Next.js
NEXT_PUBLIC_APP_URL=http://localhost:3000

# R2 Storage (Optional)
R2_ACCOUNT_ID=your-account-id
R2_ACCESS_KEY_ID=your-access-key
R2_SECRET_ACCESS_KEY=your-secret-key
R2_BUCKET_NAME=your-bucket
R2_CDN_DOMAIN=cdn.yourdomain.com

# Super Admin
SUPER_ADMIN_EMAIL=admin@boostly.buzz
SUPER_ADMIN_PASSWORD=your-secure-password
```

### Database Commands

```bash
# Generate migrations
npm run db:generate:dev

# Push migrations
npm run db:push:dev

# Seed database
npm run seed:dev

# Reset database
npm run reset:dev

# Open Drizzle Studio
npm run db:studio:dev
```

---

## 🚀 Deployment

### Build for Production

```bash
npm run build
npm run start
```

### Docker Deployment

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package*.json ./
RUN npm ci --production
EXPOSE 3000
CMD ["npm", "start"]
```

---

## 📊 Monitoring & Analytics

### Built-in Analytics

- User activity tracking
- Earning statistics
- Conversion rates
- User retention
- Revenue analytics

### Admin Dashboard

- User management
- Content management
- Withdrawal approvals
- System health
- Audit logs

---

## 🎯 Roadmap

### ✅ Version 1 (Current)

- ✅ User authentication & 2FA
- ✅ Video watching & rewards
- ✅ Game playing & rewards
- ✅ Survey completion & rewards
- ✅ Ad watching & rewards
- ✅ Daily bonus & streaks
- ✅ Wallet management
- ✅ Withdrawals (Fiat & Crypto)
- ✅ Referral program
- ✅ Badges & subscriptions
- ✅ Admin dashboard
- ✅ RBAC system
- ✅ Audit logging
- ✅ Email notifications

### 🚧 Version 2 (In Progress)

- 🔄 Mobile app (React Native)
- 🔄 Push notifications
- 🔄 Advanced analytics
- 🔄 A/B testing
- 🔄 Gamification enhancements
- 🔄 Social features
- 🔄 API v1 public

### 📅 Version 3 (Planned)

- ⏳ Multi-language support
- ⏳ Advanced fraud detection
- ⏳ Automated content moderation
- ⏳ Advanced referral analytics
- ⏳ Affiliate program
- ⏳ API v2 with rate limiting

### 🌟 Version 4 (Future)

- 💡 AI-powered recommendations
- 💡 Blockchain integration
- 💡 Decentralized rewards
- 💡 NFT badges
- 💡 DAO governance

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Write tests for new features
- Update documentation
- Follow the existing code style
- Use conventional commit messages

---

## 📄 License

Copyright © 2025 Boostly.

All Rights Reserved.

Boostly is proprietary software developed and maintained by the Boostly team. Unauthorized copying, distribution, or use of this software is strictly prohibited.

---

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org) - React framework
- [Drizzle ORM](https://orm.drizzle.team) - Type-safe ORM
- [Turso](https://turso.tech) - Edge database
- [Tailwind CSS](https://tailwindcss.com) - CSS framework
- [ShadCN UI](https://ui.shadcn.com) - Component library
- [Lucide](https://lucide.dev) - Icon library

---

## 📞 Support

For support, email **support@boostly.buzz** or visit our Help Center.

## 🔗 Links

- Website
- Documentation
- API Reference
- Status Page

---

<div align="center">

**Built with ❤️ by the Boostly Team**

_Earn. Play. Grow._

</div>
