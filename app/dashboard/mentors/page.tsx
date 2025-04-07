"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, Search, Filter, Loader2 } from "lucide-react"
import { getMentors, bookMentorSession } from "@/lib/actions"
import { useToast } from "@/components/ui/use-toast"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { format, addDays } from "date-fns"

interface Mentor {
  id: string
  user_id: string
  name: string
  title: string
  expertise: string[]
  rating: number
  reviews: number
  available: boolean
  image: string
}

export default function MentorsPage() {
  const [mentors, setMentors] = useState<Mentor[]>([])
  const [filteredMentors, setFilteredMentors] = useState<Mentor[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [isLoading, setIsLoading] = useState(true)
  const [isBooking, setIsBooking] = useState(false)
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null)
  const [bookingData, setBookingData] = useState({
    date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
    time: "10:00",
    topic: "",
    duration: 60,
  })
  const [dialogOpen, setDialogOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    async function fetchMentors() {
      try {
        const result = await getMentors()
        if (result.success && result.data) {
          setMentors(result.data)
          setFilteredMentors(result.data)
        } else {
          throw new Error(result.error || "Failed to fetch mentors")
        }
      } catch (error) {
        console.error("Failed to fetch mentors:", error)
        toast({
          variant: "destructive",
          title: "Error loading mentors",
          description: "Failed to load mentor data. Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchMentors()
  }, [toast])

  useEffect(() => {
    // Filter mentors based on search query and active tab
    let filtered = [...mentors]

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (mentor) =>
          mentor.name.toLowerCase().includes(query) ||
          mentor.expertise.some((skill) => skill.toLowerCase().includes(query)),
      )
    }

    // Apply tab filter
    if (activeTab === "available") {
      filtered = filtered.filter((mentor) => mentor.available)
    } else if (activeTab === "top-rated") {
      filtered = filtered.sort((a, b) => b.rating - a.rating).slice(0, 3)
    } else if (activeTab === "recommended") {
      // For demo purposes, we'll just show a subset
      filtered = filtered.filter((_, i) => i % 2 === 0)
    }

    setFilteredMentors(filtered)
  }, [searchQuery, activeTab, mentors])

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const handleTabChange = (value) => {
    setActiveTab(value)
  }

  const handleBookingChange = (e) => {
    const { name, value } = e.target
    setBookingData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleBookSession = (mentor) => {
    setSelectedMentor(mentor)
    setDialogOpen(true)
  }

  const handleSubmitBooking = async () => {
    try {
      setIsBooking(true)

      // Combine date and time for start time
      const startTime = new Date(`${bookingData.date}T${bookingData.time}:00`)

      const result = await bookMentorSession(
        selectedMentor.id,
        startTime.toISOString(),
        bookingData.topic,
        Number.parseInt(bookingData.duration),
      )

      if (result.success) {
        toast({
          title: "Session booked!",
          description: `Your session with ${selectedMentor.name} has been scheduled.`,
        })
        setDialogOpen(false)

        // Reset booking data
        setBookingData({
          date: format(addDays(new Date(), 1), "yyyy-MM-dd"),
          time: "10:00",
          topic: "",
          duration: 60,
        })
      } else {
        throw new Error(result.error || "Failed to book session")
      }
    } catch (error) {
      console.error("Error booking session:", error)
      toast({
        variant: "destructive",
        title: "Booking failed",
        description: error.message || "Failed to book your session. Please try again.",
      })
    } finally {
      setIsBooking(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading mentors...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Find Mentors</h2>
        <p className="text-muted-foreground">Connect with expert mentors in your field</p>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search mentors by name or expertise..."
            className="pl-8"
            value={searchQuery}
            onChange={handleSearch}
          />
        </div>
        <Button variant="outline" className="gap-2">
          <Filter className="h-4 w-4" />
          Filters
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Mentors</TabsTrigger>
          <TabsTrigger value="available">Available Now</TabsTrigger>
          <TabsTrigger value="top-rated">Top Rated</TabsTrigger>
          <TabsTrigger value="recommended">Recommended</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          {filteredMentors.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredMentors.map((mentor) => (
                <Card key={mentor.id} className="overflow-hidden">
                  <CardHeader className="p-0">
                    <div className="relative h-40 w-full bg-gradient-to-r from-primary/20 to-secondary/20">
                      <div className="absolute bottom-4 left-4 flex items-center gap-3">
                        <div className="h-16 w-16 rounded-full bg-background p-1">
                          <img
                            src={mentor.image || "/placeholder.svg"}
                            alt={mentor.name}
                            className="h-full w-full rounded-full object-cover"
                          />
                        </div>
                        <div>
                          <CardTitle className="text-lg text-white drop-shadow-md">{mentor.name}</CardTitle>
                          <CardDescription className="text-white/90 drop-shadow-md">{mentor.title}</CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center gap-1">
                      <div className="flex">
                        {Array(5)
                          .fill(0)
                          .map((_, i) => (
                            <Star
                              key={i}
                              className={`h-4 w-4 ${i < Math.floor(mentor.rating) ? "text-yellow-500 fill-yellow-500" : "text-muted"}`}
                            />
                          ))}
                      </div>
                      <span className="text-sm font-medium">{mentor.rating}</span>
                      <span className="text-xs text-muted-foreground">({mentor.reviews} reviews)</span>
                    </div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {mentor.expertise.map((skill, i) => (
                        <Badge key={i} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`h-2 w-2 rounded-full ${mentor.available ? "bg-green-500" : "bg-red-500"}`} />
                      <span className="text-xs font-medium">
                        {mentor.available ? "Available for sessions" : "Currently unavailable"}
                      </span>
                    </div>
                    {mentor.hourlyRate && <div className="mt-2 text-sm font-medium">${mentor.hourlyRate}/hour</div>}
                  </CardContent>
                  <CardFooter className="flex gap-2 p-4 pt-0">
                    <Button className="flex-1" onClick={() => handleBookSession(mentor)}>
                      Book Session
                    </Button>
                    <Button variant="outline" className="flex-1">
                      View Profile
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No mentors found matching your criteria.</p>
              <Button
                variant="link"
                onClick={() => {
                  setSearchQuery("")
                  setActiveTab("all")
                }}
              >
                Clear filters
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Book a Session</DialogTitle>
            <DialogDescription>
              {selectedMentor && `Schedule a mentorship session with ${selectedMentor.name}`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="date">Date</Label>
                <Input
                  id="date"
                  name="date"
                  type="date"
                  value={bookingData.date}
                  onChange={handleBookingChange}
                  min={format(new Date(), "yyyy-MM-dd")}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="time">Time</Label>
                <Input id="time" name="time" type="time" value={bookingData.time} onChange={handleBookingChange} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="duration">Duration (minutes)</Label>
              <Input
                id="duration"
                name="duration"
                type="number"
                value={bookingData.duration}
                onChange={handleBookingChange}
                min="15"
                max="120"
                step="15"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="topic">Topic</Label>
              <Textarea
                id="topic"
                name="topic"
                placeholder="What would you like to discuss in this session?"
                value={bookingData.topic}
                onChange={handleBookingChange}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmitBooking} disabled={isBooking || !bookingData.topic}>
              {isBooking && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isBooking ? "Booking..." : "Book Session"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

