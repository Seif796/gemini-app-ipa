# 📱 Aether AI: Personal AI Productivity Companion for iPhone

A high-performance iOS application powered by **Google Gemini AI**, designed for 24/7 online access, smart note management, AI task decomposition, and native `.ipa` iOS distribution.

---

## 🌟 Features

- **🤖 Google Gemini AI Integration**:
  - Conversational AI helper (`gemini-2.0-flash`, `gemini-1.5-flash`, `gemini-1.5-pro`).
  - System instructions tailored for daily planning, problem-solving, and executive productivity.
  - Multi-tier API key handling: server default key with optional user override in Settings.
- **🔐 User Authentication (24/7 Ready)**:
  - Secure Email & Password Sign Up and Sign In.
  - Salted bcrypt password hashing & 30-day JWT persistent session tokens.
- **📝 Smart Notes with AI**:
  - Instant executive summaries (⚡ Summarize).
  - Clean bullet-point structuring (📌 Bullet Points).
  - 1-tap action extraction that converts notes into actionable to-do items (🎯 Extract Tasks).
  - Professional tone polishing (✨ Polish Tone).
- **✅ AI Task Assistant**:
  - Priority levels (High, Medium, Low) & real-time completion progress tracking.
  - **AI Magic Breakdown**: Gemini analyzes any task and splits it into 3–6 actionable checklist steps with estimated time & pro tips.
- **📱 True iOS Native Experience & Distribution**:
  - Apple Human Interface Guidelines (glassmorphism, SF Pro typography, notch & safe area insets).
  - **Instant 1-Tap Safari Install (PWA)**: Fullscreen app without needing the App Store.
  - **Automated .IPA Build Workflow**: GitHub Actions pipeline compiles `Aether-AI.ipa` on macOS cloud runners ready for AltStore, SideStore, Scarlet, or Sideloadly.

---

## 📁 Project Structure

```
App IPA/
├── .github/
│   └── workflows/
│       └── build-ipa.yml          # GitHub Actions workflow to build & export .ipa on macOS
├── client/                        # iOS Frontend Application
│   ├── ios/                       # Native Xcode iOS Project (Capacitor)
│   │   └── App/
│   │       ├── App.xcworkspace    # Xcode Workspace
│   │       └── App.xcodeproj      # Xcode Project
│   ├── public/
│   │   ├── manifest.json          # PWA Web App Manifest
│   │   └── logo.svg               # App Icon
│   ├── src/
│   │   ├── components/
│   │   │   ├── AuthModal.jsx      # iOS Sign Up & Login Dialog
│   │   │   ├── ChatTab.jsx        # Gemini AI Chat Companion
│   │   │   ├── NotesTab.jsx       # Smart Notes with AI Tools
│   │   │   ├── TasksTab.jsx       # Tasks with Gemini Breakdown
│   │   │   ├── SettingsTab.jsx    # API Key, 24/7 Server & Install Guide
│   │   │   └── TabBar.jsx         # iOS Bottom Navigation Bar
│   │   ├── api.js                 # API Client & Storage
│   │   ├── App.jsx                # Root Component
│   │   └── index.css              # iOS Native HIG Styling
│   └── capacitor.config.json      # iOS Bundle Configuration
├── server/                        # 24/7 Backend API Server
│   ├── index.js                   # Express Server & API Routes
│   ├── geminiService.js           # Gemini API Client & Fallbacks
│   ├── db.js                      # Portable JSON Database
│   ├── test-backend.js            # Automated verification test
│   ├── Dockerfile                 # Cloud container deployment
│   ├── .env                       # Environment Variables
│   └── .env.example
├── render.yaml                    # 1-Click 24/7 Cloud Blueprint (Render)
├── start-dev.js                   # Concurrent dev launcher
└── package.json                   # Root package script runner
```

---

## 🚀 Quick Start (Local Development)

### 1. Configure your Gemini API Key
You can set your Gemini API key in either of two places:
1. **Server-side**: Open `server/.env` and paste your key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
   ```
2. **In-App (iPhone)**: Open the app, go to the **Settings** tab, paste your key, and tap **"Save Key"**.

> Free Gemini API keys can be generated at [Google AI Studio](https://aistudio.google.com/app/apikey).

### 2. Start Both Server and Client
Run the following from the root directory:
```bash
npm run dev
```
- **Backend API**: `http://localhost:5000`
- **iOS Web App**: `http://localhost:5173`

---

## 🌐 Keeping the App Online 24/7 for Users

To make your backend accessible to mobile users around the clock without keeping your computer running:

### Option A: Free 1-Click Render Deployment (Recommended)
1. Push this repository to **GitHub**.
2. Go to [Render.com](https://render.com) and click **New + > Blueprint**.
3. Select your repository. Render reads `render.yaml` and spins up the Node.js API with a public HTTPS URL (e.g., `https://gemini-ios-companion.onrender.com`).
4. Set the `GEMINI_API_KEY` environment variable in the Render dashboard.
5. In the app's **Settings** tab, update the **Server Endpoint** to your Render URL.

### Option B: Keepalive / Zero Downtime
Free cloud tiers sleep after inactivity. Add your Render URL (`https://your-app.onrender.com/health`) to [UptimeRobot](https://uptimerobot.com) (free) for 5-minute interval pings to ensure 100% 24/7 uptime!

---

## 📱 How to Install on iPhone & Generate .IPA

### Method 1: Instant 1-Tap Safari Install (PWA)
1. Open your deployed URL (or local network IP e.g. `http://192.168.x.x:5173`) in **Safari** on your iPhone.
2. Tap the **Share** button at the bottom of Safari (square with arrow up).
3. Tap **"Add to Home Screen"**.
4. Tap **Add**. The app installs on your iOS home screen with the custom app icon and opens in native fullscreen mode.

### Method 2: Automated .IPA Generation via GitHub Actions
1. Push this repo to your GitHub repository:
   ```bash
   git add .
   git commit -m "feat: complete iOS Gemini companion"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-repo>.git
   git push -u origin main
   ```
2. In your GitHub repository, click the **Actions** tab.
3. Select **"Build iOS .IPA"** and click **Run workflow**.
4. The workflow will run on Apple `macos-14`, build the Xcode archive, package it, and upload `Aether-AI.ipa` to the **Artifacts** section!
5. Download `Aether-AI.ipa` and install it on your iPhone using:
   - **AltStore** / **SideStore** (Direct Wi-Fi / cable sideloading)
   - **Scarlet** or **TrollStore**
   - **Sideloadly** (macOS / Windows)
