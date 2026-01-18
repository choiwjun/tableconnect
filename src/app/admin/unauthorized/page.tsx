'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Button, Card } from '@/components/ui';

export default function UnauthorizedPage() {
  const router = useRouter();
  const supabase = useMemo(() => createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  ), []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-void flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
          <svg
            className="w-10 h-10 text-red-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"
            />
          </svg>
        </div>

        <h1 className="font-display text-2xl text-soft-white mb-2">
          アクセス権限がありません
        </h1>
        <p className="text-muted mb-8">
          このページにアクセスする権限がありません。
          <br />
          管理者にお問い合わせください。
        </p>

        <div className="flex gap-4">
          <Button
            variant="ghost"
            className="flex-1"
            onClick={() => router.back()}
          >
            戻る
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            onClick={handleLogout}
          >
            ログアウト
          </Button>
        </div>
      </Card>
    </div>
  );
}
