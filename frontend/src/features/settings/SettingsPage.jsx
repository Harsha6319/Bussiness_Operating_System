import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { endpoints } from '../../api/client.js';
import { PageHeader } from '../../components/PageHeader.jsx';
import { Skeleton } from '../../components/Skeleton.jsx';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['settings'], queryFn: () => endpoints.settings.get().then((res) => res.data.data) });
  const save = useMutation({ mutationFn: endpoints.settings.update, onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }) });
  if (isLoading) return <div className="page-shell"><Skeleton lines={5} /></div>;

  function submit(event) {
    event.preventDefault();
    const form = Object.fromEntries(new FormData(event.currentTarget).entries());
    save.mutate({
      businessName: form.businessName,
      businessLogo: form.businessLogo,
      theme: form.theme,
      profile: { industry: form.industry, phone: form.phone, email: form.email, address: form.address, currency: form.currency },
      notifications: {
        lowStock: Boolean(form.lowStock),
        dailySummary: Boolean(form.dailySummary),
        invoiceReminders: Boolean(form.invoiceReminders)
      }
    });
  }

  return (
    <div className="page-shell">
      <PageHeader title="Settings" description="Business profile, logo, theme, and notification preferences." />
      <form className="panel grid gap-4 p-5 md:grid-cols-2" onSubmit={submit}>
        <label className="block text-sm font-medium text-slate-700">Business name<input className="input mt-1" name="businessName" defaultValue={data?.businessName} required /></label>
        <label className="block text-sm font-medium text-slate-700">Logo URL<input className="input mt-1" name="businessLogo" defaultValue={data?.businessLogo} /></label>
        <label className="block text-sm font-medium text-slate-700">Industry<input className="input mt-1" name="industry" defaultValue={data?.profile?.industry} /></label>
        <label className="block text-sm font-medium text-slate-700">Phone<input className="input mt-1" name="phone" defaultValue={data?.profile?.phone} /></label>
        <label className="block text-sm font-medium text-slate-700">Email<input className="input mt-1" name="email" defaultValue={data?.profile?.email} /></label>
        <label className="block text-sm font-medium text-slate-700">Currency<input className="input mt-1" name="currency" defaultValue={data?.profile?.currency || 'USD'} maxLength="3" /></label>
        <label className="block text-sm font-medium text-slate-700 md:col-span-2">Address<input className="input mt-1" name="address" defaultValue={data?.profile?.address} /></label>
        <label className="block text-sm font-medium text-slate-700">Theme<select className="input mt-1" name="theme" defaultValue={data?.theme || 'light'}><option value="light">Light</option><option value="dark">Dark</option><option value="system">System</option></select></label>
        <div className="space-y-3 rounded-lg border border-slate-200 p-4">
          <label className="flex items-center gap-2 text-sm text-slate-700"><input name="lowStock" type="checkbox" defaultChecked={data?.notifications?.lowStock} /> Low stock alerts</label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input name="dailySummary" type="checkbox" defaultChecked={data?.notifications?.dailySummary} /> Daily summary</label>
          <label className="flex items-center gap-2 text-sm text-slate-700"><input name="invoiceReminders" type="checkbox" defaultChecked={data?.notifications?.invoiceReminders} /> Invoice reminders</label>
        </div>
        <button className="btn-primary md:col-span-2" disabled={save.isPending}>Save settings</button>
      </form>
    </div>
  );
}
