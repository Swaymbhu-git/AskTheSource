import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import multer from 'multer';
import pdf from 'pdf-parse-fork';
import { Document } from '@langchain/core/documents';
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters';
import { YoutubeLoader } from "@langchain/community/document_loaders/web/youtube";
import { vectorStore } from './embeddings.js';
import { agent, agentQuery } from './agent.js';

dotenv.config();

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const port = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(cors());

const GREETINGS = ['hi', 'hii', 'hello', 'hey', 'hy'];
const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?(.+)/;

app.post('/generate', async (req, res) => {
    const { query, thread_id } = req.body;
    if (!query || !thread_id) return res.status(400).send({ error: 'Query and thread_id are required.' });

    const lowerCaseQuery = query.trim().toLowerCase();

    if (GREETINGS.includes(lowerCaseQuery)) {
        return res.send("Hello! How can I help you?");
    }

    if (YOUTUBE_REGEX.test(query)) {
        try {
            console.log(`🔨 Processing YouTube URL: ${query}`);
            const loader = YoutubeLoader.createFromUrl(query, { language: "en", addVideoInfo: true });
            const docs = await loader.load();
            if (docs.length === 0 || !docs[0].pageContent) {
                return res.send("Sorry, I could not find a transcript for that video.");
            }
            const videoTitle = docs[0].metadata.title || "the video";
            await saveDocs(docs, thread_id, 'youtube');
            return res.send(`Successfully processed "${videoTitle}". You can now ask questions about it.`);
        } catch (error) {
            console.error("Error processing YouTube URL:", error);
            return res.status(500).send({ error: "An error occurred processing the YouTube link." });
        }
    }

    try {
        console.log(`🔍 Retrieving documents for: "${query}" in session ${thread_id}`);

        // --- THIS IS THE FINAL, CRITICAL FIX ---
        // The filter object must be passed directly, not nested inside another object.
        const searchFilter = { "session_id": thread_id };
        // --- END OF FIX ---

        const retrievedDocs = await vectorStore.similaritySearch(query, 4, searchFilter);

        if (retrievedDocs.length === 0) {
            return res.send("I don't have any documents in this session with information to answer that. Please provide a YouTube URL or a PDF first.");
        }

        const context = retrievedDocs.map(doc => doc.pageContent).join('\n\n---\n\n');
        const query2 = `You are a query-enhancer. 
        Using only the context provided, rewrite the user's raw question into a concise, well-formed final query suitable for database retrieval. 
        Preserve the user's intent exactly, do not add facts, and do not introduce new content. 
        Output the final query and a short list of the core keywords."\n\nContext:\n${context}\n\nQuestion: ${query}`;

        const res1 = await agentQuery.invoke({ messages: [{ role: 'user', content: query2 }] }, { configurable: { thread_id: String(thread_id) } });
        const finalQuery=res1.messages.at(-1)?.content;

        const finalPrompt = `You are a helpful Q&A assistant. Based *only* on the context provided below, answer the user's question.
        - **Synthesize and Explain:** Do not just extract information. Summarize, rephrase, and explain the concepts from the context in a clear and conversational way.
        - **Be Creative (within bounds):** If the user asks for an explanation using an analogy, a story, or a different perspective, you should create one based *only* on the facts and concepts found in the provided context.
        - **Stick to the Facts:** Do not introduce any new information or facts that are not present in the context. Your creative explanations must be grounded in the source material.
        - **Handle Missing Information:** If the context truly does not contain any information related to the user's question, clearly state that the provided document does not cover that topic. 
        If the answer is not in the text, say "The provided text does not contain the answer."\n\nContext:\n${context}\n\nQuestion: ${finalQuery}`;
        
        const results = await agent.invoke({ messages: [{ role: 'user', content: finalPrompt }] }, { configurable: { thread_id: String(thread_id) } });
        return res.send(results.messages.at(-1)?.content);

    } catch (error) {
        console.error("Error in RAG process:", error);
        return res.status(500).send({ error: "An error occurred during your request." });
    }
});

app.post('/upload', upload.single('file'), async (req, res) => {
    const { thread_id } = req.body;
    const file = req.file;
    if (!file || !thread_id) return res.status(400).send({ error: 'File and thread_id are required.' });
    try {
        console.log(`📄 Processing PDF: ${file.originalname}`);
        const data = await pdf(file.buffer);
        const doc = new Document({ pageContent: data.text, metadata: { source: file.originalname } });
        await saveDocs([doc], thread_id, 'pdf');
        res.json({ message: `Successfully processed "${file.originalname}".` });
    } catch (error) {
        console.error("Error processing PDF:", error);
        res.status(500).send({ error: "An error processing your file." });
    }
});

async function saveDocs(docs, sessionId, type) {
    const splitter = new RecursiveCharacterTextSplitter({ chunkSize: 1000, chunkOverlap: 200 });
    const chunks = await splitter.splitDocuments(docs);
    chunks.forEach(chunk => {
        // Pinecone filters on metadata fields directly, not nested objects.
        chunk.metadata = { ...chunk.metadata, session_id: sessionId, type: type };
    });
    await vectorStore.addDocuments(chunks);
    console.log(`💾 Saved ${chunks.length} chunks to Pinecone for session ${sessionId}.`);
}

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});