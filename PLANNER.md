# Fastbreak Sports Event Management - Project Planner

## Project Overview
Build a full-stack Sports Event Management application using Next.js 15+, TypeScript, Supabase, Tailwind CSS, and Shadcn UI.

---

## Phase 1: Project Setup & Configuration

### Step 1.1: Initialize Next.js Project
```bash
npx create-next-app@latest fastbreak-events --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd fastbreak-events
```

### Step 1.2: Install Dependencies
```bash
# Supabase
npm install @supabase/supabase-js @supabase/ssr

# Shadcn UI setup
npx shadcn@latest init

# Form handling
npm install react-hook-form @hookform/resolvers zod

# Date handling
npm install date-fns

# Additional utilities (optional)
npm install lucide-react
```

### Step 1.3: Install Required Shadcn Components
```bash
npx shadcn@latest add button card input label form select textarea toast dialog table badge dropdown-menu separator skeleton avatar
```

### Step 1.4: Setup Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## Phase 2: Supabase Setup

### Step 2.1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Copy project URL and anon key to `.env.local`

### Step 2.2: Database Schema
Run this SQL in Supabase SQL Editor:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Events table
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  sport_type VARCHAR(100) NOT NULL,
  date_time TIMESTAMPTZ NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Venues table (many-to-many relationship)
CREATE TABLE venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  address TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Junction table for events and venues
CREATE TABLE event_venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  venue_id UUID REFERENCES venues(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(event_id, venue_id)
);

-- Row Level Security (RLS)
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_venues ENABLE ROW LEVEL SECURITY;

-- Policies for events (users can only access their own events)
CREATE POLICY "Users can view own events" ON events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own events" ON events
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own events" ON events
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own events" ON events
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for venues (public read, authenticated write)
CREATE POLICY "Anyone can view venues" ON venues
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can create venues" ON venues
  FOR INSERT TO authenticated WITH CHECK (true);

-- Policies for event_venues
CREATE POLICY "Users can view own event venues" ON event_venues
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_venues.event_id AND events.user_id = auth.uid())
  );

CREATE POLICY "Users can manage own event venues" ON event_venues
  FOR ALL USING (
    EXISTS (SELECT 1 FROM events WHERE events.id = event_venues.event_id AND events.user_id = auth.uid())
  );

-- Create indexes for performance
CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_sport_type ON events(sport_type);
CREATE INDEX idx_events_name ON events(name);
CREATE INDEX idx_event_venues_event_id ON event_venues(event_id);
CREATE INDEX idx_event_venues_venue_id ON event_venues(venue_id);
```

### Step 2.3: Enable Google OAuth (Optional)
1. In Supabase Dashboard → Authentication → Providers
2. Enable Google provider
3. Add Google OAuth credentials from Google Cloud Console

---

## Phase 3: Supabase Client Setup

### Step 3.1: Create Supabase Utilities
Create the following files:

**`src/lib/supabase/server.ts`** - Server-side Supabase client
```typescript
// For use in Server Components, Server Actions, Route Handlers
```

**`src/lib/supabase/client.ts`** - Client-side Supabase client (auth only)
```typescript
// For auth state management only - NO database calls
```

**`src/lib/supabase/middleware.ts`** - Middleware helper
```typescript
// For refreshing auth tokens
```

### Step 3.2: Create Type Definitions
**`src/types/database.ts`**
- Define Event, Venue, EventVenue types
- Create Zod schemas for validation

---

## Phase 4: Server Action Infrastructure

### Step 4.1: Create Action Helper
**`src/lib/actions/safe-action.ts`**

Create a generic wrapper for server actions that provides:
- Type safety with Zod validation
- Consistent error handling
- Authentication checks
- Standardized response format

```typescript
type ActionResult<T> = 
  | { success: true; data: T }
  | { success: false; error: string };

