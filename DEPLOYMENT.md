# Deployment Guide - Cloudflare Pages

This guide will help you deploy Promptvexity to Cloudflare Pages.

## Prerequisites

1. A Cloudflare account
2. A GitHub repository with your code
3. A Supabase project set up

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Environment Variables

1. Copy `.env.example` to `.env.local` for local development
2. Set up the following environment variables in Cloudflare Pages dashboard:

### Required Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anonymous key
- `NEXT_PUBLIC_SITE_URL`: Your production domain (e.g., `https://your-app.pages.dev`)

## Step 3: Supabase Configuration

1. In your Supabase dashboard, go to Authentication > URL Configuration
2. Add your Cloudflare Pages domain to:
   - Site URL: `https://your-app.pages.dev`
   - Redirect URLs: `https://your-app.pages.dev/auth/callback`

## Step 4: Deploy to Cloudflare Pages

### Option A: Using Cloudflare Dashboard (Recommended)

1. Go to [Cloudflare Pages](https://pages.cloudflare.com/)
2. Click "Create a project"
3. Connect your GitHub repository
4. Configure build settings:
   - **Framework preset**: Next.js
   - **Build command**: `npm run pages:build`
   - **Build output directory**: `.vercel/output/static`
   - **Root directory**: `/` (leave empty)
5. Add environment variables in the dashboard
6. Click "Save and Deploy"

### Option B: Using Wrangler CLI

1. Install Wrangler globally:
   ```bash
   npm install -g wrangler
   ```

2. Login to Cloudflare:
   ```bash
   wrangler login
   ```

3. Deploy:
   ```bash
   npm run deploy
   ```

## Step 5: Post-Deployment

1. Update `NEXT_PUBLIC_SITE_URL` in your environment variables to your actual domain
2. Test authentication flows
3. Verify all features work correctly

## Troubleshooting

### Common Issues

1. **Authentication not working**: Check that your site URL and redirect URLs are correctly configured in Supabase
2. **Build failures**: Ensure all environment variables are set correctly
3. **Server actions not working**: Make sure you're using the latest version of `@cloudflare/next-on-pages`

### Build Commands

- **Development**: `npm run dev`
- **Build for Cloudflare**: `npm run pages:build`
- **Preview locally**: `npm run preview`
- **Deploy**: `npm run deploy`

## Performance Optimization

Cloudflare Pages provides:
- Global CDN
- Automatic HTTPS
- Branch previews
- Analytics

Your Next.js app will run on Cloudflare's edge runtime, providing fast global performance.