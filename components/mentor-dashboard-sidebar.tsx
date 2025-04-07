"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Users, Calendar, MessageSquare, Video, Clock, Settings, LogOut, DollarSign, Star } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/contexts/auth-context"

export function MentorDashboardSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const routes = [
    {
      href: "/dashboard",
      icon: Home,
      title: "Dashboard",
    },
    {
      href: "/dashboard/schedule",
      icon: Calendar,
      title: "My Schedule",
    },
    {
      href: "/dashboard/sessions",
      icon: Video,
      title: "Active Sessions",
    },
    {
      href: "/dashboard/upcoming",
      icon: Clock,
      title: "Upcoming Sessions",
    },
    {
      href: "/dashboard/messages",
      icon: MessageSquare,
      title: "Messages",
    },
    {
      href: "/dashboard/mentees",
      icon: Users,
      title: "My Mentees",
    },
    {
      href: "/dashboard/earnings",
      icon: DollarSign,
      title: "Earnings",
    },
    {
      href: "/dashboard/reviews",
      icon: Star,
      title: "Reviews",
    },
    {
      href: "/dashboard/settings",
      icon: Settings,
      title: "Settings",
    },
  ]

  const handleSignOut = async () => {
    await signOut()
    // Force a hard refresh after sign out
    window.location.href = "/"
  }

  return (
    <div className="flex h-screen w-[250px] flex-col border-r bg-muted/40">
      <div className="flex h-14 items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-lg font-bold">MentorConnect</span>
        </Link>
      </div>
      <div className="flex-1 overflow-auto py-2">
        <div className="px-4 py-2">
          <div className="rounded-lg bg-primary/10 p-3 text-center">
            <div className="text-sm font-medium">Mentor Dashboard</div>
          </div>
        </div>
        <nav className="grid gap-1 px-2">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
                pathname === route.href ? "bg-accent text-accent-foreground" : "transparent",
              )}
            >
              <route.icon className="h-4 w-4" />
              {route.title}
            </Link>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary/10" />
            <div>
              <p className="text-sm font-medium">{user?.user_metadata?.full_name || "Mentor"}</p>
              <p className="text-xs text-muted-foreground">Mentor</p>
            </div>
          </div>
          <ModeToggle />
        </div>
        <Button variant="outline" className="mt-4 w-full justify-start gap-2" size="sm" onClick={handleSignOut}>
          <LogOut className="h-4 w-4" />
          Log Out
        </Button>
      </div>
    </div>
  )
}

