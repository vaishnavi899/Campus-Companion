import { useState, useEffect, useRef } from "react";
import { MessageCircle, X, Send, Bot, User } from "lucide-react";

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "🤖 Hi! Ask me anything about JIIT." },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { sender: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:5000/ask", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage.text,
        }),
      });

      const data = await response.json();

      const botMessage = {
        sender: "bot",
        text:
          data.answer ||
          "⚠️ Sorry, I didn't get a response from the server.",
      };
      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "❌ Server not reachable. Check backend." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Floating Button with Beautiful Animations */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="group relative bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-purple-700 text-white rounded-full p-5 shadow-2xl shadow-blue-500/40 hover:shadow-blue-600/50 transition-all duration-500 transform hover:scale-110 hover:rotate-12 overflow-hidden"
        >
          {/* Animated gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Icon */}
          <MessageCircle className="w-7 h-7 relative z-10 drop-shadow-lg" />
          
          {/* Multiple Pulse Rings */}
          <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-20"></div>
          <div className="absolute inset-0 rounded-full bg-purple-400 animate-ping opacity-15" style={{ animationDelay: "0.5s" }}></div>
          
          {/* Notification Badge */}
          <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-red-500 to-pink-500 rounded-full flex items-center justify-center text-xs font-bold shadow-lg animate-bounce border-2 border-white">
            1
          </div>
        </button>
      )}

      {/* Chat Box with Glass Morphism */}
      {open && (
        <div className="w-96 h-[600px] rounded-3xl shadow-2xl flex flex-col overflow-hidden backdrop-blur-xl bg-white/95 border border-white/40 animate-scale-in">
          {/* Header with Animated Gradient */}
          <div className="relative bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 text-white p-5 overflow-hidden">
            {/* Animated Background Pattern */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full mix-blend-overlay filter blur-xl animate-float"></div>
              <div className="absolute bottom-0 right-0 w-32 h-32 bg-white rounded-full mix-blend-overlay filter blur-xl animate-float-delayed"></div>
            </div>
            
            <div className="relative flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border-2 border-white/30 shadow-xl">
                    <Bot className="w-6 h-6 animate-pulse" />
                  </div>
                  {/* Online Status Indicator with Glow */}
                  <div className="absolute bottom-0 right-0 w-4 h-4 bg-green-400 rounded-full border-2 border-white shadow-lg">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping"></div>
                  </div>
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight drop-shadow-sm">JIIT Chat Companion</h2>
                  <p className="text-blue-100 text-xs flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    Online • Ready to help
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setOpen(false)}
                className="w-9 h-9 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-300 hover:rotate-90 backdrop-blur-sm border border-white/20 shadow-lg group"
              >
                <X className="w-5 h-5 group-hover:scale-110 transition-transform" />
              </button>
            </div>
          </div>

          {/* Messages Container with Custom Gradient Scrollbar */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-gray-50 via-blue-50/30 to-purple-50/20 custom-scrollbar">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex items-end space-x-2 animate-message-slide ${
                  msg.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                }`}
              >
                {/* Avatar with Gradient Glow */}
                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-xl transform hover:scale-110 transition-transform duration-300 ${
                  msg.sender === "bot" 
                    ? "bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 shadow-blue-500/50" 
                    : "bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 shadow-green-500/50"
                }`}>
                  {msg.sender === "bot" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                </div>
                
                {/* Message Bubble with Enhanced Effects */}
                <div
                  className={`max-w-[75%] px-4 py-3 rounded-2xl transition-all duration-300 transform hover:scale-[1.02] hover:shadow-2xl ${
                    msg.sender === "bot"
                      ? "bg-white text-gray-800 rounded-bl-sm shadow-lg border border-gray-100/50 hover:border-blue-200/50"
                      : "bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 text-white rounded-br-sm shadow-xl shadow-blue-500/30"
                  }`}
                >
                  <p className="text-sm leading-relaxed whitespace-pre-wrap font-medium">
                    {msg.text}
                  </p>
                  <div className={`text-xs mt-1.5 font-medium ${
                    msg.sender === "bot" ? "text-gray-400" : "text-blue-100"
                  }`}>
                    {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {/* Enhanced Typing Indicator with Gradient Dots */}
            {loading && (
              <div className="flex items-end space-x-2 animate-message-slide">
                <div className="w-9 h-9 bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-full flex items-center justify-center shadow-xl shadow-blue-500/50">
                  <Bot className="w-5 h-5 text-white animate-pulse" />
                </div>
                <div className="bg-white rounded-2xl rounded-bl-sm px-5 py-3 shadow-xl border border-gray-100/50">
                  <div className="flex items-center space-x-2">
                    <span className="text-gray-600 text-sm font-semibold">Typing</span>
                    <div className="flex space-x-1">
                      <div className="w-2.5 h-2.5 rounded-full animate-bounce bg-gradient-to-r from-blue-500 to-purple-500"></div>
                      <div className="w-2.5 h-2.5 rounded-full animate-bounce bg-gradient-to-r from-purple-500 to-pink-500" style={{ animationDelay: "0.15s" }}></div>
                      <div className="w-2.5 h-2.5 rounded-full animate-bounce bg-gradient-to-r from-pink-500 to-blue-500" style={{ animationDelay: "0.3s" }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area with Glass Effect */}
          <div className="border-t border-gray-200/60 bg-white/90 backdrop-blur-xl p-5 shadow-2xl">
            <div className="flex items-center space-x-3">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about your rulebook..."
                  className="w-full px-4 py-3 bg-gray-50/90 border-2 border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 focus:bg-white placeholder-gray-400 text-gray-700 text-sm transition-all duration-300 disabled:opacity-50 group-hover:border-gray-300 shadow-sm"
                  disabled={loading}
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-xs opacity-0 group-focus-within:opacity-100 transition-opacity duration-200 font-medium">
                  ↵
                </div>
              </div>
              <button
                onClick={sendMessage}
                disabled={loading || !input.trim()}
                className="relative bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 hover:from-blue-600 hover:via-purple-600 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white p-3.5 rounded-xl shadow-xl hover:shadow-2xl shadow-blue-500/30 transform hover:scale-110 hover:-rotate-12 disabled:transform-none transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500/50 disabled:cursor-not-allowed overflow-hidden group"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Send className="w-5 h-5 relative z-10 drop-shadow-lg" />
              </button>
            </div>
            <p className="text-center text-gray-400 text-xs mt-3 flex items-center justify-center gap-1.5 font-medium">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
              Powered by AI • Secure chat
            </p>
          </div>
        </div>
      )}

      {/* Enhanced Custom Animations & Styles */}
      <style>{`
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.85) translateY(30px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        
        @keyframes message-slide {
          from {
            opacity: 0;
            transform: translateY(15px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(10px);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(20px) translateX(-10px);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        
        .animate-message-slide {
          animation: message-slide 0.4s ease-out;
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        
        /* Custom Scrollbar with Beautiful Gradient */
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #3b82f6, #8b5cf6, #ec4899);
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #2563eb, #7c3aed, #db2777);
          box-shadow: 0 0 10px rgba(139, 92, 246, 0.5);
        }
      `}</style>
    </div>
  );
}