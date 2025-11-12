# 🎴 Burako Leaderboard

A modern, secure web application for tracking Burako (Canasta) card game scores, managing player groups, and viewing game history and leaderboards.

## ✨ Features

- 🎮 **Game Tracking** - Record games with detailed scoring for teams and players
- 👥 **Group Management** - Create and manage groups of 4 players
- 📊 **Leaderboards** - View player, pair, and game statistics
- 📜 **Game History** - Review past games with full audit trails
- ✏️ **Edit & Undo** - Modify scores or undo the last change
- 🔄 **Real-time Sync** - Firebase integration for multi-device access
- 📱 **PWA Support** - Install as a mobile app
- ♿ **Accessible** - WCAG compliant with keyboard navigation
- 🎨 **Modern UI** - Clean, responsive design with toast notifications

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase account (optional, for cloud sync)

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd burako

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your Firebase credentials

# Start development server
npm run dev
```

### Build for Production

```bash
# Build the app
npm run build

# Preview production build
npm run preview
```

## 🏗️ Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Custom CSS with modern features
- **State Management**: Zustand
- **Backend**: Firebase (Firestore + Auth)
- **Testing**: Vitest + Testing Library
- **PWA**: Vite PWA Plugin
- **Notifications**: React Hot Toast

## 📁 Project Structure

```
src/
├── components/        # Reusable UI components
│   ├── forms/        # Form components (GroupForm, PlayerSelector, etc.)
│   └── Skeleton.tsx  # Loading skeletons
├── features/         # Feature-specific code (future)
├── hooks/            # Custom React hooks
│   └── useToast.ts   # Toast notifications
├── lib/              # Utilities and helpers
│   ├── accessibility.ts
│   ├── constants.ts
│   ├── firebase.ts
│   ├── sanitize.ts
│   └── validation.ts
├── pages/            # Page components
│   ├── GroupsPage.tsx
│   ├── PlayersPage.tsx
│   ├── LeaderboardPage.tsx
│   ├── HistoryPage.tsx
│   └── AddGamePage.tsx
├── repositories/     # Data access layer
│   ├── firebaseScoreRepository.ts
│   ├── localScoreRepository.ts
│   └── repositoryFactory.ts
├── store/            # Zustand state management
│   └── useScoreStore.ts
├── types/            # TypeScript type definitions
│   └── index.ts
└── utils/            # Pure utility functions
    └── groupNameGenerator.ts
```

## 🔒 Security Features

- ✅ Firebase Security Rules enforcing authentication
- ✅ Input sanitization (DOMPurify) preventing XSS
- ✅ Environment variables for sensitive data
- ✅ No debug logs in production
- ✅ ARIA labels and accessibility features

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run specific test file
npm test -- groupNameGenerator.test.ts
```

## 📝 Development Guidelines

### Code Style

- Follow existing patterns in the codebase
- Use TypeScript for type safety
- Keep components small and focused
- Extract business logic to utilities
- Write tests for utilities and components

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "feat: your feature description"

# Push and create PR
git push origin feature/your-feature
```

## 🚢 Deployment

### Netlify

See [SECURITY_SETUP.md](./SECURITY_SETUP.md) for Firebase setup.

```bash
# Deploy to Netlify
netlify deploy --prod
```

### GitHub Pages

See [GITHUB_PAGES_SETUP.md](./GITHUB_PAGES_SETUP.md) for detailed instructions.

## 📄 License

MIT

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 🐛 Known Issues

None currently. Please report issues on GitHub.

---

Made with ❤️ for Burako players
