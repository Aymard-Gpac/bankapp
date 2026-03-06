import MobileNav from "@/components/MobileNav";
import RightSidebar from "@/components/RightSidebar";
import Sidebar from "@/components/Sidebar";
import { getCurrentClientServer } from "@/lib/actions/client.server";
import { getCurrentUserServer } from "@/lib/actions/user.server";
import { redirect } from "next/navigation";
import Image from "next/image";

type LayoutProps = {
  children: React.ReactNode;
};

export default async function ClientLayout({ children }: LayoutProps) {
  const client = await getCurrentUserServer();
    //  Protection : si aucun utilisateur connecté,
  // on redirige vers la page de connexion pour éviter l'erreur client.id null
  if (!client?.id) {
    redirect("/sign-in"); // adapte si ta route login est différente
  }
  //  ici client existe forcément
  const accounts = await getCurrentClientServer(client.id);

  return (
    <main className="flex h-screen w-full font-inter">
      <Sidebar user={client} currentUser={client} />

      <div className="flex size-full flex-col">
        <div className="root-layout">
          <Image src="/icons/logo.svg" width={30} height={30} alt="logo" />
          <div>
            <MobileNav user={client} />
          </div>
        </div>
        {children}
      </div>

      <RightSidebar user={client} transactions={[]} banks={accounts} />
    </main>
  );
}