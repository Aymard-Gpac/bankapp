import BankCard from "@/components/BankCard";
import HeaderBox from "@/components/HeaderBox";
import { getClientAccountsServer } from "@/lib/actions/bank.server";
import { getCurrentUserServer } from "@/lib/actions/user.server";
import { redirect } from "next/navigation";
import type { Account } from "@/types";

const MyBanks = async () => {
  const client = await getCurrentUserServer();

  if (!client || !client.id) {
    redirect("/sign-in");
  }

  const clientId = client.id;
  const accounts = await getClientAccountsServer(clientId);

  if (!accounts?.data?.length) {
    return (
      <section className="flex">
        <div className="my-banks">
          <HeaderBox
            title="Comptes bancaires"
            subtext="Aucun compte bancaire trouvé pour ce client."
            userName={
              `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim() ||
              "Client"
            }
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
              <BankCard key={a.id} account={a} userName={clientName} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default MyBanks;