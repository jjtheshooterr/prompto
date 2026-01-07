# Deployment Guide - Vercel

This guide will help you deploy Promptvexity to Vercel (recommended for Next.js apps).

## Prerequisites

1. A Vercel account (free)
2. A GitHub repository with your code
3. A Supabase project set up

## Step 1: Deploy to Vercel

### Option A: One-Click Deploy (Easiest)

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Vercel will automatically detect Next.js
5. Click "Deploy"

### Option B: Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Deploy:
   ```bash
   vercel
   ```

## Step 2: Environment Variables

After deployment, add environment variables in Vercel dashboard:

1. Go to your project in Vercel dashboard
2. Go to **Settings** → **Environment Variables**
3. Add these variables for **Production**, **Preview**, and **Development**:

```
NEXT_PUBLIC_SUPABASE_URL = https://yknsbonffoaxxcwvxrls.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = your_supabase_anon_key
NEXT_PUBLIC_SITE_URL = https://your-app.vercel.app
```

## Step 3: Supabase Configuration

1. In your Supabase dashboard, go to Authentication → URL Configuration
2. Add your Vercel domain to:
   - **Site URL**: `https://your-app.vercel.app`
   - **Redirect URLs**: `https://your-app.vercel.app/auth/callback`

## Step 4: Custom Domain (Optional)

1. In Vercel dashboard, go to **Settings** → **Domains**
2. Add your custom domain
3. Update `NEXT_PUBLIC_SITE_URL` to your custom domain
4. Update Supabase auth URLs to your custom domain

## Features You Get with Vercel

- ✅ **Automatic deployments** from GitHub
- ✅ **Preview deployments** for pull requests
- ✅ **Edge functions** for server actions
- ✅ **Global CDN** with 99.99% uptime
- ✅ **Analytics** and performance monitoring
- ✅ **Zero configuration** - works out of the box

## Troubleshooting

### Common Issues

1. **Environment variables not working**: Make sure they're added to all environments (Production, Preview, Development)
2. **Authentication redirects failing**: Check that your Vercel domain is added to Supabase auth settings
3. **Build failures**: Check the build logs in Vercel dashboard

### Build Commands

- **Development**: `npm run dev`
- **Build**: `npm run build` (automatic on Vercel)
- **Start**: `npm run start`

## Performance

Vercel provides:
- Global edge network
- Automatic HTTPS
- Image optimization
- Static file caching
- Serverless functions for API routes

Your Next.js app will have excellent performance worldwide!