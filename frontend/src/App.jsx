import { useState, useRef, useEffect } from 'react';
import { marked } from 'marked';

export default function App() {
  const [messages, setMessages] = useState([
    { text: "Hey there! What's on your mind?", sender: 'bot', type: 'text' }
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
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user_message: userMsg, mode: mode })
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
      setMessages(prev => [...prev, { text: "Error: Could not connect to the server.", sender: 'bot', type: 'text' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(prev => prev === 'chat' ? 'image' : 'chat');
  };

  return (
    // Changed base background to a deep cosmic purple/midnight (#030014)
    <div className="flex flex-col h-screen w-full bg-[#030014] text-slate-200 font-sans overflow-hidden relative selection:bg-indigo-500/30">
      
      {/* NEW: Subtle Tech Grid Overlay */}
      <div className="absolute inset-0 bg-grid-pattern [mask-image:radial-gradient(ellipse_at_center,black,transparent_80%)] pointer-events-none opacity-30"></div>

      {/* Enhanced Aurora Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-700/20 blur-[120px] rounded-full animate-pulse-slow pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-fuchsia-700/15 blur-[120px] rounded-full animate-pulse-slow pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="absolute top-[30%] left-[50%] w-[40%] h-[40%] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none"></div>

      <header className="flex items-center justify-between px-6 py-4 bg-[#030014]/40 backdrop-blur-xl border-b border-white/5 z-20">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-fuchsia-500 shadow-lg shadow-indigo-500/20">
            <div className="absolute inset-0 bg-white/20 rounded-xl blur-sm"></div>
            <svg className="w-5 h-5 text-white relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
          </div>
          <h1 className="text-xl font-extrabold tracking-wide bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 via-white to-fuchsia-300 drop-shadow-sm">
            Bhavya's AI Assistant
          </h1>
        </div>
        
        <button 
          onClick={toggleMode}
          className={`relative overflow-hidden px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ease-out shadow-lg hover:scale-105 active:scale-95 ${
            mode === 'chat' 
              ? 'bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10' 
              // NEW: Fuchsia/Pink/Mauve gradient for Image Mode
              : 'bg-gradient-to-r from-fuchsia-600 to-pink-500 text-white shadow-fuchsia-500/30 border border-fuchsia-400/50'
          }`}
        >
          <span className="relative z-10 flex items-center gap-2">
            {mode === 'chat' ? '💬 Chat Mode' : '✨ Image Mode'}
          </span>
        </button>
      </header>
      
      <main ref={chatWindowRef} className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center w-full z-10 custom-scrollbar scroll-smooth">
        <div className="w-full max-w-4xl flex flex-col gap-6 pb-20">
          {messages.map((msg, idx) => (
            <div 
              key={idx} 
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
            >
              <div 
                className={`px-6 py-4 max-w-[85%] sm:max-w-[75%] text-[15px] shadow-2xl transition-all duration-300 ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-br from-indigo-600 to-purple-700 text-white rounded-3xl rounded-br-sm shadow-indigo-900/50 border border-indigo-400/20' 
                    : 'bg-[#0f0b1e]/80 backdrop-blur-xl border border-white/10 text-slate-200 rounded-3xl rounded-tl-sm shadow-black/50'
                }`}
              >
                {msg.type === 'image' ? (
                  <div className="relative group rounded-xl overflow-hidden bg-black/50">
                     <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10 pointer-events-none"></div>
                     <img src={msg.text} alt="AI Generated" className="rounded-xl w-full h-auto transform transition-transform duration-500 group-hover:scale-105" />
                  </div>
                ) : msg.sender === 'bot' ? (
                  <div dangerouslySetInnerHTML={{ __html: marked.parse(msg.text) }} className="prose prose-invert prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10 max-w-none prose-a:text-indigo-400 hover:prose-a:text-indigo-300" />
                ) : (
                  <div className="break-words leading-relaxed font-medium">{msg.text}</div>
                )}
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start animate-slide-up">
              <div className="px-6 py-5 bg-[#0f0b1e]/80 backdrop-blur-xl border border-white/10 rounded-3xl rounded-tl-sm flex items-center gap-2.5 shadow-2xl">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce-custom"></div>
                <div className="w-2 h-2 rounded-full bg-fuchsia-500 animate-bounce-custom" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 rounded-full bg-pink-400 animate-bounce-custom" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="absolute bottom-0 w-full p-4 sm:p-8 flex justify-center bg-gradient-to-t from-[#030014] via-[#030014]/90 to-transparent z-20 pointer-events-none">
        <div className="w-full max-w-4xl flex gap-3 relative pointer-events-auto group">
          
          <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 rounded-full blur opacity-25 group-focus-within:opacity-50 transition duration-500"></div>
          
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
            placeholder={mode === 'image' ? "Describe an image to generate..." : "Ask me anything..."} 
            className="relative flex-1 bg-[#0a0618]/90 backdrop-blur-2xl border border-white/10 text-white rounded-full px-8 py-4 outline-none focus:border-fuchsia-500/50 transition-all placeholder-slate-500 shadow-2xl text-[15px]"
          />
          <button 
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className="relative bg-gradient-to-r from-indigo-600 to-fuchsia-600 hover:from-indigo-500 hover:to-fuchsia-500 disabled:from-slate-800 disabled:to-slate-800 disabled:text-slate-500 disabled:border-slate-700 text-white border border-fuchsia-400/30 px-6 rounded-full cursor-pointer transition-all duration-300 shadow-xl hover:shadow-fuchsia-500/25 flex items-center justify-center active:scale-95"
          >
            <svg className="w-5 h-5 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
          </button>
        </div>
      </footer>
      
      <style dangerouslySetInnerHTML={{__html: `
        /* NEW: CSS Grid Background Pattern */
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #2a2a35; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #3f3f50; }
        
        @keyframes slideUp { 
          0% { opacity: 0; transform: translateY(20px) scale(0.98); } 
          100% { opacity: 1; transform: translateY(0) scale(1); } 
        }
        .animate-slide-up { animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        
        @keyframes pulseSlow {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(1.05); }
        }
        .animate-pulse-slow { animation: pulseSlow 8s ease-in-out infinite; }

        @keyframes bounceCustom {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(-4px); opacity: 1; }
        }
        .animate-bounce-custom { animation: bounceCustom 1s infinite cubic-bezier(0.4, 0, 0.2, 1); }
      `}} />
    </div>
  );
}