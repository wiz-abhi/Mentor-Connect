import { Pinecone } from "@pinecone-database/pinecone"

// Initialize Pinecone client
export const pinecone = new Pinecone({
  apiKey: process.env.PINECONE_API_KEY || "",
  environment: process.env.PINECONE_ENVIRONMENT || "",
})

// Get the index
export const index = pinecone.Index(process.env.PINECONE_INDEX_NAME || "mentorship-sessions")

// Pinecone index configuration
export const pineconeConfig = {
  dimension: 384, // Dimension of the embeddings
  metric: "cosine", // Similarity metric
  podType: "p1", // Pod type
}

// Create Pinecone index (run this once during setup)
export async function createPineconeIndex() {
  try {
    // Check if index exists
    const indexes = await pinecone.listIndexes()

    if (!indexes.includes(process.env.PINECONE_INDEX_NAME || "mentorship-sessions")) {
      console.log("Creating Pinecone index...")

      await pinecone.createIndex({
        name: process.env.PINECONE_INDEX_NAME || "mentorship-sessions",
        dimension: pineconeConfig.dimension,
        metric: pineconeConfig.metric,
        podType: pineconeConfig.podType,
      })

      console.log("Pinecone index created successfully")
    } else {
      console.log("Pinecone index already exists")
    }
  } catch (error) {
    console.error("Error creating Pinecone index:", error)
    throw error
  }
}

