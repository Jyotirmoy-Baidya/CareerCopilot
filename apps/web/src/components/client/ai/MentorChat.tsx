'use client';

import { useState, useRef, useEffect } from 'react';

const CHAT_LIMIT = 3;

interface Message {
  role:    'user' | 'assistant';
  content: string;
}

export function MentorChat({ targetRole, currentSkill }: { targetRole?: string; currentSkill?: string }) {
  const [messages,   setMessages]   = useState<Message[]>(() => {
    try { return JSON.parse(localStorage.getItem('mentor_chat_messages') ?? '[]'); } catch { return []; }
  });
  const [input,      setInput]      = useState('');
  const [loading,    setLoading]    = useState(false);
  const [used,       setUsed]       = useState<number>(() => {
    try { return parseInt(localStorage.getItem('mentor_chat_used') ?? '0'); } catch { return 0; }
  });
  const [limitHit,   setLimitHit]   = useState(() => {
    try { return parseInt(localStorage.getItem('mentor_chat_used') ?? '0') >= CHAT_LIMIT; } catch { return false; }
  });
  const bottomRef                   = useRef<HTMLDivElement>(null);
  const remaining                   = Math.max(0, CHAT_LIMIT - used);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('mentor_chat_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('mentor_chat_used', String(used));
  }, [used]);

  const send = async () => {
    if (!input.trim() || loading || limitHit) return;

    const userMsg: Message = { role: 'user', content: input.trim() };
    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInput('');
    setLoading(true);

    const assistantMsg: Message = { role: 'assistant', content: '' };
    setMessages(prev => [...prev, assistantMsg]);

    try {
      const res = await fetch('/api/ai/chat', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({
          messages: newHistory,
          context:  { targetRole, currentSkill },
        }),
      });

      // Increment usage locally on every attempt
      setUsed(prev => prev + 1);

      // Handle limit / error responses (non-streaming)
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const errMsg =
          data.error === 'chat_limit_reached' ? `You've used all ${CHAT_LIMIT} free chat messages.` :
          data.error === 'out_of_credits'     ? 'AI credits exhausted.' :
          data.error === 'rate_limited'       ? 'AI is busy — try again in a moment.' :
          'Something went wrong.';
        if (data.error === 'chat_limit_reached') { setUsed(CHAT_LIMIT); setLimitHit(true); }
        setMessages(prev => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: errMsg };
          return updated;
        });
        return;
      }

      const reader  = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer    = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6);
          if (data === '[DONE]') break;
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              const errMsg =
                parsed.error === 'out_of_credits' ? 'AI credits exhausted.' :
                parsed.error === 'rate_limited'   ? 'AI is busy — try again in a moment.' :
                'Something went wrong.';
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'assistant', content: errMsg };
                return updated;
              });
              break;
            }
            if (parsed.chunk) {
              setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  content: updated[updated.length - 1].content + parsed.chunk,
                };
                return updated;
              });
            }
          } catch { /* partial line */ }
        }
      }
    } catch {
      setMessages(prev => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: 'Something went wrong. Please try again.' };
        return updated;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full max-h-[600px] border rounded-lg overflow-hidden">
      {/* Header with usage counter */}
      <div className="bg-brand-500 text-white px-4 py-3 flex items-center justify-between">
        <span className="text-sm font-medium">AI Mentor — ask anything</span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          remaining === 0 ? 'bg-red-500' : remaining === 1 ? 'bg-yellow-400 text-yellow-900' : 'bg-white/20'
        }`}>
          {remaining}/{CHAT_LIMIT} messages left
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <p className="text-sm text-gray-400 text-center mt-8">
            Ask me anything about your learning path, current skill, or career advice.
          </p>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`
              max-w-[80%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap
              ${msg.role === 'user'
                ? 'bg-brand-500 text-white'
                : 'bg-white border text-gray-800'}
            `}>
              {msg.content || (loading && i === messages.length - 1 ? '...' : '')}
            </div>
          </div>
        ))}
        {limitHit && (
          <p className="text-xs text-center text-red-500 font-medium">
            Free chat limit reached. Upgrade to continue.
          </p>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t bg-white p-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
          placeholder={limitHit ? 'Chat limit reached' : 'Ask your mentor...'}
          className="flex-1 text-sm border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500 disabled:bg-gray-50 disabled:text-gray-400"
          disabled={loading || limitHit}
        />
        <button
          onClick={send}
          disabled={loading || !input.trim() || limitHit}
          className="px-4 py-2 bg-brand-500 text-white text-sm rounded-md disabled:opacity-50 hover:bg-brand-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
