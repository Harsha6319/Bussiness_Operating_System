import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { endpoints } from '../../api/client.js';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { currency, date } from '../../utils/format.js';

export function FinancePage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: summary } = useQuery({ queryKey: ['finance-summary'], queryFn: () => endpoints.finance.summary().then((res) => res.data.data) });
  const { data: transactions } = useQuery({ queryKey: ['transactions'], queryFn: () => endpoints.finance.list().then((res) => res.data) });
  const create = useMutation({ mutationFn: endpoints.finance.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['transactions'] }); queryClient.invalidateQueries({ queryKey: ['finance-summary'] }); setOpen(false); } });

  function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    create.mutate({ ...data, amount: Number(data.amount) });
  }

  return (
    <div className="page-shell">
      <PageHeader title="Finance" description="Income, expenses, invoice generation, and ledger visibility." action={<button className="btn-primary" onClick={() => setOpen(true)}><FiPlus /> Add Entry</button>} />
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <Card title="Income" value={currency(summary?.income)} tone="emerald" />
        <Card title="Expenses" value={currency(summary?.expenses)} tone="rose" />
        <Card title="Profit" value={currency(summary?.profit)} />
      </div>
      <DataTable columns={[{ key: 'type', label: 'Type' }, { key: 'category', label: 'Category' }, { key: 'amount', label: 'Amount', render: (row) => currency(row.amount) }, { key: 'description', label: 'Description' }, { key: 'occurredAt', label: 'Date', render: (row) => date(row.occurredAt) }]} rows={transactions?.data || []} />
      <Modal open={open} title="Ledger Entry" onClose={() => setOpen(false)}>
        <form className="grid gap-3" onSubmit={submit}>
          <select className="input" name="type"><option>Income</option><option>Expense</option></select>
          <input className="input" name="category" placeholder="Category" required />
          <input className="input" name="amount" placeholder="Amount" type="number" step="0.01" required />
          <input className="input" name="description" placeholder="Description" />
          <button className="btn-primary">Save entry</button>
        </form>
      </Modal>
    </div>
  );
}
