"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Calendar, Clock, Users, MessageSquare, Star, TrendingUp } from "lucide-react"
import { getDashboardData } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState({
    totalSessions: 0,
    totalHours: 0,
    connectionsCount: 0,
    aiChatCount: 0,
    topMentors: [],
    upcomingSessions: [],
    previousMonth: {
      sessions: 0,
      hours: 0,
      connections: 0,
      aiChats: 0,
    },
  })
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchData() {
      try {
        const data = await getDashboardData()
        setDashboardData(data)
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
        toast({
          variant: "destructive",
          title: "Error loading dashboard",
          description: "Failed to load your dashboard data. Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [toast])

  // Format date for upcoming sessions
  const formatSessionDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString("en-US", {
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your mentorship journey.</p>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Sessions</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalSessions}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.totalSessions - dashboardData.previousMonth.sessions > 0 ? "+" : ""}
                  {dashboardData.totalSessions - dashboardData.previousMonth.sessions} from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Hours of Mentorship</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.totalHours}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.totalHours - dashboardData.previousMonth.hours > 0 ? "+" : ""}
                  {(dashboardData.totalHours - dashboardData.previousMonth.hours).toFixed(1)} from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mentors Connected</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.connectionsCount}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.connectionsCount - dashboardData.previousMonth.connections > 0 ? "+" : ""}
                  {dashboardData.connectionsCount - dashboardData.previousMonth.connections} from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">AI Mentor Chats</CardTitle>
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{dashboardData.aiChatCount}</div>
                <p className="text-xs text-muted-foreground">
                  {dashboardData.aiChatCount - dashboardData.previousMonth.aiChats > 0 ? "+" : ""}
                  {dashboardData.aiChatCount - dashboardData.previousMonth.aiChats} from last month
                </p>
              </CardContent>
            </Card>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Growth Progress</CardTitle>
                <CardDescription>Your skill development over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full rounded-md bg-muted/60 flex items-center justify-center">
                  <TrendingUp className="h-8 w-8 text-muted-foreground/60" />
                </div>
              </CardContent>
            </Card>
            <Card className="col-span-3">
              <CardHeader>
                <CardTitle>Top Rated Mentors</CardTitle>
                <CardDescription>Mentors with highest ratings</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData.topMentors.length > 0 ? (
                    dashboardData.topMentors.map((mentor, i) => (
                      <div key={mentor.mentor.id} className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-full bg-primary/10 overflow-hidden">
                          {mentor.mentor.avatar_url ? (
                            <img
                              src={mentor.mentor.avatar_url || "/placeholder.svg"}
                              alt={mentor.mentor.full_name}
                              className="h-full w-full object-cover"
                            />
                          ) : null}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{mentor.mentor.full_name}</p>
                          <div className="flex items-center">
                            {Array(5)
                              .fill(0)
                              .map((_, j) => (
                                <Star
                                  key={j}
                                  className={`h-3 w-3 ${j < mentor.rating ? "text-yellow-500" : "text-muted"}`}
                                  fill={j < mentor.rating ? "currentColor" : "none"}
                                />
                              ))}
                          </div>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">No mentor ratings available yet</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>Your scheduled mentorship sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData.upcomingSessions.length > 0 ? (
                  dashboardData.upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-4 rounded-lg border p-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <Calendar className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">
                          Session with {session.mentor?.full_name || session.mentee?.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground">{formatSessionDate(session.start_time)}</p>
                        <p className="text-sm text-muted-foreground">Topic: {session.topic}</p>
                      </div>
                      <Button>Join</Button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    No upcoming sessions scheduled.
                    <Button variant="link" className="px-1">
                      Find a mentor
                    </Button>
                    to book your first session.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="recommendations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recommended Mentors</CardTitle>
              <CardDescription>Based on your interests and goals</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {isLoading ? (
                  <div className="text-center py-4">Loading recommendations...</div>
                ) : (
                  <>
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10" />
                        <div className="flex-1">
                          <p className="font-medium">Recommended Mentor {i}</p>
                          <p className="text-sm text-muted-foreground">Expert in Web Development, AI, Cloud</p>
                        </div>
                        <Button variant="outline">View Profile</Button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

