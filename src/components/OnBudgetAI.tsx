import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Send, Bot, User, X, ArrowRight } from 'lucide-react';
import { Product } from '../types';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  products?: Product[];
}

interface OnBudgetAIProps {
  products: Product[];
  onOpenProduct: (productId: string) => void;
}

export default function OnBudgetAI({ products, onOpenProduct }: OnBudgetAIProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Hey! I'm **BudgetBuddy**, your personal AI Shopping Assistant. 🤖✨\n\nTell me what you're looking for or your maximum budget, and I'll find the absolute best personally-tested gadgets for you! For example, try asking: \n- *'Show me gaming accessories under ₹300'* \n- *'I need a gift under ₹100'* \n- *'Help me organize my work desk'*",
    },
  ]);
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    if (!textToSend) {
      setInput('');
    }

    const newMessages = [...messages, { sender: 'user' as const, text }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const response = await fetch('/api/gemini/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: text,
          availableProducts: products.map(p => ({
            id: p.id,
            title: p.title,
            price: p.price,
            originalPrice: p.originalPrice,
            discount: p.discount,
            description: p.description,
            brand: p.brand,
            category: p.category,
            rating: p.rating,
            whyIRecommend: p.whyIRecommend,
          })),
        }),
      });

      const data = await response.json();

      if (response.ok && data.text) {
        // Find matching product IDs returned by the AI (if any)
        const matchedProducts: Product[] = [];
        const aiTextLower = data.text.toLowerCase();
        
        products.forEach(p => {
          if (
            aiTextLower.includes(p.id.toLowerCase()) || 
            aiTextLower.includes(p.title.toLowerCase()) ||
            (p.brand && aiTextLower.includes(p.brand.toLowerCase()))
          ) {
            matchedProducts.push(p);
          }
        });

        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: data.text,
            products: matchedProducts.length > 0 ? matchedProducts : undefined,
          },
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            sender: 'bot',
            text: "Sorry, I'm experiencing some budget constraints of my own right now! Could you try asking me again?",
          },
        ]);
      }
    } catch (error) {
      console.error('Error fetching AI recommendation:', error);
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: "I couldn't reach my server to find that recommendation. Please verify that your Gemini API key is configured or try again shortly!",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const suggestions = [
    'Best desk upgrades under ₹200',
    'Tech gadget gifts under ₹100',
    'Viral room decor under ₹500',
    'Personally tested products only',
  ];

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        id="ai-floating-btn"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 bg-[#FF5A00] hover:bg-[#E04F00] text-white font-medium px-4 py-3 rounded-full shadow-lg shadow-[#FF5A00]/20 cursor-pointer transition-colors border border-[#FF5A00]/10"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Sparkles className="w-5 h-5 animate-pulse" />
        <span className="text-sm font-semibold tracking-wide font-display">Ask BudgetBuddy AI</span>
      </motion.button>

      {/* Chat Drawers / Panel */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-end p-0 sm:p-6 bg-slate-950/40 dark:bg-slate-950/70 backdrop-blur-xs">
            {/* Click outside to close */}
            <div className="absolute inset-0" onClick={() => setIsOpen(false)} />

            <motion.div
              id="ai-chat-window"
              initial={{ opacity: 0, y: 100, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 100, scale: 0.98 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="relative w-full sm:max-w-md h-[90vh] sm:h-[600px] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-[#FF5A00]/5 to-white dark:to-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#FF5A00]/10 border border-[#FF5A00]/20 flex items-center justify-center">
                    <Sparkles className="w-4.5 h-4.5 text-[#FF5A00] animate-pulse" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5 font-display">
                      BudgetBuddy AI <span className="text-[10px] bg-[#FF5A00]/15 text-[#FF5A00] font-black px-1.5 py-0.5 rounded-full border border-[#FF5A00]/15 font-display">Live</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 dark:text-slate-500">Curator Assistant powered by Gemini</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Message List */}
              <div
                ref={scrollRef}
                className="flex-1 p-4 overflow-y-auto space-y-4 scrollbar-thin text-left"
              >
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-[85%] ${
                      msg.sender === 'user' ? 'ml-auto flex-row-reverse' : ''
                    }`}
                  >
                    <div
                      className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border ${
                        msg.sender === 'user'
                          ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                          : 'bg-[#FF5A00]/10 border-[#FF5A00]/20 text-[#FF5A00]'
                      }`}
                    >
                      {msg.sender === 'user' ? <User className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>

                    <div className="space-y-3">
                      <div
                        className={`text-xs leading-relaxed px-3.5 py-2.5 rounded-2xl whitespace-pre-wrap font-sans ${
                          msg.sender === 'user'
                            ? 'bg-[#FF5A00] text-white rounded-tr-none'
                            : 'bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-800/60 rounded-tl-none'
                        }`}
                        dangerouslySetInnerHTML={{
                          __html: msg.text
                            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                            .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        }}
                      />

                      {/* Matching Product Attachments */}
                      {msg.products && (
                        <div className="grid grid-cols-1 gap-2 mt-2">
                          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider font-display">Matched Curated Products:</p>
                          {msg.products.map(p => (
                            <div
                              key={p.id}
                              onClick={() => {
                                onOpenProduct(p.id);
                                setIsOpen(false);
                              }}
                              className="flex items-center gap-2.5 p-2.5 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-850 border border-slate-150 dark:border-slate-800 rounded-2xl cursor-pointer transition-colors group"
                            >
                              <img
                                src={p.images[0]}
                                alt={p.title}
                                className="w-10 h-10 object-cover rounded-lg"
                                referrerPolicy="no-referrer"
                              />
                              <div className="flex-1 min-w-0">
                                <h4 className="text-[11px] font-extrabold text-slate-900 dark:text-white truncate group-hover:text-[#FF5A00] transition-colors font-display">
                                  {p.title}
                                </h4>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[11px] font-black text-[#FF5A00]">₹{p.price}</span>
                                  <span className="text-[10px] text-slate-400 dark:text-slate-500 line-through">₹{p.originalPrice}</span>
                                  <span className="text-[9px] bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400 px-1.5 py-0.2 rounded font-bold border border-red-200 dark:border-red-900/40 font-mono">
                                    {p.discount}% OFF
                                  </span>
                                </div>
                              </div>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#FF5A00] transition-colors shrink-0 mr-1" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {loading && (
                  <div className="flex gap-3 max-w-[80%]">
                    <div className="w-7 h-7 rounded-full bg-[#FF5A00]/10 border border-[#FF5A00]/20 text-[#FF5A00] flex items-center justify-center shrink-0">
                      <Bot className="w-3.5 h-3.5 animate-bounce" />
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-800/60 text-slate-400 px-3.5 py-2.5 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#FF5A00] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#FF5A00] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1.5 h-1.5 bg-[#FF5A00] rounded-full animate-bounce"></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Suggestion Chips */}
              {messages.length === 1 && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950/20 border-t border-slate-100 dark:border-slate-800/45 flex flex-wrap gap-1.5 justify-center">
                  {suggestions.map((s, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(s)}
                      className="text-[10px] bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 transition-colors cursor-pointer shadow-3xs"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Input Form */}
              <div className="p-3 bg-white dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSend();
                  }}
                  placeholder="Ask for budget deals or tech tips..."
                  className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-950 dark:text-white rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-[#FF5A00] dark:focus:border-[#FF5A00] transition-colors placeholder-slate-400 dark:placeholder-slate-500"
                />
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  className="p-2.5 bg-[#FF5A00] hover:bg-[#E04F00] disabled:bg-slate-100 dark:disabled:bg-slate-850 disabled:text-slate-300 dark:disabled:text-slate-700 text-white rounded-xl transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
