import BankCard from "@/components/BankCard";
import HeaderBox from "@/components/HeaderBox";
import RightSidebar from "@/components/RightSidebar";
import { getClientAccounts } from "@/lib/actions/bank.actions";
import { getClientAccountsServer } from "@/lib/actions/bank.server";
import { getCurrentClientServer } from "@/lib/actions/client.server";
import CloseAccountButton from "@/components/CloseAccountButton";
import type { Account } from "@/types";

type PageProps = {
  params: { clientsId: string };
};

const MyBanks = async ({ params }: PageProps) => {
  const clientId = Number(params.clientsId);

  const client = await getCurrentClientServer(clientId);
  const accounts = await getClientAccountsServer(clientId);

  if (!accounts?.data?.length) {
    return (
      <section className="flex">
        <div className="my-banks">
          <HeaderBox
            title="Comptes bancaires"
            subtext="Aucun compte bancaire trouvé pour ce client."
            userName={`${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim() || "Client"}
          />
        </div>
      </section>
    );
  }

  const clientName =
    `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim() || "Client";

  return (
    <section className="flex">
      <div className="my-banks">
        <HeaderBox
          title="Comptes bancaires"
          subtext="Gérez vos opérations bancaires en toute simplicité."
          userName={clientName}
        />

        <div className="space-y-4">
          <h2 className="header-2">Cartes</h2>

          <div className="flex flex-wrap gap-6">
            {accounts.data.map((a: Account) => (
              <div key={a.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
              <BankCard key={a.id} account={a} userName={clientName} />
              <div className="w-full">
                <CloseAccountButton 
                clientId={clientId}
                accountId={Number(a.id)}
                accountType={String(a.type)}
                balance={Number(a.balance)}
                />
              </div>
              </div>
              
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyBanks;