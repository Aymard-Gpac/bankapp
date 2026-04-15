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

  /**
   * user :
   * - côté client => client connecté
   * - côté étudiant en supervision => client supervisé
   */
  const clientId = user?.id;

  const normalize = (path: string) =>
    path && path.length > 1 ? path.replace(/\/+$/, "") : path || "/";

  const currentPath = normalize(pathname);

  /**
   * Contexte : étudiant qui supervise un client
   */
  const isStudentSupervision =
    currentUser?.role === "etudiant" &&
    typeof clientId !== "undefined" &&
    currentPath.startsWith("/student/clients/");

  /**
   * On filtre les liens visibles par LABEL.
   * C'est plus fiable ici que de dépendre uniquement de item.route,
   * car ton projet a plusieurs contextes (client / étudiant supervision).
   */
  const visibleSidebarLinks = sidebarLinks.filter((item) => {
    if (isStudentSupervision) {
      return [
        "Accueil",
        "Mes banques",
        "Historique des transactions",
        "Liste client",
      ].includes(item.label);
    }

    if (currentUser?.role === "client") {
      return item.label !== "Liste client";
    }

    return true;
  });

  /**
   * Construit le bon href selon le rôle et le contexte.
   * Ici on utilise item.label pour éviter les incohérences de routes.
   */
  const buildHref = (label: string, fallbackRoute: string) => {
    if (isStudentSupervision && clientId) {
      if (label === "Accueil") {
        return `/student/clients/${clientId}`;
      }

      if (label === "Mes banques") {
        return `/student/clients/${clientId}/my-banks`;
      }

      if (label === "Historique des transactions") {
        return `/student/clients/${clientId}/transaction-history`;
      }

      if (label === "Liste client") {
        return `/student`;
      }

      return fallbackRoute;
    }

    // ✅ Mode client normal
    if (clientId && fallbackRoute.includes("{id}")) {
      return fallbackRoute.replace("{id}", String(clientId));
    }

    return fallbackRoute;
  };

  /**
   * Détermine si un lien est actif.
   * On le fait par LABEL pour être robuste dans les 2 contextes.
   */
  const isLinkActive = (label: string, href: string) => {
    const targetPath = normalize(href);

    // =========================
    // Mode étudiant supervision
    // =========================
    if (isStudentSupervision && clientId) {
      if (label === "Accueil") {
        return currentPath === normalize(`/student/clients/${clientId}`);
      }

      if (label === "Mes banques") {
        return currentPath === normalize(`/student/clients/${clientId}/my-banks`);
      }

      if (label === "Historique des transactions") {
        return (
          currentPath ===
          normalize(`/student/clients/${clientId}/transaction-history`)
        );
      }

      if (label === "Liste client") {
        return currentPath === normalize("/student");
      }

      return currentPath === targetPath;
    }

    // =========================
    // Mode client normal
    // =========================
   if (currentUser?.role === "client" && clientId) {
     if (label === "Accueil") {
       return (
         currentPath === normalize("/") ||
         currentPath === normalize(`/api/clients/${clientId}/accounts`) ||
         currentPath === normalize(`/client/${clientId}/accounts`)
       );
     }
   
     if (label === "Mes banques") {
       return currentPath === normalize(`/client/${clientId}/my-banks`);
     }
   
     if (label === "Historique des transactions") {
       return currentPath === normalize("/transaction-history");
     }
   
     if (label === "Virements") {
       return (
         currentPath === normalize("/payment-transfer") ||
         currentPath === normalize("/transfers")
       );
     }
   
     if (label === "Transactions futures") {
       return currentPath === normalize("/future-transactions");
     }
   
     if (label === "Produits") {
       return currentPath === normalize("/products");
     }
     if (label === "Dépôt de chèque") {
       return currentPath === normalize("/check-deposit");
     }
   
     return currentPath === targetPath;
  }

    // fallback général
    return currentPath === targetPath;
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

        {visibleSidebarLinks.map((item) => {
          const href = buildHref(item.label, item.route);
          const isActive = isLinkActive(item.label, href);

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