import type { NextRequest } from "next/server"
import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import { sql } from "@vercel/postgres"
import bcrypt from "bcryptjs"

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET || "your-secret-key")
const TOKEN_NAME = "auth-token"

export type User = {
  id: string
  email: string
  full_name: string
  user_type: "mentor" | "mentee"
  avatar_url?: string | null
  bio?: string | null
}

export type UserWithMetadata = User & {
  user_metadata: {
    full_name: string
    user_type: "mentor" | "mentee"
  }
}

// Server-side only functions
export async function createUserAccount(
  email: string,
  password: string,
  userData: {
    full_name: string
    user_type: "mentor" | "mentee"
  },
) {
  try {
    // Check if user already exists
    const existingUser = await sql.query("SELECT * FROM users WHERE email = $1", [email])
    if (existingUser.rows.length > 0) {
      return { success: false, error: "User with this email already exists" }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10)

    // Generate a UUID for the user
    const userId = crypto.randomUUID()

    // Insert the user into the database
    const result = await sql.query(
      "INSERT INTO users (id, email, password_hash, full_name, user_type) VALUES ($1, $2, $3, $4, $5) RETURNING id, email, full_name, user_type",
      [userId, email, hashedPassword, userData.full_name, userData.user_type],
    )

    // If user is a mentor, create a mentor profile
    if (userData.user_type === "mentor") {
      await sql.query("INSERT INTO mentor_profiles (user_id, expertise) VALUES ($1, $2)", [userId, "{}"])
    }

    return { success: true, user: result.rows[0] }
  } catch (error) {
    console.error("Error creating user account:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function authenticateUser(email: string, password: string) {
  try {
    // Get user from database
    const result = await sql.query("SELECT * FROM users WHERE email = $1", [email])

    if (result.rows.length === 0) {
      return { success: false, error: "Invalid email or password" }
    }

    const user = result.rows[0]

    // Verify password
    const passwordValid = await bcrypt.compare(password, user.password_hash)

    if (!passwordValid) {
      return { success: false, error: "Invalid email or password" }
    }

    // Create JWT token
    const token = await createJWT(user)

    // Set cookie (only in server context)
    const cookieStore = await cookies()
    cookieStore.set({
      name: TOKEN_NAME,
      value: token,
      httpOnly: true,
      path: "/",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
    })

    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        avatar_url: user.avatar_url,
        bio: user.bio,
        user_metadata: {
          full_name: user.full_name,
          user_type: user.user_type,
        },
      },
    }
  } catch (error) {
    console.error("Error authenticating user:", error)
    return { success: false, error: "An unexpected error occurred" }
  }
}

export async function clearAuthCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(TOKEN_NAME)
  return { success: true }
}

export async function getUserFromCookie() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(TOKEN_NAME)?.value

    if (!token) {
      return { user: null }
    }

    const payload = await verifyJWT(token)
    if (!payload || !payload.sub) {
      return { user: null }
    }

    // Get user from database
    const result = await sql.query("SELECT id, email, full_name, user_type, avatar_url, bio FROM users WHERE id = $1", [
      payload.sub,
    ])

    if (result.rows.length === 0) {
      return { user: null }
    }

    const user = result.rows[0]

    return {
      user: {
        ...user,
        user_metadata: {
          full_name: user.full_name,
          user_type: user.user_type,
        },
      },
    }
  } catch (error) {
    console.error("Error getting user from cookie:", error)
    return { user: null }
  }
}

// JWT helpers
async function createJWT(user: User) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET)
}

async function verifyJWT(token: string) {
  try {
    const verified = await jwtVerify(token, JWT_SECRET)
    return verified.payload
  } catch (error) {
    console.error("Error verifying JWT:", error)
    return null
  }
}

// Middleware helper to verify JWT token
export async function verifyAuth(req: NextRequest) {
  const token = req.cookies.get(TOKEN_NAME)?.value

  if (!token) {
    return null
  }

  return await verifyJWT(token)
}

export async function getSession() {
  try {
    const token = (await cookies()).get(TOKEN_NAME)?.value

    if (!token) {
      return { data: { session: null }, error: null }
    }

    const payload = await verifyJWT(token)

    if (!payload || !payload.sub) {
      return { data: { session: null }, error: null }
    }

    // Get user from database
    const result = await sql.query("SELECT id, email, full_name, user_type, avatar_url, bio FROM users WHERE id = $1", [
      payload.sub,
    ])

    if (result.rows.length === 0) {
      return { data: { session: null }, error: null }
    }

    const user = result.rows[0]

    const session = {
      user: {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        user_type: user.user_type,
        avatar_url: user.avatar_url,
        bio: user.bio,
        user_metadata: {
          full_name: user.full_name,
          user_type: user.user_type,
        },
      },
      expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    }

    return { data: { session }, error: null }
  } catch (error) {
    console.error("Error getting session:", error)
    return { data: { session: null }, error: { message: "Failed to get session" } }
  }
}

