# PromptBench

A problem-first prompt library where users can browse, compare, and fork prompts organized by real-world problems.

## Features

- **Problem-Focused Organization**: Prompts organized by actual problems, not random categories
- **Side-by-Side Comparison**: Compare different approaches to the same problem
- **Fork & Improve**: Create versions of existing prompts with improvements
- **Community Voting**: Vote on prompts and see what actually works
- **Trust Through Transparency**: See known failures and test contexts

## Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, TailwindCSS
- **Backend**: Supabase (Postgres, Auth, RLS, Storage)
- **Validation**: Zod
- **Architecture**: Server Actions + Route Handlers

## Getting Started

### Prerequisites

- Node.js 18+
- Supabase account
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/jjtheshooterr/promptbench.git
cd promptbench
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.local.example .env.local
```

Update `.env.local` with your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Setup

The database schema is already applied to your Supabase project. It includes:

- **Problems**: Core problems that prompts solve
- **Prompts**: Prompt templates with examples and metadata
- **Workspaces**: Personal and team workspaces
- **Voting System**: Community-driven ranking
- **Analytics**: Usage tracking and insights

## Project Structure

```
/app
  /(marketing)     # Public marketing pages
  /(public)        # Public browsing (problems, prompts)
  /(auth)          # Authentication pages
  /(app)           # Authenticated user area
  /api             # API routes

/components
  /ui              # Reusable UI components
  /layout          # Layout components
  /problems        # Problem-specific components
  /prompts         # Prompt-specific components
  /forms           # Form components
  /common          # Common components

/lib
  /supabase        # Supabase client configuration
  /db              # Database queries and mutations
  /validators      # Zod validation schemas
  /utils           # Utility functions

/supabase
  schema.sql       # Database schema
  rls.sql          # Row Level Security policies
  seed.sql         # Seed data
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**jjtheshooterr** - [GitHub](https://github.com/jjtheshooterr)

## Acknowledgments

- Built for the prompt engineering community
- Inspired by the need for problem-focused prompt organization
- Powered by Supabase and Next.js