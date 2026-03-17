"use client";

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { sidebarLinks } from "@/constants";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Footer from "./Footer";
import { MobileNavProps } from "@/types";

const MobileNav = ({ user }: MobileNavProps) => {
  const pathname = usePathname();
  const clientId = user?.id;

  const normalize = (path: string) =>
    path.length > 1 ? path.replace(/\/+$/, "") : path;

  const getEquivalentPaths = (href: string) => {
    const h = normalize(href);

    if (!clientId) return [h];

    const apiAccounts = normalize(`/api/clients/${clientId}/accounts`);
    const clientAccounts = normalize(`/client/${clientId}/accounts`);

    if (h === apiAccounts || h === clientAccounts) {
      return ["/", apiAccounts, clientAccounts];
    }

    return [h];
  };

  const isLinkActive = (href: string) => {
    const current = normalize(pathname);
    const equivalents = getEquivalentPaths(href);

    return equivalents.some(
      (p) => current === p || current.startsWith(`${p}/`)
    );
  };

  return (
    <section className="w-full max-w-[264px]">
      <Sheet>
        <SheetTrigger>
          <Image
            src="/icons/hamburger.svg"
            width={30}
            height={30}
            alt="menu"
            className="cursor-pointer"
          />
        </SheetTrigger>

        <SheetContent side="left" className="border-none bg-white">
          <Link
            href="/"
            className="cursor-pointer flex items-center gap-1 px-4"
          >
            <Image
              src="/icons/logo.svg"
              width={34}
              height={34}
              alt="Horizon logo"
            />
            <h1 className="text-26 font-ibm-plex-serif font-bold text-black-1">
              BANK APP
            </h1>
          </Link>

          <div className="mobilenav-sheet">
            <nav className="flex h-full flex-col gap-6 pt-16 text-white">
              {sidebarLinks
                .filter((item) => {
                  const role = user?.role;

                  if (role === "etudiant" && item.route.includes("/transfers")) {
                    return false;
                  }

                  if (role === "client" && item.route.includes("/student")) {
                    return false;
                  }

                  return true;
                })
                .map((item) => {
                  const href =
                    item.route.includes("{id}") && clientId
                      ? item.route.replace("{id}", String(clientId))
                      : item.route;

                  const isActive = isLinkActive(href);

                  return (
                    <SheetClose asChild key={item.route}>
                      <Link
                        href={href}
                        className={cn("mobilenav-sheet_close w-full", {
                          "bg-bank-gradient": isActive,
                        })}
                      >
                        <Image
                          src={item.imgURL}
                          alt={item.label}
                          width={20}
                          height={20}
                          className={cn({
                            "brightness-[3] invert-0": isActive,
                          })}
                        />
                        <p
                          className={cn(
                            "text-16 font-semibold text-black-2",
                            {
                              "text-white": isActive,
                            }
                          )}
                        >
                          {item.label}
                        </p>
                      </Link>
                    </SheetClose>
                  );
                })}
            </nav>

            <Footer user={user} type="mobile" />
          </div>
        </SheetContent>
      </Sheet>
    </section>
  );
};

export default MobileNav;