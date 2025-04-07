import { Video, Bot, Star, History, Users, Calendar } from "lucide-react"

export function FeatureSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/50">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col items-center justify-center space-y-4 text-center">
          <div className="space-y-2">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Key Features</div>
            <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
              Everything You Need for Effective Mentorship
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Our platform combines human expertise with AI-powered guidance to provide you with the best mentorship
              experience.
            </p>
          </div>
        </div>
        <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary/20 p-3">
              <Video className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">WebRTC Video Calls</h3>
            <p className="text-center text-muted-foreground">
              Connect with mentors in real-time through high-quality video and audio calls.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary/20 p-3">
              <Bot className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">AI Mentor</h3>
            <p className="text-center text-muted-foreground">
              Get instant guidance from our AI mentor trained on thousands of successful mentorship sessions.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary/20 p-3">
              <Star className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Mentor Ratings</h3>
            <p className="text-center text-muted-foreground">
              Find the best mentors based on ratings and reviews from other mentees.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary/20 p-3">
              <History className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Session Logs</h3>
            <p className="text-center text-muted-foreground">
              Access past mentorship sessions for future reference and continuous learning.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary/20 p-3">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Expert Profiles</h3>
            <p className="text-center text-muted-foreground">
              Browse detailed mentor profiles to find the perfect match for your needs.
            </p>
          </div>
          <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
            <div className="rounded-full bg-primary/20 p-3">
              <Calendar className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-xl font-bold">Availability Management</h3>
            <p className="text-center text-muted-foreground">
              Mentors can set their availability and mentees can book sessions accordingly.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

