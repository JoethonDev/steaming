"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { Play, Shield, Download, Users, Loader2 } from "lucide-react";
import { useTranslation } from "@/i18n/client";
import LanguageToggle from "@/components/LanguageToggle";
import { type Locale } from "@/i18n/config";

interface HomePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default function HomePage({ params }: HomePageProps) {
  const { data: session, status } = useSession();
  const { t } = useTranslation();
  const [locale, setLocale] = React.useState<string>('ar');

  React.useEffect(() => {
    params.then(({ locale: paramLocale }) => {
      setLocale(paramLocale || 'ar');
    });
  }, [params]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#08090c]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#08090c] via-[#0f1116] to-[#1a1b23] text-white">
      {/* Header */}
      <header className="relative z-10 flex items-center justify-between p-6 lg:p-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center">
            <Play className="w-5 h-5 text-white" fill="currentColor" />
          </div>
          <h1 className="text-xl font-black">Stream Master Pro</h1>
        </div>

        <div className="flex items-center gap-4">
          <LanguageToggle currentLocale={locale as Locale} />
          {session ? (
            <>
              <Link
                href={`/${locale}/dashboard`}
                className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition-colors"
              >
                {t('dashboard')}
              </Link>
              <button
                onClick={() => signOut()}
                className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
              >
                {t('sign_out')}
              </button>
            </>
          ) : (
            <Link
              href={`/${locale}/login`}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 rounded-xl font-bold transition-colors"
            >
              {t('sign_in')}
            </Link>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="w-20 h-20 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <Play className="w-10 h-10 text-indigo-400" fill="currentColor" />
            </div>
            <h1 className="text-5xl lg:text-7xl font-black mb-6 bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              Stream Master Pro
            </h1>
            <p className="text-xl lg:text-2xl text-slate-400 mb-8 leading-relaxed">
              {t('app_description')}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            {session ? (
              <Link
                href={`/${locale}/dashboard`}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
              >
                {t('access_dashboard')}
              </Link>
            ) : (
              <Link
                href={`/${locale}/login`}
                className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 rounded-2xl font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-indigo-500/20"
              >
                {t('get_started')}
              </Link>
            )}
            <button className="px-8 py-4 border border-white/20 hover:border-white/40 rounded-2xl font-bold text-lg transition-all hover:bg-white/5">
              {t('learn_more')}
            </button>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="p-8 bg-white/5 backdrop-blur border border-white/10 rounded-3xl">
              <Shield className="w-8 h-8 text-indigo-400 mb-4" />
              <h3 className="text-xl font-bold mb-3">
                {t('secure_streaming')}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {t('secure_streaming_desc')}
              </p>
            </div>

            <div className="p-8 bg-white/5 backdrop-blur border border-white/10 rounded-3xl">
              <Download className="w-8 h-8 text-green-400 mb-4" />
              <h3 className="text-xl font-bold mb-3">
                {t('offline_support')}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {t('offline_support_desc')}
              </p>
            </div>

            <div className="p-8 bg-white/5 backdrop-blur border border-white/10 rounded-3xl">
              <Users className="w-8 h-8 text-purple-400 mb-4" />
              <h3 className="text-xl font-bold mb-3">
                {t('multi_user')}
              </h3>
              <p className="text-slate-400 leading-relaxed">
                {t('multi_user_desc')}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Background Effects */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}