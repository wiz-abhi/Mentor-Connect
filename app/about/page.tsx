import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Users, Video, Bot, Shield, Clock, Award, BookOpen, Briefcase, GraduationCap } from "lucide-react"

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_500px]">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">
                    Our Mission: Connect, Learn, Grow
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    MentorConnect was founded with a simple yet powerful mission: to democratize access to quality
                    mentorship and guidance for everyone, everywhere.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Link href="/register">
                    <Button size="lg" className="w-full min-[400px]:w-auto">
                      Join Our Community
                    </Button>
                  </Link>
                  <Link href="/dashboard/mentors">
                    <Button size="lg" variant="outline" className="w-full min-[400px]:w-auto">
                      Meet Our Mentors
                    </Button>
                  </Link>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <div className="relative h-[350px] w-full overflow-hidden rounded-xl bg-muted md:h-[450px] lg:h-[500px]">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="space-y-4 text-center">
                      <div className="inline-flex h-20 w-20 items-center justify-center rounded-full bg-background">
                        <Users className="h-10 w-10 text-primary" />
                      </div>
                      <h2 className="text-2xl font-bold text-white">Connecting Experts & Learners</h2>
                      <p className="mx-auto max-w-[300px] text-white/90">
                        We've helped thousands of people find the right mentor to accelerate their career growth.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Our Story Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Our Story</h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                MentorConnect was founded in 2023 by a group of tech professionals who recognized a critical gap in the
                industry: access to quality mentorship. After struggling to find mentors themselves early in their
                careers, they decided to build a platform that would make it easy for anyone to connect with experienced
                professionals.
              </p>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                What started as a simple matching service has grown into a comprehensive platform with video mentorship,
                AI-powered guidance, and a thriving community of mentors and mentees from around the world.
              </p>
            </div>
          </div>
        </section>

        {/* Key Features Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-muted/40">
          <div className="container px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">What Makes Us Different</h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Our platform combines human expertise with cutting-edge technology to provide a mentorship experience
                unlike any other.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/20 p-3">
                  <Video className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Real-Time Mentorship</h3>
                <p className="text-center text-muted-foreground">
                  Connect with mentors via high-quality video calls for personalized guidance.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/20 p-3">
                  <Bot className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">AI-Powered Guidance</h3>
                <p className="text-center text-muted-foreground">
                  Get instant answers from our AI mentor trained on thousands of mentorship sessions.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/20 p-3">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Vetted Experts</h3>
                <p className="text-center text-muted-foreground">
                  All our mentors go through a rigorous vetting process to ensure quality guidance.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/20 p-3">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Flexible Scheduling</h3>
                <p className="text-center text-muted-foreground">
                  Book sessions at times that work for you, with mentors from around the world.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/20 p-3">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Skill Development</h3>
                <p className="text-center text-muted-foreground">
                  Track your progress and develop new skills with structured mentorship programs.
                </p>
              </div>
              <div className="flex flex-col items-center space-y-2 rounded-lg border p-6 shadow-sm">
                <div className="rounded-full bg-primary/20 p-3">
                  <BookOpen className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Knowledge Library</h3>
                <p className="text-center text-muted-foreground">
                  Access recordings and transcripts from your past sessions for continued learning.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">Our Team</h2>
              <p className="max-w-[85%] leading-normal text-muted-foreground sm:text-lg sm:leading-7">
                Meet the passionate individuals behind MentorConnect who are dedicated to making quality mentorship
                accessible to all.
              </p>
            </div>
            <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 py-12 md:grid-cols-2 lg:grid-cols-3">
              {[
                { name: "Sarah Johnson", role: "Founder & CEO", icon: Briefcase },
                { name: "Michael Chen", role: "CTO", icon: Briefcase },
                { name: "Priya Patel", role: "Head of Mentor Relations", icon: Users },
                { name: "David Kim", role: "AI Research Lead", icon: Bot },
                { name: "Emma Rodriguez", role: "UX Design Lead", icon: GraduationCap },
                { name: "James Wilson", role: "Community Manager", icon: Users },
              ].map((member) => (
                <div key={member.name} className="flex flex-col items-center space-y-4">
                  <div className="h-32 w-32 rounded-full bg-muted flex items-center justify-center">
                    <member.icon className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-xl font-bold">{member.name}</h3>
                    <p className="text-muted-foreground">{member.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="w-full py-12 md:py-24 lg:py-32 bg-primary text-primary-foreground">
          <div className="container px-4 md:px-6">
            <div className="mx-auto flex max-w-[58rem] flex-col items-center justify-center gap-4 text-center">
              <h2 className="text-3xl font-bold leading-tight sm:text-4xl md:text-5xl">
                Ready to Accelerate Your Growth?
              </h2>
              <p className="max-w-[85%] leading-normal sm:text-lg sm:leading-7">
                Join thousands of professionals who are advancing their careers through quality mentorship.
              </p>
              <div className="flex flex-col gap-2 min-[400px]:flex-row">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="w-full min-[400px]:w-auto">
                    Get Started
                  </Button>
                </Link>
                <Link href="/dashboard/mentors">
                  <Button
                    size="lg"
                    variant="outline"
                    className="w-full min-[400px]:w-auto border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
                  >
                    Browse Mentors
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

