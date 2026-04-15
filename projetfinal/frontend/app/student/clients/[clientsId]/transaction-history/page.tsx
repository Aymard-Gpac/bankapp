import HeaderBox from "@/components/HeaderBox";
import HistoryTabs from "@/components/HistoryTabs";
import { getClientTransactionHistoryServer } from "@/lib/actions/bank.server";
import { getCurrentClientServer } from "@/lib/actions/client.server";
import { redirect } from "next/navigation";

type StudentTransactionHistoryPageProps = {
  params: {
    clientsId: string;
  };
};

const StudentTransactionHistoryPage = async ({
  params,
}: StudentTransactionHistoryPageProps) => {
  const clientId = Number(params.clientsId);

  // Sécurité : si l'id dans l'URL est invalide, on retourne à la liste étudiant
  if (Number.isNaN(clientId)) {
    redirect("/student");
  }

  // On récupère le client supervisé
  const client = await getCurrentClientServer(clientId);

  // Si le client n'existe pas ou n'est pas accessible, retour à la liste
  if (!client) {
    redirect("/student");
  }

  // On réutilise exactement la même source de données que la page client
  const history = await getClientTransactionHistoryServer(clientId);

  return (
    <section className="flex h-[calc(100vh-72px)] min-h-0 w-full flex-col gap-8 overflow-y-auto px-5 py-7 sm:px-8 lg:py-12">
      <div className="mx-auto w-full max-w-7xl px-6 py-8">
        <HeaderBox
          title="Historique des transactions"
          subtext="Consultez les opérations réalisées sur les comptes chèque, épargne et crédit du client supervisé."
          userName={
            `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim() ||
            "Client"
          }
        />

        <div className="mt-8">
          <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-6">
            <HistoryTabs transactions={history?.data ?? []} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default StudentTransactionHistoryPage;