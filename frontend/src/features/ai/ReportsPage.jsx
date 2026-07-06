import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FiDownload, FiFileText } from 'react-icons/fi';
import { endpoints } from '../../api/client.js';
import { DataTable } from '../../components/DataTable.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { date } from '../../utils/format.js';

const templates = ['sales', 'inventory', 'customer', 'finance', 'orders', 'business', 'weekly', 'monthly'];

export function ReportsPage() {
  const [type, setType] = useState('business');
  const [selected, setSelected] = useState(null);
  const queryClient = useQueryClient();
  const { data: reports } = useQuery({ queryKey: ['ai-reports'], queryFn: () => endpoints.ai.reports().then((res) => res.data.data) });
  const generate = useMutation({ mutationFn: endpoints.ai.generateReport, onSuccess: ({ data }) => { setSelected(data.data); queryClient.invalidateQueries({ queryKey: ['ai-reports'] }); } });

  function download(report) {
    const blob = new Blob([report.content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${report.title}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-shell">
      <PageHeader title="AI Reports" description="Generate sales, inventory, customer, finance, order, weekly, and monthly reports." />
      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <div className="panel space-y-4 p-5">
          <p className="font-semibold text-slate-950">Report Templates</p>
          <select className="input" value={type} onChange={(event) => setType(event.target.value)}>{templates.map((item) => <option key={item} value={item}>{item}</option>)}</select>
          <button className="btn-primary w-full" onClick={() => generate.mutate({ type, format: 'markdown' })} disabled={generate.isPending}><FiFileText /> Generate Report</button>
        </div>
        <div className="space-y-6">
          {selected && (
            <div className="panel p-5">
              <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                <p className="text-xl font-bold text-slate-950">{selected.title}</p>
                <button className="btn-secondary" onClick={() => download(selected)}><FiDownload /> Export</button>
              </div>
              <article className="prose prose-slate max-w-none prose-headings:text-brand-700 prose-a:text-brand-600 prose-table:w-full prose-th:bg-slate-50 prose-th:p-2 prose-td:p-2 prose-td:border-b prose-td:border-slate-100">
                <ReactMarkdown>{selected.content}</ReactMarkdown>
              </article>
            </div>
          )}
          <DataTable columns={[
            { key: 'title', label: 'Report' },
            { key: 'type', label: 'Type' },
            { key: 'createdAt', label: 'Generated', render: (row) => date(row.createdAt) },
            { key: 'actions', label: '', render: (row) => <button className="btn-secondary" onClick={() => setSelected(row)}>Open</button> }
          ]} rows={reports || []} empty="Generate your first AI report." />
        </div>
      </div>
    </div>
  );
}
