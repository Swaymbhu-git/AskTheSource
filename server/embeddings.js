import { GoogleGenerativeAIEmbeddings } from "@langchain/google-genai";
import { PineconeStore } from "@langchain/pinecone";
import { Pinecone } from "@pinecone-database/pinecone";

const embeddings = new GoogleGenerativeAIEmbeddings({
    model: "text-embedding-004",
});

const pinecone = new Pinecone();

const pineconeIndex = pinecone.Index(process.env.PINECONE_INDEX_NAME);

// The vectorStore is now an instance of PineconeStore
export const vectorStore = new PineconeStore(embeddings, { pineconeIndex });