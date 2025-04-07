"use client"

import type React from "react"
import { DashboardSidebar } from "@/components/dashboard-sidebar"
import { MentorDashboardSidebar } from "@/components/mentor-dashboard-sidebar"
import { useAuth } from "@/contexts/auth-context"
import { AuthErrorFallback } from "@/components/auth-error-fallback"
import { Loader2 } from "lucide-react"
import { useEffect, useState } from "react"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, isLoading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  // Log authentication state for debugging
  useEffect(() => {
    console.log("Dashboard layout auth state:", { user: user?.id, isLoading })
    setIsMounted(true)
  }, [user, isLoading])

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  // If we're not loading and there's no user, show the auth error fallback
  if (!user) {
    return <AuthErrorFallback />
  }

  // Determine if user is a mentor or mentee
  const isMentor = user.user_metadata?.user_type === "mentor"

  // Only render the content after client-side hydration
  if (!isMounted) {
    return null
  }

  // Normal dashboard layout
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1">
        {isMentor ? <MentorDashboardSidebar /> : <DashboardSidebar />}
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  )
}

