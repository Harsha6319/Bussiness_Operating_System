import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { z } from 'zod';
import { useAuth } from '../../context/AuthContext.jsx';

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm({ resolver: zodResolver(schema) });

  async function onSubmit(values) {
    try {
      await login(values);
      navigate('/dashboard');
    } catch (error) {
      setError('root', { message: error.response?.data?.message || 'Unable to sign in. Check your credentials and try again.' });
    }
  }

  return (
    <div className="grid min-h-screen bg-slate-50 lg:grid-cols-[1fr_1.05fr]">
      <section className="flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <p className="text-2xl font-bold text-brand-700">AI-BOS</p>
          <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-950">Sign in to your workspace</h1>
          <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <label className="block text-sm font-medium text-slate-700">Email<input className="input mt-1" {...register('email')} /></label>
            {errors.email && <p className="text-sm text-rose-600">{errors.email.message}</p>}
            <label className="block text-sm font-medium text-slate-700">Password<input className="input mt-1" type="password" {...register('password')} /></label>
            {errors.password && <p className="text-sm text-rose-600">{errors.password.message}</p>}
            {errors.root && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{errors.root.message}</p>}
            <button className="btn-primary w-full" disabled={isSubmitting}>Sign in</button>
          </form>
          <p className="mt-6 text-sm text-slate-500">New to AI-BOS? <Link className="font-semibold text-brand-700" to="/register">Create an account</Link></p>
        </div>
      </section>
      <section className="hidden bg-brand-700 px-12 py-16 text-white lg:flex lg:items-end">
        <div className="max-w-xl">
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-100">One Platform to Manage, Automate and Grow</p>
          <p className="mt-4 text-5xl font-semibold tracking-tight">AI-powered operations for modern SMB teams.</p>
        </div>
      </section>
    </div>
  );
}
