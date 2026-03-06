"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import {  getBeneficiaries } from "@/lib/actions/beneficiaries.actions";
import { payBill } from "@/lib/actions/bills.actions";

type Frequency = "once" | "weekly" | "monthly";

type Account = {
  id: number;
  account_number: string;
  type: string;
  balance: number;
  currency?: string;
};

type Beneficiary = {
  id: number;
  name: string;
  account_number: string;
  bank_name?: string | null;
};

export default function BillTransfer({ accounts }: { accounts: Account[] }) {
  const router = useRouter();
  const safeAccounts = Array.isArray(accounts) ? accounts : [];

  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [fromAccountId, setFromAccountId] = useState<number | "">("");
  const [beneficiaryId, setBeneficiaryId] = useState<number | "">("");

  const [amount, setAmount] = useState<string>("0.00");
  const [message, setMessage] = useState<string>("");

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [frequency, setFrequency] = useState<Frequency>("once");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; text: string }>({
    type: "idle",
    text: "",
  });

  useEffect(() => {
    let mounted = true;

    getBeneficiaries()
      .then((data) => {
        if (mounted) setBeneficiaries(data);
      })
      .catch((e: any) => {
        if (mounted) setStatus({ type: "error", text: e?.message || "Impossible de charger les bénéficiaires." });
      });

    return () => {
      mounted = false;
    };
  }, []);

  const fromAccount = useMemo(() => {
    if (fromAccountId === "") return null;
    return safeAccounts.find((a) => a.id === fromAccountId) ?? null;
  }, [safeAccounts, fromAccountId]);

  const numericAmount = useMemo(() => Number(amount), [amount]);

  const canPay =
    fromAccountId !== "" &&
    beneficiaryId !== "" &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    (!fromAccount || numericAmount <= Number(fromAccount.balance));

  const handlePay = async () => {
    setStatus({ type: "idle", text: "" });

    if (fromAccountId === "") return setStatus({ type: "error", text: "Sélectionne le compte source." });
    if (beneficiaryId === "") return setStatus({ type: "error", text: "Sélectionne un bénéficiaire." });
    if (!Number.isFinite(numericAmount) || numericAmount <= 0)
      return setStatus({ type: "error", text: "Montant invalide." });

    if (fromAccount && numericAmount > Number(fromAccount.balance))
      return setStatus({ type: "error", text: "Solde insuffisant." });

    setLoading(true);
    try {
      const r = await payBill({
        fromAccountId: Number(fromAccountId),
        beneficiaryId: Number(beneficiaryId),
        amount: numericAmount,
        description: message.trim() ? message.trim() : undefined,
        date,
        frequency,
      });

      if (!r.ok) return setStatus({ type: "error", text: r.error || "Échec du paiement." });

      setStatus({ type: "success", text: "✅ Facture payée. La transaction apparaît sur Accueil." });

      // Reset champs
      setAmount("0.00");
      setMessage("");
      setBeneficiaryId("");

      //  Important: Accueil est server-rendered (no-store), donc en allant sur "/" tu verras l’historique à jour.
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Montant */}
      <div className="transfer-section">
        <label className="text-12 text-gray-500 mb-1 block">Montant</label>
        <div className="transfer-amount">
            <span className="transfer-currency">$</span>
            <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="transfer-input-amount"
            />
        </div>

        {fromAccount && Number.isFinite(numericAmount) && numericAmount > Number(fromAccount.balance) && (
          <p className="mt-2 text-12 text-red-600">Solde insuffisant sur le compte source.</p>
        )}
      </div>

      {/* Compte source */}
      <div>
        <label className="text-12 text-gray-500 mb-1 block">À partir du</label>
        <select
          className="w-full rounded-xl border border-gray-200 px-4 py-3"
          value={fromAccountId}
          onChange={(e) => setFromAccountId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Sélectionner le compte...</option>
          {safeAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.type} • {a.currency ?? "CAD"} {Number(a.balance).toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      {/* Bénéficiaire */}
      <div>
        <label className="text-12 text-gray-500 mb-1 block">Payer à</label>
        <select
          className="w-full rounded-xl border border-gray-200 px-4 py-3"
          value={beneficiaryId}
          onChange={(e) => setBeneficiaryId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Sélectionner un bénéficiaire...</option>
          {beneficiaries.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name} 
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="text-12 text-gray-500 mb-1 block">Description (optionnel)</label>
        <input
          className="w-full rounded-xl border border-gray-200 px-4 py-3"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex: Hydro, Internet, Carte de crédit..."
        />
      </div>

      {/* Date + Fréquence */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-12 text-gray-500 mb-1 block">Date</label>
          <div className="rounded-xl border border-gray-200 px-4 py-3">
            <input
              type="date"
              className="w-full outline-none bg-transparent text-16"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-12 text-gray-500 mb-1 block">Fréquence</label>
          <div className="rounded-xl border border-gray-200 px-4 py-3">
            <select
              className="w-full outline-none bg-transparent text-16"
              value={frequency}
              onChange={(e) => setFrequency(e.target.value as Frequency)}
            >
              <option value="once">Une fois</option>
              <option value="weekly">Chaque semaine</option>
              <option value="monthly">Chaque mois</option>
            </select>
          </div>
        </div>
      </div>

      {/* Status */}
      {status.type !== "idle" && (
        <div className={`text-14 ${status.type === "success" ? "text-green-700" : "text-red-600"}`}>
          {status.text}
        </div>
      )}

      {/* Button */}
      <button
        onClick={handlePay}
        disabled={loading || !canPay}
        className="w-full rounded-xl bg-bank-gradient text-white py-3 font-semibold shadow-form disabled:opacity-60"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" /> Paiement...
          </span>
        ) : (
          "Payer"
        )}
      </button>
    </div>
  );
}