export function createAction<TInput, TOutput>(
  schema: ZodSchema<TInput>,
  handler: (input: TInput, userId: string) => Promise<TOutput>
): (input: TInput) => Promise<ActionResult<TOutput>>
```

### Step 4.2: Create Auth Actions
**`src/lib/actions/auth.ts`**
- `signUp(email, password)`
- `signIn(email, password)`
- `signInWithGoogle()`
- `signOut()`

---

## Phase 5: Authentication Implementation

### Step 5.1: Create Middleware
**`src/middleware.ts`**
- Refresh auth tokens
- Protect routes (redirect unauthenticated users to `/login`)
- Redirect authenticated users away from `/login` and `/signup`

### Step 5.2: Create Auth Pages

**`src/app/(auth)/login/page.tsx`**
- Email/password login form
- Google OAuth button
- Link to signup page

**`src/app/(auth)/signup/page.tsx`**
- Email/password registration form
- Google OAuth button
- Link to login page

**`src/app/(auth)/layout.tsx`**
- Centered layout for auth pages

### Step 5.3: Create Auth Callback Route
**`src/app/auth/callback/route.ts`**
- Handle OAuth callback
- Exchange code for session

### Step 5.4: Create Auth Form Components
**`src/components/auth/login-form.tsx`**
**`src/components/auth/signup-form.tsx`**
- Use Shadcn Form with react-hook-form
- Zod validation
- Loading states
- Error handling with toast notifications

---

## Phase 6: Event Actions

### Step 6.1: Create Event Actions
**`src/lib/actions/events.ts`**

```typescript
// All actions use the safe-action wrapper
export const getEvents = createAction(...)      // With search & filter params
export const getEvent = createAction(...)       // Single event by ID
export const createEvent = createAction(...)    // Create new event
export const updateEvent = createAction(...)    // Update existing event
export const deleteEvent = createAction(...)    // Delete event
```

### Step 6.2: Create Venue Actions
**`src/lib/actions/venues.ts`**

```typescript
export const getVenues = createAction(...)      // List all venues
export const createVenue = createAction(...)    // Create new venue
```

---

## Phase 7: Dashboard Implementation

### Step 7.1: Create Dashboard Layout
**`src/app/(dashboard)/layout.tsx`**
- Header with logo, user info, logout button
- Responsive navigation

### Step 7.2: Create Dashboard Page
**`src/app/(dashboard)/dashboard/page.tsx`**
- Server Component that fetches initial events
- Pass data to client components

### Step 7.3: Create Event List Components

**`src/components/events/event-list.tsx`**
- Client component for interactivity
- Search input (debounced)
- Sport type filter dropdown
- Grid/list layout toggle
- Skeleton loading states

**`src/components/events/event-card.tsx`**
- Display event details: name, date, sport type, venues
- Edit and delete buttons
- Badge for sport type

**`src/components/events/event-filters.tsx`**
- Search input
- Sport type select
- Triggers server action refetch

### Step 7.4: Implement Search & Filter
- Use `useTransition` for pending states
- Call server action with search/filter params
- Update UI with results

---

## Phase 8: Event CRUD Forms

### Step 8.1: Create Event Form Component
**`src/components/events/event-form.tsx`**
- Reusable for both create and edit
- Shadcn Form with react-hook-form
- Fields:
  - Event name (Input)
  - Sport type (Select)
  - Date & Time (Date picker + time input)
  - Description (Textarea)
  - Venues (Multi-select or tag input)
- Zod validation schema
- Loading state during submission
- Toast on success/error

### Step 8.2: Create Event Page
**`src/app/(dashboard)/events/new/page.tsx`**
- Create new event form

### Step 8.3: Edit Event Page
**`src/app/(dashboard)/events/[id]/edit/page.tsx`**
- Fetch existing event (Server Component)
- Pre-populate form
- Update on submit

### Step 8.4: Delete Event
**`src/components/events/delete-event-dialog.tsx`**
- Confirmation dialog using Shadcn Dialog
- Loading state
- Toast notification

---

## Phase 9: UI Polish & UX

### Step 9.1: Loading States
- Skeleton loaders for event cards
- Button loading spinners
- Page transition indicators

### Step 9.2: Toast Notifications
**`src/components/ui/toaster.tsx`**
- Add to root layout
- Use for all success/error feedback

### Step 9.3: Error Handling
- Error boundaries for pages
- Graceful error messages
- Retry functionality

### Step 9.4: Responsive Design
- Mobile-first approach
- Test on various screen sizes
- Responsive navigation

---

## Phase 10: Testing & Deployment

### Step 10.1: Manual Testing Checklist
- [ ] Sign up with email
- [ ] Login with email
- [ ] Login with Google (if implemented)
- [ ] Logout
- [ ] View dashboard with no events
- [ ] Create event with multiple venues
- [ ] View event in list
- [ ] Search events by name
- [ ] Filter events by sport type
- [ ] Edit existing event
- [ ] Delete event
- [ ] Responsive layout on mobile
- [ ] Error handling (network errors, validation)
- [ ] Protected routes redirect to login

### Step 10.2: Deploy to Vercel
1. Push code to GitHub
2. Connect repository to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Step 10.3: Post-Deployment
- Test all functionality on production URL
- Verify Supabase connection
- Test OAuth callback URLs

---

## File Structure Overview

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   │   └── page.tsx
│   │   ├── signup/
│   │   │   └── page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── events/
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   └── layout.tsx
│   ├── auth/
│   │   └── callback/
│   │       └── route.ts
│   ├── layout.tsx
│   └── page.tsx (redirect to dashboard or login)
├── components/
│   ├── auth/
│   │   ├── login-form.tsx
│   │   └── signup-form.tsx
│   ├── events/
│   │   ├── event-card.tsx
│   │   ├── event-filters.tsx
│   │   ├── event-form.tsx
│   │   ├── event-list.tsx
│   │   └── delete-event-dialog.tsx
│   ├── layout/
│   │   ├── header.tsx
│   │   └── nav.tsx
│   └── ui/
│       └── (shadcn components)
├── lib/
│   ├── actions/
│   │   ├── safe-action.ts
│   │   ├── auth.ts
│   │   ├── events.ts
│   │   └── venues.ts
│   ├── supabase/
│   │   ├── server.ts
│   │   ├── client.ts
│   │   └── middleware.ts
│   └── utils.ts
├── types/
│   └── database.ts
└── middleware.ts
```

