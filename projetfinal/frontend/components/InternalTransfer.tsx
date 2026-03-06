"use client";

import React, { useMemo, useState } from "react";
import { createInternalTransfer, type Frequency } from "@/lib/actions/transactions.actions";
import { Account } from "@/types";

type InternalTransferProps = {
  accounts?: Account[] | null;
};

const InternalTransfer = ({ accounts }: InternalTransferProps) => {
  const safeAccounts = Array.isArray(accounts) ? accounts : [];

  const [amount, setAmount] = useState("0.00");
  const [fromAccountId, setFromAccountId] = useState<number | "">("");
  const [toAccountId, setToAccountId] = useState<number | "">("");
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [frequency, setFrequency] = useState<Frequency>("once");
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fromAccount = useMemo(
    () => safeAccounts.find((a) => a.id === fromAccountId),
    [safeAccounts, fromAccountId]
  );

  const toOptions = useMemo(() => {
    if (!fromAccountId) return safeAccounts;
    return safeAccounts.filter((a) => a.id !== fromAccountId);
  }, [safeAccounts, fromAccountId]);

  const handleSubmit = async () => {
    setMessage(null);

    const numericAmount = Number(amount);

    if (!fromAccountId) return setMessage("Sélectionne le compte source.");
    if (!toAccountId) return setMessage("Sélectionne le compte destination.");
    if (fromAccountId === toAccountId) return setMessage("Les comptes doivent être différents.");
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) return setMessage("Montant invalide.");

    if (fromAccount && numericAmount > fromAccount.balance) {
      return setMessage("Solde insuffisant.");
    }

    setLoading(true);
    const r = await createInternalTransfer({
      fromAccountId: Number(fromAccountId),
      toAccountId: Number(toAccountId),
      amount: numericAmount,
      date,
      frequency,
    });
    setLoading(false);

    if (!r.ok) return setMessage(r.error);

    setMessage("✅ Virement effectué.");
    setAmount("0.00");
    setToAccountId("");
  };

  if (safeAccounts.length === 0) {
    return (
      <div className="transfer-card">
        <div className="transfer-section">
          <p className="text-sm text-gray-600">Aucun compte disponible.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="transfer-card">
      <div className="transfer-section">
        <label className="transfer-label">Montant</label>
        <div className="transfer-amount">
          <span className="transfer-currency">$</span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            className="transfer-input-amount"
          />
        </div>
      </div>

      <div className="transfer-section">
        <label className="transfer-label">À partir du</label>
        <select
          className="transfer-select"
          value={fromAccountId}
          onChange={(e) => setFromAccountId(e.target.value ? Number(e.target.value) : "")}>
            
          <option value="">Sélectionner le compte...</option>
          {safeAccounts.map((a) => (
            <option key={a.id} value={a.id}>
              {a.type} • {a.balance}
            </option>
          ))}
        </select>
      </div>

      <div className="transfer-section">
        <label className="transfer-label">Au</label>
        <select
          className="transfer-select"
          value={toAccountId}
          onChange={(e) => setToAccountId(e.target.value ? Number(e.target.value) : "")}
        >
          <option value="">Sélectionner le compte...</option>
          {toOptions.map((a) => (
            <option key={a.id} value={a.id}>
              {a.type} • {a.balance}
            </option>
          ))}
        </select>
      </div>

      <div className="transfer-section transfer-row">
        <div className="w-full">
          <label className="transfer-label">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="transfer-select" />
        </div>
      </div>

      <div className="transfer-section transfer-row">
        <div className="w-full">
          <label className="transfer-label">Fréquence</label>
          <select
            className="transfer-select"
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as Frequency)}
          >
            <option value="once">Une fois</option>
            <option value="weekly">Chaque semaine</option>
            <option value="monthly">Chaque mois</option>
          </select>
        </div>
      </div>

      <div className="transfer-actions">
        {message && <p className="transfer-message">{message}</p>}
        <button onClick={handleSubmit} disabled={loading} className="transfer-button">
          {loading ? "Traitement..." : "Continuer"}
        </button>
      </div>
    </div>
  );
};

export default InternalTransfer;