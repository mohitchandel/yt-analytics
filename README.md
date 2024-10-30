# YouTube Analytics Dashboard

A Next.js application that authenticates with Google OAuth and displays YouTube Analytics data using the YouTube Analytics API and YouTube Data API.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone and Install](#1-clone-and-install)
  - [2. Google Cloud Console Setup](#2-google-cloud-console-setup)
  - [3. Environment Variables](#3-environment-variables)
  - [4. Run the Application](#4-run-the-application)
- [Project Structure](#project-structure)
- [Common Issues and Solutions](#common-issues-and-solutions)


## Features

- Google OAuth authentication
- YouTube Analytics data visualization
- Channel statistics
- Historical data viewing
- Responsive design
- Error handling and loading states

## Prerequisites

- Node.js 16.x or later
- A Google Account
- A YouTube channel (for testing analytics)
- npm or yarn package manager

## Getting Started

### 1. Clone and Install

```bash
# Clone the repository
git clone https://github.com/mohitchandel/yt-analytics.git
cd yt-analytic

# Install dependencies
npm install
# or
yarn install
```

Required dependencies:

```json
{
  "dependencies": {
    "next": "^13.0.0",
    "next-auth": "^4.22.1",
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "googleapis": "^118.0.0",
    "recharts": "^2.5.0"
  }
}
```

### 2. Google Cloud Console Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable required APIs:

   - Navigate to "APIs & Services" > "Library"
   - Search for and enable these APIs:
     - YouTube Data API v3
     - YouTube Analytics API
     - YouTube Reporting API

4. Configure OAuth Consent Screen:

   - Go to "APIs & Services" > "OAuth consent screen"
   - Choose "External" user type
   - Fill in required information:
     - App name
     - User support email
     - Developer contact information
   - Add scopes:
     ```
     https://www.googleapis.com/auth/youtube.readonly
     https://www.googleapis.com/auth/yt-analytics.readonly
     https://www.googleapis.com/auth/youtube
     ```
   - Add test users (required for testing)

5. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth 2.0 Client IDs"
   - Application type: "Web application"
   - Add authorized JavaScript origins:
     ```
     http://localhost:3000
     ```
   - Add authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Copy your Client ID and Client Secret

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key # Generate a random string
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret
```

### 4. Run the Application

```bash
npm run dev
# or
yarn dev
```

Visit `http://localhost:3000` in your browser.

## Project Structure

```
├── app/
│   ├── api/
|   |   |-- video-analytics/[videoid]
│   │   |   └── route.ts
|   |   |-- youtube-videos/
│   │   |   └── route.ts
│   │   ├── auth/
│   │   │   └── [...nextauth]/
│   │   │       └── route.ts
│   │   └── youtube-analytics/
│   │       └── route.ts
│   ├── components/
│   │   ├── AuthButton.tsx
│   │   └── VideoAnalytics.tsx
│   │   └── YouTubeAnalytics.tsx
│   ├── providers.tsx
│   ├── layout.tsx
│   └── page.tsx
├── types/
│   └── next-auth.d.ts
├── .env.local
└── next.config.js
```

## Common Issues and Solutions

### 1. "Google hasn't verified this app" Warning

- **Solution**: This is normal during development
- Click "Continue" or "Advanced" > "Go to {Your App Name} (unsafe)"
- For production, complete Google's verification process

### 2. "Access blocked: localhost has not completed the Google verification process"

- **Solution**: Add your Google account as a test user
- Go to Google Cloud Console > OAuth consent screen
- Add your email under "Test users"

### 3. "Failed to fetch YouTube analytics"

- **Solutions**:
  - Ensure YouTube Data API v3 is enabled
  - Check if the user has a YouTube channel
  - Verify all required scopes are added
  - Check if access token is present in session

### 4. "React Context is unavailable in Server Components"

- **Solution**: Mark components using Next-Auth hooks as Client Components
- Add 'use client' directive at the top of components using:
  - useSession
  - signIn
  - signOut

### 5. "Unauthorized - No access token found"

- **Solutions**:
  - Ensure authOptions is properly exported and imported
  - Verify session callbacks are correctly configured
  - Check if user is properly authenticated
  - Confirm environment variables are set correctly
