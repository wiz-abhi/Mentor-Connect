"use server"

import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"

export async function getDashboardData() {
  try {
    const { data } = await getSession()

    if (!data.session?.user) {
      throw new Error("Not authenticated")
    }

    const userId = data.session.user.id
    const userType = data.session.user.user_metadata?.user_type || "mentee"

    // Get total sessions
    const sessionsResult = await query(
      `SELECT id, start_time, end_time FROM mentorship_sessions 
       WHERE mentor_id = $1 OR mentee_id = $1`,
      [userId],
    )
    const sessionsData = sessionsResult.rows

    // Calculate total hours
    const totalHours = sessionsData.reduce((acc, session) => {
      if (session.end_time) {
        const start = new Date(session.start_time)
        const end = new Date(session.end_time)
        const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        return acc + durationHours
      }
      return acc
    }, 0)

    // Get connected mentors/mentees
    const connectionsResult = await query(
      `SELECT 
        m.id as mentor_id, m.full_name as mentor_name,
        me.id as mentee_id, me.full_name as mentee_name
       FROM mentorship_sessions s
       JOIN users m ON s.mentor_id = m.id
       JOIN users me ON s.mentee_id = me.id
       WHERE s.mentor_id = $1 OR s.mentee_id = $1`,
      [userId],
    )
    const connectionsData = connectionsResult.rows

    // Get unique mentors/mentees
    const uniqueConnections = new Set()
    connectionsData.forEach((conn) => {
      if (userType === "mentee" && conn.mentor_id) {
        uniqueConnections.add(conn.mentor_id)
      } else if (userType === "mentor" && conn.mentee_id) {
        uniqueConnections.add(conn.mentee_id)
      }
    })

    // Get AI chat count
    const aiChatResult = await query(`SELECT COUNT(*) FROM ai_chat_sessions WHERE user_id = $1`, [userId])
    const aiChatCount = Number.parseInt(aiChatResult.rows[0].count)

    // Get top rated mentors
    const topMentorsResult = await query(
      `SELECT 
        u.id, u.full_name, u.avatar_url, AVG(r.rating) as avg_rating
       FROM mentor_ratings r
       JOIN users u ON r.mentor_id = u.id
       GROUP BY u.id, u.full_name, u.avatar_url
       ORDER BY avg_rating DESC
       LIMIT 3`,
    )
    const topMentors = topMentorsResult.rows

    // Get upcoming sessions
    const upcomingSessionsResult = await query(
      `SELECT 
        s.id, s.start_time, s.topic,
        m.id as mentor_id, m.full_name as mentor_name,
        me.id as mentee_id, me.full_name as mentee_name
       FROM mentorship_sessions s
       JOIN users m ON s.mentor_id = m.id
       JOIN users me ON s.mentee_id = me.id
       WHERE (s.mentor_id = $1 OR s.mentee_id = $1)
         AND s.status = 'scheduled'
         AND s.start_time > NOW()
       ORDER BY s.start_time
       LIMIT 2`,
      [userId],
    )
    const upcomingSessions = upcomingSessionsResult.rows.map((session) => ({
      id: session.id,
      mentor: { id: session.mentor_id, full_name: session.mentor_name },
      mentee: { id: session.mentee_id, full_name: session.mentee_name },
      start_time: session.start_time,
      topic: session.topic,
    }))

    return {
      totalSessions: sessionsData.length || 0,
      totalHours: Number.parseFloat(totalHours.toFixed(1)),
      connectionsCount: uniqueConnections.size,
      aiChatCount: aiChatCount || 0,
      topMentors: topMentors || [],
      upcomingSessions: upcomingSessions || [],
      previousMonth: {
        sessions: Math.floor((sessionsData.length || 0) * 0.7), // Simulating previous month data
        hours: Number.parseFloat((totalHours * 0.7).toFixed(1)),
        connections: Math.floor(uniqueConnections.size * 0.7),
        aiChats: Math.floor((aiChatCount || 0) * 0.7),
      },
    }
  } catch (error) {
    console.error("Error fetching dashboard data:", error)
    throw error
  }
}
export async function sendMessage(recipientId: string, content: string) {
  try {
    const { data } = await getSession()

    if (!data.session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const senderId = data.session.user.id

    // Insert message into database
    const { rows } = await query(
      `INSERT INTO messages
        (sender_id, recipient_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, created_at`,
      [senderId, recipientId, content],
    )

    return {
      success: true,
      message: {
        id: rows[0].id,
        sender_id: senderId,
        recipient_id: recipientId,
        content,
        created_at: rows[0].created_at,
      },
    }
  } catch (error) {
    console.error("Error sending message:", error)
    return { success: false, error: "Failed to send message" }
  }
}

export async function getMentors(filters = {}) {
  try {
    console.log("Fetching mentors with filters:", filters)
    
    let queryText = `
      SELECT 
        u.id as user_id,
        u.full_name,
        u.avatar_url,
        u.bio,
        u.user_type,
        mp.id as profile_id,
        mp.expertise,
        mp.hourly_rate,
        mp.is_available
      FROM users u
      LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
      WHERE u.user_type = 'mentor'
    `

    const queryParams = []
    const conditions = []

    // Apply filters
    if (filters.available) {
      conditions.push("mp.is_available = true")
    }

    if (filters.expertise) {
      queryParams.push(filters.expertise)
      conditions.push(`$${queryParams.length} = ANY(mp.expertise)`)
    }

    if (conditions.length > 0) {
      queryText += " AND " + conditions.join(" AND ")
    }

    console.log("Executing query:", queryText)
    const { rows: mentors } = await query(queryText, queryParams)
    console.log("Found mentors:", mentors)

    // Get ratings for each mentor
    const mentorsWithRatings = await Promise.all(
      mentors.map(async (mentor) => {
        const { rows: ratings } = await query("SELECT rating FROM mentor_ratings WHERE mentor_id = $1", [
          mentor.user_id,
        ])

        const avgRating = ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length : 0

        return {
          id: mentor.profile_id,
          user_id: mentor.user_id,
          name: mentor.full_name,
          title: mentor.expertise?.[0] || "Mentor",
          expertise: mentor.expertise || [],
          rating: Number.parseFloat(avgRating.toFixed(1)),
          reviews: ratings.length,
          available: mentor.is_available,
          image: mentor.avatar_url || "/placeholder.svg?height=100&width=100",
        }
      })
    )

    console.log("Mentors with ratings:", mentorsWithRatings)
    return { success: true, data: mentorsWithRatings }
  } catch (error) {
    console.error("Error fetching mentors:", error)
    return { success: false, error: "Failed to fetch mentors" }
  }
}

export async function bookMentorSession(mentorId: string, startTime: string, topic: string) {
  try {
    const { data } = await getSession()

    if (!data.session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    // First get the mentor's user_id from the profile
    const mentorProfile = await query(
      `SELECT user_id FROM mentor_profiles WHERE id = $1`,
      [mentorId]
    )

    if (mentorProfile.rows.length === 0) {
      return { success: false, error: "Mentor profile not found" }
    }

    const mentorUserId = mentorProfile.rows[0].user_id

    // Verify the user is actually a mentor
    const mentorCheck = await query(
      `SELECT id FROM users WHERE id = $1 AND user_type = 'mentor'`,
      [mentorUserId]
    )

    if (mentorCheck.rows.length === 0) {
      return { success: false, error: "Mentor not found" }
    }

    const { rows } = await query(
      `INSERT INTO mentorship_sessions 
        (mentor_id, mentee_id, start_time, status, topic)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [mentorUserId, data.session.user.id, startTime, "scheduled", topic],
    )

    return { success: true, data: rows[0] }
  } catch (error) {
    console.error("Error booking session:", error)
    return { success: false, error: "Failed to book session" }
  }
}

export async function updateUserProfile(profileData: any) {
  try {
    const { data } = await getSession()

    if (!data.session?.user) {
      return { success: false, error: "Not authenticated" }
    }

    const userId = data.session.user.id
    const userType = data.session.user.user_metadata?.user_type

    // Update user profile
    await query(
      `UPDATE users
       SET full_name = $1, bio = $2, avatar_url = $3
       WHERE id = $4`,
      [profileData.fullName, profileData.bio, profileData.avatarUrl, userId],
    )

    // If user is a mentor, update mentor profile
    if (userType === "mentor") {
      await query(
        `UPDATE mentor_profiles
         SET expertise = $1, hourly_rate = $2, is_available = $3
         WHERE user_id = $4`,
        [profileData.expertise, Number.parseFloat(profileData.hourlyRate) || null, profileData.isAvailable, userId],
      )
    }

    return { success: true }
  } catch (error) {
    console.error("Error updating profile:", error)
    return { success: false, error: "Failed to update profile" }
  }
}

