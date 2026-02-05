# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Watch Accuracy Tracker - an Expo React Native application for tracking mechanical watch timekeeping accuracy by comparing watch time to NTP/device time.

## Technology Stack

- **Framework:** Expo SDK 54 with Expo Router
- **Language:** TypeScript
- **UI:** React Native 0.81 with React 19
- **Navigation:** React Navigation (bottom tabs, stack)
- **State Management:** Zustand
- **Database:** expo-sqlite
- **Time Sync:** react-native-ntp-client

## Common Commands

All commands should be run from the `watch-accuracy-tracker-app` directory:

```bash
# Start development server
npm start

# Start for specific platform
npm run android
npm run ios
npm run web  # Note: expo-sqlite has limited web support

# Lint the codebase
npm run lint
```

## Project Structure

```
watch-accuracy-tracker-app/
├── app/                    # Expo Router screens
│   ├── (tabs)/             # Tab navigation screens
│   │   ├── index.tsx       # Watch list (home)
│   │   └── settings.tsx    # App settings
│   └── watch/              # Watch-related screens
│       ├── new.tsx         # Add watch form
│       ├── [id].tsx        # Watch detail
│       └── [id]/
│           ├── edit.tsx    # Edit watch form
│           ├── measure.tsx # Time capture screen
│           └── history.tsx # Measurement history
├── components/
│   ├── ui/                 # Generic UI components (Button, Card, Input, Select)
│   ├── watch/              # Watch-specific components
│   └── measurement/        # Measurement-specific components
├── services/
│   ├── database/           # SQLite CRUD operations
│   ├── timeService.ts      # NTP time fetching
│   └── accuracyService.ts  # Accuracy calculations
├── store/                  # Zustand stores
├── types/                  # TypeScript types
├── constants/              # Theme colors and fonts
└── hooks/                  # Custom React hooks
```

## Architecture

### Data Flow
1. **Database (SQLite):** watches, baseline_periods, measurements tables
2. **Services:** Database CRUD, NTP time sync, accuracy calculation
3. **Stores (Zustand):** watchStore (watches, measurements), timeStore (reference time)
4. **Components:** Consume store state, dispatch actions

### Accuracy Calculation
- First measurement establishes baseline (offset = 0)
- Subsequent measurements record reference time at capture
- Drift calculated from time difference between measurements
- Uses linear regression for 3+ measurements
