# AMSF001 Project Tracker

A comprehensive project management system built with React, Supabase, and Claude AI.

![Version](https://img.shields.io/badge/version-5.0-blue)
![React](https://img.shields.io/badge/React-18-61dafb)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ecf8e)
![Vercel](https://img.shields.io/badge/Vercel-Deployed-black)

## 🌐 Live Application

**Production:** https://amsf001-project-tracker.vercel.app

## ✨ Features

### Core Project Management
- **Milestones & Deliverables** - Track project progress with completion certificates
- **Resource Management** - Allocate team members and manage utilization
- **Time Tracking** - Submit and validate timesheets with approval workflows
- **Expense Management** - Track expenses with AI-powered receipt scanning
- **Partner Invoicing** - Generate invoices from timesheets and expenses

### AI-Powered Features
- **Project Assistant** - Natural language queries about project data
- **Smart Receipt Scanner** - AI extracts date, amount, category from receipts
- **Three-Tier Response System** - Instant, streaming, and tool-based responses

### Modern UI/UX
- **Apple Design System** - Clean, minimal interface with consistent styling
- **Click-to-Navigate** - Full row clickability across all list views
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Customizable Dashboard** - Drag-and-drop widget arrangement

## 🏗️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Styling | Custom Apple Design System (CSS) |
| Backend | Supabase (PostgreSQL + Auth + RLS) |
| AI | Anthropic Claude 4.5 (Sonnet + Haiku) |
| Hosting | Vercel |

## 📁 Project Structure

```
├── api/                    # Vercel serverless functions
│   ├── chat.js            # AI chat with database tools
│   ├── chat-stream.js     # Streaming responses
│   └── chat-context.js    # Context pre-fetching
├── src/
│   ├── components/        # Reusable UI components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom hooks
│   ├── lib/               # Utilities
│   ├── pages/             # Page components + CSS
│   └── services/          # Data service layer
├── sql/                   # Database migrations
└── docs/                  # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+
- Supabase project
- Anthropic API key (for AI features)

### Installation

```bash
# Clone the repository
git clone https://github.com/spac3man-G/amsf001-project-tracker.git
cd amsf001-project-tracker

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your keys

# Start development server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_anon_key
ANTHROPIC_API_KEY=your_anthropic_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Technical Reference](AMSF001-Technical-Reference.md) | Architecture, APIs, database |
| [User Guide](AMSF001-User-Guide.md) | End-user documentation |
| [AI Chat Spec](AI-CHAT-ASSISTANT-SPEC.md) | Chat assistant details |
| [Receipt Scanner Spec](SMART-RECEIPT-SCANNER-SPEC.md) | Receipt scanning |

## 🎨 Design System

The application uses a custom Apple-inspired design system:

- **Clean Headers** - Sticky with backdrop blur
- **No Dashboard Cards on List Pages** - Metrics only on Dashboard
- **Click-to-Navigate** - Full row clickability
- **Consistent Tables** - Clean borders, hover states
- **Color Palette** - Teal accent, Apple system colors

## 👥 Role-Based Access

| Role | Capabilities |
|------|--------------|
| Admin | Full system access |
| Supplier PM | Full access + validates timesheets/expenses |
| Customer PM | Reviews deliverables, validates timesheets |
| Contributor | Submits timesheets & expenses |
| Viewer | Read-only dashboard access |

## 🔧 Development

### Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

### Deployment

The app auto-deploys to Vercel on push to `main`:

```bash
git add -A
git commit -m "Your message"
git push origin main
```

## 📝 Recent Updates

### Version 5.0 (December 2025)
- Apple Design System across all pages
- Removed dashboard cards from list views
- Click-to-navigate pattern everywhere
- AI Chat performance improvements
- Three-tier response architecture

## 📄 License

Proprietary - All rights reserved.

---

*Built with ❤️ using React, Supabase, and Claude AI*
