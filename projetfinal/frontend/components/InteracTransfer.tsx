"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { getClients } from "@/lib/actions/clients";
import { sendInterac } from "@/lib/actions/interac.actions";
import { Account } from "@/types";

type Frequency = "once" | "weekly" | "monthly";

type Client = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

export default function InteracTransfer({
  accounts,
  currentUser,
}: {
  accounts: Account[];
  currentUser: { id: number };
}) {
  const safeAccounts = useMemo(() => {
    return Array.isArray(accounts) ? accounts : [];
  }, [accounts]);

  const [clients, setClients] = useState<Client[]>([]);
  const [fromAccountId, setFromAccountId] = useState<number | "">("");
  const [recipientUserId, setRecipientUserId] = useState<number | "">("");

  const [amount, setAmount] = useState<string>("0.00");
  const [message, setMessage] = useState<string>("");

  const [date, setDate] = useState<string>(
    new Date().toISOString().slice(0, 10),
  );
  const [frequency, setFrequency] = useState<Frequency>("once");

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "idle" | "success" | "error";
    text: string;
  }>({
    type: "idle",
    text: "",
  });

  useEffect(() => {
    let mounted = true;

    getClients()
      .then((data) => {
        if (!mounted) return;

        //  On retire le client connecté
        const filtered = data.filter(
          (client: Client) => client.id !== currentUser.id,
        );

        setClients(filtered);
      })
      .catch((e: any) => {
        if (mounted)
          setStatus({
            type: "error",
            text: e?.message || "Impossible de charger les clients.",
          });
      });

    return () => {
      mounted = false;
    };
  }, [currentUser.id]);

  const fromAccount = useMemo(() => {
    if (fromAccountId === "") return null;
    return safeAccounts.find((a) => a.id === fromAccountId) ?? null;
  }, [safeAccounts, fromAccountId]);

  const numericAmount = useMemo(() => Number(amount), [amount]);

  const canSend =
    fromAccountId !== "" &&
    recipientUserId !== "" &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    (!fromAccount || numericAmount <= Number(fromAccount.balance));

  const handleSend = async () => {
    setStatus({ type: "idle", text: "" });

    if (fromAccountId === "")
      return setStatus({
        type: "error",
        text: "Sélectionne le compte source.",
      });
    if (recipientUserId === "")
      return setStatus({ type: "error", text: "Sélectionne un destinataire." });
    if (!Number.isFinite(numericAmount) || numericAmount <= 0)
      return setStatus({ type: "error", text: "Montant invalide." });

    if (fromAccount && numericAmount > Number(fromAccount.balance))
      return setStatus({ type: "error", text: "Solde insuffisant." });

    setLoading(true);
    try {
      // Si ton backend ne gère pas encore date/frequency, tu peux les ignorer côté API
      const r = await sendInterac({
        fromAccountId: Number(fromAccountId),
        toClientId: Number(recipientUserId),
        amount: numericAmount,
        description: message.trim() ? message.trim() : undefined,
        date,
        frequency,
      } as any);

      if (!r.ok)
        return setStatus({
          type: "error",
          text: r.error || "Échec du virement.",
        });

      setStatus({
        type: "success",
        text: "✅ Interac envoyé. Le compte chèque du destinataire a été crédité.",
      });

      // Reset champs
      setAmount("0.00");
      setMessage("");
      setRecipientUserId("");
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
          className="transfer-input-amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          inputMode="decimal"
          placeholder="0.00"
          />
        </div>
        {fromAccount &&
          Number.isFinite(numericAmount) &&
          numericAmount > Number(fromAccount.balance) && (
            <p className="mt-2 text-12 text-red-600">
              Solde insuffisant sur le compte source.
            </p>
          )}
      </div>

      {/* Compte source */}
      <div>
        <label className="text-12 text-gray-500 mb-1 block">À partir du</label>
        <select
          className="w-full rounded-xl border border-gray-200 px-4 py-3"
          value={fromAccountId}
          onChange={(e) =>
            setFromAccountId(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">Sélectionner le compte...</option>
          {safeAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.type} • {a.currency ?? "CAD"} {Number(a.balance).toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      {/* Destinataire */}
      <div>
        <label className="text-12 text-gray-500 mb-1 block">Envoyer à</label>
        <select
          className="w-full rounded-xl border border-gray-200 px-4 py-3"
          value={recipientUserId}
          onChange={(e) =>
            setRecipientUserId(e.target.value ? Number(e.target.value) : "")
          }
        >
          <option value="">Sélectionner un client...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.first_name} {c.last_name} • {c.email}
            </option>
          ))}
        </select>
      </div>

      {/* Message */}
      <div>
        <label className="text-12 text-gray-500 mb-1 block">
          Message (optionnel)
        </label>
        <input
          className="w-full rounded-xl border border-gray-200 px-4 py-3"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex: Loyer, remboursement..."
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
        <div
          className={`text-14 ${status.type === "success" ? "text-green-700" : "text-red-600"}`}
        >
          {status.text}
        </div>
      )}

      {/* Button */}
      <button
        onClick={handleSend}
        disabled={loading || !canSend}
        className="w-full rounded-xl bg-bank-gradient text-white py-3 font-semibold shadow-form disabled:opacity-60"
      >
        {loading ? (
          <span className="inline-flex items-center gap-2">
            <Loader2 size={18} className="animate-spin" /> Envoi...
          </span>
        ) : (
          "Envoyer"
        )}
      </button>
    </div>
  );
}
