'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { MerchantAdminSidebar } from '@/components/admin';
import { Spinner, Card, Button } from '@/components/ui';
import { useSessionStore } from '@/lib/stores/sessionStore';

interface MerchantSettings {
  name: string;
  slug: string;
  description?: string;
  address?: string;
  phone?: string;
  business_hours?: string;
  settings: {
    max_tables: number;
    fee_percentage: number;
    auto_settlement: boolean;
  };
}

export default function MerchantSettingsPage() {
  const params = useParams<{ merchant: string }>();
  const router = useRouter();
  const [settings, setSettings] = useState<MerchantSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { merchantId } = useSessionStore();

  const merchantSlug = params.merchant;

  const [formData, setFormData] = useState<Partial<MerchantSettings>>({});

  useEffect(() => {
    async function fetchSettings() {
      if (!merchantId) {
        setError('관리자 권한이 필요합니다');
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/merchants/${merchantSlug}/admin/settings`);
        
        if (!response.ok) {
          throw new Error('가게 정보 가져오기 실패');
        }

        const { data } = await response.json();
        setSettings(data);
        setFormData(data);
      } catch (err) {
        console.error('Settings error:', err);
        setError('가게 정보을 가져오는 중 오류가 발생했습니다');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSettings();
  }, [merchantSlug, merchantId]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);

    try {
      const response = await fetch(`/api/merchants/${merchantSlug}/admin/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('가게 정보 저장 실패');
      }

      const { data } = await response.json();
      setSettings(data);
      setSuccess('가게 정보가 성공적으로 저장되었습니다');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : '가게 정보 저장 중 오류 발생');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex">
        <MerchantAdminSidebar />
        <main className="flex-1 ml-64 p-8">
          <div className="flex items-center justify-center h-64">
            <Spinner size="lg" />
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex">
      <MerchantAdminSidebar />

      <main className="flex-1 ml-64 p-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display text-soft-white mb-2">
              가게 설정
            </h1>
            <p className="text-muted">
              가게 정보 및 운영 설정을 관리하세요
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Card className="p-4 mb-6 bg-red-500/10 border-red-500/30">
              <p className="text-red-400">{error}</p>
            </Card>
          )}

          {/* Success Message */}
          {success && (
            <Card className="p-4 mb-6 bg-green-500/10 border-green-500/30">
              <p className="text-green-400">{success}</p>
            </Card>
          )}

          {settings && (
            <form onSubmit={handleSave} className="space-y-6">
              {/* Basic Info */}
              <Card className="p-6">
                <h2 className="text-xl font-display text-soft-white mb-6">
                  기본 정보
                </h2>
                
                <div className="space-y-4">
                  {/* Name */}
                  <div>
                    <label className="block text-sm font-medium text-soft-white mb-2">
                      가게 이름 *
                    </label>
                    <input
                      type="text"
                      value={formData.name || ''}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="예: 도쿄 시나죠쿠라쿠바"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                    />
                  </div>

                  {/* Slug (Read-only) */}
                  <div>
                    <label className="block text-sm font-medium text-soft-white mb-2">
                      슬러그 (URL)
                    </label>
                    <input
                      type="text"
                      value={formData.slug || ''}
                      disabled
                      className="w-full px-4 py-3 rounded-xl bg-steel/30 border border-steel/20 text-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted mt-1">
                      슬러그는 변경할 수 없습니다. 관리자에게 문의하세요.
                    </p>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-medium text-soft-white mb-2">
                      가게 설명
                    </label>
                    <textarea
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="가게에 대한 설명을 입력하세요"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                    />
                  </div>
                </div>
              </Card>

              {/* Contact Info */}
              <Card className="p-6">
                <h2 className="text-xl font-display text-soft-white mb-6">
                  연락처 정보
                </h2>
                
                <div className="space-y-4">
                  {/* Address */}
                  <div>
                    <label className="block text-sm font-medium text-soft-white mb-2">
                      주소
                    </label>
                    <input
                      type="text"
                      value={formData.address || ''}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      placeholder="예: 도쿄 도 시나죠쿠 1-1-1"
                      className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-soft-white mb-2">
                      전화번호
                    </label>
                    <input
                      type="tel"
                      value={formData.phone || ''}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="예: 03-1234-5678"
                      className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                    />
                  </div>

                  {/* Business Hours */}
                  <div>
                    <label className="block text-sm font-medium text-soft-white mb-2">
                      영업 시간
                    </label>
                    <input
                      type="text"
                      value={formData.business_hours || ''}
                      onChange={(e) => setFormData({ ...formData, business_hours: e.target.value })}
                      placeholder="예: 월-금 17:00-24:00, 토-일 12:00-23:00"
                      className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                    />
                  </div>
                </div>
              </Card>

              {/* Operation Settings */}
              <Card className="p-6">
                <h2 className="text-xl font-display text-soft-white mb-6">
                  운영 설정
                </h2>
                
                <div className="space-y-4">
                  {/* Max Tables */}
                  <div>
                    <label className="block text-sm font-medium text-soft-white mb-2">
                      최대 테이블 수 *
                    </label>
                    <input
                      type="number"
                      value={formData.settings?.max_tables || 50}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings!, max_tables: parseInt(e.target.value) || 50 }
                      })}
                      min="1"
                      max="200"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                    />
                    <p className="text-xs text-muted mt-1">
                      가게의 최대 테이블 수를 설정하세요. (1-200)
                    </p>
                  </div>

                  {/* Fee Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-soft-white mb-2">
                      플랫폼 수수료율 (%) *
                    </label>
                    <input
                      type="number"
                      value={formData.settings?.fee_percentage || 10}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings!, fee_percentage: parseFloat(e.target.value) || 10 }
                      })}
                      min="0"
                      max="50"
                      step="0.1"
                      required
                      className="w-full px-4 py-3 rounded-xl bg-steel/50 border border-steel/30 text-soft-white placeholder:text-muted focus:outline-none focus:border-neon-cyan focus:ring-2 focus:ring-neon-cyan/20 transition-all"
                    />
                    <p className="text-xs text-muted mt-1">
                      선물 매출에서 플랫폼 수수료 비율을 설정하세요. (0-50%)
                    </p>
                  </div>

                  {/* Auto Settlement */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="auto_settlement"
                      checked={formData.settings?.auto_settlement || false}
                      onChange={(e) => setFormData({
                        ...formData,
                        settings: { ...formData.settings!, auto_settlement: e.target.checked }
                      })}
                      className="w-5 h-5 rounded border-steel/30"
                    />
                    <label htmlFor="auto_settlement" className="text-sm text-soft-white">
                      매월 자동 정산 (월말 자동 정산 요청)
                    </label>
                  </div>
                </div>
              </Card>

              {/* Submit Button */}
              <div className="flex gap-3">
                <Button
                  variant="primary"
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-3 text-lg"
                >
                  {isSaving ? (
                    <Spinner size="sm" />
                  ) : (
                    '저장 완료'
                  )}
                </Button>
                <Button
                  variant="ghost"
                  type="button"
                  onClick={() => router.push(`/${merchantSlug}/admin/dashboard`)}
                  className="flex-1 py-3 text-lg"
                >
                  취소
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
