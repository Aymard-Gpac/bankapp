"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  Loader2,
  Mail,
  Plus,
  UserPlus,
  UserRound,
  Wallet,
} from "lucide-react";
import { getClients } from "@/lib/actions/clients";
import { sendInterac } from "@/lib/actions/interac.actions";
import { getLocalDateInputValue } from "@/lib/utils";
import { Account } from "@/types";

type Frequency = "once" | "weekly" | "monthly";

type Client = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
};

type ExternalRecipient = {
  firstName: string;
  lastName: string;
  email: string;
};

type SelectRecipient = {
  kind: "client" | "external";
  label: string;
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
  const [selectedClientEmail, setSelectedClientEmail] = useState("");

  const [showManualRecipientForm, setShowManualRecipientForm] = useState(false);
  const [manualFirstName, setManualFirstName] = useState("");
  const [manualLastName, setManualLastName] = useState("");
  const [manualRecipientEmail, setManualRecipientEmail] = useState("");

  const [savedExternalRecipient, setSavedExternalRecipient] =
    useState<ExternalRecipient | null>(null);

  const [amount, setAmount] = useState<string>("0.00");
  const [message, setMessage] = useState<string>("");

  const [date, setDate] = useState<string>(getLocalDateInputValue());
  const [frequency, setFrequency] = useState<Frequency>("once");

  const [loading, setLoading] = useState(false);
  const [savingExternalRecipient, setSavingExternalRecipient] = useState(false);

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

        const filtered = data.filter(
          (client: Client) => client.id !== currentUser.id,
        );

        setClients(filtered);
      })
      .catch((e: any) => {
        if (!mounted) return;

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

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const manualEmailIsValid = useMemo(() => {
    return emailRegex.test(manualRecipientEmail.trim());
  }, [manualRecipientEmail]);

  const selectRecipients = useMemo<SelectRecipient[]>(() => {
    const baseClients: SelectRecipient[] = clients.map((client) => ({
      kind: "client",
      email: client.email,
      label: `${client.first_name} ${client.last_name} • ${client.email}`,
    }));

    if (!savedExternalRecipient) {
      return baseClients;
    }

    const alreadyExists = baseClients.some(
      (item) => item.email.toLowerCase() === savedExternalRecipient.email.toLowerCase(),
    );

    if (alreadyExists) {
      return baseClients;
    }

    return [
      {
        kind: "external",
        email: savedExternalRecipient.email,
        label: `${savedExternalRecipient.firstName} ${savedExternalRecipient.lastName} • ${savedExternalRecipient.email} (externe)`,
      },
      ...baseClients,
    ];
  }, [clients, savedExternalRecipient]);

  const selectedRecipient = useMemo(() => {
    return selectRecipients.find((item) => item.email === selectedClientEmail) ?? null;
  }, [selectRecipients, selectedClientEmail]);

  const usingExternalRecipient = selectedRecipient?.kind === "external";

  const canSaveExternalRecipient =
    manualFirstName.trim() !== "" &&
    manualLastName.trim() !== "" &&
    manualRecipientEmail.trim() !== "" &&
    manualEmailIsValid;

  const canSend =
    fromAccountId !== "" &&
    selectedClientEmail.trim() !== "" &&
    Number.isFinite(numericAmount) &&
    numericAmount > 0 &&
    (!fromAccount || numericAmount <= Number(fromAccount.balance));

  const handleSaveExternalRecipient = async () => {
    setStatus({ type: "idle", text: "" });

    if (!manualFirstName.trim()) {
      return setStatus({
        type: "error",
        text: "Le prénom du destinataire est obligatoire.",
      });
    }

    if (!manualLastName.trim()) {
      return setStatus({
        type: "error",
        text: "Le nom du destinataire est obligatoire.",
      });
    }

    if (!manualRecipientEmail.trim()) {
      return setStatus({
        type: "error",
        text: "L’email du destinataire est obligatoire.",
      });
    }

    if (!manualEmailIsValid) {
      return setStatus({
        type: "error",
        text: "L’adresse email du destinataire est invalide.",
      });
    }

    setSavingExternalRecipient(true);

    try {
      const externalRecipient = {
        firstName: manualFirstName.trim(),
        lastName: manualLastName.trim(),
        email: manualRecipientEmail.trim().toLowerCase(),
      };

      setSavedExternalRecipient(externalRecipient);

      //  on le sélectionne directement dans le select
      setSelectedClientEmail(externalRecipient.email);

      setShowManualRecipientForm(false);

      setStatus({
        type: "success",
        text: "Destinataire externe enregistré avec succès.",
      });
    } finally {
      setSavingExternalRecipient(false);
    }
  };

  const handleChooseRecipient = (value: string) => {
    setSelectedClientEmail(value);
    setStatus({ type: "idle", text: "" });

    // si on choisit un vrai client différent, on ne supprime pas forcément
    // le destinataire externe sauvegardé, il reste disponible dans la liste
  };

  const handleToggleManualForm = () => {
    setShowManualRecipientForm((prev) => !prev);
    setStatus({ type: "idle", text: "" });
  };

  const handleSend = async () => {
    setStatus({ type: "idle", text: "" });

    if (fromAccountId === "") {
      return setStatus({
        type: "error",
        text: "Sélectionne le compte source.",
      });
    }

    if (!selectedClientEmail.trim()) {
      return setStatus({
        type: "error",
        text: "Sélectionne un destinataire.",
      });
    }

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return setStatus({
        type: "error",
        text: "Montant invalide.",
      });
    }

    if (fromAccount && numericAmount > Number(fromAccount.balance)) {
      return setStatus({
        type: "error",
        text: "Solde insuffisant.",
      });
    }

    setLoading(true);

    try {
      const r = await sendInterac({
        fromAccountId: Number(fromAccountId),
        recipientEmail: selectedClientEmail,
        recipientFirstName: usingExternalRecipient
          ? savedExternalRecipient?.firstName
          : undefined,
        recipientLastName: usingExternalRecipient
          ? savedExternalRecipient?.lastName
          : undefined,
        amount: numericAmount,
        description: message.trim() ? message.trim() : undefined,
        date,
        frequency,
        isExternalRecipient: usingExternalRecipient,
      });

      if (!r.ok) {
        return setStatus({
          type: "error",
          text: r.error || "Échec du virement Interac.",
        });
      }

      setStatus({
        type: "success",
        text: usingExternalRecipient
          ? "Le virement Interac vers le destinataire externe a été effectué avec succès."
          : "Le virement Interac a été effectué avec succès.",
      });

      setAmount("0.00");
      setMessage("");
      setSelectedClientEmail("");
      setManualFirstName("");
      setManualLastName("");
      setManualRecipientEmail("");
      setSavedExternalRecipient(null);
      setShowManualRecipientForm(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 space-y-5">
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

      <div>
        <label className="text-12 text-gray-500 mb-1 block">À partir du</label>
        <div className="relative">
          <Wallet
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <select
            className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-11"
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
      </div>

      <div>
        <label className="text-12 text-gray-500 mb-1 block">Envoyer à</label>
        <div className="relative">
          <UserRound
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
          <select
            className="w-full rounded-xl border border-gray-200 px-4 py-3 pl-11"
            value={selectedClientEmail}
            onChange={(e) => handleChooseRecipient(e.target.value)}
          >
            <option value="">Sélectionner un client...</option>
            {selectRecipients.map((recipient) => (
              <option key={`${recipient.kind}-${recipient.email}`} value={recipient.email}>
                {recipient.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <button
        type="button"
        onClick={handleToggleManualForm}
        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
      >
        <Plus size={16} />
        {showManualRecipientForm
          ? "Fermer l’ajout du destinataire externe"
          : "Ajouter un destinataire externe"}
      </button>

      {savedExternalRecipient && usingExternalRecipient && (
        <div className="rounded-2xl border border-green-200 bg-green-50 px-4 py-3">
          <div className="flex items-start gap-2 text-green-700">
            <CheckCircle2 size={18} className="mt-0.5" />
            <div>
              <p className="text-sm font-semibold">
                Destinataire  sélectionné
              </p>
              <p className="text-sm">
                {savedExternalRecipient.firstName} {savedExternalRecipient.lastName} •{" "}
                {savedExternalRecipient.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {showManualRecipientForm && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <UserPlus size={18} className="text-blue-700" />
            <h3 className="text-sm font-semibold text-blue-900">
              Nouveau destinataire 
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-12 text-gray-600 mb-1 block">Prénom</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3"
                value={manualFirstName}
                onChange={(e) => setManualFirstName(e.target.value)}
                placeholder="Ex: Claude"
              />
            </div>

            <div>
              <label className="text-12 text-gray-600 mb-1 block">Nom</label>
              <input
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3"
                value={manualLastName}
                onChange={(e) => setManualLastName(e.target.value)}
                placeholder="Ex: Rocher"
              />
            </div>
          </div>

          <div>
            <label className="text-12 text-gray-600 mb-1 block">Email</label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="email"
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 pl-11"
                value={manualRecipientEmail}
                onChange={(e) => setManualRecipientEmail(e.target.value)}
                placeholder="Ex: claude@test.com"
              />
            </div>

            {manualRecipientEmail.trim() && !manualEmailIsValid && (
              <p className="mt-2 text-12 text-red-600">
                Entre une adresse email valide.
              </p>
            )}
          </div>

          <p className="text-12 text-gray-500">
            Ce destinataire est externe à l’application.
          </p>

          <button
            type="button"
            onClick={handleSaveExternalRecipient}
            disabled={savingExternalRecipient || !canSaveExternalRecipient}
            className="w-full rounded-xl bg-bank-gradient py-3 font-semibold text-white shadow-form disabled:opacity-60"
          >
            {savingExternalRecipient ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 size={18} className="animate-spin" />
                Enregistrement...
              </span>
            ) : (
              "Enregistrer le destinataire"
            )}
          </button>
        </div>
      )}

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

      {status.type !== "idle" && (
        <div
          className={`text-14 ${
            status.type === "success" ? "text-green-700" : "text-red-600"
          }`}
        >
          {status.text}
        </div>
      )}

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