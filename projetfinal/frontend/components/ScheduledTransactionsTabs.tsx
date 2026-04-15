"use client";

import { useEffect, useMemo, useState } from "react";
import ScheduledTransactionList from "@/components/ScheduledTransactionList";
import { ScheduledTransaction } from "@/types";
import {
  getScheduledTransactions,
  cancelScheduledTransaction,
} from "@/lib/actions/scheduled-transaction.action";

type AccountTab = "cheque" | "epargne" | "credit";
type StatusFilter = "all" | "active" | "cancelled";

const accountTabs: { key: AccountTab; label: string }[] = [
  { key: "cheque", label: "Cheque" },
  { key: "epargne", label: "Epargne" },
  { key: "credit", label: "Credit" },
];

/**
 * Normalise une chaîne pour rendre les comparaisons plus robustes.
 *
 * Utilisé pour :
 * - les onglets de compte
 * - la recherche libre
 */
function normalizeText(value?: string | null) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

/**
 * Convertit un libellé de compte vers une valeur simple
 * utilisée par les onglets.
 */
function normalizeAccountType(value?: string | null): AccountTab | "" {
  const raw = normalizeText(value);

  if (raw.includes("cheque")) return "cheque";
  if (raw.includes("epargne")) return "epargne";
  if (raw.includes("credit")) return "credit";

  return "";
}

/**
 * Construit le texte utilisé par la recherche.
 *
 * On regroupe plusieurs champs afin que la recherche fonctionne
 * même si l'utilisateur tape :
 * - un nom de bénéficiaire
 * - un nom de destinataire
 * - une description
 * - un compte source ou destination
 */
function getSearchableText(transaction: ScheduledTransaction) {
  const recipientName = `${transaction.recipient_first_name ?? ""} ${
    transaction.recipient_last_name ?? ""
  }`.trim();

  return normalizeText(
    [
      transaction.description,
      transaction.source_account_name,
      transaction.destination_account_name,
      transaction.beneficiary_name,
      transaction.interac_recipient_name,
      transaction.recipient_email,
      recipientName,
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export default function ScheduledTransactionsTabs() {
  const [transactions, setTransactions] = useState<ScheduledTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /**
   * États UI inspirés du pattern HistoryTabs.
   *
   * - activeTab     : onglet du compte source
   * - statusFilter  : toutes / actives / annulées
   * - search        : recherche libre
   */
  const [activeTab, setActiveTab] = useState<AccountTab>("cheque");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  /**
   * Charge la liste des transactions futures depuis l'API.
   */
  async function chargerTransactions() {
    try {
      setLoading(true);
      setError("");

      const data = await getScheduledTransactions();
      setTransactions(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Erreur lors du chargement"
      );
    } finally {
      setLoading(false);
    }
  }

  /**
   * Chargement initial au montage du composant.
   */
  useEffect(() => {
    chargerTransactions();
  }, []);

  /**
   * Annule une transaction programmée puis met à jour
   * l'état local de manière synchrone côté UI.
   *
   * Ici on évite un rechargement complet inutile :
   * on remplace simplement le statut de l'élément concerné.
   */
  async function handleCancel(transactionId: number) {
    await cancelScheduledTransaction(transactionId);

    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === transactionId
          ? { ...transaction, status: "cancelled" }
          : transaction
      )
    );
  }

  /**
   * Applique les filtres visibles dans l'interface.
   *
   * Ordre de filtrage :
   * 1. onglet de compte
   * 2. statut
   * 3. recherche
   */
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const matchesTab =
        normalizeAccountType(transaction.source_account_name) === activeTab;

      if (!matchesTab) return false;

      if (statusFilter !== "all" && transaction.status !== statusFilter) {
        return false;
      }

      const normalizedSearch = normalizeText(search);
      const haystack = getSearchableText(transaction);

      if (normalizedSearch && !haystack.includes(normalizedSearch)) {
        return false;
      }

      return true;
    });
  }, [transactions, activeTab, statusFilter, search]);

  /**
   * Statistiques d'affichage, dans le même esprit que HistoryTabs.
   */
  const stats = useMemo(() => {
    const active = filteredTransactions.filter(
      (item) => item.status === "active"
    ).length;

    const cancelled = filteredTransactions.filter(
      (item) => item.status === "cancelled"
    ).length;

    return {
      total: filteredTransactions.length,
      active,
      cancelled,
    };
  }, [filteredTransactions]);

  if (loading) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-white p-6 shadow-sm">
        <p className="text-sm font-medium text-slate-500">
          Chargement des transactions programmées...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[20px] border border-red-200 bg-red-50 p-6 shadow-sm">
        <p className="text-sm font-medium text-red-600">{error}</p>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="rounded-[20px] border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900">
          Aucune transaction future
        </h3>
        <p className="mt-2 text-sm text-slate-500">
          Les virements et paiements récurrents programmés apparaîtront ici.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Onglets des comptes, comme dans HistoryTabs */}
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
        {/* Zone de titre secondaire + recherche + filtre de statut */}
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-xl">
            <h2 className="text-[18px] font-semibold text-gray-900">
              Transactions futures
            </h2>
            <p className="text-sm text-gray-600">
              Consulte les transactions programmées du compte sélectionné et
              filtre-les par statut ou par recherche.
            </p>
          </div>

          <div className="flex w-full max-w-2xl flex-col gap-3 xl:items-end">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher un bénéficiaire, un destinataire ou une description..."
              className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-700 outline-none transition focus:border-blue-500"
            />

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setStatusFilter("all")}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  statusFilter === "all"
                    ? "border-blue-600 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-700"
                }`}
              >
                Toutes
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("active")}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  statusFilter === "active"
                    ? "border-green-600 bg-green-50 text-green-700"
                    : "border-gray-200 text-gray-700"
                }`}
              >
                Actives
              </button>

              <button
                type="button"
                onClick={() => setStatusFilter("cancelled")}
                className={`rounded-lg border px-4 py-2 text-sm font-medium ${
                  statusFilter === "cancelled"
                    ? "border-red-600 bg-red-50 text-red-700"
                    : "border-gray-200 text-gray-700"
                }`}
              >
                Annulées
              </button>
            </div>
          </div>
        </div>

        {/* Cartes de stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-gray-200 bg-white p-4">
            <p className="text-sm text-gray-500">Transactions affichées</p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {stats.total}
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-sm text-green-700">Actives</p>
            <p className="mt-2 text-2xl font-semibold text-green-700">
              {stats.active}
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-700">Annulées</p>
            <p className="mt-2 text-2xl font-semibold text-red-700">
              {stats.cancelled}
            </p>
          </div>
        </div>

        {/* Liste des cartes */}
        <ScheduledTransactionList
          transactions={filteredTransactions}
          annulationHandler={handleCancel}
        />

        {filteredTransactions.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-sm text-gray-500">
            Aucune transaction future trouvée pour ce filtre.
          </div>
        )}
      </div>
    </div>
  );
}