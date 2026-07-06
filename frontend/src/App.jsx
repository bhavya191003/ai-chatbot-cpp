import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';

export default function App() {
  const [messages, setMessages] = useState([
    { text: "Hello! I am connected to your C++ server. What's on your mind?", sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
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
    setMessages(prev => [...prev, { text: userMsg, sender: 'user' }]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_message: userMsg })
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, { text: data.bot_reply, sender: 'bot' }]);
      } else {
        setMessages(prev => [...prev, { text: `Server Error: ${response.status}`, sender: 'bot' }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { text: "Error: Could not connect to the C++ server. Is it running?", sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-slate-950 text-slate-200 font-sans selection:bg-purple-500/30 overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-full w-full bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.2),rgba(255,255,255,0))] pointer-events-none"></div>

      <header className="flex items-center justify-between px-8 py-5 backdrop-blur-md bg-slate-900/50 border-b border-white/10 z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="text-xl font-bold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">Gemini C++ Engine</h1>
        </div>
      </header>
      
      <main ref={chatWindowRef} className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center w-full z-10 scroll-smooth custom-scrollbar">
        <div className="w-full max-w-3xl flex flex-col gap-6 pb-4">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fade-in-up`}
            >
              <div 
                className={`px-5 py-4 max-w-[85%] sm:max-w-[75%] leading-relaxed text-[15px] shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-3xl rounded-br-sm shadow-purple-500/10' 
                    : 'bg-slate-800/80 backdrop-blur-md border border-white/10 text-slate-200 rounded-3xl rounded-tl-sm'
                }`}
              >
                {msg.sender === 'bot' ? (
                  <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }} className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-white/10 max-w-none" />
                ) : (
                  <div className="break-words">{msg.text}</div>
                )}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-fade-in-up">
              <div className="px-5 py-5 bg-slate-800/80 backdrop-blur-md border border-white/10 rounded-3xl rounded-tl-sm flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-400 animate-bounce"></div>
                <div className="w-2 h-2 rounded-full bg-purple-400 animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 rounded-full bg-rose-400 animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="p-4 sm:p-6 w-full flex justify-center bg-transparent shrink-0 z-10 pb-8 sm:pb-10">
        <div className="flex w-full max-w-3xl gap-3 relative group">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Message the AI..." 
            className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-white/10 text-white rounded-2xl px-6 py-4 outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder-slate-500 shadow-xl"
          />
          <button 
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white border-none px-6 rounded-2xl cursor-pointer transition-all shadow-lg hover:shadow-indigo-500/25 flex items-center justify-center active:scale-95"
          >
            <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fade-in-up { animation: fadeInUp 0.3s ease-out forwards; }
      `}} />
    </div>
  );
}