---

## Requirements Checklist

### Authentication ✓
- [ ] Sign up with email & password
- [ ] Login with email & password
- [ ] Google OAuth (optional but recommended)
- [ ] Protected routes
- [ ] Logout functionality

### Dashboard ✓
- [ ] Display list of all sports events
- [ ] Show event details: name, date, venue, sport type
- [ ] Navigate to create/edit forms
- [ ] Responsive grid/list layout
- [ ] Search by name (server-side refetch)
- [ ] Filter by sport (server-side refetch)

### Event Management ✓
- [ ] Create events with all required fields
- [ ] Multiple venues per event
- [ ] Edit events
- [ ] Delete events

### Technical Requirements ✓
- [ ] Next.js 15+ with App Router
- [ ] TypeScript throughout
- [ ] Supabase for database
- [ ] Tailwind CSS styling
- [ ] Shadcn UI components
- [ ] Server-side database interactions only
- [ ] Server Actions (not API routes)
- [ ] Generic action helper for type safety
- [ ] Shadcn Form with react-hook-form
- [ ] Loading states
- [ ] Error handling
- [ ] Toast notifications

### Deployment ✓
- [ ] Deployed to Vercel
- [ ] Working public URL
- [ ] GitHub repository

## Quick Start Priority Order

If you're short on time, implement in this exact order:

1. **Setup** - Project, Supabase, env vars
2. **Database** - Run SQL schema
3. **Supabase clients** - Server-side client
4. **Safe action helper** - Generic wrapper
5. **Auth actions & middleware** - Login/signup/logout
6. **Auth pages** - Basic forms (email only, skip Google)
7. **Event actions** - CRUD operations
8. **Dashboard page** - Event list with search/filter
9. **Event form** - Create/edit
10. **Delete functionality** - Dialog with confirmation
11. **Deploy** - Push to Vercel

