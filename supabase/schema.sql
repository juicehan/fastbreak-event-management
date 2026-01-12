-- Fastbreak Sports Event Management Database Schema
-- Run this SQL in the Supabase SQL Editor

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

CREATE POLICY "Authenticated users can update venues" ON venues
  FOR UPDATE TO authenticated USING (true);

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