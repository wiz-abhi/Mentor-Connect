-- Create users table with password_hash field
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('mentor', 'mentee')),
  avatar_url TEXT,
  bio TEXT
);

-- Create mentor_profiles table
CREATE TABLE IF NOT EXISTS mentor_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users NOT NULL,
  expertise TEXT[] NOT NULL,
  hourly_rate DECIMAL(10, 2),
  availability JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_available BOOLEAN DEFAULT TRUE
);

-- Create mentorship_sessions table
CREATE TABLE IF NOT EXISTS mentorship_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES users NOT NULL,
  mentee_id UUID REFERENCES users NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  topic TEXT NOT NULL,
  notes TEXT,
  transcript_url TEXT,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create mentor_ratings table
CREATE TABLE IF NOT EXISTS mentor_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mentor_id UUID REFERENCES users NOT NULL,
  mentee_id UUID REFERENCES users NOT NULL,
  session_id UUID REFERENCES mentorship_sessions NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_chat_sessions table
CREATE TABLE IF NOT EXISTS ai_chat_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users NOT NULL,
  topic TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create ai_chat_messages table
CREATE TABLE IF NOT EXISTS ai_chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES ai_chat_sessions NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updating timestamp
CREATE TRIGGER update_ai_chat_sessions_timestamp
BEFORE UPDATE ON ai_chat_sessions
FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

