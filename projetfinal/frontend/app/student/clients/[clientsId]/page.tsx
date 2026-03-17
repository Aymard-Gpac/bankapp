import HeaderBox from "@/components/HeaderBox";
import RecentTransactions from "@/components/RecentTransactions";
import TotalBalanceBox from "@/components/TotalBalanceBox";

import { getClientAccountsServer } from "@/lib/actions/bank.server";
import { getClientAccountServer } from "@/lib/actions/bank.server";
import { getCurrentClientServer } from "@/lib/actions/client.server";

type PageProps = {
  params: { clientsId: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

const ClientAccountsPage = async ({ params, searchParams }: PageProps) => {
  const clientId = Number(params.clientsId);
  const currentPage = Number(searchParams.page) || 1;

  const currentClient = await getCurrentClientServer(clientId);

  const accounts = await getClientAccountsServer(clientId);
  const accountsData = accounts?.data ?? [];

  if (!accountsData.length) {
    return (
      <section className="home">
        <div className="home-content">
          <HeaderBox
            type="greeting"
            title="Bienvenue"
            userName={
              currentClient?.first_name ||
              currentClient?.firstName ||
              "Client"
            }
            subtext="Aucun compte bancaire trouvé pour ce client."
          />
        </div>
      </section>
    );
  }

  // ✅ accountId = string
  const accountId =
    (typeof searchParams.id === "string" && searchParams.id) ||
    String(accountsData[0].id);
  const accountIdNum = Number(accountId);

  const accountDetails = await getClientAccountServer({
    clientId,
    accountId: Number(accountId),
    page: currentPage,
    pageSize: 10,
  });

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="greeting"
            title="Bienvenue"
            userName={
              currentClient?.first_name ||
              currentClient?.firstName ||
              "Client"
            }
            subtext="Accédez et gérez vos comptes et transactions efficacement."
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

export default ClientAccountsPage;