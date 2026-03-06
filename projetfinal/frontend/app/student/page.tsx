"use client";

import HeaderBox from "@/components/HeaderBox";
import ClientsSection from "@/components/ClientsSection";
import { useEffect, useState } from "react";
import { getCurrentUser } from "@/lib/actions/user.actions";
import type { User } from "@/types";
import MobileNav from "@/components/MobileNav";

export default function StudentDashboard() {
  const [loggedIn, setLoggedIn] = useState<User | null>(null);

  useEffect(() => {
    const loadUser = async () => {
      const u = await getCurrentUser();
      setLoggedIn(u);
    };
    loadUser();
  }, []);

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <div className="md:hidden">
            <MobileNav user={loggedIn} />
          </div>

          <HeaderBox
            type="greeting"
            title="Student Dashboard"
            userName={loggedIn?.firstName ?? loggedIn?.first_name ?? "Invité"}
            subtext="Add and view clients."
          />
        </header>

        <ClientsSection />
      </div>
    </section>
  );
}