import { getSession } from "@/lib/auth"
import { redirect } from "next/navigation"
import ConferenceRoom from "./conference-room"

interface PageProps {
  params: {
    sessionId: string
  }
}

export default async function ConferencePage({ params }: PageProps) {
  const { data } = await getSession()
  if (!data.session?.user) {
    redirect("/login")
  }

  return <ConferenceRoom sessionId={params.sessionId} />
} 