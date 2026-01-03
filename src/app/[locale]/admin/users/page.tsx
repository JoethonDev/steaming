"use client";

import { useTranslation } from "@/i18n/client";

export default function AdminUsersPage() {
  const { t } = useTranslation();

  return (
    <div className="p-6 lg:p-10">
      <h1 className="text-3xl font-bold text-red-400 mb-6">{t('user_management')}</h1>
      <div className="bg-[#0f1116] border border-white/10 rounded-2xl p-8">
        <p className="text-slate-400">User management functionality coming soon...</p>
      </div>
    </div>
  );
}