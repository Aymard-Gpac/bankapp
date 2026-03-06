/* eslint-disable no-prototype-builtins */
import { type ClassValue, clsx } from "clsx";
import qs from "query-string";
import { twMerge } from "tailwind-merge";
import { z } from "zod";

// ✅ Importe tes types si tu les as dans "@/types"
import type { AccountType, Transaction, CategoryCount } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// ============================
// FORMAT DATE / TIME (safe types)
// ============================
export const formatDateTime = (input: string | number | Date) => {
  const dateTimeOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  const dateDayOptions: Intl.DateTimeFormatOptions = {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };

  const dateOptions: Intl.DateTimeFormatOptions = {
    month: "short",
    year: "numeric",
    day: "numeric",
  };

  const timeOptions: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "numeric",
    hour12: true,
  };

  const d = new Date(input);

  const formattedDateTime = d.toLocaleString("en-US", dateTimeOptions);
  const formattedDateDay = d.toLocaleString("en-US", dateDayOptions);
  const formattedDate = d.toLocaleString("en-US", dateOptions);
  const formattedTime = d.toLocaleString("en-US", timeOptions);

  return {
    dateTime: formattedDateTime,
    dateDay: formattedDateDay,
    dateOnly: formattedDate,
    timeOnly: formattedTime,
  };
};

export function parseISODate(dateStr?: string | null) {
  if (!dateStr) return null;

  // si c'est un format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split("-").map(Number);
    return new Date(y, m - 1, d); // ✅ local date, pas de bug timezone
  }

  const dt = new Date(dateStr);
  return Number.isNaN(dt.getTime()) ? null : dt;
}
// ============================
// MONEY FORMAT (configurable)
// ============================
export function formatAmount(
  amount: number,
  currency: string = "CAD",
  locale: string = "fr-CA"
): string {
  const formatter = new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  });

  return formatter.format(amount);
}

// ============================
// SAFE CLONE (simple objects)
// ============================
export const parseStringify = (value: any) => JSON.parse(JSON.stringify(value));

// ============================
// STRINGS
// ============================
export const removeSpecialCharacters = (value?: string | null) => {
  return value?.replace(/[^\w\s]/gi, "") ?? "";
};

// ============================
// URL QUERY (SSR-safe)
// ============================
interface UrlQueryParams {
  params: string; // ex: searchParams string
  key: string;
  value: string;
}

export function formUrlQuery({ params, key, value }: UrlQueryParams) {
  const currentUrl = qs.parse(params);
  currentUrl[key] = value;

  // ✅ SSR safe
  const pathname =
    typeof window !== "undefined" ? window.location.pathname : "";

  return qs.stringifyUrl(
    {
      url: pathname,
      query: currentUrl,
    },
    { skipNull: true }
  );
}

// ============================
// ACCOUNT TYPE COLORS
// ============================
export function getAccountTypeColors(type: AccountType) {
  switch (type) {
    case "Compte Cheque":
      return {
        bg: "bg-blue-25",
        lightBg: "bg-blue-100",
        title: "text-blue-900",
        subText: "text-blue-700",
      };
    case "Compte Epargne":
      return {
        bg: "bg-green-25",
        lightBg: "bg-green-100",
        title: "text-green-900",
        subText: "text-green-700",
      };
    case "CREDIT":
      return {
        bg: "bg-red-25",
        lightBg: "bg-red-100",
        title: "text-red-900",
        subText: "text-red-700",
      };
    case "DEBIT":
      return {
        bg: "bg-purple-25",
        lightBg: "bg-purple-100",
        title: "text-purple-900",
        subText: "text-purple-700",
      };
    default:
      return {
        bg: "bg-gray-25",
        lightBg: "bg-gray-100",
        title: "text-gray-900",
        subText: "text-gray-700",
      };
  }
}

// ============================
// TRANSACTIONS CATEGORIES
// ============================
export function countTransactionCategories(
  transactions: Transaction[]
): CategoryCount[] {
  const categoryCounts: { [category: string]: number } = {};
  let totalCount = 0;

  transactions?.forEach((transaction) => {
    const category = transaction.category;

    if (categoryCounts.hasOwnProperty(category)) {
      categoryCounts[category]++;
    } else {
      categoryCounts[category] = 1;
    }

    totalCount++;
  });

  const aggregatedCategories: CategoryCount[] = Object.keys(categoryCounts).map(
    (category) => ({
      name: category,
      count: categoryCounts[category],
      totalCount,
    })
  );

  aggregatedCategories.sort((a, b) => b.count - a.count);

  return aggregatedCategories;
}

// ============================
// URL HELPERS
// ============================
export function extractCustomerIdFromUrl(url: string) {
  const parts = url.split("/");
  return parts[parts.length - 1];
}

// ============================
// BASE64 (not "encryption" - just obfuscation)
// ✅ Works server-side (Next) and client-side if Buffer exists.
// If you get Buffer undefined in browser, tell me and I’ll give browser-only version.
// ============================
export function encryptId(id: string) {
  return Buffer.from(id, "utf8").toString("base64");
}

export function decryptId(id: string) {
  return Buffer.from(id, "base64").toString("utf8");
}

// ============================
// STATUS
// ============================
export const getTransactionStatus = (date: Date) => {
  const today = new Date();
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);

  return date > twoDaysAgo ? "Processing" : "Success";
};

// ============================
// ZOD AUTH FORM SCHEMA
// ============================
export const authFormSchema = (type: string) =>
  z.object({
    // sign up
    firstName: type === "sign-in" ? z.string().optional() : z.string().min(3),
    lastName: type === "sign-in" ? z.string().optional() : z.string().min(3),
    address1: type === "sign-in" ? z.string().optional() : z.string().max(50),
    city: type === "sign-in" ? z.string().optional() : z.string().max(50),
    state:
      type === "sign-in" ? z.string().optional() : z.string().min(2).max(2),
    postalCode:
      type === "sign-in" ? z.string().optional() : z.string().min(3).max(6),
    dateOfBirth:
      type === "sign-in" ? z.string().optional() : z.string().min(3),
    ssn: type === "sign-in" ? z.string().optional() : z.string().min(3),

    // both
    email: z.string().email(),
    password: z.string().min(8),
  });