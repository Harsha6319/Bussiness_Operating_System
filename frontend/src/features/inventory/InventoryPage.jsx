import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import { endpoints } from '../../api/client.js';
import { Card } from '../../components/Card.jsx';
import { DataTable } from '../../components/DataTable.jsx';
import { Modal } from '../../components/Modal.jsx';
import { PageHeader } from '../../components/PageHeader.jsx';
import { currency } from '../../utils/format.js';

export function InventoryPage() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();
  const { data: products } = useQuery({ queryKey: ['products'], queryFn: () => endpoints.products.list({ limit: 100 }).then((res) => res.data) });
  const { data: stats } = useQuery({ queryKey: ['product-stats'], queryFn: () => endpoints.products.stats().then((res) => res.data.data) });
  const create = useMutation({ mutationFn: endpoints.products.create, onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['products'] }); queryClient.invalidateQueries({ queryKey: ['product-stats'] }); setOpen(false); } });

  function submit(event) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    create.mutate({ ...data, stockQuantity: Number(data.stockQuantity), price: Number(data.price), lowStockThreshold: Number(data.lowStockThreshold || 5), costPrice: Number(data.costPrice || 0) });
  }

  return (
    <div className="page-shell">
      <PageHeader title="Inventory" description="Products, categories, pricing, barcode/QR metadata, and low-stock alerts." action={<button className="btn-primary" onClick={() => setOpen(true)}><FiPlus /> Add Product</button>} />
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card title="Products" value={stats?.products || 0} />
        <Card title="Units" value={stats?.units || 0} />
        <Card title="Inventory Value" value={currency(stats?.inventoryValue)} />
        <Card title="Low Stock" value={stats?.lowStock || 0} tone="amber" />
      </div>
      <DataTable columns={[
        { key: 'name', label: 'Product' },
        { key: 'category', label: 'Category' },
        { key: 'stockQuantity', label: 'Stock', render: (row) => <span className={row.isLowStock || row.stockQuantity <= (row.lowStockThreshold || 5) ? "font-semibold text-red-600" : ""}>{row.stockQuantity}</span> },
        { key: 'price', label: 'Price', render: (row) => currency(row.price) },
        { key: 'barcode', label: 'Barcode' }
      ]} rows={products?.data || []} />
      <Modal open={open} title="Add Product" onClose={() => setOpen(false)}>
        <form className="grid gap-3 sm:grid-cols-2" onSubmit={submit}>
          <input className="input sm:col-span-2" name="name" placeholder="Product name" required />
          <input className="input" name="category" placeholder="Category" />
          <input className="input" name="sku" placeholder="SKU" />
          <input className="input" name="stockQuantity" placeholder="Stock" type="number" required />
          <input className="input" name="lowStockThreshold" placeholder="Low stock threshold" type="number" />
          <input className="input" name="price" placeholder="Price" type="number" step="0.01" required />
          <input className="input" name="barcode" placeholder="Barcode" />
          <button className="btn-primary sm:col-span-2">Save product</button>
        </form>
      </Modal>
    </div>
  );
}
