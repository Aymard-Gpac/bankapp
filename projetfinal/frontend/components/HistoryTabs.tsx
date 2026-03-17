"use client";

import { useMemo, useState } from "react";
import TransactionsTable from "@/components/TransactionsTable";

type HistoryTransaction = {
  id: number;
  account_id: number;
  account_type: string;
  account_number?: string;
  description?: string | null;
  amount: number;
  type: string;
  created_at: string;
};

type Props = {
  transactions: HistoryTransaction[];
};

type AccountTab = "cheque" | "epargne" | "credit";
type DirectionFilter = "all" | "in" | "out";

const accountTabs: { key: AccountTab; label: string }[] = [
  { key: "cheque", label: "Cheque" },
  { key: "epargne", label: "Epargne" },
  { key: "credit", label: "Credit" },
];

const normalizeAccountType = (value?: string | null): AccountTab | "" => {
  const raw = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  if (raw.includes("cheque")) return "cheque";
  if (raw.includes("epargne")) return "epargne";
  if (raw.includes("credit")) return "credit";
  return "";
};

const getDirectionLabel = (type?: string | null) =>
  String(type ?? "").toUpperCase() === "CREDIT" ? "Entrée" : "Sortie";

export default function HistoryTabs({ transactions }: Props) {
  const [activeTab, setActiveTab] = useState<AccountTab>("cheque");
  const [directionFilter, setDirectionFilter] =
    useState<DirectionFilter>("all");

  const filteredTransactions = useMemo(() => {
    return (transactions ?? []).filter((transaction) => {
      const matchesTab =
        normalizeAccountType(transaction.account_type) === activeTab;

      if (!matchesTab) return false;

      const direction = getDirectionLabel(transaction.type);

      if (directionFilter === "in") return direction === "Entrée";
      if (directionFilter === "out") return direction === "Sortie";

      return true;
    });
  }, [activeTab, directionFilter, transactions]);

  const stats = useMemo(() => {
    const entries = filteredTransactions.filter(
      (item) => getDirectionLabel(item.type) === "Entrée"
    ).length;

    const exits = filteredTransactions.filter(
      (item) => getDirectionLabel(item.type) === "Sortie"
    ).length;

    return {
      entries,
      exits,
      total: filteredTransactions.length,
    };
  }, [filteredTransactions]);

  return (
    <div className="w-full">
      {/* Onglets */}
      <div className="flex flex-wrap gap-3 border-b border-gray-200 pb-3">
        {accountTabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === tab.key
                ? "border border-blue-600 bg-blue-50 text-blue-700"
                : "border border-transparent text-gray-700 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="space-y-6 py-6">
        {/* Titre + filtres */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-xl">
            <h2 className="text-[18px] font-semibold text-gray-900">
              Historique des transactions
            </h2>
            <p className="text-sm text-gray-600">
              Consulte les entrées et les sorties pour le compte sélectionné.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setDirectionFilter("all")}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                directionFilter === "all"
                  ? "border-blue-600 bg-blue-50 text-blue-700"
                  : "border-gray-200 text-gray-700"
              }`}
            >
              Toutes
            </button>

            <button
              type="button"
              onClick={() => setDirectionFilter("in")}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                directionFilter === "in"
                  ? "border-green-600 bg-green-50 text-green-700"
                  : "border-gray-200 text-gray-700"
              }`}
            >
              Entrées seulement
            </button>

            <button
              type="button"
              onClick={() => setDirectionFilter("out")}
              className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                directionFilter === "out"
                  ? "border-red-600 bg-red-50 text-red-700"
                  : "border-gray-200 text-gray-700"
              }`}
            >
              Sorties seulement
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Transactions affichées</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-700">Entrées</p>
            <p className="mt-2 text-2xl font-semibold text-green-700">
              {stats.entries}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">Sorties</p>
            <p className="mt-2 text-2xl font-semibold text-red-700">
              {stats.exits}
            </p>
          </div>
        </div>

        {/* Tableau */}
        <div className="w-full overflow-x-auto rounded-2xl border border-gray-200 bg-white">
          <div className="min-w-[1050px] p-4">
            <TransactionsTable
              transactions={filteredTransactions.map((transaction) => ({
                ...transaction,
                description:
                  transaction.description ||
                  `Transaction ${getDirectionLabel(transaction.type).toLowerCase()} • ${
                    transaction.account_number || transaction.account_type
                  }`,
              }))}
              showAccountColumn
              showDirectionColumn
            />
          </div>
        </div>

        {filteredTransactions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
            Aucune transaction trouvée pour ce filtre.
          </div>
        )}
      </div>
    </div>
  );
}