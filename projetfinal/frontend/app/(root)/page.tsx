import HeaderBox from "@/components/HeaderBox";
import RecentTransactions from "@/components/RecentTransactions";
import TotalBalanceBox from "@/components/TotalBalanceBox";
import { getClientAccounts } from "@/lib/actions/bank.actions";

import { getClientAccountServer, getClientAccountsServer } from "@/lib/actions/bank.server";
import { getCurrentUserServer } from "@/lib/actions/user.server";
import { redirect } from "next/navigation";

type PageProps = {
  searchParams: { [key: string]: string | string[] | undefined };
};

const ClientDashboard = async ({searchParams }: PageProps) => {
  
  const currentPage = Number(searchParams.page) || 1;
  const client = await getCurrentUserServer();
 
  const clientId = client.id;
  
  const accounts = await getClientAccountsServer(clientId);
  const accountsData = accounts?.data ?? [];

  if (!accountsData.length) {
    return (
      <section className="home">
        <div className="home-content">
          <HeaderBox
            type="greeting"
            title="Welcome"
            userName={
              client?.first_name ||
              client?.firstName ||
              "Client"
            }
            subtext="No bank accounts found for this client."
          />
        </div>
      </section>
    );
  }

const accountIdStr =
  (typeof searchParams.id === "string" && searchParams.id) ||
  String(accountsData[0].id);

const accountIdNum = Number(accountIdStr);

  const accountDetails = await getClientAccountServer({
    clientId,
    accountId: accountIdNum,
    page: currentPage,
    pageSize: 10,
  });

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Welcome"
            userName={
              client?.first_name ||
              client?.firstName ||
              "Client"
            }
            subtext="Access and manage your account and transactions efficiently."
          />

          <TotalBalanceBox
            accounts={accountsData}
            totalBanks={accounts.totalBanks}
            totalCurrentBalance={Number(accounts.totalCurrentBalance) || 0}
          />
        </header>

        <RecentTransactions
          accounts={accountsData}
          transactions={accountDetails?.transactions || []}
          accountId={accountIdNum}
          page={currentPage}
        />
      </div>
    </section>
  );
};

export default ClientDashboard;
