import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FiSearch, FiTrash2, FiUploadCloud } from 'react-icons/fi';
import { endpoints } from '../../api/client.js';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { date } from '../../utils/format.js';

export function KnowledgePage() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);
  const queryClient = useQueryClient();
  const { data: documents } = useQuery({ queryKey: ['knowledge-documents'], queryFn: () => endpoints.ai.documents().then((res) => res.data.data) });
  const upload = useMutation({ mutationFn: endpoints.ai.uploadDocument, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] }) });
  const ask = useMutation({ mutationFn: endpoints.ai.askKnowledge, onSuccess: ({ data }) => setAnswer(data.data) });

  function uploadDocument(event) {
    event.preventDefault();
    const file = event.currentTarget.document.files[0];
    const formData = new FormData();
    formData.append('document', file);
    formData.append('title', event.currentTarget.title.value || file.name);
    upload.mutate(formData);
    event.currentTarget.reset();
  }

  return (
    <div className="page-shell">
      <PageHeader title="Knowledge Base" description="Upload business documents, retrieve source-backed answers, and cite references." />
      <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
        <div className="space-y-6">
          <form className="panel space-y-3 p-5" onSubmit={uploadDocument}>
            <p className="font-semibold text-slate-950">Upload Document</p>
            <input className="input" name="title" placeholder="Document title" />
            <input className="input" name="document" type="file" accept=".txt,.md,.pdf,.docx" required />
            <button className="btn-primary" disabled={upload.isPending}><FiUploadCloud /> Upload and Index</button>
          </form>
          <form className="panel space-y-3 p-5" onSubmit={(event) => { event.preventDefault(); ask.mutate({ question, topK: 5 }); }}>
            <p className="font-semibold text-slate-950">Ask Documents</p>
            <textarea className="input min-h-28" value={question} onChange={(event) => setQuestion(event.target.value)} placeholder="Ask from uploaded policies, SOPs, invoices, manuals..." />
            <button className="btn-primary" disabled={ask.isPending}><FiSearch /> Search Knowledge</button>
          </form>
        </div>
        <div className="space-y-6">
          {answer && <div className="panel p-5"><p className="font-semibold text-slate-950">Answer</p><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{answer.answer}</p><div className="mt-4 space-y-2 text-xs text-slate-500">{answer.sources.map((source) => <p key={source.chunkId}>Source: {source.title} - confidence {Math.round(source.score * 100)}%</p>)}</div></div>}
          <DataTable columns={[
            { key: 'title', label: 'Document' },
            { key: 'sourceType', label: 'Type' },
            { key: 'status', label: 'Status' },
            { key: 'createdAt', label: 'Uploaded', render: (row) => date(row.createdAt) },
            { key: 'actions', label: '', render: (row) => <button className="text-rose-600" onClick={() => endpoints.ai.deleteDocument(row._id).then(() => queryClient.invalidateQueries({ queryKey: ['knowledge-documents'] }))}><FiTrash2 /></button> }
          ]} rows={documents || []} empty="Upload documents to build your business knowledge base." />
        </div>
      </div>
    </div>
  );
}
