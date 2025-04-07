import { supabase } from "../lib/supabase"

// Sample mentors data
const mentors = [
  {
    name: "Dr. Jane Smith",
    email: "jane.smith@example.com",
    expertise: ["Web Development", "React", "Node.js"],
    hourlyRate: 75,
    bio: "Senior Software Engineer with 10+ years of experience in web development. Specialized in React and Node.js.",
    available: true,
  },
  {
    name: "Michael Johnson",
    email: "michael.johnson@example.com",
    expertise: ["Machine Learning", "Python", "Data Science"],
    hourlyRate: 90,
    bio: "AI Research Scientist with a PhD in Computer Science. Passionate about helping others learn machine learning and data science.",
    available: true,
  },
  {
    name: "Sarah Williams",
    email: "sarah.williams@example.com",
    expertise: ["User Experience", "Figma", "Design Systems"],
    hourlyRate: 65,
    bio: "UX/UI Designer with experience at top tech companies. I help designers level up their skills and build amazing portfolios.",
    available: false,
  },
  {
    name: "Robert Chen",
    email: "robert.chen@example.com",
    expertise: ["AWS", "Azure", "DevOps"],
    hourlyRate: 85,
    bio: "Cloud Architect with certifications in AWS, Azure, and GCP. I can help you navigate the complex world of cloud infrastructure.",
    available: true,
  },
  {
    name: "Emily Davis",
    email: "emily.davis@example.com",
    expertise: ["Product Strategy", "Agile", "User Research"],
    hourlyRate: 80,
    bio: "Product Manager with experience launching successful products at startups and enterprise companies.",
    available: true,
  },
  {
    name: "David Wilson",
    email: "david.wilson@example.com",
    expertise: ["iOS", "Android", "React Native"],
    hourlyRate: 70,
    bio: "Mobile Developer specializing in cross-platform development. I can help you build and launch your mobile app.",
    available: false,
  },
]

// Sample mentees data
const mentees = [
  {
    name: "Alex Johnson",
    email: "alex.johnson@example.com",
    bio: "Junior developer looking to improve my React skills and build a portfolio.",
  },
  {
    name: "Maria Garcia",
    email: "maria.garcia@example.com",
    bio: "UX designer transitioning from graphic design. Seeking guidance on user research methods.",
  },
  {
    name: "James Wilson",
    email: "james.wilson@example.com",
    bio: "Computer Science student interested in machine learning and AI.",
  },
]

// Seed the database with initial data
async function seedDatabase() {
  try {
    console.log("Starting database seeding...")

    // Create mentors
    for (const mentor of mentors) {
      // Create user
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: mentor.email,
        password: "Password123!", // Default password for testing
        options: {
          data: {
            full_name: mentor.name,
            user_type: "mentor",
          },
        },
      })

      if (userError) {
        console.error(`Error creating mentor user ${mentor.name}:`, userError)
        continue
      }

      const userId = userData.user?.id

      if (!userId) {
        console.error(`Failed to get user ID for mentor ${mentor.name}`)
        continue
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from("users")
        .update({
          bio: mentor.bio,
          avatar_url: null, // No avatar for seed data
        })
        .eq("id", userId)

      if (profileError) {
        console.error(`Error updating mentor profile for ${mentor.name}:`, profileError)
      }

      // Create mentor profile
      const { error: mentorError } = await supabase.from("mentor_profiles").insert({
        user_id: userId,
        expertise: mentor.expertise,
        hourly_rate: mentor.hourlyRate,
        is_available: mentor.available,
        availability: {}, // Empty availability for now
      })

      if (mentorError) {
        console.error(`Error creating mentor profile for ${mentor.name}:`, mentorError)
      } else {
        console.log(`Created mentor: ${mentor.name}`)
      }
    }

    // Create mentees
    for (const mentee of mentees) {
      // Create user
      const { data: userData, error: userError } = await supabase.auth.signUp({
        email: mentee.email,
        password: "Password123!", // Default password for testing
        options: {
          data: {
            full_name: mentee.name,
            user_type: "mentee",
          },
        },
      })

      if (userError) {
        console.error(`Error creating mentee user ${mentee.name}:`, userError)
        continue
      }

      const userId = userData.user?.id

      if (!userId) {
        console.error(`Failed to get user ID for mentee ${mentee.name}`)
        continue
      }

      // Update user profile
      const { error: profileError } = await supabase
        .from("users")
        .update({
          bio: mentee.bio,
          avatar_url: null, // No avatar for seed data
        })
        .eq("id", userId)

      if (profileError) {
        console.error(`Error updating mentee profile for ${mentee.name}:`, profileError)
      } else {
        console.log(`Created mentee: ${mentee.name}`)
      }
    }

    console.log("Database seeding completed!")
  } catch (error) {
    console.error("Error seeding database:", error)
  }
}

// Run the seed function
seedDatabase()

