"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { parseISODate } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Account, RecentTransactionsProps } from "@/types";
import { BankTabItem } from "./BankTabItem";
import TransactionsTable from "./TransactionsTable";
import BankInfo from "./BankInfo";

type RecentTransactionsWithClientProps = RecentTransactionsProps & {
  clientId?: string | number;
};

const RecentTransactions = ({
  accounts,
  transactions = [],
  accountId,
  clientId,
}: RecentTransactionsWithClientProps) => {
  const pathname = usePathname();

  const initialSelectedId = String(accountId ?? accounts?.[0]?.id ?? "");
  const [selectedId, setSelectedId] = useState(initialSelectedId);

  const getTxAccountId = (t: any) => String(t.accountId ?? t.account_id ?? "");

  const getTxTime = (t: any) => {
    const raw =
      t.createdAt ?? t.created_at ?? t.date ?? t.$createdAt ?? t.$created_at;
    const parsed = parseISODate(raw);
    const ms = parsed ? parsed.getTime() : 0;
    return Number.isFinite(ms) ? ms : 0;
  };

  const top5ByAccount = useMemo(() => {
    const map = new Map<string, any[]>();

    for (const acc of accounts) {
      const id = String(acc.id);

      const list = (transactions ?? [])
        .filter((t: any) => getTxAccountId(t) === id)
        .sort((a: any, b: any) => getTxTime(b) - getTxTime(a))
        .slice(0, 5);

      map.set(id, list);
    }

    return map;
  }, [accounts, transactions]);

  /**
   * Si on est dans le contexte étudiant (/student/clients/:clientsId),
   * le bouton "Voir tout" doit rester dans la route de supervision.
   *
   * Sinon, on garde la route client normale.
   */
  const isStudentSupervision = pathname?.startsWith("/student/clients/");

  const viewAllHref =
    isStudentSupervision && clientId
      ? `/student/clients/${clientId}/transaction-history`
      : `/transaction-history?id=${selectedId}`;

  return (
    <section className="recent-transactions">
      <header className="flex items-center justify-between">
        <h2 className="recent-transactions-label">Transactions récentes</h2>

        <Link href={viewAllHref} className="view-all-btn">
          Voir tout
        </Link>
      </header>

      <Tabs value={selectedId} onValueChange={setSelectedId} className="w-full">
        <TabsList className="recent-transactions-tablist">
          {accounts.map((account: Account) => {
            const tabValue = String(account.id);

            return (
              <TabsTrigger key={account.id} value={tabValue}>
                <BankTabItem account={account} selectedId={selectedId} />
              </TabsTrigger>
            );
          })}
        </TabsList>

        {accounts.map((account: Account) => {
          const tabValue = String(account.id);
          const currentTransactions = top5ByAccount.get(tabValue) ?? [];

          return (
            <TabsContent value={tabValue} key={account.id} className="space-y-4">
              <BankInfo account={account} accountId={tabValue} type="full" />

              <TransactionsTable transactions={currentTransactions} />

              {currentTransactions.length === 0 && (
                <p className="text-sm text-gray-500">
                  Aucune transaction récente pour ce compte.
                </p>
              )}
            </TabsContent>
          );
        })}
      </Tabs>
    </section>
  );
};

export default RecentTransactions;