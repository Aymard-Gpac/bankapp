/* eslint-disable no-unused-vars */

import { decl } from "postcss";

// ========================================
// Next.js params
// ========================================

export type SearchParamProps = {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// ========================================
// Auth
// ========================================

export type SignUpParams = {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  state: string;
  postalCode: string;
  dateOfBirth: string;
  ssn: string;
  email: string;
  password: string;
};

export type LoginUser = {
  email: string;
  password: string;
};

export type NewUserParams = {
  userId: string;
  email: string;
  name: string;
  password: string;
};

// ========================================
// User (✅ compatible backend snake_case + frontend camelCase)
// ========================================

export type User = {
  // backend / sqlite
  id?: number | string;
  userId?: string;

  first_name?: string;
  last_name?: string;
  address1?: string;
  postal_code?: string;
  date_of_birth?: string;

  // frontend
  firstName?: string;
  lastName?: string;
  postalCode?: string;
  dateOfBirth?: string;

  // commun
  email?: string;
  name?: string;
  city?: string;
  state?: string;
  ssn?: string;
  role?: "client" | "etudiant" | "admin";
  created_at?: string;
};

export type Client = User & { role: "client" | "student" | "admin" };

// ========================================
// Accounts
// ========================================

export type AccountType = "Compte Cheque" | "Compte Epargne" | "loan" | "DEBIT" | "CREDIT" | "investment" | "other";

export type Account = {
  id: number;
  user_id: number;             
  account_number: string;
  type: AccountType;
  balance: number;
  currency: string;
  created_at?: string;

  name?: string;     // ex: "Checking Account"
  subtype?: string;  // ex: "cheque"
};


export type Bank = {
  $id?: string;
  accountId: string;
  bankId: string;
  accessToken: string;
  fundingSourceUrl: string;
  userId: string;
  shareableId: string;
};

// ========================================
// Transactions
// ========================================

export type Transaction = {
  id: string;
  $id?: string;
  name: string;
  paymentChannel: string;
  type: "DEBIT" | "CREDIT" | string;
  accountId: string;
  amount: number;
  pending: boolean;
  description: string;
  category: string;
  date: string;
  image?: string;
  created_at?: date;
  channel?: string;
  senderBankId?: string;
  receiverBankId?: string;
};

declare interface CreditCardProps {
  account: Account;
  userName: string;
  showBalance?: boolean;
}

declare interface TotalBalanceBoxProps {
  accounts: Account[];
  totalBanks: number;
  totalCurrentBalance: number;
}


// ========================================
// Categories
// ========================================

export type CategoryCount = {
  name: string;
  count: number;
  totalCount: number;
};

export type Category = "Food and Drink" | "Travel" | "Transfer";

export type Receiver = {
  firstName: string;
  lastName: string;
};

// ========================================
// Transfers
// ========================================

export type TransferParams = {
  sourceFundingSourceUrl: string;
  destinationFundingSourceUrl: string;
  amount: string;
};

export type AddFundingSourceParams = {
  processorToken: string;
  bankName: string;
};

// ========================================
// Component Props (✅ accept User | null)
// ========================================

declare interface HeaderBoxProps {
  type?: "title" | "greeting";
  title: string;
  subtext?: string;
  userName?: string; // ✅ string only
}

declare interface FooterProps {
  user: User | null;
  type?: "mobile" | "desktop";
}

declare interface SiderbarProps {
  user: User | null;
  currentUser: User | null;
}

declare interface MobileNavProps {
  user: User | null;
}

declare interface RightSidebarProps {
  user: User | null;
  transactions?: Transaction[];
  banks?: (Bank | Account)[];
}

declare interface RecentTransactionsProps {
  accounts: Account[];
  transactions: Transaction[];
  accountId: number;
  page: number;
}

declare interface TransactionHistoryTableProps {
  transactions: Transaction[];
  page: number;
}

declare interface CategoryBadgeProps {
  category: string;
}

declare interface TransactionTableProps {
  transactions: Transaction[];
}

declare interface CategoryProps {
  category: CategoryCount;
}

declare interface DoughnutChartProps {
  accounts: Account[];
}

declare interface PaymentTransferFormProps {
  accounts: Account[];
}


declare interface BankInfoProps {
  account: Account;
  accountId?: string;
  type: "full" | "card";
}

// ========================================
// Action Props
// ========================================

declare interface getAccountsProps {
  userId: string;
}

declare interface getInstitutionProps {
  institutionId: string;
}

declare interface getTransactionsProps {
  accessToken: string;
}

declare interface CreateFundingSourceOptions {
  customerId: string;
  fundingSourceName: string;
  plaidToken: string;
  _links: object;
}

export interface CreateTransactionProps {
  name: string;
  amount: string;
  senderId: string;
  senderBankId: string;
  receiverId: string;
  receiverBankId: string;
  email: string;
}

export interface getTransactionsByBankIdProps {
  bankId: string;
}

export interface BankTabItemProps {
  account: Account;
  accountId?: string; // ✅ string (query param)
}

export interface signInProps {
  email: string;
  password: string;
}

declare interface getUserInfoProps {
  userId: string;
}

export interface exchangePublicTokenProps {
  publicToken: string;
  user: User;
}

export interface createBankAccountProps {
  accessToken: string;
  userId: string;
  accountId: string;
  bankId: string;
  fundingSourceUrl: string;
  shareableId: string;
}

declare interface getBanksProps {
  userId: string;
}

declare interface getBankProps {
  documentId: string;
}

declare interface getBankByAccountIdProps {
  accountId: string;
}


export type PaginationProps = {
  page: number;
  totalPages: number;
};