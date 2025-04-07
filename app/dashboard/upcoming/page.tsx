import { Suspense } from "react"
import { getSession } from "@/lib/auth"
import { query } from "@/lib/db"
import UpcomingSessionsList from "./upcoming-sessions-list"

interface SessionRow {
  id: string
  start_time: string
  end_time: string | null
  status: string
  topic: string
  mentor_id: string
  mentor_name: string
  mentor_avatar: string | null
  mentee_id: string
  mentee_name: string
  mentee_avatar: string | null
  expertise: string[] | null
}

// Mark the page as dynamic
export const dynamic = 'force-dynamic'

export default async function UpcomingSessionsPage() {
  const { data } = await getSession()
  if (!data.session?.user) {
    throw new Error("Not authenticated")
  }

  const userType = data.session.user.user_type

  const { rows } = await query(
    `SELECT 
      ms.id, ms.start_time, ms.end_time, ms.status, ms.topic,
      m.id as mentor_id, m.full_name as mentor_name, m.avatar_url as mentor_avatar,
      me.id as mentee_id, me.full_name as mentee_name, me.avatar_url as mentee_avatar,
      mp.expertise
     FROM mentorship_sessions ms
     JOIN users m ON ms.mentor_id = m.id
     JOIN users me ON ms.mentee_id = me.id
     LEFT JOIN mentor_profiles mp ON m.id = mp.user_id
     WHERE (ms.mentor_id = $1 OR ms.mentee_id = $1)
     AND ms.status = 'scheduled'
     AND ms.start_time > NOW()
     ORDER BY ms.start_time ASC`,
    [data.session.user.id]
  )

  const sessions = rows.map((row: unknown) => {
    const typedRow = row as SessionRow
    return {
      id: typedRow.id,
      start_time: typedRow.start_time,
      end_time: typedRow.end_time,
      status: typedRow.status,
      topic: typedRow.topic,
      mentor: {
        id: typedRow.mentor_id,
        full_name: typedRow.mentor_name,
        avatar_url: typedRow.mentor_avatar,
        expertise: typedRow.expertise || []
      },
      mentee: {
        id: typedRow.mentee_id,
        full_name: typedRow.mentee_name,
        avatar_url: typedRow.mentee_avatar
      }
    }
  })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Upcoming Sessions</h2>
        <p className="text-muted-foreground">
          {userType === 'mentor' 
            ? "View and manage your upcoming mentorship sessions with mentees"
            : "View and manage your upcoming mentorship sessions with mentors"}
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-[400px]">
          <div className="text-center">
            <p className="text-muted-foreground">Loading your sessions...</p>
          </div>
        </div>
      }>
        <UpcomingSessionsList sessions={sessions} userType={userType} />
      </Suspense>
    </div>
  )
} 