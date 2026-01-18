'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, MessageCircle, Gift, Shield, Sparkles } from 'lucide-react';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Check if there's a stored session and redirect
    const storedSession = localStorage.getItem('tableconnect_session');
    if (storedSession) {
      try {
        const session = JSON.parse(storedSession);
        if (session.merchantId && session.tableNumber) {
          router.push(`/${session.merchantId}/${session.tableNumber}`);
        }
      } catch {
        // Invalid session data, stay on landing page
      }
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-pink-500 to-purple-500 opacity-30 rounded-full" />
                <div className="relative bg-gradient-to-r from-pink-500 to-purple-600 p-4 rounded-2xl">
                  <MessageCircle className="w-12 h-12 text-white" />
                </div>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-4xl sm:text-6xl font-bold text-white mb-6">
              <span className="bg-gradient-to-r from-pink-400 to-purple-400 bg-clip-text text-transparent">
                Table Connect
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl sm:text-2xl text-gray-300 mb-8 max-w-2xl mx-auto">
              居酒屋のテーブル同士で
              <br className="sm:hidden" />
              匿名コミュニケーション
            </p>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
                <QrCode className="w-16 h-16 text-pink-400 mx-auto mb-3" />
                <p className="text-white font-medium">QRコードをスキャン</p>
                <p className="text-gray-400 text-sm mt-1">テーブルのQRコードから参加</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
          主な機能
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Feature 1: Chat */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-pink-500/50 transition-colors">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 p-3 rounded-xl w-fit mb-4">
              <MessageCircle className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">匿名チャット</h3>
            <p className="text-gray-400 text-sm">
              ニックネームで気軽に他のテーブルとチャット
            </p>
          </div>

          {/* Feature 2: Gift */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-pink-500/50 transition-colors">
            <div className="bg-gradient-to-r from-orange-500 to-pink-500 p-3 rounded-xl w-fit mb-4">
              <Gift className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">ギフト送信</h3>
            <p className="text-gray-400 text-sm">
              ドリンクやフードをギフトとして送れます
            </p>
          </div>

          {/* Feature 3: Safety */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-pink-500/50 transition-colors">
            <div className="bg-gradient-to-r from-green-500 to-teal-500 p-3 rounded-xl w-fit mb-4">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">安心・安全</h3>
            <p className="text-gray-400 text-sm">
              ブロック・報告機能で安心して利用可能
            </p>
          </div>

          {/* Feature 4: Real-time */}
          <div className="bg-white/5 backdrop-blur-lg rounded-2xl p-6 border border-white/10 hover:border-pink-500/50 transition-colors">
            <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-3 rounded-xl w-fit mb-4">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">リアルタイム</h3>
            <p className="text-gray-400 text-sm">
              メッセージは即座に相手に届きます
            </p>
          </div>
        </div>
      </div>

      {/* How to Use Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center mb-12">
          使い方
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
              1
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">QRコードをスキャン</h3>
            <p className="text-gray-400 text-sm">
              テーブルに置かれたQRコードをスマートフォンでスキャン
            </p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
              2
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">ニックネームを入力</h3>
            <p className="text-gray-400 text-sm">
              好きなニックネームを入力して参加
            </p>
          </div>

          <div className="text-center">
            <div className="bg-gradient-to-r from-pink-500 to-purple-500 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 text-white font-bold text-xl">
              3
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">チャット開始</h3>
            <p className="text-gray-400 text-sm">
              他のテーブルの人とチャットやギフト送信を楽しもう
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-pink-400" />
              <span className="text-white font-semibold">Table Connect</span>
            </div>
            <p className="text-gray-500 text-sm">
              © 2024 Table Connect. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
