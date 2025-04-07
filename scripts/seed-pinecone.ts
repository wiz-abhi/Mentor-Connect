import { index } from "../lib/pinecone-config"
import { openai } from "@ai-sdk/openai"

// Sample mentorship sessions for seeding
const mentorshipSessions = [
  {
    id: "1",
    topic: "Web Development Career Path",
    content: `
      Mentor: What aspects of web development are you most interested in?
      Mentee: I'm not sure if I should focus on frontend or backend development.
      Mentor: That's a common dilemma. Frontend development involves creating the user interface and experience using HTML, CSS, and JavaScript frameworks like React or Vue. Backend development focuses on server-side logic, databases, and APIs using technologies like Node.js, Python, or Java. Many developers start with frontend to see immediate visual results, then gradually learn backend concepts. Full-stack development, which covers both, is also a viable path but requires more learning.
      Mentee: What skills are most in-demand right now?
      Mentor: For frontend, strong JavaScript skills, experience with React, and knowledge of modern CSS techniques are highly sought after. For backend, Node.js and Python are very popular, along with database skills (both SQL and NoSQL). Cloud services knowledge (AWS, Azure, GCP) is increasingly important for both paths. Regardless of specialization, understanding of version control (Git), CI/CD pipelines, and basic DevOps concepts will make you more valuable to employers.
    `,
  },
  {
    id: "2",
    topic: "Machine Learning Fundamentals",
    content: `
      Mentor: What's your background in mathematics and programming?
      Mentee: I have a good understanding of programming but my math is a bit rusty.
      Mentor: That's a good starting point. For machine learning, you'll want to brush up on linear algebra, calculus, probability, and statistics. Start with practical applications using libraries like scikit-learn in Python, which abstracts away much of the mathematical complexity. As you progress, you can dive deeper into the math behind the algorithms. For learning resources, I recommend Andrew Ng's course on Coursera and the book "Hands-On Machine Learning with Scikit-Learn and TensorFlow."
      Mentee: How long does it typically take to become proficient?
      Mentor: It depends on your dedication and prior knowledge, but most people can gain practical skills within 6-12 months of consistent study and practice. Focus on projects rather than just theory - implement algorithms from scratch, participate in Kaggle competitions, and build a portfolio of projects that demonstrate your skills. Specializing in a specific area like computer vision or natural language processing can also help you stand out.
    `,
  },
  {
    id: "3",
    topic: "UX Design Principles",
    content: `
      Mentor: What aspects of UX design are you most interested in learning about?
      Mentee: I want to understand how to create more intuitive interfaces.
      Mentor: Intuitive interfaces come from understanding your users deeply. Start by learning about user research methods like interviews, surveys, and usability testing. The principle of "Don't Make Me Think" by Steve Krug is fundamental - users shouldn't have to figure out how to use your interface. Follow established patterns that users are already familiar with, maintain consistency throughout your design, provide clear feedback for actions, and use visual hierarchy to guide users' attention. Remember that simplicity is key - remove unnecessary elements and streamline user flows.
      Mentee: How do I balance creativity with usability?
      Mentor: That's the art of UX design. Innovation should never come at the expense of usability. Start with proven design patterns and principles, then add creative elements thoughtfully. Always test new ideas with real users. Sometimes the most creative solution is the one that feels invisible because it works so naturally. Great designers know when to follow conventions and when to break them. The goal is to delight users while helping them accomplish their tasks efficiently.
    `,
  },
  {
    id: "4",
    topic: "Software Engineering Best Practices",
    content: `
      Mentor: What's your current development workflow like?
      Mentee: I usually just write code until it works, but I know there must be better approaches.
      Mentor: That's a common starting point. Let's talk about some best practices that can improve your workflow. First, adopt test-driven development (TDD) - write tests before you write code. This ensures your code meets requirements and helps prevent regressions. Second, use version control effectively with feature branches and pull requests for code reviews. Third, implement continuous integration to automatically test your code when changes are pushed. Fourth, follow the SOLID principles for object-oriented design to make your code more maintainable. Finally, document your code well - your future self will thank you.
      Mentee: How do I know when my code is "good enough"?
      Mentor: That's a great question. Code is "good enough" when it meets the functional requirements, has appropriate test coverage, follows the project's style guidelines, and is maintainable by other developers. Remember that perfect is the enemy of good - at some point, you need to ship. However, never compromise on security or critical performance issues. Use code quality tools like linters and static analyzers to catch common issues. And always get another pair of eyes on your code through code reviews - they often catch things you miss.
    `,
  },
  {
    id: "5",
    topic: "Data Science Career Advice",
    content: `
      Mentor: What area of data science interests you the most?
      Mentee: I'm fascinated by predictive analytics, but I'm not sure how to break into the field.
      Mentor: Predictive analytics is a great area to focus on. To break in, start by building a strong foundation in statistics, machine learning, and programming (Python or R). Then, work on projects that demonstrate your skills - Kaggle competitions are excellent for this. Create a portfolio that showcases your ability to clean data, perform exploratory analysis, build models, and communicate results effectively. Networking is also crucial - join data science communities, attend meetups, and connect with professionals on LinkedIn. Consider getting certifications from recognized platforms like DataCamp or Coursera to add credentials to your resume.
      Mentee: Should I pursue a master's degree in data science?
      Mentor: It depends on your background and career goals. If you already have a quantitative degree (math, statistics, computer science, engineering), you might not need a master's - focused online courses and projects can be sufficient. However, if you're changing careers from a non-technical field, a master's can provide structured learning and credibility. Some companies use degrees as a filtering mechanism for hiring. That said, many successful data scientists are self-taught. What matters most is demonstrating your skills through projects and being able to solve real-world problems with data.
    `,
  },
]

// Generate embeddings for text
async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  })

  return response.data[0].embedding
}

// Seed Pinecone with mentorship sessions
async function seedPinecone() {
  try {
    console.log("Seeding Pinecone with mentorship sessions...")

    for (const session of mentorshipSessions) {
      // Split content into chunks (simplified)
      const chunks = session.content.split("\n\n").filter((chunk) => chunk.trim().length > 0)

      console.log(`Processing session ${session.id}: ${session.topic} (${chunks.length} chunks)`)

      // Process each chunk
      const vectors = await Promise.all(
        chunks.map(async (chunk, i) => {
          const embedding = await generateEmbedding(chunk)

          return {
            id: `${session.id}-${i}`,
            values: embedding,
            metadata: {
              sessionId: session.id,
              topic: session.topic,
              chunk,
              chunkIndex: i,
            },
          }
        }),
      )

      // Upsert vectors to Pinecone
      await index.upsert(vectors)

      console.log(`Session ${session.id} processed successfully`)
    }

    console.log("Pinecone seeding completed successfully")
  } catch (error) {
    console.error("Error seeding Pinecone:", error)
  }
}

// Run the seeding function
seedPinecone()

