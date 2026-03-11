import HeaderBox from "@/components/HeaderBox";
import HistoryTabs from "@/components/HistoryTabs";
import { getClientTransactionHistoryServer } from "@/lib/actions/bank.server";
import { getCurrentUserServer } from "@/lib/actions/user.server";

const HistoryPage = async () => {
  const client = await getCurrentUserServer();
  const clientId = client.id;

  const history = await getClientTransactionHistoryServer(clientId);

  return (
    <section className="w-full">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <HeaderBox
          title="Historique des transactions"
          subtext="Analysez les opérations réalisées sur vos comptes chèque, épargne et crédit."
          userName={
            `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim() ||
            "Client"
          }
        />

        {/* Contenu principal en pleine largeur */}
        <div className="mt-8">
          <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6">
            <HistoryTabs transactions={history?.data ?? []} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HistoryPage;