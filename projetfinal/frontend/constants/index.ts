import { FinancialProduct } from "../types";

export const sidebarLinks = [
  {
    imgURL: "/icons/home.svg",
    route: "/api/clients/{id}/accounts",
    label: "Accueil",

  },
  {
    imgURL: "/icons/dollar-circle.svg",
    route: "/client/{id}/my-banks",
    label: "Mes banques",

  },
  {
    imgURL: "/icons/transaction.svg",
    route: "/transaction-history",
    label: "Historique des transactions",
  },
   {
    imgURL: "/icons/money-send.svg",
    route: "/transfers",
    label: "Virements",
  },
   {
    imgURL: "/icons/arrow-left.svg",
    route: "/student",
    label: "Liste client",
  },
  {
    imgURL: "/icons/trasaction.svg",
    route: "/future-transactions",
    label: "Transactions futures",
  },
  {
    imgURL: "/icons/credit-card.svg",
    route: "/products",
    label: "Produits",
  },
];




export const topCategoryStyles = {
  "Food and Drink": {
    bg: "bg-blue-25",
    circleBg: "bg-blue-100",
    text: {
      main: "text-blue-900",
      count: "text-blue-700",
    },
    progress: {
      bg: "bg-blue-100",
      indicator: "bg-blue-700",
    },
    icon: "/icons/monitor.svg",
  },
  Travel: {
    bg: "bg-success-25",
    circleBg: "bg-success-100",
    text: {
      main: "text-success-900",
      count: "text-success-700",
    },
    progress: {
      bg: "bg-success-100",
      indicator: "bg-success-700",
    },
    icon: "/icons/coins.svg",
  },
  default: {
    bg: "bg-pink-25",
    circleBg: "bg-pink-100",
    text: {
      main: "text-pink-900",
      count: "text-pink-700",
    },
    progress: {
      bg: "bg-pink-100",
      indicator: "bg-pink-700",
    },
    icon: "/icons/shopping-bag.svg",
  },
};

export const transactionCategoryStyles = {
  "Food and Drink": {
    borderColor: "border-pink-600",
    backgroundColor: "bg-pink-500",
    textColor: "text-pink-700",
    chipBackgroundColor: "bg-inherit",
  },
  Payment: {
    borderColor: "border-success-600",
    backgroundColor: "bg-green-600",
    textColor: "text-success-700",
    chipBackgroundColor: "bg-inherit",
  },
  "Bank Fees": {
    borderColor: "border-success-600",
    backgroundColor: "bg-green-600",
    textColor: "text-success-700",
    chipBackgroundColor: "bg-inherit",
  },
  Transfer: {
    borderColor: "border-red-700",
    backgroundColor: "bg-red-700",
    textColor: "text-red-700",
    chipBackgroundColor: "bg-inherit",
  },
  Processing: {
    borderColor: "border-[#F2F4F7]",
    backgroundColor: "bg-gray-500",
    textColor: "text-[#344054]",
    chipBackgroundColor: "bg-[#F2F4F7]",
  },
  Success: {
    borderColor: "border-[#12B76A]",
    backgroundColor: "bg-[#12B76A]",
    textColor: "text-[#027A48]",
    chipBackgroundColor: "bg-[#ECFDF3]",
  },
  Travel: {
    borderColor: "border-[#0047AB]",
    backgroundColor: "bg-blue-500",
    textColor: "text-blue-700",
    chipBackgroundColor: "bg-[#ECFDF3]",
  },
  default: {
    borderColor: "",
    backgroundColor: "bg-blue-500",
    textColor: "text-blue-700",
    chipBackgroundColor: "bg-inherit",
  },
};
export const financialProducts: FinancialProduct[] = [
  {
    id: "compte-cheque",
    title: "Compte chèque quotidien",
    category: "Services",
    description:
      "Un compte conçu pour les opérations de tous les jours : dépôts, retraits, paiements et virements.",
    features: [
      "Accès rapide aux fonds",
      "Carte de débit pour les achats courants",
      "Paiement de factures et virements",
    ],
    target: "Idéal pour la gestion des dépenses quotidiennes.",
    icon: "/icons/dollar-circle.svg",
  },
  {
    id: "compte-epargne",
    title: "Compte épargne",
    category: "Épargne",
    description:
      "Une solution simple pour mettre de l’argent de côté et préparer vos projets à moyen terme.",
    features: [
      "Épargne sécurisée",
      "Consultation facile du solde",
      "Parfait pour un fonds d’urgence",
    ],
    target: "Adapté aux clients qui souhaitent économiser progressivement.",
    icon: "/icons/coins.svg",
  },
  {
    id: "carte-credit",
    title: "Carte de crédit",
    category: "Crédit",
    description:
      "Une carte pour financer vos achats, suivre vos dépenses et bénéficier d’une marge de paiement flexible.",
    features: [
      "Paiements en ligne et en magasin",
      "Historique détaillé des dépenses",
      "Remboursement selon le solde utilisé",
    ],
    target: "Utile pour les achats planifiés et la gestion du crédit.",
    icon: "/icons/credit-card.svg",
  },
  {
    id: "pret-personnel",
    title: "Prêt personnel",
    category: "Crédit",
    description:
      "Un financement pour soutenir un besoin ponctuel comme un projet personnel, un achat important ou une urgence.",
    features: [
      "Montant défini à l’avance",
      "Versements périodiques prévisibles",
      "Bonne visibilité sur le remboursement",
    ],
    target: "Convient aux clients qui veulent planifier un financement clair.",
    icon: "/icons/bank-transfer.svg",
  },
  {
    id: "placement-cpg",
    title: "Placement garanti",
    category: "Investissement",
    description:
      "Une option prudente pour investir un montant pendant une période donnée avec un rendement plus stable.",
    features: [
      "Capital mieux protégé",
      "Objectif d’épargne à moyen ou long terme",
      "Approche rassurante pour les profils prudents",
    ],
    target: "Intéressant pour les clients qui privilégient la stabilité.",
    icon: "/icons/monitor.svg",
  },
  {
    id: "virement-interac",
    title: "Virement Interac",
    category: "Services",
    description:
      "Un service pratique pour envoyer de l’argent à un bénéficiaire rapidement à partir de vos comptes disponibles.",
    features: [
      "Envoi vers un bénéficiaire enregistré",
      "Gestion depuis l’espace client",
      "Suivi dans l’historique des transactions",
    ],
    target: "Pensé pour les transferts simples entre particuliers.",
    icon: "/icons/money-send.svg",
  },
];