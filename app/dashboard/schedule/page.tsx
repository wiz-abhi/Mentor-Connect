"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { Clock, Save } from "lucide-react"

export default function MentorSchedulePage() {
  const [date, setDate] = useState<Date | undefined>(new Date())
  const [availableDays, setAvailableDays] = useState({
    monday: true,
    tuesday: true,
    wednesday: true,
    thursday: true,
    friday: true,
    saturday: false,
    sunday: false,
  })
  const [timeSlots, setTimeSlots] = useState([
    { id: 1, day: "monday", start: "09:00", end: "10:00", isAvailable: true },
    { id: 2, day: "monday", start: "10:00", end: "11:00", isAvailable: true },
    { id: 3, day: "monday", start: "11:00", end: "12:00", isAvailable: true },
    { id: 4, day: "tuesday", start: "09:00", end: "10:00", isAvailable: true },
    { id: 5, day: "tuesday", start: "10:00", end: "11:00", isAvailable: true },
    { id: 6, day: "wednesday", start: "14:00", end: "15:00", isAvailable: true },
    { id: 7, day: "wednesday", start: "15:00", end: "16:00", isAvailable: true },
    { id: 8, day: "thursday", start: "09:00", end: "10:00", isAvailable: true },
    { id: 9, day: "thursday", start: "10:00", end: "11:00", isAvailable: true },
    { id: 10, day: "friday", start: "13:00", end: "14:00", isAvailable: true },
    { id: 11, day: "friday", start: "14:00", end: "15:00", isAvailable: true },
  ])
  const { toast } = useToast()

  const toggleDayAvailability = (day: string) => {
    setAvailableDays((prev) => ({
      ...prev,
      [day]: !prev[day as keyof typeof prev],
    }))

    // Update time slots for this day
    setTimeSlots((prev) =>
      prev.map((slot) => {
        if (slot.day === day) {
          return { ...slot, isAvailable: !availableDays[day as keyof typeof availableDays] }
        }
        return slot
      }),
    )
  }

  const toggleTimeSlot = (id: number) => {
    setTimeSlots((prev) =>
      prev.map((slot) => {
        if (slot.id === id) {
          return { ...slot, isAvailable: !slot.isAvailable }
        }
        return slot
      }),
    )
  }

  const addTimeSlot = (day: string, start: string, end: string) => {
    const newId = Math.max(0, ...timeSlots.map((slot) => slot.id)) + 1
    setTimeSlots((prev) => [
      ...prev,
      {
        id: newId,
        day,
        start,
        end,
        isAvailable: true,
      },
    ])
  }

  const saveSchedule = () => {
    // In a real app, you would save this to your backend
    console.log("Saving schedule:", { availableDays, timeSlots })

    toast({
      title: "Schedule saved",
      description: "Your availability has been updated successfully.",
    })
  }

  const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]
  const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Manage Your Schedule</h2>
        <p className="text-muted-foreground">Set your availability for mentorship sessions</p>
      </div>

      <Tabs defaultValue="weekly" className="space-y-4">
        <TabsList>
          <TabsTrigger value="weekly">Weekly Schedule</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
          <TabsTrigger value="upcoming">Upcoming Sessions</TabsTrigger>
        </TabsList>

        <TabsContent value="weekly" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Available Days</CardTitle>
                <CardDescription>Set which days of the week you're available for sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {days.map((day, index) => (
                    <div key={day} className="flex items-center justify-between">
                      <Label htmlFor={`day-${day}`} className="flex-1">
                        {dayNames[index]}
                      </Label>
                      <Switch
                        id={`day-${day}`}
                        checked={availableDays[day as keyof typeof availableDays]}
                        onCheckedChange={() => toggleDayAvailability(day)}
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Add Time Slot</CardTitle>
                <CardDescription>Create a new available time slot</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault()
                    const form = e.target as HTMLFormElement
                    const day = (form.elements.namedItem("day") as HTMLSelectElement).value
                    const start = (form.elements.namedItem("start") as HTMLSelectElement).value
                    const end = (form.elements.namedItem("end") as HTMLSelectElement).value

                    if (start >= end) {
                      toast({
                        variant: "destructive",
                        title: "Invalid time range",
                        description: "End time must be after start time.",
                      })
                      return
                    }

                    addTimeSlot(day, start, end)
                    form.reset()
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="day">Day</Label>
                    <Select name="day" defaultValue="monday">
                      <SelectTrigger>
                        <SelectValue placeholder="Select day" />
                      </SelectTrigger>
                      <SelectContent>
                        {days.map((day, index) => (
                          <SelectItem key={day} value={day}>
                            {dayNames[index]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start">Start Time</Label>
                      <Select name="start" defaultValue="09:00">
                        <SelectTrigger>
                          <SelectValue placeholder="Start time" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 13 }, (_, i) => {
                            const hour = i + 8 // Start from 8 AM
                            return `${hour.toString().padStart(2, "0")}:00`
                          }).map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end">End Time</Label>
                      <Select name="end" defaultValue="10:00">
                        <SelectTrigger>
                          <SelectValue placeholder="End time" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 13 }, (_, i) => {
                            const hour = i + 9 // Start from 9 AM
                            return `${hour.toString().padStart(2, "0")}:00`
                          }).map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Button type="submit" className="w-full">
                    Add Time Slot
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Your Time Slots</CardTitle>
              <CardDescription>Manage your available time slots for mentorship sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {days.map((day, dayIndex) => (
                  <div key={day} className={availableDays[day as keyof typeof availableDays] ? "" : "opacity-50"}>
                    <h3 className="font-medium mb-2">{dayNames[dayIndex]}</h3>
                    <div className="grid gap-2">
                      {timeSlots
                        .filter((slot) => slot.day === day)
                        .map((slot) => (
                          <div
                            key={slot.id}
                            className={`flex items-center justify-between rounded-md border p-3 ${
                              !availableDays[day as keyof typeof availableDays] || !slot.isAvailable ? "bg-muted" : ""
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <Clock className="h-4 w-4 text-muted-foreground" />
                              <span>
                                {slot.start} - {slot.end}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Switch
                                checked={slot.isAvailable && availableDays[day as keyof typeof availableDays]}
                                onCheckedChange={() => toggleTimeSlot(slot.id)}
                                disabled={!availableDays[day as keyof typeof availableDays]}
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setTimeSlots((prev) => prev.filter((s) => s.id !== slot.id))
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          </div>
                        ))}
                      {timeSlots.filter((slot) => slot.day === day).length === 0 && (
                        <div className="text-center py-4 text-muted-foreground">No time slots added for this day</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <Button className="mt-6 w-full" onClick={saveSchedule}>
                <Save className="mr-2 h-4 w-4" />
                Save Schedule
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendar View</CardTitle>
              <CardDescription>View and manage your schedule in a calendar format</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-4">
                <Calendar mode="single" selected={date} onSelect={setDate} className="rounded-md border" />

                <div className="w-full max-w-md space-y-4">
                  <h3 className="font-medium">
                    {date?.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                  </h3>

                  <div className="space-y-2">
                    {date && (
                      <>
                        <div className="rounded-md border p-4">
                          <div className="font-medium">Available Time Slots</div>
                          <div className="mt-2 space-y-2">
                            {timeSlots
                              .filter(
                                (slot) =>
                                  slot.day.toLowerCase() ===
                                    date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() &&
                                  slot.isAvailable,
                              )
                              .map((slot) => (
                                <div key={slot.id} className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span>
                                      {slot.start} - {slot.end}
                                    </span>
                                  </div>
                                  <Button variant="outline" size="sm">
                                    Edit
                                  </Button>
                                </div>
                              ))}
                            {timeSlots.filter(
                              (slot) =>
                                slot.day.toLowerCase() ===
                                  date.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase() &&
                                slot.isAvailable,
                            ).length === 0 && (
                              <div className="text-center py-2 text-muted-foreground">
                                No available time slots for this day
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="rounded-md border p-4">
                          <div className="font-medium">Booked Sessions</div>
                          <div className="mt-2 space-y-2">
                            {/* This would show actual booked sessions from the database */}
                            <div className="text-center py-2 text-muted-foreground">
                              No booked sessions for this day
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
              <CardDescription>View and manage your upcoming mentorship sessions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* This would show actual upcoming sessions from the database */}
                <div className="rounded-md border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">Session with John Doe</div>
                    <div className="text-sm text-muted-foreground">Tomorrow, 10:00 AM - 11:00 AM</div>
                    <div className="text-sm">Topic: React Fundamentals</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                    <Button size="sm">Join</Button>
                  </div>
                </div>

                <div className="rounded-md border p-4 flex items-center justify-between">
                  <div>
                    <div className="font-medium">Session with Jane Smith</div>
                    <div className="text-sm text-muted-foreground">Friday, 2:00 PM - 3:00 PM</div>
                    <div className="text-sm">Topic: Career Guidance</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm">
                      Reschedule
                    </Button>
                    <Button size="sm">Join</Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

