"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { cn, formUrlQuery } from "@/lib/utils";
import type { Account } from "@/types";

/* ---------------- BankTabItem ---------------- */
export const BankTabItem = ({
  account,
  selectedId,
  setSelectedId,
}: {
  account: Account;
  selectedId: string;                 // id sélectionné (string)
  setSelectedId?: (id: string) => void;
}) => {
  const searchParams = useSearchParams();
  const router = useRouter();

  const accountIdStr = String(account.id);     // ✅ convertit number -> string
  const isActive = selectedId === accountIdStr;

  const handleBankChange = () => {
    // ✅ Met à jour le state sélectionné avec string
    if (setSelectedId) setSelectedId(accountIdStr);

    // ✅ Met à jour l'URL avec string
    const newUrl = formUrlQuery({
      params: searchParams.toString(),
      key: "id",
      value: accountIdStr,
    });

    router.push(newUrl, { scroll: false });
  };

  return (
    <div
      onClick={handleBankChange}
      className={cn("banktab-item cursor-pointer px-3 py-2 rounded", {
        "border-b-2 border-blue-600": isActive,
      })}
    >
      <p
        className={cn("text-16 font-medium line-clamp-1", {
          "text-blue-600": isActive,
          "text-gray-500": !isActive,
        })}
      >
        {/* ✅ Affichage stable même si name manque */}
        {account.type ?? `Account ${account.id}`}
      </p>
    </div>
  );
};
