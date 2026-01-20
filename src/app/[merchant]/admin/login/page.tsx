'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Container, Button, Spinner } from '@/components/ui';
import { useSessionStore } from '@/lib/stores/sessionStore';

export default function MerchantAdminLoginPage() {
  const params = useParams<{ merchant: string }>();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merchantId, setMerchantId] = useState<string>('');
  const { merchantId: currentMerchantId } = useSessionStore();

  const merchantSlug = params.merchant;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/merchants/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantSlug,
          email,
          password,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || '로그인 실패');
      }

      const { merchantId: fetchedMerchantId } = await response.json();
      setMerchantId(fetchedMerchantId);

      // Navigate to admin dashboard
      router.push(`/${merchantSlug}/admin/dashboard`);
    } catch (err) {
      setError(err instanceof Error ? err.message : '로그인 중 오류가 발생했습니다');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center py-8 p-4">
      {/* Ambient Background */}
      <div className="fixed inset-0 bg-gradient-radial from-[#1a2530] via-background-dark to-black z-0" />
      <div className="fixed top-1/4 left-1/4 w-96 h-96 bg-neon-cyan/5 rounded-full blur-3xl" />
      <div className="fixed bottom-1/4 right-1/4 w-96 h-96 bg-neon-purple/5 rounded-full blur-3xl" />
      
      <Container maxWidth="sm" className="relative z-10 stagger-children">
        <div className="glass-panel rounded-2xl p-8 border border-steel/30 shadow-2xl">
          {/* Logo/Icon */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-neon-cyan/20 to-neon-purple/10 flex items-center justify-center border border-neon-cyan/30">
              <svg className="w-10 h-10 text-neon-cyan" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h1 className="font-display text-3xl text-soft-white mb-2">
              가게 관리자 로그인
            </h1>
            <p className="text-muted text-sm">
              {merchantSlug} 관리자로 로그인하세요
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-soft-white mb-2">
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-soft-white mb-2">
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <Button
              variant="primary"
              type="submit"
              disabled={isLoading}
              className="w-full py-3 text-lg"
            >
              {isLoading ? (
                <Spinner size="sm" />
              ) : (
                '로그인'
              )}
            </Button>
          </form>

          {/* Back Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => router.push(`/${merchantSlug}`)}
              className="text-sm text-muted hover:text-soft-white transition-colors"
            >
              ← 가게 페이지로 돌아가기
            </button>
          </div>

          {/* Platform Admin Link */}
          <div className="mt-8 pt-6 border-t border-steel/30 text-center">
            <p className="text-xs text-muted mb-2">
              플랫폼 관리자이신가요?
            </p>
            <button
              type="button"
              onClick={() => router.push('/admin/login')}
              className="text-sm text-neon-cyan hover:text-neon-purple transition-colors"
            >
              플랫폼 관리자 로그인 →
            </button>
          </div>
        </div>
      </Container>
    </div>
  );
}
