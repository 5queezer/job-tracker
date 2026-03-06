"use client";

import { useLocale } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function toggle() {
    const next = locale === "de" ? "en" : "de";
    document.cookie = `locale=${next}; path=/; max-age=31536000; SameSite=Lax`;
    startTransition(() => {
      router.refresh();
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      title={locale === "de" ? "Switch to English" : "Zu Deutsch wechseln"}
      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
    >
      <span className="text-base leading-none">
        {locale === "de" ? "🇩🇪" : "🇬🇧"}
      </span>
      <span>{locale === "de" ? "DE" : "EN"}</span>
    </button>
  );
}
