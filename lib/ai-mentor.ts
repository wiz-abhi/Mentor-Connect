import { Groq } from 'groq-sdk';
import 'dotenv/config'

if (!process.env.GROQ_API_KEY) {
  throw new Error('GROQ_API_KEY environment variable is not set');
}

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
  dangerouslyAllowBrowser: true
});

// This is a simplified implementation of a RAG-based AI mentor
// In a real application, you would use a vector database like Pinecone or FAISS

// Mock database of past mentorship sessions
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
]

// Simple vector search simulation
// In a real app, you would use a proper vector database and embedding model
function searchMentorshipSessions(query: string) {
  // This is a very simplified search - in a real app, you would use embeddings and vector similarity
  const results = mentorshipSessions.filter((session) => {
    const lowerQuery = query.toLowerCase()
    return session.topic.toLowerCase().includes(lowerQuery) || session.content.toLowerCase().includes(lowerQuery)
  })

  return results.map((session) => ({
    id: session.id,
    topic: session.topic,
    // Extract relevant snippets (simplified)
    snippets: session.content
      .split("\n")
      .filter((line) => line.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 3)
      .join("\n"),
  }))
}

export async function getAIMentorResponse(query: string, emotion: string = '') {
  try {
    const systemPrompt = `You are an AI mentor with expertise in various fields. 
    Your goal is to provide helpful, supportive, and personalized guidance to users.
    ${emotion ? `The user appears to be feeling ${emotion}. Consider this in your response.` : ''}
    
    Guidelines:
    1. Be empathetic and understanding
    2. Provide clear, actionable advice
    3. Break down complex concepts into simple terms
    4. Encourage growth and learning
    5. Ask clarifying questions when needed
    6. Share relevant examples and analogies
    7. Maintain a professional yet friendly tone`;

    const response = await groq.chat.completions.create({
      model: "mistral-saba-24b",
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: query
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    return response.choices[0]?.message?.content || 'I apologize, but I could not generate a response at this time.';
  } catch (error) {
    console.error('Error getting AI mentor response:', error);
    throw error;
  }
}

