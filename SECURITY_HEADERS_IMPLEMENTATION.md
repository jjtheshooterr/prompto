# Security Headers Implementation Guide

## Quick Implementation

Add these security headers to your Next.js application for production deployment.

---

## 1. Update next.config.js

Replace or update your `next.config.js` with the following:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Existing config...
  
  async headers() {
    return [
      {
        // Apply these headers to all routes
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

---

## 2. Content Security Policy (CSP)

For maximum security, add a Content Security Policy. This is more complex and may require adjustments based on your needs.

### Option A: Strict CSP (Recommended for Production)

```javascript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // unsafe-eval needed for Next.js dev
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
}
```

### Option B: Relaxed CSP (For Development)

```javascript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self' data:",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'"
  ].join('; ')
}
```

---

## 3. Complete next.config.js Example

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          // DNS Prefetch Control
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          // HSTS - Force HTTPS
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          // Prevent clickjacking
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          // Prevent MIME type sniffing
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          // XSS Protection (legacy, but still useful)
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          // Referrer Policy
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          // Permissions Policy (disable unnecessary features)
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()'
          },
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'"
            ].join('; ')
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig
```

---

## 4. Testing Security Headers

After implementing, test your headers using these tools:

### Online Tools
1. **Security Headers** - https://securityheaders.com/
   - Enter your domain
   - Get a grade (A+ is best)
   - See missing headers

2. **Mozilla Observatory** - https://observatory.mozilla.org/
   - Comprehensive security scan
   - Detailed recommendations

3. **SSL Labs** - https://www.ssllabs.com/ssltest/
   - Test SSL/TLS configuration
   - Check HSTS implementation

### Browser DevTools
1. Open DevTools (F12)
2. Go to Network tab
3. Reload page
4. Click on any request
5. Check "Response Headers" section
6. Verify all security headers are present

---

## 5. Header Explanations

### X-Frame-Options: DENY
Prevents your site from being embedded in iframes, protecting against clickjacking attacks.

### X-Content-Type-Options: nosniff
Prevents browsers from MIME-sniffing responses, reducing XSS risks.

### Strict-Transport-Security
Forces browsers to only connect via HTTPS, preventing man-in-the-middle attacks.

### Referrer-Policy
Controls how much referrer information is sent with requests.

### Permissions-Policy
Disables browser features you don't use (camera, microphone, etc.).

### Content-Security-Policy
Defines which resources can be loaded, preventing XSS and data injection attacks.

---

## 6. Cloudflare Pages Configuration

If deploying to Cloudflare Pages, you can also set headers in `_headers` file:

Create `public/_headers`:

```
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  X-XSS-Protection: 1; mode=block
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Strict-Transport-Security: max-age=63072000; includeSubDomains; preload
```

**Note:** Cloudflare Pages automatically adds some security headers, but explicit configuration is better.

---

## 7. Deployment Checklist

Before deploying to production:

- [ ] Add security headers to `next.config.js`
- [ ] Test headers locally (`npm run build && npm start`)
- [ ] Deploy to staging environment
- [ ] Test with securityheaders.com
- [ ] Verify no functionality is broken
- [ ] Deploy to production
- [ ] Re-test with securityheaders.com
- [ ] Monitor for CSP violations (if using CSP reporting)

---

## 8. CSP Violation Reporting (Optional)

To monitor CSP violations, add a report-uri:

```javascript
{
  key: 'Content-Security-Policy',
  value: [
    "default-src 'self'",
    // ... other directives ...
    "report-uri https://your-domain.com/api/csp-report"
  ].join('; ')
}
```

Then create an API route to log violations:

```typescript
// app/api/csp-report/route.ts
export async function POST(request: Request) {
  const report = await request.json()
  console.error('CSP Violation:', report)
  return new Response('OK', { status: 200 })
}
```

---

## 9. Common Issues & Solutions

### Issue: CSP blocks inline scripts
**Solution:** Use nonces or hashes for inline scripts, or relax CSP during development.

### Issue: CSP blocks Supabase connections
**Solution:** Add `https://*.supabase.co` and `wss://*.supabase.co` to `connect-src`.

### Issue: Images not loading
**Solution:** Add image domains to `img-src` directive.

### Issue: Fonts not loading
**Solution:** Add font sources to `font-src` directive.

---

## 10. Security Score Goals

After implementing all headers, you should achieve:

- **securityheaders.com:** A+ rating
- **Mozilla Observatory:** A+ rating (90+ score)
- **SSL Labs:** A+ rating

---

## Implementation Priority

1. **High Priority (Do Now):**
   - X-Frame-Options
   - X-Content-Type-Options
   - Strict-Transport-Security

2. **Medium Priority (Do Soon):**
   - Referrer-Policy
   - Permissions-Policy
   - X-XSS-Protection

3. **Low Priority (Do Later):**
   - Content-Security-Policy (requires testing)
   - CSP Reporting

---

## Next Steps

1. Copy the complete `next.config.js` example above
2. Test locally to ensure nothing breaks
3. Deploy to staging
4. Test with securityheaders.com
5. Deploy to production
6. Monitor for issues

**Estimated Time:** 15-30 minutes  
**Difficulty:** Easy  
**Impact:** High security improvement
