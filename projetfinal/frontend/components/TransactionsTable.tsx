"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { cn, formatAmount, formatDateTime, getTransactionStatus, parseISODate, removeSpecialCharacters } from "@/lib/utils";
import { transactionCategoryStyles } from "@/constants";
import { CategoryBadgeProps, Transaction } from "@/types";

/**
 * Badge de statut déjà existant
 */
const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  const {
    borderColor,
    backgroundColor,
    textColor,
    chipBackgroundColor,
  } =
    transactionCategoryStyles[
      category as keyof typeof transactionCategoryStyles
    ] || transactionCategoryStyles.default;

  return (
    <div className={cn("category-badge", borderColor, chipBackgroundColor)}>
      <div className={cn("size-2 rounded-full", backgroundColor)} />
      <p className={cn("text-[12px] font-medium", textColor)}>{category}</p>
    </div>
  );
};

/**
 * =========================
 * AJOUT
 * =========================
 * Cette fonction sert à afficher un nom propre du type de compte
 * dans la nouvelle colonne "Compte".
 */
const normalizeAccountLabel = (value?: string | null) => {
  const raw = String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (raw.includes("cheque")) return "Chèque";
  if (raw.includes("epargne")) return "Épargne";
  if (raw.includes("credit")) return "Crédit";

  return value || "Compte";
};

/**
 * =========================
 * AJOUT
 * =========================
 * Cette fonction transforme le type de transaction
 * en libellé lisible pour l'utilisateur :
 * CREDIT => Entrée
 * DEBIT  => Sortie
 */
const getMovementLabel = (type?: string | null) =>
  String(type ?? "").toUpperCase() === "CREDIT" ? "Entrée" : "Sortie";

/**
 * =========================
 * AJOUT
 * =========================
 *
 * - transactions : données du tableau
 * - showAccountColumn : affiche ou non la colonne "Compte"
 * - showDirectionColumn : affiche ou non la colonne "Mouvement"
 *
 * Comme ça, ton tableau peut rester utilisé ailleurs comme avant,
 * mais sur la page historique on pourra afficher les nouvelles colonnes.
 */
/**
 * =========================
 * AJOUT
 * =========================
 * Type local plus souple pour supporter :
 * - les transactions classiques
 * - les transactions d'historique
 */
type TransactionRow = {
  id: number;
  type: string;
  amount: number;
  description?: string | null;
  date?: string;
  created_at?: string;

  // champs ajoutés pour l'historique
  account_type?: string;
  account_number?: string;
  account_id?: number;
};
type TransactionsTablePropsExtended = {
  transactions: TransactionRow[];
  showAccountColumn?: boolean;
  showDirectionColumn?: boolean;
};

const TransactionsTable = ({
  transactions,
  showAccountColumn = false,
  showDirectionColumn = false,
}: TransactionsTablePropsExtended) => {
  return (
    <Table>
      <TableHeader className="bg-[#f9fafb]">
        <TableRow>
          <TableHead className="px-2">Transaction</TableHead>
          <TableHead className="px-2">Montant</TableHead>
          <TableHead className="px-2">Statut</TableHead>
          <TableHead className="px-2">Date</TableHead>

          {/* =========================
              AJOUT
              =========================
              Nouvelle colonne "Compte"
              Affichée seulement si demandée
          */}
          {showAccountColumn && <TableHead className="px-2">Compte</TableHead>}

          {/* =========================
              AJOUT
              =========================
              Nouvelle colonne "Mouvement"
              Affichée seulement si demandée
          */}
          {showDirectionColumn && (
            <TableHead className="px-2">Mouvement</TableHead>
          )}

          <TableHead className="px-2 max-md:hidden">Description</TableHead>
        </TableRow>
      </TableHeader>

      <TableBody>
        {transactions.map((t: Transaction & any) => {
          /**
           * Petite adaptation :
           * on supporte soit t.date soit t.created_at
           * selon la forme des données reçues.
           */
          const transactionDate = t.created_at ?? t.date;
          const parsedTransactionDate = parseISODate(transactionDate) ?? new Date();

          const status = getTransactionStatus(parsedTransactionDate);
          const amount = formatAmount(t.amount);

          const isDebit = t.type === "DEBIT";
          const isCredit = t.type === "CREDIT";

          return (
            <TableRow
              key={t.id}
              className={`${
                isDebit || amount[0] === "-"
                  ? "bg-[#FFFBFA]"
                  : "bg-[#F6FEF9]"
              } !over:bg-none !border-b-DEFAULT`}
            >
              <TableCell className="max-w-[250px] pl-2 pr-10">
                <div className="flex items-center gap-3">
                  <h1 className="text-14 truncate font-semibold text-[#344054]">
                    {removeSpecialCharacters(t.type) || "Transaction"}
                  </h1>
                </div>
              </TableCell>

              <TableCell
                className={`pl-2 pr-10 font-semibold ${
                  isDebit || amount[0] === "-"
                    ? "text-[#f04438]"
                    : "text-[#039855]"
                }`}
              >
                {isDebit ? `-${amount}` : isCredit ? amount : amount}
              </TableCell>

              <TableCell className="pl-2 pr-10">
                <CategoryBadge category={status} />
              </TableCell>

              <TableCell className="min-w-32 pl-2 pr-10">
                {formatDateTime(parsedTransactionDate).dateTime}
              </TableCell>

              {/* =========================
                  AJOUT
                  =========================
                  Affiche le type de compte :
                  Chèque / Épargne / Crédit
                  On suppose que t.account_type vient du backend
              */}
              {showAccountColumn && (
                <TableCell className="pl-2 pr-10">
                  {normalizeAccountLabel(t.account_type)}
                </TableCell>
              )}

              {/* =========================
                  AJOUT
                  =========================
                  Affiche si c'est une entrée ou une sortie
              */}
              {showDirectionColumn && (
                <TableCell
                  className={`pl-2 pr-10 font-semibold ${
                    getMovementLabel(t.type) === "Entrée"
                      ? "text-[#039855]"
                      : "text-[#f04438]"
                  }`}
                >
                  {getMovementLabel(t.type)}
                </TableCell>
              )}

              <TableCell className="pl-2 pr-10 capitalize min-w-24">
                {t.description}
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};

export default TransactionsTable;