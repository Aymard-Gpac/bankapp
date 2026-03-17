import TransferTabs from "@/components/TransferTabs";
import { getClientAccountsServer } from "@/lib/actions/bank.server";
import { getCurrentUserServer } from "@/lib/actions/user.server";
import { redirect } from "next/navigation";

const Page = async () => {
  const client = await getCurrentUserServer();

  // ✅ Sécurité : éviter un crash si l'utilisateur n'est pas connecté
  if (!client || !client.id) {
    redirect("/sign-in");
  }

  const accounts = await getClientAccountsServer(client.id);
  const accountsData = accounts?.data ?? [];

  return (
    <section className="payment-transfer">
      <div className="payment-transfer__container">
        <header className="payment-transfer__header">
          <div>
            <h1 className="payment-transfer__title">Virements</h1>
            <p className="payment-transfer__subtitle">
              Transférez de l’argent entre vos comptes ou par Interac.
            </p>
          </div>
        </header>

        <div className="payment-transfer__grid">
          <div className="payment-transfer__card">
            <div className="p-5">
              <TransferTabs accounts={accountsData} currentUser={client} />
            </div>
          </div>

          <aside className="payment-transfer__help">
            <div className="payment-transfer__help-card">
              <h3 className="payment-transfer__help-title">Conseils</h3>
              <ul className="payment-transfer__help-list">
                <li>Choisissez un compte source valide avec un solde suffisant.</li>
                <li>Pour Interac, vérifiez l’adresse courriel du destinataire.</li>
                <li>Les transferts sont enregistrés automatiquement.</li>
                <li>Pour les factures, sélectionnez un bénéficiaire.</li>
              </ul>
            </div>

            <div className="payment-transfer__help-card">
              <h3 className="payment-transfer__help-title">Sécurité</h3>
              <p className="payment-transfer__help-text">
                Le backend vérifie l’authentification et l’accès aux comptes
                avant d’effectuer le virement.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
};

export default Page;