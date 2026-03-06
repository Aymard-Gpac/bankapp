import BankCard from "@/components/BankCard";
import HeaderBox from "@/components/HeaderBox";
import RightSidebar from "@/components/RightSidebar";
import { getClientAccounts } from "@/lib/actions/bank.actions";
import { getClientAccountsServer } from "@/lib/actions/bank.server";
import { getCurrentClientServer } from "@/lib/actions/client.server";
import { getCurrentUser } from "@/lib/actions/user.actions";
import type { Account } from "@/types";

type PageProps = {
  params: { clientsId: string };
};

const MyBanks = async ({ params }: PageProps) => {
  const client = await getCurrentUser();
  const clientId = client.id;
  //const currentClient = await getCurrentClientServer( clientId );
  const accounts = await getClientAccountsServer( clientId );

  if (!accounts?.data?.length) {
    return (
      <section className="flex">
        <div className="my-banks">
          <HeaderBox
            title="Bank Accounts"
            subtext="No bank accounts found for this client."
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
          title="Bank Accounts"
          subtext="Effortlessly manage banking activities."
          userName={clientName}
        />

        <div className="space-y-4">
          <h2 className="header-2">Cards</h2>

          <div className="flex flex-wrap gap-6">
            {accounts.data.map((a: Account) => (
              <BankCard key={a.id} account={a} userName={clientName} />
            ))}
          </div>
        </div>
      </div>

    </section>
  );
};

export default MyBanks;
