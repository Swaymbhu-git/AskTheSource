<p align="center">
  <svg width="280" height="50" viewBox="0 0 280 50" xmlns="http://www.w3.org/2000/svg">
    <style>
      .cursor { animation: blink 1s step-end infinite; }
      @keyframes blink { from, to { opacity: 1 } 50% { opacity: 0 } }
    </style>
    <text x="10" y="35" font-family="'Courier New', Courier, monospace" font-size="24" font-weight="bold" fill="#333">
      <tspan fill="#007bff">&gt;</tspan> AskTheSource<tspan class="cursor" fill="#333">_</tspan>
    </text>
  </svg>
</p>

<p align="center">
  An intelligent conversational agent that allows users to chat with their own content, sourced from PDF documents or YouTube videos.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/react-%2320232a.svg?style=for-the-badge&logo=react&logoColor=%2361DAFB" alt="React"/>
  <img src="https://img.shields.io/badge/node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/express.js-%23404d59.svg?style=for-the-badge&logo=express&logoColor=%2361DAFB" alt="Express.js"/>
  <img src="https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/langchain-%23000000.svg?style=for-the-badge&logo=langchain&logoColor=white" alt="LangChain"/>
  <img src="https://img.shields.io/badge/vercel-%23000000.svg?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel"/>
</p>

---

## 🚀 Introduction

In a world filled with information, valuable knowledge is often locked away in static formats like dense PDF documents or long video presentations. Accessing and synthesizing this information can be tedious and inefficient. **AskTheSource** tackles this problem head-on by transforming your static content into a dynamic, interactive knowledge base. Simply provide a document or a YouTube link, and instantly begin a conversation to extract insights, get summaries, and find the exact information you need.

---

## ✨ Live Demo

You can try out the live application here:

### ➡️ **[https://ask-the-source.vercel.app/](https://ask-the-source.vercel.app/)**

> **⚠️ Server Note**
> The backend for this project is hosted on a free-tier service. It may go to sleep due to inactivity. If the application is unresponsive on your first attempt, please wait 30-60 seconds for the server to "wake up" and then refresh the page.

---

## 🎯 Key Features

* 📚 **Multi-Source Ingestion:** Upload PDF documents or simply provide a YouTube URL to begin.
* 💬 **Contextual Conversations:** Engage in natural, question-and-answer dialogue with your content.
* 🎯 **Source-Grounded Responses:** The AI is architected to answer questions based *only* on the provided documents, minimizing hallucination and ensuring factual accuracy.
* 🔒 **Session-Based Memory:** Each chat session is completely isolated using a unique session ID, ensuring privacy and providing a clean slate for every new interaction.
* 💻 **Real-Time & Responsive Interface:** A clean, modern, and intuitive chat interface built with React for a seamless user experience on any device.

---

## 🛠️ Technology Stack

This project leverages a modern, full-stack architecture to deliver a robust and intelligent user experience.

