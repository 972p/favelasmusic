'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        setError('Access Denied');
      }
    } catch (err) {
      setError('Error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        
        <form onSubmit={handleSubmit} className="relative group">
           <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="PASSWORD"
              className="w-full bg-transparent border-b border-white/10 py-4 text-center text-xl text-white tracking-[0.5em] placeholder-white/20 focus:outline-none focus:border-white/50 transition-colors"
              autoFocus
           />
           
           <button
            type="submit"
            disabled={loading || !password}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors disabled:opacity-0"
           >
             <ArrowRight className="w-5 h-5" />
           </button>
        </form>

        {error && (
          <div className="mt-8 text-center">
            <p className="text-red-500/50 text-xs tracking-widest uppercase">{error}</p>
          </div>
        )}
      </div>
    </div>
  );
}
