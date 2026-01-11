# Fastbreak Event Dashboard

A full-stack Sports Event Management application built with Next.js 15, TypeScript, and Supabase.

## Overview

This application allows users to create, view, and manage sports events with venue information. Users can authenticate via email/password or Google OAuth, and perform CRUD operations on sports events through an intuitive dashboard interface.

## Tech Stack

- **Framework:** Next.js 15+ (App Router)
- **Language:** TypeScript
- **Database:** Supabase
- **Styling:** Tailwind CSS
- **UI Components:** Shadcn UI
- **Authentication:** Supabase Auth (Email & Google SSO)
- **Forms:** React Hook Form with Shadcn Form components
- **Deployment:** Vercel

## Features

### Authentication
- Sign up / Login with email & password
- Google OAuth Sign-in
- Protected routes with automatic redirect to login
- Logout functionality

### Dashboard
- Display list of all sports events
- Show key event details: name, date, venue, sport type
- Search events by name
- Filter events by sport type
- Responsive grid/list layout
- Navigate to create/edit event forms

### Event Management
- **Create Events** with:
  - Event name
  - Sport type (Soccer, Basketball, Tennis, etc.)
  - Date & Time
  - Description
  - Multiple venues
- **Edit Events** - Update existing event information
- **Delete Events** - Remove events from the system

### Additional Features
- Server-side database interactions using Server Actions
- Type-safe API layer with consistent error handling
- Loading states throughout the application
- Toast notifications for success/error states
- Fully responsive design

## Getting Started

### Prerequisites

- Node.js 18+ installed
- A Supabase account and project
- Git

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd test
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Set up Supabase database:

Run the SQL migrations in your Supabase project (see Database Schema section below).

5. Configure Supabase Authentication:

- Enable Email/Password authentication in your Supabase project
- Enable Google OAuth provider (optional)

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database Schema

### Tables

**events**
- `id` (uuid, primary key)
- `user_id` (uuid, foreign key to auth.users)
- `name` (text)
- `sport_type` (text)
- `date_time` (timestamp)
- `description` (text)
- `created_at` (timestamp)
- `updated_at` (timestamp)

**venues**
- `id` (uuid, primary key)
- `event_id` (uuid, foreign key to events)
- `name` (text)
- `address` (text)
- `created_at` (timestamp)

## Project Structure

```
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── dashboard/
│   ├── events/
│   │   ├── create/
│   │   └── [id]/edit/
│   ├── actions/
│   └── layout.tsx
├── components/
│   ├── ui/           # Shadcn UI components
│   ├── auth/
│   ├── events/
│   └── dashboard/
├── lib/
│   ├── supabase/
│   ├── actions/      # Server Actions
│   └── utils.ts
└── types/
    └── index.ts
```

## Key Technical Decisions

- **Server Actions over API Routes:** All database operations use Next.js Server Actions for better type safety and simplified data fetching
- **No Client-Side Supabase Calls:** All database interactions happen server-side
- **Generic Helper Functions:** Consistent error handling and type safety across the application
- **Form Validation:** React Hook Form with Zod schema validation
- **Toast Notifications:** User feedback for all operations

## Deployment

This application is designed to be deployed on Vercel:

1. Push your code to GitHub
2. Import the project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

## Development Guidelines

- All forms must use Shadcn Form components with react-hook-form
- Use Shadcn UI components for consistency
- All database interactions must be server-side
- Include loading states and error handling
- Implement toast notifications for user feedback

## License

MIT

## Author

Built as part of the Fastbreak Developer Interview Challenge
