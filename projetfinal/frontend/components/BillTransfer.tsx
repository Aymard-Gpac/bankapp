"use client";

import React, { useEffect, useMemo, useState } from "react";
import { CheckCircle2, Landmark, Loader2, Plus, UserRound, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  createBeneficiary,
  getBeneficiaries,
} from "@/lib/actions/beneficiaries.actions";
import { payBill } from "@/lib/actions/bills.actions";
import { getLocalDateInputValue } from "@/lib/utils";

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

  const [date, setDate] = useState<string>(getLocalDateInputValue());
  const [frequency, setFrequency] = useState<Frequency>("once");

  const [loading, setLoading] = useState(false);
  const [creatingBeneficiary, setCreatingBeneficiary] = useState(false);

  const [showManualBeneficiaryForm, setShowManualBeneficiaryForm] = useState(false);
  const [newBeneficiaryName, setNewBeneficiaryName] = useState("");
  const [newBeneficiaryAccountNumber, setNewBeneficiaryAccountNumber] = useState("");
  const [newBeneficiaryBankName, setNewBeneficiaryBankName] = useState("");

  const [status, setStatus] = useState<{ type: "idle" | "success" | "error"; text: string }>(
    {
      type: "idle",
      text: "",
    }
  );

  const loadBeneficiaries = async () => {
    const data = await getBeneficiaries();
    setBeneficiaries(data);
  };

  useEffect(() => {
    let mounted = true;

    getBeneficiaries()
      .then((data) => {
        if (mounted) setBeneficiaries(data);
      })
      .catch((e: any) => {
        if (mounted) {
          setStatus({
            type: "error",
            text: e?.message || "Impossible de charger les bénéficiaires.",
          });
        }
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

  const canCreateBeneficiary =
    newBeneficiaryName.trim() !== "" && newBeneficiaryAccountNumber.trim() !== "";

  const handleCreateBeneficiary = async () => {
    setStatus({ type: "idle", text: "" });

    if (!canCreateBeneficiary) {
      return setStatus({
        type: "error",
        text: "Le nom et le numéro de compte du bénéficiaire sont obligatoires.",
      });
    }

    setCreatingBeneficiary(true);

    try {
      const result = await createBeneficiary({
        name: newBeneficiaryName.trim(),
        accountNumber: newBeneficiaryAccountNumber.trim(),
        bankName: newBeneficiaryBankName.trim() || undefined,
      });

      if (!result.ok) {
        return setStatus({
          type: "error",
          text: result.error || "Impossible d’ajouter le bénéficiaire.",
        });
      }

      await loadBeneficiaries();

      if (result.data?.id) {
        setBeneficiaryId(Number(result.data.id));
      }

      setNewBeneficiaryName("");
      setNewBeneficiaryAccountNumber("");
      setNewBeneficiaryBankName("");
      setShowManualBeneficiaryForm(false);

      setStatus({
        type: "success",
        text: "Bénéficiaire ajouté avec succès.",
      });
    } catch (e: any) {
      setStatus({
        type: "error",
        text: e?.message || "Impossible d’ajouter le bénéficiaire.",
      });
    } finally {
      setCreatingBeneficiary(false);
    }
  };

  const handlePay = async () => {
    setStatus({ type: "idle", text: "" });

    if (fromAccountId === "") {
      return setStatus({ type: "error", text: "Sélectionne le compte source." });
    }

    if (beneficiaryId === "") {
      return setStatus({ type: "error", text: "Sélectionne un bénéficiaire." });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return setStatus({ type: "error", text: "Montant invalide." });
    }

    if (fromAccount && numericAmount > Number(fromAccount.balance)) {
      return setStatus({ type: "error", text: "Solde insuffisant." });
    }

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

      if (!r.ok) {
        return setStatus({
          type: "error",
          text: r.error || "Échec du paiement.",
        });
      }

      setStatus({
        type: "success",
        text: "✅ Facture payée. La transaction apparaît sur Accueil.",
      });

      setAmount("0.00");
      setMessage("");
      setBeneficiaryId("");

      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
      {/* Montant */}
      <div className="border-b border-gray-100 pb-5">
        <label className="text-[13px] text-gray-500 mb-2 block">Montant</label>

        <div className="flex items-center gap-3">
          <span className="text-[28px] font-semibold text-black">$</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="w-full bg-transparent text-[36px] font-bold text-black outline-none placeholder:text-gray-300"
          />
        </div>

        {fromAccount &&
          Number.isFinite(numericAmount) &&
          numericAmount > Number(fromAccount.balance) && (
            <p className="mt-3 text-[13px] text-red-600">
              Solde insuffisant sur le compte source.
            </p>
          )}
      </div>

      {/* Compte source */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-gray-600">À partir du</label>
        <div className="relative">
          <Wallet
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <select
            className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-[15px] text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
      </div>

      {/* Bénéficiaire */}
      <div className="space-y-3">
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-gray-600">Payer à</label>
          <div className="relative">
            <UserRound
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <select
              className="w-full rounded-2xl border border-gray-200 bg-white py-3.5 pl-11 pr-4 text-[15px] text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
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
        </div>

        <button
          type="button"
          onClick={() => setShowManualBeneficiaryForm((prev) => !prev)}
          className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-50 px-4 py-3 text-[14px] font-semibold text-blue-700 transition hover:bg-blue-100 hover:border-blue-300"
        >
          <Plus size={16} />
          {showManualBeneficiaryForm
            ? "Fermer l’ajout manuel"
            : "Ajouter un bénéficiaire manuellement"}
        </button>

        {showManualBeneficiaryForm && (
          <div className="rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-slate-50 p-5 shadow-sm">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                <Landmark size={20} />
              </div>
              <div>
                <h3 className="text-[16px] font-semibold text-gray-900">
                  Nouveau bénéficiaire
                </h3>
                <p className="text-[13px] text-gray-500">
                  Ajoutez rapidement un bénéficiaire pour payer une facture.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
                  Nom du bénéficiaire
                </label>
                <input
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={newBeneficiaryName}
                  onChange={(e) => setNewBeneficiaryName(e.target.value)}
                  placeholder="Ex: Rogers"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
                  Numéro de compte
                </label>
                <input
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={newBeneficiaryAccountNumber}
                  onChange={(e) => setNewBeneficiaryAccountNumber(e.target.value)}
                  placeholder="Ex: RO-025-886"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[13px] font-medium text-gray-600">
                  Banque / fournisseur (optionnel)
                </label>
                <input
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  value={newBeneficiaryBankName}
                  onChange={(e) => setNewBeneficiaryBankName(e.target.value)}
                  placeholder="Ex: Rogers"
                />
              </div>

              <button
                type="button"
                onClick={handleCreateBeneficiary}
                disabled={creatingBeneficiary || !canCreateBeneficiary}
                className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-[15px] font-semibold text-white shadow-md transition hover:scale-[1.01] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              >
                {creatingBeneficiary ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 size={18} className="animate-spin" />
                    Ajout du bénéficiaire...
                  </span>
                ) : (
                  "Enregistrer le bénéficiaire"
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-[13px] font-medium text-gray-600">
          Description (optionnel)
        </label>
        <input
          className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex: Hydro, Internet, Carte de crédit..."
        />
      </div>

      {/* Date + Fréquence */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-[13px] font-medium text-gray-600">Date</label>
          <input
            type="date"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[13px] font-medium text-gray-600">Fréquence</label>
          <select
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-[15px] text-gray-800 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
          >
            <option value="once">Une fois</option>
            <option value="weekly">Chaque semaine</option>
            <option value="monthly">Chaque mois</option>
          </select>
        </div>
      </div>

      {/* Status */}
      {status.type !== "idle" && (
        <div
          className={`flex items-center gap-2 rounded-2xl px-4 py-3 text-[14px] ${
            status.type === "success"
              ? "border border-green-200 bg-green-50 text-green-700"
              : "border border-red-200 bg-red-50 text-red-600"
          }`}
        >
          {status.type === "success" && <CheckCircle2 size={18} />}
          <span>{status.text}</span>
        </div>
      )}

      {/* Bouton payer */}
      <button
        onClick={handlePay}
        disabled={loading || !canPay}
        className="w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-500 py-3.5 text-[16px] font-semibold text-white shadow-md transition hover:scale-[1.01] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" />
            Paiement...
          </span>
        ) : (
          "Payer"
        )}
      </button>
    </div>
  );
}