import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import { query } from "@/lib/db"
import SessionsList from "./sessions-list"

interface SessionRow {
  id: string
  start_time: string
  end_time: string | null
  status: string
  topic: string
  mentor_id: string
  mentor_name: string
  mentor_avatar: string | null
  expertise: string[]
  mentee_id: string
  mentee_name: string
  mentee_avatar: string | null
}

export default async function SessionsPage() {
  const { data } = await getSession()
  if (!data.session?.user) {
    redirect("/login")
  }

  const userType = data.session.user.user_type as 'mentor' | 'mentee'

  try {
    const sessions = await query(
      `SELECT 
        ms.id,
        ms.start_time,
        ms.end_time,
        ms.status,
        ms.topic,
        mentor.id as mentor_id,
        mentor.full_name as mentor_name,
        mentor.avatar_url as mentor_avatar,
        mp.expertise,
        mentee.id as mentee_id,
        mentee.full_name as mentee_name,
        mentee.avatar_url as mentee_avatar
      FROM mentorship_sessions ms
      JOIN users mentor ON ms.mentor_id = mentor.id
      JOIN mentor_profiles mp ON mentor.id = mp.user_id
      JOIN users mentee ON ms.mentee_id = mentee.id
      WHERE ${userType === 'mentor' ? 'mentor.id' : 'mentee.id'} = $1
      ORDER BY ms.start_time DESC`,
      [data.session.user.id]
    )

    const formattedSessions = sessions.rows.map((row: SessionRow) => ({
      id: row.id,
      start_time: row.start_time,
      end_time: row.end_time,
      status: row.status,
      topic: row.topic,
      mentor: {
        id: row.mentor_id,
        full_name: row.mentor_name,
        avatar_url: row.mentor_avatar,
        expertise: row.expertise || []
      },
      mentee: {
        id: row.mentee_id,
        full_name: row.mentee_name,
        avatar_url: row.mentee_avatar
      }
    }))

  return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Your Sessions</h1>
        <SessionsList 
          sessions={formattedSessions}
          userType={userType}
        />
      </div>
    )
  } catch (error) {
    console.error('Error fetching sessions:', error)
    return (
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Your Sessions</h1>
        <div className="text-center py-12">
          <p className="text-muted-foreground">Failed to load sessions. Please try again later.</p>
                      </div>
    </div>
  )
  }
}

