"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useToast } from "@/components/ui/use-toast"

type User = {
  id: string
  email: string
  full_name: string
  user_type: "mentor" | "mentee"
  avatar_url?: string | null
  bio?: string | null
  user_metadata: {
    full_name: string
    user_type: "mentor" | "mentee"
  }
}

type AuthContextType = {
  user: User | null
  isLoading: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (
    email: string,
    password: string,
    fullName: string,
    userType: "mentor" | "mentee",
  ) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
  retryAuth: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => ({ success: false }),
  signUp: async () => ({ success: false }),
  signOut: async () => {},
  retryAuth: async () => {},
})

export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const { toast } = useToast()
  const router = useRouter()

  // Function to fetch the current user
  const fetchUser = async () => {
    try {
      const response = await fetch("/api/auth/user")
      const data = await response.json()

      if (data.user) {
        setUser(data.user)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Initial auth check
  useEffect(() => {
    fetchUser()
  }, [])

  // Sign in function
  const signIn = async (email: string, password: string) => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to sign in" }
      }

      setUser(data.user)
      return { success: true }
    } catch (error) {
      console.error("Error signing in:", error)
      return { success: false, error: "An unexpected error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign up function
  const signUp = async (email: string, password: string, fullName: string, userType: "mentor" | "mentee") => {
    try {
      setIsLoading(true)

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, fullName, userType }),
      })

      const data = await response.json()

      if (!response.ok) {
        return { success: false, error: data.error || "Failed to sign up" }
      }

      return { success: true }
    } catch (error) {
      console.error("Error signing up:", error)
      return { success: false, error: "An unexpected error occurred" }
    } finally {
      setIsLoading(false)
    }
  }

  // Sign out function
  const signOut = async () => {
    try {
      setIsLoading(true)

      await fetch("/api/auth/logout", {
        method: "POST",
      })

      setUser(null)
      router.push("/")
    } catch (error) {
      console.error("Error signing out:", error)
      toast({
        variant: "destructive",
        title: "Sign Out Error",
        description: "An unexpected error occurred. Please try again.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Function to retry authentication
  const retryAuth = async () => {
    setIsLoading(true)
    await fetchUser()
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        signIn,
        signUp,
        signOut,
        retryAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

