"use client";

import { ScheduledTransaction } from "@/types";

type Props = {
  transactions: ScheduledTransaction[];
  annulationHandler: (transactionId: number) => Promise<void>;
};

/**
 * Convertit le type technique d'une transaction programmée
 * en libellé lisible pour l'interface.
 */
function getTypeLabel(kind: ScheduledTransaction["kind"]) {
  switch (kind) {
    case "internal":
      return "Virement interne";
    case "interac":
      return "Virement Interac";
    case "bill":
      return "Paiement de facture";
    default:
      return "Transaction";
  }
}

/**
 * Retourne les classes visuelles du badge selon le type de transaction.
 */
function getTypeBadgeClasses(kind: ScheduledTransaction["kind"]) {
  switch (kind) {
    case "internal":
      return "bg-blue-100 text-blue-700 border border-blue-200";
    case "interac":
      return "bg-violet-100 text-violet-700 border border-violet-200";
    case "bill":
      return "bg-amber-100 text-amber-700 border border-amber-200";
    default:
      return "bg-slate-100 text-slate-700 border border-slate-200";
  }
}

/**
 * Convertit la fréquence stockée en base/API
 * vers un texte plus compréhensible pour l'utilisateur.
 */
function getFrequencyLabel(frequency: ScheduledTransaction["frequency"]) {
  switch (frequency) {
    case "weekly":
      return "Chaque semaine";
    case "monthly":
      return "Chaque mois";
    default:
      return frequency;
  }
}

/**
 * Retourne les classes visuelles du badge de fréquence.
 */
function getFrequencyBadgeClasses(frequency: ScheduledTransaction["frequency"]) {
  switch (frequency) {
    case "weekly":
      return "bg-sky-100 text-sky-700";
    case "monthly":
      return "bg-indigo-100 text-indigo-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

/**
 * Formate une date SQLite pour l'affichage.
 */
function formatDate(dateString?: string | null) {
  if (!dateString) return "Date inconnue";

  const date = new Date(dateString.replace(" ", "T"));

  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return date.toLocaleString("fr-CA", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Retourne le libellé du compte source.
 */
function getSourceLabel(transaction: ScheduledTransaction) {
  if (
    transaction.source_account_name &&
    transaction.source_account_name !== "Compte"
  ) {
    return transaction.source_account_name;
  }

  return "Compte source";
}

/**
 * Détermine le libellé principal de la destination.
 *
 * L'objectif est d'afficher l'information la plus utile
 * selon le type de transaction programmée.
 */
function getDestinationLabel(transaction: ScheduledTransaction) {
  if (transaction.kind === "internal") {
    if (
      transaction.destination_account_name &&
      transaction.destination_account_name !== "Compte"
    ) {
      return transaction.destination_account_name;
    }

    return "Compte destination";
  }

  if (transaction.kind === "interac") {
    if (transaction.interac_recipient_name) {
      return transaction.interac_recipient_name;
    }

    const recipientName = `${transaction.recipient_first_name ?? ""} ${
      transaction.recipient_last_name ?? ""
    }`.trim();

    if (recipientName) return recipientName;
    if (transaction.beneficiary_name) return transaction.beneficiary_name;
    if (transaction.recipient_email) return transaction.recipient_email;

    return "Destinataire Interac";
  }

  if (transaction.kind === "bill") {
    if (transaction.beneficiary_name) {
      return transaction.beneficiary_name;
    }

    return transaction.beneficiary_id
      ? `Bénéficiaire #${transaction.beneficiary_id}`
      : "Bénéficiaire";
  }

  return "Destination inconnue";
}

/**
 * Retourne le sous-libellé affiché sous la destination.
 */
function getDestinationSubtitle(transaction: ScheduledTransaction) {
  if (transaction.kind === "internal") {
    return "Compte de destination";
  }

  if (transaction.kind === "interac") {
    return transaction.is_external_recipient
      ? "Destinataire externe"
      : "Client destinataire";
  }

  if (transaction.kind === "bill") {
    return "Bénéficiaire de facture";
  }

  return "Destination";
}

export default function ScheduledTransactionsList({
  transactions,
  annulationHandler,
}: Props) {
  if (!transactions.length) {
    return null;
  }

  return (
    <div className="space-y-5">
      {transactions.map((transaction) => {
        const source = getSourceLabel(transaction);
        const destination = getDestinationLabel(transaction);
        const destinationSubtitle = getDestinationSubtitle(transaction);

        const isCancelled = transaction.status === "cancelled";

        return (
          <div
            key={transaction.id}
            className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <div className="flex flex-col gap-4 border-b border-slate-100 bg-slate-50/70 px-6 py-5 md:flex-row md:items-start md:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getTypeBadgeClasses(
                      transaction.kind
                    )}`}
                  >
                    {getTypeLabel(transaction.kind)}
                  </span>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getFrequencyBadgeClasses(
                      transaction.frequency
                    )}`}
                  >
                    {getFrequencyLabel(transaction.frequency)}
                  </span>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      isCancelled
                        ? "bg-red-100 text-red-700"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {isCancelled ? "Annulée" : "Active"}
                  </span>
                </div>

                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Destination
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-slate-900">
                    {destination}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {destinationSubtitle}
                  </p>
                </div>
              </div>

              <div className="rounded-2xl bg-blue-50 px-5 py-4 md:min-w-[190px]">
                <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
                  Montant programmé
                </p>
                <p className="mt-2 text-2xl font-bold text-blue-700">
                  {Number(transaction.amount).toLocaleString("fr-CA", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}{" "}
                  $
                </p>
              </div>
            </div>

            <div className="grid gap-4 px-6 py-5 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Compte source
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {source}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Prochaine exécution
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatDate(transaction.next_run_date)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Répétition
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {getFrequencyLabel(transaction.frequency)}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Référence
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-900">
                  #{transaction.id}
                </p>
              </div>
            </div>

            {transaction.description && (
              <div className="px-6 pb-2">
                <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-blue-500">
                    Description
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    {transaction.description}
                  </p>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end px-6 py-5">
              <button
                onClick={() => annulationHandler(transaction.id)}
                disabled={isCancelled}
                className={`inline-flex items-center rounded-xl px-4 py-2 text-sm font-semibold text-white transition-all duration-200 ${
                  isCancelled
                    ? "cursor-not-allowed bg-slate-300"
                    : "bg-red-500 hover:bg-red-600"
                }`}
              >
                {isCancelled ? "Déjà annulée" : "Annuler la transaction"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}