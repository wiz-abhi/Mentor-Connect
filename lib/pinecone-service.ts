import { Pinecone } from "@pinecone-database/pinecone"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Initialize Pinecone client
const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "",
  environment: process.env.PINECONE_ENVIRONMENT || "",
})

// Get the index
const index = pinecone.Index(process.env.PINECONE_INDEX_NAME || "mentorship-sessions")

// Generate embeddings for text
async function generateEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  })

  return response.data[0].embedding
}

// Store a mentorship session in Pinecone
export async function storeMentorshipSession(
  sessionId: string,
  topic: string,
  transcript: string,
  metadata: Record<string, any> = {},
) {
  try {
    // Split transcript into chunks (simplified)
    const chunks = transcript.split("\n\n")

    // Process each chunk
    const vectors = await Promise.all(
      chunks.map(async (chunk, i) => {
        const embedding = await generateEmbedding(chunk)

        return {
          id: `${sessionId}-${i}`,
          values: embedding,
          metadata: {
            ...metadata,
            sessionId,
            topic,
            chunk,
            chunkIndex: i,
          },
        }
      }),
    )

    // Upsert vectors to Pinecone
    await index.upsert(vectors)

    return { success: true, count: vectors.length }
  } catch (error) {
    console.error("Error storing mentorship session:", error)
    throw error
  }
}

// Query similar mentorship sessions
export async function querySimilarMentorshipSessions(query: string, topK = 5) {
  try {
    // Generate embedding for query
    const embedding = await generateEmbedding(query)

    // Query Pinecone
    const results = await index.query({
      vector: embedding,
      topK,
      includeMetadata: true,
    })

    return results.matches.map((match) => ({
      score: match.score,
      sessionId: match.metadata?.sessionId,
      topic: match.metadata?.topic,
      chunk: match.metadata?.chunk,
    }))
  } catch (error) {
    console.error("Error querying similar mentorship sessions:", error)
    throw error
  }
}

// Generate RAG response
export async function generateRAGResponse(query: string) {
  try {
    // Query similar mentorship sessions
    const similarSessions = await querySimilarMentorshipSessions(query)

    // Prepare context from similar sessions
    const context = similarSessions.map((session) => `Topic: ${session.topic}\nContent: ${session.chunk}`).join("\n\n")

    // Generate response using AI model with RAG context
    const { text } = await generateText({
      model: openai("gpt-4o"),
      prompt: `
        You are an AI mentor trained on thousands of successful mentorship sessions.
        Answer the following question based on your knowledge and the provided context from past mentorship sessions.
        
        Context from relevant mentorship sessions:
        ${context}
        
        Question: ${query}
        
        Provide a helpful, informative response as if you were an experienced mentor. 
        If the context doesn't contain relevant information, use your general knowledge to provide guidance.
        Your response should be conversational, supportive, and actionable.
      `,
    })

    return text
  } catch (error) {
    console.error("Error generating RAG response:", error)
    throw error
  }
}

