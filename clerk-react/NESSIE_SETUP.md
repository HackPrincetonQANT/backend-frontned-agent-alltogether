# Nessie API Setup Guide

## 🔒 Security First

This guide will help you securely configure the Capital One Nessie API integration.

## Setup Instructions

### 1. Create your environment file

Copy the example environment file:

```bash
cp .env.example .env.local
```

### 2. Add your API credentials

Open `.env.local` and replace the placeholder values with your actual credentials:

```env
VITE_NESSIE_API_KEY=your_actual_api_key_here
VITE_NESSIE_ACCOUNT_ID=your_actual_account_id_here
```

⚠️ **IMPORTANT**: 
- **NEVER** commit `.env.local` to git
- **NEVER** share your API keys publicly
- `.env.local` is already in `.gitignore` to protect you

### 3. Restart the development server

After updating `.env.local`, restart your dev server:

```bash
npm run dev
```

### 4. Verify it works

The Home page should now display your real account balance from the Nessie API.

## How It Works

### Environment Variables

Vite exposes environment variables prefixed with `VITE_` to the client-side code:

- `VITE_NESSIE_API_KEY` - Your Nessie API key
- `VITE_NESSIE_ACCOUNT_ID` - Your account ID

### API Service

The `src/services/nessieApi.ts` file handles all API communication:

- ✅ Reads credentials from environment variables
- ✅ Makes secure API calls to Nessie
- ✅ Handles errors gracefully
- ✅ Provides TypeScript types for data

### Component Integration

The `Home` component:

- Fetches account balance on mount using `useEffect`
- Shows loading state while fetching
- Displays error messages if API call fails
- Shows real balance data when successful

## API Endpoints Used

### Get Account Balance

```
GET http://api.nessieisreal.com/accounts/{account_id}?key={api_key}
```

Response includes:
- `balance` - Current account balance
- `account_number` - Account number (last 4 digits shown)
- `nickname` - Account nickname
- `type` - Account type (Savings, Checking, etc.)

## Troubleshooting

### "API key not set" error

Make sure:
1. You created `.env.local` file
2. You added `VITE_NESSIE_API_KEY` with your actual key
3. You restarted the dev server after adding the file

### Balance not showing

Check browser console for errors:
1. Open DevTools (F12)
2. Go to Console tab
3. Look for error messages from the API

### 401 Unauthorized

Your API key might be incorrect. Double-check:
- No extra spaces in `.env.local`
- API key is still valid
- Format: `VITE_NESSIE_API_KEY=your_key_here`

## Best Practices

### ✅ DO:
- Keep `.env.local` file locally only
- Use environment variables for all secrets
- Check `.gitignore` includes `.env.local`
- Provide `.env.example` for other developers

### ❌ DON'T:
- Commit API keys to git
- Share keys in Slack/Discord/etc
- Hardcode keys in source code
- Push `.env.local` to GitHub

## Production Deployment

For production, set environment variables in your hosting platform:

- **Vercel**: Project Settings → Environment Variables
- **Netlify**: Site Settings → Environment Variables
- **AWS**: Use Parameter Store or Secrets Manager

Never use `.env.local` in production!
