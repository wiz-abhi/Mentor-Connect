"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, User, Video, MessageSquare } from "lucide-react"
import { format } from "date-fns"

interface Session {
  id: string
  start_time: string
  end_time: string | null
  status: string
  topic: string
  mentor: {
    id: string
    full_name: string
    avatar_url: string | null
    expertise: string[]
  }
  mentee: {
    id: string
    full_name: string
    avatar_url: string | null
  }
}

interface SessionsListProps {
  sessions: Session[]
  userType: 'mentor' | 'mentee'
}

const SessionsList = ({ sessions = [], userType }: SessionsListProps) => {
  const startVideoCall = (sessionId: string) => {
    window.location.href = `/dashboard/conference/${sessionId}`
  }

  if (!sessions || sessions.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No sessions</h3>
          <p className="text-muted-foreground text-center mt-2">
            {userType === 'mentor'
              ? "You don't have any sessions with mentees."
              : "You don't have any sessions with mentors."}
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-8">
      {sessions.map((session) => (
        <Card key={session.id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{session.topic}</CardTitle>
              <Badge variant="outline">{session.status}</Badge>
            </div>
            <CardDescription>
              <div className="flex items-center gap-2 mt-2">
                <User className="h-4 w-4" />
                <span>
                  {userType === 'mentor'
                    ? `Mentee: ${session.mentee?.full_name || 'Unknown'}`
                    : `Mentor: ${session.mentor?.full_name || 'Unknown'}`}
                </span>
              </div>
              {userType === 'mentee' && session.mentor?.expertise && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {session.mentor.expertise.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{format(new Date(session.start_time), "MMMM d, yyyy")}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{format(new Date(session.start_time), "h:mm a")}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4 mr-2" />
              Message
            </Button>
            <Button 
              size="sm" 
              onClick={() => startVideoCall(session.id)}
            >
              <Video className="h-4 w-4 mr-2" />
              Join Session
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}

export default SessionsList 