import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { endpoints } from '../../api/client.js';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { currency, date } from '../../utils/format.js';

export function CustomerPage() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const { data } = useQuery({ queryKey: ['customers', search], queryFn: () => endpoints.customers.list({ search, limit: 100 }).then((res) => res.data) });
  const create = useMutation({ mutationFn: endpoints.customers.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['customers'] }); setOpen(false); } });

  function submit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    create.mutate(Object.fromEntries(form.entries()));
  }

  return (
    <div className="page-shell">
      <PageHeader title="Customers" description="Manage profiles, contact details, purchase history, and segmentation." action={<button className="btn-primary" onClick={() => setOpen(true)}><FiPlus /> Add Customer</button>} />
      <input className="input mb-4 max-w-sm" placeholder="Search customers" value={search} onChange={(event) => setSearch(event.target.value)} />
      <DataTable columns={[{ key: 'name', label: 'Name' }, { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' }, { key: 'totalSpend', label: 'Spend', render: (row) => currency(row.totalSpend) }, { key: 'lastPurchaseAt', label: 'Last Purchase', render: (row) => date(row.lastPurchaseAt) }]} rows={data?.data || []} />
      <Modal open={open} title="Add Customer" onClose={() => setOpen(false)}>
        <form className="grid gap-3" onSubmit={submit}>
          <input className="input" name="name" placeholder="Name" required />
          <input className="input" name="email" placeholder="Email" type="email" />
          <input className="input" name="phone" placeholder="Phone" />
          <input className="input" name="notes" placeholder="Notes" />
          <button className="btn-primary" disabled={create.isPending}>Save customer</button>
        </form>
      </Modal>
    </div>
  );
}
