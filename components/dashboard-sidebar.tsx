"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Home, Users, Calendar, MessageSquare, Bot, History, Settings, LogOut } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/contexts/auth-context"

export function DashboardSidebar() {
  const pathname = usePathname()
  const { user, signOut } = useAuth()

  const routes = [
    {
      href: "/dashboard",
      icon: Home,
      title: "Dashboard",
    },
    {
      href: "/dashboard/mentors",
      icon: Users,
      title: "Find Mentors",
    },
    {
      href: "/dashboard/sessions",
      icon: Calendar,
      title: "My Sessions",
    },
    {
      href: "/dashboard/messages",
      icon: MessageSquare,
      title: "Messages",
    },
    {
      href: "/dashboard/ai-mentor",
      icon: Bot,
      title: "AI Mentor",
    },
    {
      href: "/dashboard/history",
      icon: History,
      title: "Session History",
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
              <p className="text-sm font-medium">{user?.user_metadata?.full_name || "User"}</p>
              <p className="text-xs text-muted-foreground">{user?.user_metadata?.user_type || "User"}</p>
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

