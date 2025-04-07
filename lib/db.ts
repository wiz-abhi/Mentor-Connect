import { sql } from "@vercel/postgres"
import 'dotenv/config'

// Check if POSTGRES_URL is set
if (!process.env.POSTGRES_URL) {
  console.warn('Warning: POSTGRES_URL environment variable is not set. Database operations will fail.');
}

// Helper function to execute SQL queries
export async function query(text: string, params?: any[]) {
  try {
    if (!process.env.POSTGRES_URL) {
      throw new Error('Database connection string is not configured');
    }
    const result = await sql.query(text, params || [])
    return result
  } catch (error) {
    console.error("Error executing query", { text, error })
    throw error
  }
}

// For transactions and more complex operations
export async function transaction<T>(callback: () => Promise<T>): Promise<T> {
  try {
    if (!process.env.POSTGRES_URL) {
      throw new Error('Database connection string is not configured');
    }
    await sql.query("BEGIN")
    const result = await callback()
    await sql.query("COMMIT")
    return result
  } catch (error) {
    await sql.query("ROLLBACK")
    console.error("Transaction error:", error)
    throw error
  }
}

export async function getUserProfile(userId: string) {
  try {
    const result = await sql`
      SELECT 
        u.id, u.email, u.full_name, u.bio, u.avatar_url, u.user_type,
        m.expertise, m.hourly_rate, m.is_available
      FROM users u
      LEFT JOIN mentor_profiles m ON u.id = m.user_id
      WHERE u.id = ${userId}
    `
    
    if (result.rows.length === 0) {
      return null
    }

    const userData = result.rows[0]
    return {
      ...userData,
      expertise: userData.expertise || [],
      hourly_rate: userData.hourly_rate?.toString() || "",
      is_available: userData.is_available ?? true
    }
  } catch (error) {
    console.error("Error fetching user profile:", error)
    throw error
  }
}

export async function updateUserProfile(userId: string, data: {
  full_name: string
  bio: string
  avatar_url: string
  expertise?: string[]
  hourly_rate?: number
  is_available?: boolean
}) {
  try {
    // Update user profile
    await sql`
      UPDATE users
      SET 
        full_name = ${data.full_name},
        bio = ${data.bio},
        avatar_url = ${data.avatar_url}
      WHERE id = ${userId}
    `

    // If user is a mentor, update mentor profile
    if (data.expertise || data.hourly_rate !== undefined || data.is_available !== undefined) {
      // Convert expertise array to JSON string for storage
      const expertiseJson = data.expertise ? JSON.stringify(data.expertise) : null;
      
      await sql`
        INSERT INTO mentor_profiles (user_id, expertise, hourly_rate, is_available)
        VALUES (${userId}, ${expertiseJson}, ${data.hourly_rate}, ${data.is_available})
        ON CONFLICT (user_id) DO UPDATE
        SET 
          expertise = ${expertiseJson},
          hourly_rate = ${data.hourly_rate},
          is_available = ${data.is_available}
      `
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating user profile:", error)
    throw error
  }
}

export async function createAIChatSession(userId: string): Promise<string> {
  try {
    if (!process.env.POSTGRES_URL) {
      console.warn('Database not configured, skipping session creation');
      return 'mock-session-id';
    }
    
    // Generate a UUID for the session if userId is not a valid UUID
    const sessionUserId = userId === 'user' ? crypto.randomUUID() : userId;
    
    const result = await sql`
      INSERT INTO ai_chat_sessions (user_id, topic, created_at)
      VALUES (${sessionUserId}, 'General Mentorship', NOW())
      RETURNING id
    `
    return result.rows[0].id
  } catch (error) {
    console.error('Error creating AI chat session:', error)
    // Return a mock session ID if database operation fails
    return 'mock-session-id'
  }
}

export async function saveAIChatMessage(
  sessionId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<void> {
  try {
    if (!process.env.POSTGRES_URL) {
      console.warn('Database not configured, skipping message save');
      return;
    }
    
    await sql`
      INSERT INTO ai_chat_messages (session_id, role, content, created_at)
      VALUES (${sessionId}, ${role}, ${content}, NOW())
    `
  } catch (error) {
    console.error('Error saving AI chat message:', error)
    // Silently fail if database operation fails
  }
}

