import { getServerUser } from "@/lib/get-server-user"
import { updateUserProfile } from "@/lib/actions"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { revalidatePath } from "next/cache"

export async function ServerProfileForm() {
  const { user, error } = await getServerUser()

  if (error || !user) {
    return <div className="p-4 bg-red-50 text-red-500 rounded-md">Authentication error: Please log in</div>
  }

  // This is a server action
  async function handleUpdateProfile(formData: FormData) {
    "use server"

    const profileData = {
      fullName: formData.get("fullName") as string,
      bio: formData.get("bio") as string,
      avatarUrl: formData.get("avatarUrl") as string,
      expertise: [(formData.get("expertise") as string) || "Mentoring"],
      hourlyRate: formData.get("hourlyRate") as string,
      isAvailable: formData.get("isAvailable") === "on",
    }

    const result = await updateUserProfile(profileData)

    if (result.success) {
      revalidatePath("/dashboard/settings")
    }

    return result
  }

  return (
    <form action={handleUpdateProfile} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName">Full Name</Label>
        <Input id="fullName" name="fullName" defaultValue={user.user_metadata?.full_name || ""} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="bio">Bio</Label>
        <Textarea id="bio" name="bio" defaultValue={user.user_metadata?.bio || ""} className="min-h-[120px]" />
      </div>

      {user.user_metadata?.user_type === "mentor" && (
        <>
          <div className="space-y-2">
            <Label htmlFor="expertise">Primary Expertise</Label>
            <Input id="expertise" name="expertise" defaultValue={user.user_metadata?.expertise?.[0] || ""} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
            <Input
              id="hourlyRate"
              name="hourlyRate"
              type="number"
              defaultValue={user.user_metadata?.hourly_rate || ""}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch id="isAvailable" name="isAvailable" defaultChecked={user.user_metadata?.is_available !== false} />
            <Label htmlFor="isAvailable">Available for new mentees</Label>
          </div>
        </>
      )}

      <Button type="submit">Save Profile</Button>
    </form>
  )
}

