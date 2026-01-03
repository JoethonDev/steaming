import React from "react";
import { db } from "@/lib/db";
import { getDictionary } from "@/i18n/config";
import { I18nProvider } from "@/i18n/client";
import CatalogClient from "./CatalogClient";
import type { CatalogSeries } from "@/types";
import type { Locale } from "@/i18n/config";

interface CatalogPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function CatalogPage({ params }: CatalogPageProps) {
  const { locale } = await params;
  const validLocale = (locale === 'ar' || locale === 'en') ? locale as Locale : 'ar';
  
  // Get dictionary and series data
  const [dictionary, series] = await Promise.all([
    getDictionary(validLocale),
    db.series.findMany({
      orderBy: { createdAt: "desc" },
    }) as Promise<CatalogSeries[]>
  ]);

  return (
    <I18nProvider dictionary={dictionary} locale={validLocale}>
      <CatalogClient series={series} locale={validLocale} />
    </I18nProvider>
  );
}