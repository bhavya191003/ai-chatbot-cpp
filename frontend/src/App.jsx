import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';

export default function App() {
  const [messages, setMessages] = useState([
    { text: "Hello! I am connected to your C++ server. What's on your mind?", sender: 'bot', type: 'text' }
  ]);
  const [input, setInput] = useState('');
  const [mode, setMode] = useState('chat');
  const [isLoading, setIsLoading] = useState(false);
  const chatWindowRef = useRef(null);

  useEffect(() => {
    if (chatWindowRef.current) {
      chatWindowRef.current.scrollTop = chatWindowRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    
    const userMsg = input.trim();
    setMessages(prev => [...prev, { text: userMsg, sender: 'user', type: 'text' }]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. We completely remove the VITE_API_URL logic
      // 2. We ask the browser to fetch from the local /api/chat tunnel
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        // Notice we removed mode: 'cors' because it's no longer cross-origin!
        body: JSON.stringify({ user_message: input, mode: mode })
      });

  

      if (response.ok) {
        const data = await response.json();
        if (mode === 'image' && data.image_url) {
            setMessages(prev => [...prev, { text: data.image_url, sender: 'bot', type: 'image' }]);
        } else {
            setMessages(prev => [...prev, { text: data.bot_reply, sender: 'bot', type: 'text' }]);
        }
      } else {
        setMessages(prev => [...prev, { text: `Server Error: ${response.status}`, sender: 'bot', type: 'text' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { text: "Error: Could not connect to the C++ server. Is it running?", sender: 'bot', type: 'text' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'chat' ? 'image' : 'chat');
  };

  return (
    <div className="flex flex-col h-screen w-full bg-[#11151c] font-sans text-white overflow-hidden">
      <div className="flex justify-between items-center p-4 bg-[#11151c] border-b border-gray-800 shrink-0">
        <h1 className="text-xl font-bold tracking-wide">C++ AI Backend</h1>
        <button 
          onClick={toggleMode}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all shadow-md ${
            mode === 'chat' 
              ? 'bg-gray-600 hover:bg-gray-500 text-white' 
              : 'bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-400 hover:to-rose-400 text-white'
          }`}
        >
          {mode === 'chat' ? '💬 Chat Mode' : '🎨 Image Mode'}
        </button>
      </div>
      
      <div ref={chatWindowRef} className="flex-1 overflow-y-auto p-6 flex flex-col items-center w-full">
        <div className="w-full max-w-4xl flex flex-col gap-6">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`p-4 max-w-[75%] leading-relaxed text-sm break-words ${
                msg.sender === 'user' 
                  ? 'bg-[#2563eb] text-white self-end rounded-2xl rounded-br-sm shadow-md' 
                  : 'bg-[#1e2430] text-gray-200 self-start rounded-2xl rounded-tl-sm shadow-sm'
              }`}
            >
              {msg.type === 'image' ? (
                <img src={msg.text} alt="Generated Content" className="rounded-lg w-full h-auto mt-2 mb-2" />
              ) : msg.sender === 'bot' ? (
                <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }} className="prose prose-invert max-w-none" />
              ) : (
                msg.text
              )}
            </div>
          ))}
          {isLoading && (
            <div className="text-sm text-gray-500 italic self-start bg-[#1e2430] p-4 rounded-2xl rounded-tl-sm shadow-sm">
              {mode === 'image' ? 'Generating image...' : 'AI is thinking...'}
            </div>
          )}
        </div>
      </div>

      <div className="p-6 w-full flex justify-center bg-[#11151c] shrink-0 border-t border-gray-800">
        <div className="flex w-full max-w-4xl gap-4">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={mode === 'image' ? "Describe an image to generate..." : "Type your message..."} 
            className="flex-1 bg-[#161b24] border border-gray-700 text-white rounded-full px-6 py-4 outline-none focus:border-gray-500 transition-colors placeholder-gray-500 text-sm shadow-inner"
          />
          <button 
            onClick={sendMessage}
            className="bg-[#3b82f6] text-white border-none px-8 py-4 rounded-full cursor-pointer font-semibold hover:bg-blue-500 transition-colors shadow-md"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}