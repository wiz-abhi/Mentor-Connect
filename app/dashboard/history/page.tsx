import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Calendar, Clock, Download, Bot, User, MessageSquare } from "lucide-react"

export default function HistoryPage() {
  // Mock data for past sessions
  const humanSessions = [
    {
      id: "1",
      mentor: "Dr. Jane Smith",
      topic: "Web Development Career Path",
      date: "2023-05-15",
      duration: "45 minutes",
      rating: 5,
      hasTranscript: true,
      hasRecording: true,
    },
    {
      id: "2",
      mentor: "Michael Johnson",
      topic: "Machine Learning Fundamentals",
      date: "2023-05-10",
      duration: "60 minutes",
      rating: 4,
      hasTranscript: true,
      hasRecording: false,
    },
    {
      id: "3",
      mentor: "Sarah Williams",
      topic: "UX Design Principles",
      date: "2023-05-05",
      duration: "30 minutes",
      rating: 5,
      hasTranscript: true,
      hasRecording: true,
    },
  ]

  const aiSessions = [
    {
      id: "1",
      topic: "JavaScript Async/Await",
      date: "2023-05-16",
      duration: "15 minutes",
      questions: 8,
    },
    {
      id: "2",
      topic: "React Hooks Best Practices",
      date: "2023-05-14",
      duration: "20 minutes",
      questions: 12,
    },
    {
      id: "3",
      topic: "CSS Grid vs Flexbox",
      date: "2023-05-12",
      duration: "10 minutes",
      questions: 5,
    },
    {
      id: "4",
      topic: "Database Selection Criteria",
      date: "2023-05-11",
      duration: "25 minutes",
      questions: 15,
    },
  ]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Session History</h2>
        <p className="text-muted-foreground">Review your past mentorship sessions and AI conversations</p>
      </div>

      <Tabs defaultValue="human" className="space-y-4">
        <TabsList>
          <TabsTrigger value="human" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Human Mentors
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2">
            <Bot className="h-4 w-4" />
            AI Mentor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="human" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {humanSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="mb-2">
                      Human Mentor
                    </Badge>
                    <div className="flex">
                      {Array(5)
                        .fill(0)
                        .map((_, i) => (
                          <svg
                            key={i}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill={i < session.rating ? "currentColor" : "none"}
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={`h-4 w-4 ${i < session.rating ? "text-yellow-500" : "text-muted-foreground"}`}
                          >
                            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                          </svg>
                        ))}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{session.topic}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>
                        {session.mentor
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                      <AvatarImage src="/placeholder.svg?height=24&width=24" />
                    </Avatar>
                    <span>{session.mentor}</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(session.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{session.duration}</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {session.hasTranscript && (
                        <Button variant="outline" size="sm" className="h-8 gap-1">
                          <Download className="h-3 w-3" />
                          Transcript
                        </Button>
                      )}
                      {session.hasRecording && (
                        <Button variant="outline" size="sm" className="h-8 gap-1">
                          <Download className="h-3 w-3" />
                          Recording
                        </Button>
                      )}
                      <Button size="sm" className="h-8 ml-auto">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        <TabsContent value="ai" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {aiSessions.map((session) => (
              <Card key={session.id}>
                <CardHeader className="pb-2">
                  <Badge variant="outline" className="mb-2">
                    AI Mentor
                  </Badge>
                  <CardTitle className="text-xl">{session.topic}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>AI</AvatarFallback>
                      <AvatarImage src="/placeholder.svg?height=24&width=24" />
                    </Avatar>
                    <span>AI Mentor</span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {new Date(session.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span>{session.duration}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      <span>{session.questions} questions</span>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" className="h-8 gap-1">
                        <Download className="h-3 w-3" />
                        Transcript
                      </Button>
                      <Button size="sm" className="h-8 ml-auto">
                        View Conversation
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

