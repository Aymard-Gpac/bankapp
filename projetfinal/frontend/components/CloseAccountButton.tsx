"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { closeClientAccount } from "@/lib/actions/clients";

type CloseAccountButtonProps = {
  clientId: number;
  accountId: number;
  accountType: string;
  balance: number;
};

export default function CloseAccountButton({
  clientId,
  accountId,
  accountType,
  balance,
}: CloseAccountButtonProps) {
  const router = useRouter();

  const [isClosing, setIsClosing] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const formattedBalance = Number(balance).toFixed(2);
  const canCloseAccount = Number(balance) === 0;

  const handleConfirmClose = async () => {
    try {
      setIsClosing(true);

      await closeClientAccount(clientId, accountId);

      toast.success("Compte fermé avec succès");
      setShowConfirmation(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message || "Erreur lors de la fermeture du compte");
    } finally {
      setIsClosing(false);
    }
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => setShowConfirmation((prev) => !prev)}
        disabled={isClosing}
        className="
          w-full rounded-xl border border-red-200 bg-white px-4 py-2.5
          text-sm font-semibold text-red-600 shadow-sm transition-all
          hover:border-red-300 hover:bg-red-50
          disabled:cursor-not-allowed disabled:opacity-60
        "
      >
        {isClosing ? "Fermeture..." : "Fermer le compte"}
      </button>

      {showConfirmation && (
        <div className="mt-3 rounded-2xl border border-red-100 bg-red-50/70 p-4 shadow-sm">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-red-700">
              Confirmation de fermeture
            </h3>

            <p className="text-sm text-gray-700">
              Voulez-vous vraiment fermer le compte{" "}
              <span className="font-semibold text-gray-900">
                {accountType}
              </span>{" "}
              ?
            </p>

            <p className="text-sm text-gray-700">
              Solde actuel :{" "}
              <span className="font-semibold text-gray-900">
                {formattedBalance} $
              </span>
            </p>

            {!canCloseAccount && (
              <p className="rounded-lg bg-white px-3 py-2 text-sm text-red-600">
                Le compte doit avoir un solde de 0 pour être fermé.
              </p>
            )}
          </div>

          <div className="mt-4 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowConfirmation(false)}
              disabled={isClosing}
              className="
                rounded-xl border border-gray-200 bg-white px-4 py-2
                text-sm font-medium text-gray-700 transition
                hover:bg-gray-50
                disabled:cursor-not-allowed disabled:opacity-60
              "
            >
              Annuler
            </button>

            <button
              type="button"
              onClick={handleConfirmClose}
              disabled={!canCloseAccount || isClosing}
              className="
                rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white
                transition hover:bg-red-700
                disabled:cursor-not-allowed disabled:opacity-50
              "
            >
              {isClosing ? "Traitement..." : "Confirmer"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}