import Link from "next/link"
import { Button } from "@/components/ui/button"

export function HeroSection() {
  return (
    <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
      <div className="container px-4 md:px-6">
        <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_600px]">
          <div className="flex flex-col justify-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                Connect with Expert Mentors or Get AI-Powered Guidance
              </h1>
              <p className="max-w-[600px] text-muted-foreground md:text-xl">
                MentorConnect helps you grow professionally through real-time video mentorship sessions or instant AI
                guidance trained on thousands of successful mentorship conversations.
              </p>
            </div>
            <div className="flex flex-col gap-2 min-[400px]:flex-row">
              <Link href="/register">
                <Button size="lg" className="w-full min-[400px]:w-auto">
                  Get Started
                </Button>
              </Link>
              <Link href="/dashboard/mentors">
                <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                  Find Mentors
                </Button>
              </Link>
            </div>
          </div>
          <div className="flex items-center justify-center">
            <div className="relative h-[350px] w-full overflow-hidden rounded-xl bg-muted md:h-[450px] lg:h-[500px]">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="grid grid-cols-2 gap-4 p-4">
                  <div className="flex flex-col space-y-2 rounded-lg bg-background/80 p-4 backdrop-blur">
                    <div className="h-12 w-12 rounded-full bg-primary/20" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                  <div className="flex flex-col space-y-2 rounded-lg bg-background/80 p-4 backdrop-blur">
                    <div className="h-12 w-12 rounded-full bg-secondary/20" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                  <div className="flex flex-col space-y-2 rounded-lg bg-background/80 p-4 backdrop-blur">
                    <div className="h-12 w-12 rounded-full bg-accent/20" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                  <div className="flex flex-col space-y-2 rounded-lg bg-background/80 p-4 backdrop-blur">
                    <div className="h-12 w-12 rounded-full bg-destructive/20" />
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

