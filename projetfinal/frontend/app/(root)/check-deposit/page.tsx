import HeaderBox from "@/components/HeaderBox";
import CheckDepositForm from "@/components/CheckDepositForm";
import { getCurrentUserServer } from "@/lib/actions/user.server";
import { redirect } from "next/navigation";

export default async function CheckDepositPage() {
  const client = await getCurrentUserServer();

  if (!client?.id) {
    redirect("/sign-in");
  }

  const clientName =
    `${client?.first_name ?? ""} ${client?.last_name ?? ""}`.trim() || "Client";

  return (
    <section className="transactions">
      <HeaderBox
        title="Dépôt de chèque"
        subtext="Téléversez une photo du chèque, validez le QR code et créditez le compte courant."
        userName={clientName}
      />

      <CheckDepositForm clientId={Number(client.id)} />
    </section>
  );
}