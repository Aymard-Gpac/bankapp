"use client";

import { useState } from "react";
import InternalTransfer from "@/components/InternalTransfer";
import InteracTransfer from "@/components/InteracTransfer";
import BillTransfer from "./BillTransfer";

export default function TransferTabs({
  accounts,
  currentUser,
}: {
  accounts: any[];
  currentUser: any;
}) {
  const [activeTab, setActiveTab] = useState<"internal" | "interac" | "bills">("internal");

  return (
    <div className="transfer-tabs">
      <input
        type="radio"
        name="transferTab"
        id="tab-internal"
        checked={activeTab === "internal"}
        onChange={() => setActiveTab("internal")}
        className="transfer-tabs__radio"
      />
      <label className="transfer-tabs__tab" htmlFor="tab-internal">
        Interne
      </label>

      <input
        type="radio"
        name="transferTab"
        id="tab-interac"
        checked={activeTab === "interac"}
        onChange={() => setActiveTab("interac")}
        className="transfer-tabs__radio"
      />
      <label className="transfer-tabs__tab" htmlFor="tab-interac">
        Interac
      </label>

      <input
        className="transfer-tabs__radio"
        type="radio"
        name="transferTab"
        id="tab-bills"
        checked={activeTab === "bills"}
        onChange={() => setActiveTab("bills")}
        
      />
      <label className="transfer-tabs__tab" htmlFor="tab-bills">
        Factures
      </label>

      <span className="transfer-tabs__indicator" />

      <div className="transfer-tabs__panels">
        {activeTab === "internal" && (
          <div className="transfer-tabs__panel">
            <InternalTransfer accounts={accounts} />
          </div>
        )}

        {activeTab === "interac" && (
          <div className="transfer-tabs__panel">
            <InteracTransfer accounts={accounts} currentUser={currentUser} />
          </div>
        )}
        {activeTab === "bills" && (
          <div className="transfer-tabs__panel">
            <BillTransfer accounts={accounts}  />
          </div>
        )}
      </div>
    </div>
  );
}