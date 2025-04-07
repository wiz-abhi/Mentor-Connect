"use client"

import Link from "next/link"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Menu, X } from "lucide-react"
import { useAuth } from "@/contexts/auth-context"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const { user, signOut, isLoading } = useAuth()
  const [isMounted, setIsMounted] = useState(false)

  // Ensure we only render user-dependent UI after mounting to avoid hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    // Force a hard refresh after sign out
    window.location.href = "/"
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center space-x-2">
          <span className="text-xl font-bold">MentorConnect</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6">
          <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4">
            About
          </Link>
          <Link href="/mentors" className="text-sm font-medium hover:underline underline-offset-4">
            Find Mentors
          </Link>
          <Link href="/ai-mentor" className="text-sm font-medium hover:underline underline-offset-4">
            AI Mentor
          </Link>
        </nav>
        <div className="hidden md:flex items-center gap-4">
          <ModeToggle />
          {isMounted
            ? !isLoading &&
              (user ? (
                <>
                  <Link href="/dashboard">
                    <Button variant="outline" size="sm">
                      Dashboard
                    </Button>
                  </Link>
                  <Button size="sm" onClick={handleSignOut}>
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="outline" size="sm">
                      Log In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </>
              ))
            : null}
        </div>
        <button className="md:hidden" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Toggle menu">
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
      {isMenuOpen && (
        <div className="container md:hidden py-4 flex flex-col gap-4">
          <Link href="/about" className="text-sm font-medium hover:underline underline-offset-4">
            About
          </Link>
          <Link href="/mentors" className="text-sm font-medium hover:underline underline-offset-4">
            Find Mentors
          </Link>
          <Link href="/ai-mentor" className="text-sm font-medium hover:underline underline-offset-4">
            AI Mentor
          </Link>
          <div className="flex flex-col gap-2 pt-2 border-t">
            {isMounted
              ? !isLoading &&
                (user ? (
                  <>
                    <Link href="/dashboard">
                      <Button variant="outline" className="w-full" size="sm">
                        Dashboard
                      </Button>
                    </Link>
                    <Button className="w-full" size="sm" onClick={handleSignOut}>
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="outline" className="w-full" size="sm">
                        Log In
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button className="w-full" size="sm">
                        Sign Up
                      </Button>
                    </Link>
                  </>
                ))
              : null}
          </div>
        </div>
      )}
    </header>
  )
}

