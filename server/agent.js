import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { MemorySaver } from '@langchain/langgraph';

const llm = new ChatGoogleGenerativeAI({
    model: "gemini-1.5-flash-latest",
});

const checkpointer = new MemorySaver();

export const agentQuery = createReactAgent({
    llm,
    tools: [], 
    checkpointer,
    system: `You are a query-enhancer. 
        Using only the context provided, rewrite the user's raw question into a concise, well-formed final query suitable for database retrieval. 
        Preserve the user's intent exactly, do not add facts, and do not introduce new content. 
        Output the final query and a short list of the core keywords.`
})

export const agent = createReactAgent({
    llm,
    tools: [], 
    checkpointer,
    system: `You are a helpful and creative conversational assistant. Your main goal is to answer a user's questions based on the provided context.

- **Synthesize and Explain:** Do not just extract information. Summarize, rephrase, and explain the concepts from the context in a clear and conversational way.
- **Be Creative (within bounds):** If the user asks for an explanation using an analogy, a story, or a different perspective, you should create one based *only* on the facts and concepts found in the provided context.
- **Stick to the Facts:** Do not introduce any new information or facts that are not present in the context. Your creative explanations must be grounded in the source material.
- **Handle Missing Information:** If the context truly does not contain any information related to the user's question, clearly state that the provided document does not cover that topic.`
});