"use client";

import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import { sidebarLinks } from "@/constants";
import type { SiderbarProps } from "@/types";

const Sidebar = ({ user, currentUser }: SiderbarProps) => {
  const pathname = usePathname();

  // ✅ id du client venant de getCurrentClient
  const clientId = user?.id;

  /**
   * Normalise un chemin pour comparer proprement:
   * - retire les slashs finaux
   * - garantit un format stable
   */
  const normalize = (path: string) =>
    path.length > 1 ? path.replace(/\/+$/, "") : path;

  /**
   * “Aliases” pro: certains écrans ont 2 routes équivalentes.
   * Exemple:
   * - /api/clients/:id/accounts (supervision étudiant)
   * - /client/:id/accounts (accès client)
   * => doivent activer le même item dans le sidebar.
   *
   * On définit ici une fonction qui liste toutes les routes équivalentes
   * d’un href sidebar donné.
   */
  const getEquivalentPaths = (href: string) => {
    const h = normalize(href);

    // si on n'a pas d'id, aucune équivalence dynamique n'est possible
    if (!clientId) return [h];

    const apiAccounts = normalize(`/api/clients/${clientId}/accounts`);
    const clientAccounts = normalize(`/client/${clientId}/accounts`);

    // Écran "accounts/home": on rend ces routes équivalentes
    if (h === apiAccounts || h === clientAccounts) {
      return ["/",apiAccounts, clientAccounts];
    }

    // Par défaut: pas d’équivalence spéciale
    return [h];
  };

  /**
   * Détermine si un item est actif:
   * - actif si pathname est exactement une des routes équivalentes
   * - ou si pathname est une sous-route (startsWith)
   */
  const isLinkActive = (href: string) => {
    const current = normalize(pathname);
    const equivalents = getEquivalentPaths(href);

    return equivalents.some(
      (p) => current === p || current.startsWith(`${p}/`),
    );
  };

  return (
    <section className="sidebar">
      <nav className="flex flex-col gap-4">
        <Link href="/" className="mb-12 flex items-center gap-2">
          <Image
            src="/icons/logo.svg"
            width={34}
            height={34}
            alt="Logo"
            className="size-[24px] max-xl:size-14"
          />
          <h1 className="sidebar-logo">BANK APP</h1>
        </Link>

        {sidebarLinks
          .filter((item) => {
            if (currentUser?.role === "etudiant" && item.route.includes("/transfers")) {
              return false;
            } else if (currentUser?.role === "client" && item.route.includes("/student")) {
              return false;
            } 
            return true;
          })
          .map((item) => {
            // ✅ remplace {id} avec l'id réel du client
            const href =
              item.route.includes("{id}") && clientId
                ? item.route.replace("{id}", String(clientId))
                : item.route;

            const isActive = isLinkActive(href);

            return (
              <Link
                key={item.label}
                href={href}
                className={cn("sidebar-link", {
                  "bg-bank-gradient": isActive,
                })}
              >
                <div className="relative size-6">
                  <Image
                    src={item.imgURL}
                    alt={item.label}
                    fill
                    className={cn({
                      "brightness-[3] invert-0": isActive,
                    })}
                  />
                </div>

                <p
                  className={cn("sidebar-label", {
                    "!text-white": isActive,
                  })}
                >
                  {item.label}
                </p>
              </Link>
            );
          })}
      </nav>

      {user && <Footer user={currentUser} />}
    </section>
  );
};

export default Sidebar;
