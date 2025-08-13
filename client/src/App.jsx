import { useState, useRef, useEffect } from 'react';
import './index.css';

const PaperclipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M21.44 11.05l-9.19 9.19a6.003 6.003 0 11-8.49-8.49l9.19-9.19a4.002 4.002 0 015.66 5.66l-9.2 9.19a2.001 2.001 0 11-2.83-2.83l8.49-8.48" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

function App() {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [threadId, setThreadId] = useState(() => `session_${Date.now()}`);
  const [file, setFile] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      if (e.target.files[0].type === "application/pdf") {
        setFile(e.target.files[0]);
      } else {
        alert("Please select a PDF file.");
        e.target.value = '';
      }
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const removeFile = () => {
    setFile(null);
    if(fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const sendMessage = async () => {
    const textToSend = inputText.trim();
    if ((textToSend === '' && !file) || isLoading) return;

    const userMessageText = file ? `${textToSend || "File Attached"}: ${file.name}` : textToSend;
    const userMessage = { id: Date.now(), text: userMessageText, isUser: true };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
      let aiResponseText;

      if (file) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('thread_id', threadId);
        
        const response = await fetch(`${apiUrl}/upload`, {
          method: 'POST',
          body: formData,
        });
        removeFile();

        if (!response.ok) {
          const errorText = await response.text();
          try {
              const errorJson = JSON.parse(errorText);
              throw new Error(errorJson.error || 'Failed to upload file');
          } catch {
              throw new Error(errorText || 'An unknown error occurred during upload.');
          }
        }
        
        const data = await response.json();
        aiResponseText = data.message;
        
        if (textToSend) {
            aiResponseText = await getAgentResponse(textToSend, threadId);
        }

      } else {
        aiResponseText = await getAgentResponse(textToSend, threadId);
      }

      const aiMessage = { id: Date.now() + 1, text: aiResponseText, isUser: false };
      setMessages((prev) => [...prev, aiMessage]);

    } catch (error) {
      console.error('Error in sendMessage:', error);
      const errorMessage = { id: Date.now() + 1, text: `Sorry, there was an error: ${error.message}`, isUser: false };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };
  
  const getAgentResponse = async (query, currentThreadId) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const response = await fetch(`${apiUrl}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, thread_id: currentThreadId }),
    });
    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            throw new Error(errorJson.error || 'Failed to get response from agent');
        } catch {
            throw new Error(errorText || 'An unknown error occurred in the agent.');
        }
    }
    return await response.text();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetChat = () => {
    setMessages([]);
    setThreadId(`session_${Date.now()}`);
    setFile(null);
  };

  return (
    <div className='chat-container'>
      <header className='chat-header'>
       <img src="/logo.svg" alt="Logo" />
        <button className='reset-button' onClick={resetChat} disabled={isLoading}>
          New Chat
        </button>
      </header>
      <div className='messages-container'>
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.isUser ? 'user-message' : 'ai-message'}`}>
            <div className='message-avatar'>{message.isUser ? 'You' : 'AI'}</div>
            <div className='message-content'>{message.text}</div>
          </div>
        ))}
        {isLoading && (
          <div className='message ai-message'>
            <div className='message-avatar'>AI</div>
            <div className='message-content loading'>
              <span className='dot'></span><span className='dot'></span><span className='dot'></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className='input-area'>
        {file && (
          <div className="file-attachment">
            <span>{file.name}</span>
            <button onClick={removeFile}>&times;</button>
          </div>
        )}
        <div className='input-container'>
          <button className="attach-button" onClick={handleAttachClick}>
            <PaperclipIcon />
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: 'none' }}
            accept=".pdf"
          />
          <textarea
            value={inputText}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder='Ask a question or attach a PDF...'
            disabled={isLoading}
            rows={1}
          />
          <button
            className='send-button'
            onClick={sendMessage}
            disabled={(inputText.trim() === '' && !file) || isLoading}
          >
            <svg width='24' height='24' viewBox='0 0 24 24' fill='none' xmlns='http://www.w3.org/2000/svg'>
              <path d='M2.01 21L23 12L2.01 3L2 10L17 12L2 14L2.01 21Z' fill='currentColor' />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;