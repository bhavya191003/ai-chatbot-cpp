import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';

function App() {
  const [messages, setMessages] = useState([
    { text: "Hello! I am connected to your C++ server. What's on your mind?", sender: "bot", type: "text" }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isImageMode, setIsImageMode] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!inputValue.trim()) return;

    const userText = inputValue.trim();
    setMessages(prev => [...prev, { text: userText, sender: "user", type: "text" }]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_message: userText,
          mode: isImageMode ? "image" : "chat"
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.image_url) {
          setMessages(prev => [...prev, { url: data.image_url, sender: "bot", type: "image" }]);
        } else {
          setMessages(prev => [...prev, { text: data.bot_reply, sender: "bot", type: "text" }]);
        }
      } else {
        setMessages(prev => [...prev, { text: "Server Error: " + response.status, sender: "bot", type: "text" }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { text: "Error: Could not connect to the C++ server. Is it running?", sender: "bot", type: "text" }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-gray-100 font-sans">
      <header className="flex justify-between items-center p-4 bg-gray-800 shadow-md z-10 border-b border-gray-700">
        <h1 className="text-xl font-bold tracking-wide text-white">C++ AI Backend</h1>
        <button
          onClick={() => setIsImageMode(!isImageMode)}
          className={`px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 shadow-sm ${
            isImageMode ? 'bg-pink-600 hover:bg-pink-500' : 'bg-gray-600 hover:bg-gray-500'
          }`}
        >
          {isImageMode ? "🎨 Image Mode" : "💬 Chat Mode"}
        </button>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-2xl p-4 shadow-md ${
                  msg.sender === 'user'
                    ? 'bg-blue-600 text-white rounded-br-sm'
                    : 'bg-gray-800 text-gray-100 rounded-bl-sm border border-gray-700'
                }`}
              >
                {msg.type === 'image' ? (
                  <img src={msg.url} alt="AI Generated" className="w-full rounded-lg shadow-sm" />
                ) : (
                  <div 
                    className="prose prose-invert max-w-none break-words"
                    dangerouslySetInnerHTML={{ __html: msg.sender === 'bot' ? marked.parse(msg.text) : msg.text }} 
                  />
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 text-gray-400 rounded-2xl rounded-bl-sm p-4 shadow-md border border-gray-700 animate-pulse flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-75"></div>
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>
      </main>

      <footer className="p-4 bg-gray-800 border-t border-gray-700">
        <div className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder={isImageMode ? "Describe an image to generate..." : "Type your message..."}
            className="flex-1 bg-gray-900 text-white rounded-full px-6 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500 border border-gray-700 shadow-inner"
          />
          <button 
            onClick={sendMessage}
            className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8 py-3 font-semibold transition-colors duration-200 shadow-md"
          >
            Send
          </button>
        </div>
      </footer>
    </div>
  );
}

export default App;