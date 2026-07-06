import { useMutation } from '@tanstack/react-query';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FiMessageSquare, FiSend, FiStar, FiTrash2 } from 'react-icons/fi';
import { endpoints } from '../../api/client.js';
import { Badge } from '../../components/Badge.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';

const suggestions = [
  "What are today's sales?",
  'Show low stock products.',
  'Generate profit report.',
  'Explain inventory health.',
  'Which customers purchased the most?'
];

export function CopilotPage() {
  const [messages, setMessages] = useState([{ role: 'assistant', content: 'Ask me about revenue, low stock, sales summaries, invoices, or inventory health.' }]);
  const [message, setMessage] = useState('');
  const [mode, setMode] = useState('business');
  const [conversationId, setConversationId] = useState(null);
  const queryClient = useQueryClient();
  const { data: conversations } = useQuery({ queryKey: ['ai-conversations'], queryFn: () => endpoints.ai.conversations().then((res) => res.data.data) });
  const chat = useMutation({
    mutationFn: endpoints.ai.chat,
    onSuccess: ({ data }) => {
      setConversationId(data.data.conversation._id);
      setMessages((items) => [...items, { role: 'assistant', content: data.data.answer, sources: data.data.sources }]);
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
    }
  });

  async function loadConversation(id) {
    const { data } = await endpoints.ai.messages(id);
    setConversationId(id);
    setMessages(data.data.map((item) => ({ role: item.role, content: item.content, sources: item.sources })));
  }

  async function togglePin(item) {
    await endpoints.ai.updateConversation(item._id, { isPinned: !item.isPinned });
    queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
  }

  async function removeConversation(id) {
    await endpoints.ai.deleteConversation(id);
    if (conversationId === id) {
      setConversationId(null);
      setMessages([{ role: 'assistant', content: 'Conversation deleted. Start a new one when you are ready.' }]);
    }
    queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
  }

  function submit(event) {
    event.preventDefault();
    if (!message.trim()) return;
    setMessages((items) => [...items, { role: 'user', content: message }]);
    chat.mutate({ message, mode, ...(conversationId ? { conversationId } : {}) });
    setMessage('');
  }

  return (
    <div className="page-shell">
      <PageHeader title="AI Copilot" description="ChatGPT-style business assistant with memory, RAG mode, advisor mode, and source citations." />
      <div className="grid gap-6 xl:grid-cols-[300px_1fr]">
        <aside className="panel h-[680px] overflow-hidden">
          <div className="border-b border-slate-200 p-4">
            <button className="btn-primary w-full" onClick={() => { setConversationId(null); setMessages([{ role: 'assistant', content: 'New conversation started.' }]); }}>New Chat</button>
          </div>
          <div className="h-full overflow-y-auto p-3">
            {(conversations || []).map((item) => (
              <div key={item._id} className={`mb-2 rounded-lg p-3 text-sm ${conversationId === item._id ? 'bg-brand-50 text-brand-700' : 'hover:bg-slate-50'}`}>
                <button className="flex w-full items-center gap-2 text-left font-medium" onClick={() => loadConversation(item._id)}><FiMessageSquare /> {item.title}</button>
                <div className="mt-2 flex gap-2">
                  <button className="text-slate-500" onClick={() => togglePin(item)} title="Pin conversation"><FiStar /></button>
                  <button className="text-rose-500" onClick={() => removeConversation(item._id)} title="Delete conversation"><FiTrash2 /></button>
                </div>
              </div>
            ))}
          </div>
        </aside>
        <div className="panel flex h-[680px] flex-col overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-4">
            <div className="flex gap-2">
              {['business', 'rag', 'advisor'].map((item) => <button key={item} className={mode === item ? 'btn-primary' : 'btn-secondary'} onClick={() => setMode(item)}>{item}</button>)}
            </div>
            <Badge tone={mode === 'rag' ? 'amber' : 'blue'}>{mode === 'rag' ? 'Knowledge mode cites sources' : 'Business context mode'}</Badge>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto p-5">
            {messages.map((item, index) => (
              <div key={index} className={`max-w-3xl rounded-lg px-4 py-3 text-sm leading-6 ${item.role === 'user' ? 'ml-auto bg-brand-600 text-white' : 'bg-slate-100 text-slate-700'}`}>
                <div className="whitespace-pre-wrap">{item.content}</div>
                {item.sources?.length ? <div className="mt-3 space-y-1 border-t border-slate-200 pt-3 text-xs text-slate-500">{item.sources.map((source) => <p key={source.chunkId}>Source: {source.title} ({Math.round(source.score * 100)}%)</p>)}</div> : null}
              </div>
            ))}
            {chat.isPending && <div className="max-w-xl rounded-lg bg-slate-100 px-4 py-3 text-sm text-slate-500">Thinking...</div>}
          </div>
          <div className="flex flex-wrap gap-2 border-t border-slate-200 px-4 py-3">
            {suggestions.map((item) => <button key={item} className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600 hover:bg-slate-50" onClick={() => setMessage(item)}>{item}</button>)}
          </div>
          <form className="flex gap-3 border-t border-slate-200 p-4" onSubmit={submit}>
            <input className="input" value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Ask AI-BOS to analyze or perform a business operation..." />
            <button className="btn-primary" disabled={chat.isPending}><FiSend /> Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}
