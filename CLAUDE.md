# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Watch Accuracy Tracker - an Expo React Native application for tracking watch timekeeping accuracy.

## Technology Stack

- **Framework:** Expo SDK 54 with Expo Router
- **Language:** TypeScript
- **UI:** React Native 0.81 with React 19
- **Navigation:** React Navigation (bottom tabs)

## Common Commands

All commands should be run from the `watch-accuracy-tracker-app` directory:

```bash
# Start development server
npm start

# Start for specific platform
npm run android
npm run ios
npm run web

# Lint the codebase
npm run lint
```

## Project Structure

```
watch-accuracy-tracker-app/
├── app/           # Expo Router file-based routing
├── components/    # Reusable UI components
├── constants/     # App constants and theme
├── hooks/         # Custom React hooks
├── scripts/       # Utility scripts
└── assets/        # Images and fonts
```

