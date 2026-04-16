# Promptvexity Homepage Redesign Specification

## Overview
Complete professional homepage redesign matching existing design system with comprehensive SEO optimization and additional compelling sections.

## Design System Colors (from globals.css)
- Primary Blue: #2563EB → #1D4ED8 (gradient)
- Accent Amber: #F59E0B
- Success Green: #22C55E
- Background: #F8FAFC
- Text: #0F172A
- Border: rgba(148, 163, 184, 0.35)

## Sections to Add/Enhance

### 1. Hero Section (Enhanced)
**Current**: Basic hero with examples
**New**: 
- Add animated badge "🔥 50+ Production Problems Added"
- Enhance social proof with real metrics
- Add trust indicators (GitHub stars, Product Hunt badge)
- Improve CTA hierarchy

### 2. Stats Bar (Keep & Enhance)
- Current metrics are good
- Add animation on scroll
- Add comparison text ("vs starting from scratch")

### 3. Featured Problems Carousel (NEW)
- Showcase 3-4 rotating problem cards
- Real examples with fork counts
- "Most Forked This Week" badge
- Direct links to problem pages

### 4. How It Works (Enhanced)
- Keep existing 4-step process
- Add real screenshot/mockup for each step
- Add "Try it now" micro-CTA at each step

### 5. Social Proof Section (NEW)
- Testimonial cards from real users
- Company logos (if available)
- "Built in public" metrics
- Twitter/social mentions

### 6. Problem Categories (Enhanced)
- Keep 6 categories
- Add real problem count per category
- Add "New" badges for recent additions
- Show top prompt per category

### 7. Comparison Table (NEW)
- "Promptvexity vs Starting from Scratch"
- "Promptvexity vs ChatGPT Playground"
- Clear value propositions

### 8. FAQ Section (NEW)
- "How is this different from prompt libraries?"
- "Can I use these prompts commercially?"
- "How do forks work?"
- "Is it free?"

### 9. Final CTA (Enhanced)
- Stronger urgency
- Multiple entry points
- Clear next steps

## SEO Enhancements

### Meta Tags (Added)
```typescript
export const metadata: Metadata = {
  title: 'Promptvexity - Production-Ready Prompts for Real SaaS Problems',
  description: '...',
  keywords: [...],
  openGraph: {...},
  twitter: {...}
}
```

### Structured Data (To Add)
- Organization schema
- WebSite schema
- BreadcrumbList schema
- FAQPage schema

### Content SEO
- H1: "Production-ready prompts for real SaaS problems"
- H2s for each major section
- Alt text for all images
- Internal linking strategy
- Keyword density for "AI prompts", "SaaS", "prompt engineering"

## Performance Optimizations
- Lazy load below-fold content
- Optimize images
- Defer non-critical CSS
- Preload critical fonts

## Accessibility
- Proper heading hierarchy
- ARIA labels for interactive elements
- Keyboard navigation
- Focus indicators
- Color contrast ratios

## Mobile Responsiveness
- Stack sections vertically
- Touch-friendly CTAs (min 44px)
- Readable font sizes (16px+)
- Optimized images for mobile

## Implementation Priority
1. SEO meta tags ✅
2. Enhanced hero section
3. Featured problems carousel
4. Social proof section
5. Comparison table
6. FAQ section
7. Structured data
8. Performance optimizations
