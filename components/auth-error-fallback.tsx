"use client"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/auth-context"
import { useRouter } from "next/navigation"
import { AlertCircle, RefreshCw } from "lucide-react"

export function AuthErrorFallback() {
  const { retryAuth } = useAuth()
  const router = useRouter()

  const handleRetry = async () => {
    await retryAuth()
    router.refresh()
  }

  const handleGoToLogin = () => {
    router.push("/login")
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4 text-center">
      <AlertCircle className="h-16 w-16 text-destructive mb-4" />
      <h2 className="text-2xl font-bold mb-2">Authentication Error</h2>
      <p className="text-muted-foreground mb-6 max-w-md">
        We're having trouble connecting to the authentication service. This could be due to network issues or server
        problems.
      </p>
      <div className="flex flex-col sm:flex-row gap-4">
        <Button onClick={handleRetry} className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Retry Connection
        </Button>
        <Button variant="outline" onClick={handleGoToLogin}>
          Go to Login
        </Button>
      </div>
    </div>
  )
}