| Category                | Technologies                                                                                                                                                             |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Frontend** | ![React](https://img.shields.io/badge/react-%2320232a.svg?style=flat&logo=react&logoColor=%2361DAFB) ![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=flat&logo=vite&logoColor=white)          |
| **Backend** | ![NodeJS](https://img.shields.io/badge/node.js-339933?style=flat&logo=nodedotjs&logoColor=white) ![Express.js](https://img.shields.io/badge/express.js-%23404d59.svg?style=flat&logo=express&logoColor=%2361DAFB) |
| **Databases** | ![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg?style=flat&logo=mongodb&logoColor=white) `(Session Data)` <br/> ![Pinecone](https://img.shields.io/badge/Pinecone-007bff?style=flat) `(Vector Storage)` |
| **AI & Orchestration** | ![LangChain](https://img.shields.io/badge/langchain-%23000000.svg?style=flat) ![Google Gemini](https://img.shields.io/badge/Google_Gemini-8E75B7?style=flat) `(LLM)`          |
| **Deployment** | ![Vercel](https://img.shields.io/badge/vercel-%23000000.svg?style=flat&logo=vercel&logoColor=white) `(Frontend)` <br/> ![Render](https://img.shields.io/badge/Render-46E3B7?style=flat) `(Backend)`            |

---

## 🧠 Architectural Deep Dive: The RAG Pipeline

The core of AskTheSource is its **Retrieval-Augmented Generation (RAG)** pipeline. This architecture ensures that the AI's responses are not just creative guesses but are grounded in the factual content of the user-provided documents.

Here's a step-by-step breakdown of the flow:

1.  **📥 Ingestion:** The process begins when a user uploads a PDF or provides a YouTube URL. The backend server receives this source and uses specialized loaders (`pdf-parse-fork` for PDFs, `YoutubeLoader` for videos) to extract the raw text content.

2.  **🧩 Chunking:** A single large document is too big for an AI model to handle effectively. The extracted text is therefore split into smaller, more manageable pieces called "chunks" using LangChain's `RecursiveCharacterTextSplitter`.
    * **Why chunk?** It allows us to find and feed only the most relevant parts of the document to the AI.
    * **Why overlap?** Chunks are created with a slight overlap (e.g., 200 characters) to ensure that meaningful sentences or concepts aren't awkwardly split between two separate chunks, preserving contextual integrity.

3.  **🔢 Embedding:** Each text chunk is converted into a high-dimensional numerical vector—an "embedding"—using a Google embedding model. This vector represents the semantic meaning of the text, allowing for mathematical comparisons of content.

4.  **🌲 Storage:** These embeddings, along with their original text and associated metadata (like the unique `session_id`), are stored and indexed in a specialized **Pinecone vector database**.

5.  **🔍 Retrieval:** When a user asks a question, the query itself is also converted into an embedding. The system then queries the Pinecone database, asking it to find the text chunks whose embeddings are most semantically similar to the query's embedding. Crucially, this search is **filtered by the user's `session_id`**, ensuring only documents from the current conversation are considered.

6.  **✨ Query Enhancement (Advanced Feature):** To improve accuracy, AskTheSource doesn't immediately use the retrieved chunks. Instead, it performs a preliminary LLM call, providing the retrieved context and the user's raw question to the AI. It asks the AI to rewrite the question to be more specific and well-formed based on the provided context. This "enhanced query" leads to much more precise final answers.

7.  **📝 Generation:** Finally, a carefully constructed prompt is sent to the Google Gemini model. This prompt contains the retrieved context (the relevant text chunks) and the enhanced question from the previous step. The model is explicitly instructed to formulate an answer based *only* on the provided context, which is then streamed back to the user.

---

## 🚀 Getting Started (Local Setup)

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

* Node.js (v18 or later)
* npm

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/](https://github.com/)[Your-GitHub-Username]/AskTheSource.git
    cd AskTheSource
    ```

2.  **Setup the Backend:**
    * Navigate to the server directory (e.g., `cd server`).
    * Install dependencies:
        ```bash
        npm install
        ```
    * Create a `.env` file in the root of the `server` directory. This file will store your secret keys. Copy the contents of `.env.example` (if provided) or create it from scratch with the following variables:
        ```env
        # Google API Key for Gemini and Embeddings
        GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"

        # Pinecone Vector Database Credentials
        PINECONE_API_KEY="YOUR_PINECONE_API_KEY"
        PINECONE_ENVIRONMENT="YOUR_PINECONE_ENVIRONMENT"
        PINECONE_INDEX_NAME="your-pinecone-index-name"

        # MongoDB Connection String
        MONGODB_URI="YOUR_MONGODB_CONNECTION_STRING"
        ```

3.  **Setup the Frontend:**
    * Navigate to the client directory (e.g., `cd ../client`).
    * Install dependencies:
        ```bash
        npm install
        ```

### Running the Application

1.  **Run the Backend Server:**
    * From the `server` directory:
        ```bash
        npm run dev
        ```
    * The server should now be running on `http://localhost:3000`.

2.  **Run the Frontend Development Server:**
    * From the `client` directory (in a separate terminal):
        ```bash
        npm run dev
        ```
    * Open your browser and navigate to the local URL provided (usually `http://localhost:5173`).

---

## 🎬 Demo

![AskTheSource Demo](./demo.gif)

*A brief animated GIF showing the process of uploading a PDF, asking a question, and receiving a source-grounded answer.*

---

## 📫 Contact

**[Your Name]**

* **GitHub:** [github.com/YourUsername](https://github.com/YourUsername)
* **LinkedIn:** [linkedin.com/in/YourProfile](https://linkedin.com/in/YourProfile)
* **Portfolio:** [your-website.com](https://your-website.com)