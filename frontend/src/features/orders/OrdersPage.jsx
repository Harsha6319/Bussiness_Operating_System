import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { endpoints } from '../../api/client.js';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { currency, date } from '../../utils/format.js';

export function OrdersPage() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState({ customer: '', product: '', quantity: 1 });
  const queryClient = useQueryClient();
  const { data: orders } = useQuery({ queryKey: ['orders'], queryFn: () => endpoints.orders.list().then((res) => res.data) });
  const { data: customers } = useQuery({ queryKey: ['customers'], queryFn: () => endpoints.customers.list({ limit: 100 }).then((res) => res.data) });
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => endpoints.products.list({ limit: 100 }).then((res) => res.data) });
  const create = useMutation({ mutationFn: endpoints.orders.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['orders'] }); queryClient.invalidateQueries({ queryKey: ['products'] }); setOpen(false); } });
  const selectedProduct = products?.data?.find((item) => item._id === draft.product);
  const total = useMemo(() => (selectedProduct?.price || 0) * Number(draft.quantity || 1), [selectedProduct, draft.quantity]);

  function submit(event) {
    event.preventDefault();
    create.mutate({ customer: draft.customer, items: [{ product: draft.product, quantity: Number(draft.quantity) }], paymentStatus: 'Paid' });
  }

  return (
    <div className="page-shell">
      <PageHeader title="Orders" description="Create orders, track status, and calculate totals from product pricing." action={<button className="btn-primary" onClick={() => setOpen(true)}><FiPlus /> Create Order</button>} />
      <DataTable columns={[{ key: 'orderNumber', label: 'Order' }, { key: 'customer', label: 'Customer', render: (row) => row.customer?.name }, { key: 'status', label: 'Status' }, { key: 'paymentStatus', label: 'Payment' }, { key: 'total', label: 'Total', render: (row) => currency(row.total) }, { key: 'createdAt', label: 'Date', render: (row) => date(row.createdAt) }]} rows={orders?.data || []} />
      <Modal open={open} title="Create Order" onClose={() => setOpen(false)}>
        <form className="grid gap-3" onSubmit={submit}>
          <select className="input" value={draft.customer} onChange={(event) => setDraft({ ...draft, customer: event.target.value })} required>
            <option value="">Select customer</option>
            {customers?.data?.map((customer) => <option key={customer._id} value={customer._id}>{customer.name}</option>)}
          </select>
          <select className="input" value={draft.product} onChange={(event) => setDraft({ ...draft, product: event.target.value })} required>
            <option value="">Select product</option>
            {products?.data?.map((product) => <option key={product._id} value={product._id}>{product.name} - {currency(product.price)}</option>)}
          </select>
          <input className="input" type="number" min="1" value={draft.quantity} onChange={(event) => setDraft({ ...draft, quantity: event.target.value })} />
          <p className="rounded-lg bg-slate-50 p-3 text-sm font-semibold text-slate-700">Automatic total: {currency(total)}</p>
          <button className="btn-primary">Create paid order</button>
        </form>
      </Modal>
    </div>
  );
}
