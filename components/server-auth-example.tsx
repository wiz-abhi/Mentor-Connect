import { getServerUser } from "@/lib/get-server-user"

export async function ServerAuthExample() {
  const { user, error } = await getServerUser()

  return (
    <div className="p-4 border rounded-md">
      <h3 className="text-lg font-medium mb-2">Server-Side Authentication</h3>
      {error ? (
        <p className="text-red-500">Error: {error.message}</p>
      ) : user ? (
        <div>
          <p>Authenticated as: {user.email}</p>
          <p>User ID: {user.id}</p>
          <p>User type: {user.user_metadata?.user_type || "Not specified"}</p>
        </div>
      ) : (
        <p>Not authenticated</p>
      )}
    </div>
  )
}

