# MentorConnect - AI-Powered Mentorship Platform

MentorConnect is a comprehensive platform that connects mentees with expert mentors through real-time video sessions and provides AI-powered guidance based on thousands of successful mentorship conversations.

## Database Schema

The platform uses Supabase for authentication and data storage. The database schema includes the following tables:

### Users Table
- `id`: UUID (Primary Key, references auth.users)
- `created_at`: Timestamp
- `email`: Text (Unique)
- `full_name`: Text
- `user_type`: Text (Either 'mentor' or 'mentee')
- `avatar_url`: Text (Optional)
- `bio`: Text (Optional)

### Mentor Profiles Table
- `id`: UUID (Primary Key)
- `user_id`: UUID (References users.id)
- `expertise`: Text Array
- `hourly_rate`: Decimal
- `availability`: JSONB
- `created_at`: Timestamp
- `is_available`: Boolean

### Mentorship Sessions Table
- `id`: UUID (Primary Key)
- `mentor_id`: UUID (References users.id)
- `mentee_id`: UUID (References users.id)
- `start_time`: Timestamp
- `end_time`: Timestamp (Optional)
- `status`: Text (One of: 'scheduled', 'in_progress', 'completed', 'cancelled')
- `topic`: Text
- `notes`: Text (Optional)
- `transcript_url`: Text (Optional)
- `recording_url`: Text (Optional)
- `created_at`: Timestamp

### Mentor Ratings Table
- `id`: UUID (Primary Key)
- `mentor_id`: UUID (References users.id)
- `mentee_id`: UUID (References users.id)
- `session_id`: UUID (References mentorship_sessions.id)
- `rating`: Integer (1-5)
- `review`: Text (Optional)
- `created_at`: Timestamp

### AI Chat Sessions Table
- `id`: UUID (Primary Key)
- `user_id`: UUID (References users.id)
- `topic`: Text
- `created_at`: Timestamp
- `updated_at`: Timestamp

### AI Chat Messages Table
- `id`: UUID (Primary Key)
- `session_id`: UUID (References ai_chat_sessions.id)
- `role`: Text (Either 'user' or 'assistant')
- `content`: Text
- `created_at`: Timestamp

## Features

- **User Authentication**: Secure login and registration for mentors and mentees
- **Mentor Profiles**: Detailed profiles with expertise, ratings, and availability
- **Session Scheduling**: Book and manage mentorship sessions
- **Real-time Video Calls**: WebRTC-powered video sessions with chat
- **AI Mentor**: Get instant guidance from an AI trained on mentorship conversations
- **Session History**: Access past sessions, recordings, and transcripts
- **Ratings and Reviews**: Rate mentors and provide feedback

## Technical Stack

- **Frontend**: Next.js 14 with App Router, React, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Real-time Communication**: WebRTC, Socket.io
- **AI**: OpenAI GPT-4, Pinecone for vector search
- **Deployment**: Vercel

## Getting Started

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see `.env.example`)
4. Run the development server: `npm run dev`
5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file with the following variables:

