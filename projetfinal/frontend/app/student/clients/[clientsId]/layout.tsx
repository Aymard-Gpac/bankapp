import MobileNav from "@/components/MobileNav";
import RightSidebar from "@/components/RightSidebar";
import Sidebar from "@/components/Sidebar";
import { getCurrentClientServer } from "@/lib/actions/client.server";
import { getCurrentUserServer } from "@/lib/actions/user.server";
import Image from "next/image";

type LayoutProps = {
  children: React.ReactNode;
  params: { clientId?: string; clientsId?: string };
};

export default async function StudentLayout({ children, params }: LayoutProps) {
  const rawId = params.clientId ?? params.clientsId;
  const clientId = Number(rawId);

  if (!rawId || Number.isNaN(clientId)) {
    throw new Error(`Invalid clientId in params: ${JSON.stringify(params)}`);
  }

  const client = await getCurrentClientServer(clientId);
  const accounts = await getCurrentClientServer( clientId );
  const currentUser = await getCurrentUserServer();

if (!client) {
  return (
    <main className="flex h-screen w-full font-inter">
      <div className="flex size-full flex-col items-center justify-center p-6">
        <h1 className="text-xl font-semibold">Impossible de charger le client</h1>
        <p className="text-sm text-gray-500">clientId={clientId}</p>
        <p className="text-sm text-gray-500">
          Vérifie l’API /api/clients/{clientId} et l’auth (401).
        </p>
      </div>
    </main>
  );
}


  return (
    <main className="flex h-screen w-full font-inter">
      <Sidebar user={client} currentUser={currentUser} />

      <div className="flex size-full flex-col">
        <div className="root-layout">
          <Image src="/icons/logo.svg" width={30} height={30} alt="logo" />
          <div>
            <MobileNav user={client} />
          </div>
        </div>
        {children}
      </div>

      <RightSidebar user={currentUser} transactions={[]} banks={accounts} />

    </main>
  );
}
