import Image from "next/image";
import Link from "next/link";
import React from "react";
import { RightSidebarProps } from "@/types";

const RightSidebar = ({ user }: RightSidebarProps) => {
  if (!user) return null;

  const firstName = user.firstName || "";
  const lastName = user.lastName || "";
  const email = user.email || "";
  const initial = firstName ? firstName[0].toUpperCase() : "?";

  return (
    <aside className="right-sidebar">
      <section className="flex flex-col pb-8">
        <div className="profile-banner" />
        <div className="profile">
          <div className="profile-img">
            <span className="text-5xl font-bold text-blue-500">{initial}</span>
          </div>

          <div className="profile-details">
            <h1 className="profile-name">
              {firstName} {lastName}
            </h1>
            <p className="profile-email">{email}</p>
          </div>
        </div>
      </section>

      <section className="banks">
        <div className="flex w-full justify-between">
          <h2 className="header-2">Mes comptes</h2>

          <Link href="/" className="flex gap-2">
            <Image src="/icons/plus.svg" width={20} height={20} alt="ajouter" />
            <h2 className="text-14 font-semibold text-gray-600">
              Ajouter un compte
            </h2>
          </Link>
        </div>
      </section>
    </aside>
  );
};

export default RightSidebar;