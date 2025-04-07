import { getUserFromCookie } from "@/lib/auth"

export async function getServerUser() {
  try {
    const { user } = await getUserFromCookie()
    return { user, error: null }
  } catch (error) {
    console.error("Error getting server user:", error)
    return { user: null, error }
  }
}

