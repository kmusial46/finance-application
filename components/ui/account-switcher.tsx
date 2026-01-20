"use client";

import React from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { cn } from '@/lib/utils'

type Account = {
  appwriteItemId: string;
  name?: string;
  officialName?: string;
  mask?: string;
  needsReauth?: boolean;
};

export default function AccountSwitcher({
  accounts,
  currentId,
}: {
  accounts: Account[];
  currentId?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = e.target.value;
    const params = new URLSearchParams(searchParams?.toString() ?? "");
    if (selected) params.set("id", selected);
    else params.delete("id");
    params.delete("page");
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  return (
    <div className="account-switcher w-full max-w-sm">
      <label className="text-14 text-white block mb-2">Account</label>
      <select
        value={currentId ?? ""}
        onChange={handleChange}
        className={cn(
          "w-full min-w-0 rounded-md border px-3 py-2 text-base text-slate-900 shadow-xs transition-[color,box-shadow] outline-none bg-white",
          "border-gray-200 placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
          "disabled:opacity-50 disabled:pointer-events-none",
        )}
      >
        {accounts.map((acc) => (
          <option
            key={acc.appwriteItemId}
            value={acc.appwriteItemId}
            disabled={!!acc.needsReauth}
          >
            {acc.name ?? acc.officialName ?? "Account"}{acc.mask ? ` • ${acc.mask}` : ""}{acc.needsReauth ? " (Re-auth required)" : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
