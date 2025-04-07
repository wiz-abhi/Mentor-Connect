"use client"

import { useState, useEffect, ChangeEvent } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { useToast } from "@/components/ui/use-toast"
import { useAuth } from "@/contexts/auth-context"
import { getUserProfile, updateUserProfile } from "@/lib/db"

import { Loader2, Bell, Lock, User, CreditCard } from "lucide-react"

interface ProfileData {
  fullName: string
  email: string
  bio: string
  avatarUrl: string
  expertise: string[]
  hourlyRate: string
  isAvailable: boolean
  emailNotifications: boolean
  sessionReminders: boolean
  marketingEmails: boolean
  timezone: string
  language: string
}

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [profileData, setProfileData] = useState<ProfileData>({
    fullName: "",
    email: "",
    bio: "",
    avatarUrl: "",
    expertise: [],
    hourlyRate: "",
    isAvailable: true,
    emailNotifications: true,
    sessionReminders: true,
    marketingEmails: false,
    timezone: "UTC",
    language: "en",
  })

  useEffect(() => {
    async function fetchUserData() {
      if (!user) return

      try {
        setIsLoading(true)
        const userData = await getUserProfile(user.id)

        if (!userData) {
          throw new Error("User profile not found")
        }

        setProfileData({
          fullName: userData.full_name || "",
          email: userData.email || "",
          bio: userData.bio || "",
          avatarUrl: userData.avatar_url || "",
          expertise: userData.expertise || [],
          hourlyRate: userData.hourly_rate || "",
          isAvailable: userData.is_available ?? true,
          emailNotifications: true,
          sessionReminders: true,
          marketingEmails: false,
          timezone: "UTC",
          language: "en",
        })
      } catch (error) {
        console.error("Error fetching user data:", error)
        toast({
          variant: "destructive",
          title: "Error loading profile",
          description: "Failed to load your profile data. Please try again later.",
        })
      } finally {
        setIsLoading(false)
      }
    }

    fetchUserData()
  }, [user, toast])

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSwitchChange = (name: keyof ProfileData) => (checked: boolean) => {
    setProfileData((prev) => ({
      ...prev,
      [name]: checked,
    }))
  }

  const handleSelectChange = (name: keyof ProfileData) => (value: string) => {
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSaveProfile = async () => {
    if (!user) return

    try {
      setIsSaving(true)

      await updateUserProfile(user.id, {
        full_name: profileData.fullName,
        bio: profileData.bio,
        avatar_url: profileData.avatarUrl,
        expertise: user.user_metadata?.user_type === "mentor" ? profileData.expertise : undefined,
        hourly_rate: user.user_metadata?.user_type === "mentor" ? Number.parseFloat(profileData.hourlyRate) : undefined,
        is_available: user.user_metadata?.user_type === "mentor" ? profileData.isAvailable : undefined,
      })

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated.",
      })
    } catch (error) {
      console.error("Error updating profile:", error)
      toast({
        variant: "destructive",
        title: "Error saving profile",
        description: "Failed to save your profile data. Please try again later.",
      })
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your account settings and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="account" className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            Account
          </TabsTrigger>
          {user?.user_metadata?.user_type === "mentor" && (
            <TabsTrigger value="billing" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Billing
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information and public profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex flex-col items-center space-y-2">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback>
                      {profileData.fullName
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                    {profileData.avatarUrl && <AvatarImage src={profileData.avatarUrl} alt={profileData.fullName} />}
                  </Avatar>
                  <Button variant="outline" size="sm">
                    Change Avatar
                  </Button>
                </div>

                <div className="flex-1 space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input id="fullName" name="fullName" value={profileData.fullName} onChange={handleInputChange} />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" value={profileData.email} disabled />
                    <p className="text-xs text-muted-foreground">
                      Your email cannot be changed. Contact support if you need to update it.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="bio">Bio</Label>
                    <Textarea
                      id="bio"
                      name="bio"
                      value={profileData.bio}
                      onChange={handleInputChange}
                      placeholder="Tell others about yourself..."
                      className="min-h-[120px]"
                    />
                  </div>
                </div>
              </div>

              {user?.user_metadata?.user_type === "mentor" && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Mentor Profile</h3>

                  <div className="grid gap-2">
                    <Label htmlFor="expertise">Areas of Expertise</Label>
                    <Select
                      value={profileData.expertise[0] || ""}
                      onValueChange={(value) => {
                        setProfileData((prev) => ({
                          ...prev,
                          expertise: [value, ...prev.expertise.slice(1)],
                        }))
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select your primary expertise" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Web Development">Web Development</SelectItem>
                        <SelectItem value="Mobile Development">Mobile Development</SelectItem>
                        <SelectItem value="Data Science">Data Science</SelectItem>
                        <SelectItem value="Machine Learning">Machine Learning</SelectItem>
                        <SelectItem value="UX/UI Design">UX/UI Design</SelectItem>
                        <SelectItem value="Product Management">Product Management</SelectItem>
                        <SelectItem value="DevOps">DevOps</SelectItem>
                        <SelectItem value="Cloud Architecture">Cloud Architecture</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      You can add more expertise areas in your detailed profile.
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                    <Input
                      id="hourlyRate"
                      name="hourlyRate"
                      type="number"
                      value={profileData.hourlyRate}
                      onChange={handleInputChange}
                      placeholder="0.00"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="isAvailable"
                      checked={profileData.isAvailable}
                      onCheckedChange={handleSwitchChange("isAvailable")}
                    />
                    <Label htmlFor="isAvailable">Available for new mentees</Label>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Manage how and when you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Email Notifications</h3>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="emailNotifications">All Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive all notifications via email</p>
                  </div>
                  <Switch
                    id="emailNotifications"
                    checked={profileData.emailNotifications}
                    onCheckedChange={handleSwitchChange("emailNotifications")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="sessionReminders">Session Reminders</Label>
                    <p className="text-sm text-muted-foreground">Receive reminders before scheduled sessions</p>
                  </div>
                  <Switch
                    id="sessionReminders"
                    checked={profileData.sessionReminders}
                    onCheckedChange={handleSwitchChange("sessionReminders")}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="marketingEmails">Marketing Emails</Label>
                    <p className="text-sm text-muted-foreground">Receive updates about new features and promotions</p>
                  </div>
                  <Switch
                    id="marketingEmails"
                    checked={profileData.marketingEmails}
                    onCheckedChange={handleSwitchChange("marketingEmails")}
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Preferences</h3>

                <div className="grid gap-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select
                    value={profileData.timezone}
                    onValueChange={(value: string) => handleSelectChange("timezone")(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC">UTC</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="Europe/London">London (GMT)</SelectItem>
                      <SelectItem value="Europe/Paris">Central European Time (CET)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Japan (JST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={profileData.language} onValueChange={handleSelectChange("language")}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your language" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                      <SelectItem value="ja">Japanese</SelectItem>
                      <SelectItem value="zh">Chinese</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="account" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Account Security</CardTitle>
              <CardDescription>Manage your account security settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-medium">Change Password</h3>

                <div className="grid gap-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input id="currentPassword" type="password" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input id="newPassword" type="password" />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input id="confirmPassword" type="password" />
                </div>

                <Button>Update Password</Button>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <h3 className="font-medium">Account Management</h3>

                <div className="grid gap-2">
                  <Button variant="outline">Download My Data</Button>
                  <Button variant="destructive">Delete Account</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {user?.user_metadata?.user_type === "mentor" && (
          <TabsContent value="billing" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Billing Information</CardTitle>
                <CardDescription>Manage your payment methods and billing history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium">Payment Methods</h3>

                  <div className="rounded-lg border p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <CreditCard className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="font-medium">•••• •••• •••• 4242</p>
                          <p className="text-sm text-muted-foreground">Expires 12/2025</p>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        Remove
                      </Button>
                    </div>
                  </div>

                  <Button variant="outline">Add Payment Method</Button>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Billing History</h3>

                  <div className="rounded-lg border divide-y">
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Mentorship Earnings - May 2023</p>
                        <p className="text-sm text-muted-foreground">May 31, 2023</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$240.00</p>
                        <p className="text-xs text-muted-foreground">Paid</p>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Mentorship Earnings - April 2023</p>
                        <p className="text-sm text-muted-foreground">April 30, 2023</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$180.00</p>
                        <p className="text-xs text-muted-foreground">Paid</p>
                      </div>
                    </div>
                    <div className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">Mentorship Earnings - March 2023</p>
                        <p className="text-sm text-muted-foreground">March 31, 2023</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">$320.00</p>
                        <p className="text-xs text-muted-foreground">Paid</p>
                      </div>
                    </div>
                  </div>

                  <Button variant="outline" className="w-full">
                    View All Transactions
                  </Button>
                </div>

                <div className="space-y-4 pt-4 border-t">
                  <h3 className="font-medium">Payout Settings</h3>

                  <div className="grid gap-2">
                    <Label htmlFor="payoutMethod">Payout Method</Label>
                    <Select defaultValue="bank">
                      <SelectTrigger>
                        <SelectValue placeholder="Select payout method" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="bank">Bank Transfer</SelectItem>
                        <SelectItem value="paypal">PayPal</SelectItem>
                        <SelectItem value="stripe">Stripe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="payoutSchedule">Payout Schedule</Label>
                    <Select defaultValue="monthly">
                      <SelectTrigger>
                        <SelectValue placeholder="Select payout schedule" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="biweekly">Bi-weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button onClick={handleSaveProfile} disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}

