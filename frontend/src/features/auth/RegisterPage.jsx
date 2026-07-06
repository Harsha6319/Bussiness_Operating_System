import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';

const schema = z.object({
  businessName: z.string().min(2),
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export function RegisterPage() {
  const { register: createAccount } = useAuth();
  const navigate = useNavigate();
  const form = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    try {
      await createAccount(values);
      navigate('/dashboard');
    } catch (error) {
      form.setError('root', { message: error.response?.data?.message || 'Unable to create workspace. Please review the details and try again.' });
    }
  }

  return (
    <div className="grid min-h-screen place-items-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-xl rounded-lg border border-slate-200 bg-white p-8 shadow-soft">
        <p className="text-2xl font-bold text-brand-700">AI-BOS</p>
        <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-950">Create your business workspace</h1>
        <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={form.handleSubmit(onSubmit)}>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Business name<input className="input mt-1" {...form.register('businessName')} /></label>
          <label className="block text-sm font-medium text-slate-700">Your name<input className="input mt-1" {...form.register('name')} /></label>
          <label className="block text-sm font-medium text-slate-700">Email<input className="input mt-1" {...form.register('email')} /></label>
          <label className="block text-sm font-medium text-slate-700 sm:col-span-2">Password<input className="input mt-1" type="password" {...form.register('password')} /></label>
          {form.formState.errors.root && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 sm:col-span-2">{form.formState.errors.root.message}</p>}
          <button className="btn-primary sm:col-span-2" disabled={form.formState.isSubmitting}>Create workspace</button>
        </form>
        <p className="mt-6 text-sm text-slate-500">Already have an account? <Link className="font-semibold text-brand-700" to="/login">Sign in</Link></p>
      </div>
    </div>
  );
}
