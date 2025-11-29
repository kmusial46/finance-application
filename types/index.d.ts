/* eslint-disable no-unused-vars */

declare type SearchParamProps = {
  params: { [key: string]: string };
  searchParams: { [key: string]: string | string[] | undefined };
};

// ========================================

declare type SignUpParams = {
  firstName: string;
  lastName: string;
  address1: string;
  city: string;
  county: string;
  postcode: string;
  dateOfBirth: string;
  nationalInsuranceNumber: string;
  email: string;
  password: string;
};

declare type LoginUser = {
  email: string;
  password: string;
};

declare type User = {
  $id: string;
  email: string;
  userId: string;
  firstName: string;
  lastName: string;
  name: string;
  address1: string;
  city: string;
  county: string;
  postcode: string;
  dateOfBirth: string;
  nationalInsuranceNumber: string;
};

declare type NewUserParams = {
  userId: string;
  email: string;
  name: string;
  password: string;
};

declare type Account = {
  id: string;
  availableBalance: number;
  currentBalance: number;
  officialName: string;
  mask: string;
  institutionId: string;
  name: string;
  type: string;
  subtype: string;
  appwriteItemId: string;
  sharableId: string;
};

declare type Investment = {
  $id: string;
  ownerAccountId?: string;
  symbol: string;
  name: string;
  pricePerShare: number;
  shareCount: number;
  notes?: string;
  $createdAt: string;
  $updatedAt: string;
};

declare type Transaction = {
  id: string;
  $id: string;
  name: string;
  paymentChannel: string;
  type: string;
  accountId: string;
  amount: number;
  pending: boolean;
  category: string;
  date: string;
  image: string;
  type: string;
  $createdAt: string;
  channel: string;
  senderBankId: string;
  receiverBankId: string;
};

declare type Bank = {
  $id: string;
  accountId: string;
  accessToken: string;
  fundingSourceUrl: string;
  userId: string;
};

declare type AccountTypes =
  | "depository"
  | "credit"
  | "loan "
  | "investment"
  | "other";

declare type Category = "Food and Drink" | "Travel" | "Transfer";

declare type CategoryCount = {
  name: string;
  count: number;
  totalCount: number;
};

declare type Receiver = {
  firstName: string;
  lastName: string;
};

declare type TransferParams = {
  sourceFundingSourceUrl: string;
  destinationFundingSourceUrl: string;
  amount: string;
};

declare interface CreditCardProps {
  account: Account;
  username: string;
  showBalance?: boolean;
}

declare interface BankInfoProps {
  account: Account;
  appwriteItemId?: string;
  type: "full" | "card";
}

declare interface HeaderBoxProps {
  type?: "title" | "greeting";
  title: string;
  subtext: string;
  user?: string;
}

declare interface MobileNavProps {
  user: User;
}

declare interface PageHeaderProps {
  topTitle: string;
  bottomTitle: string;
  topDescription: string;
  bottomDescription: string;
  connectBank?: boolean;
}

declare interface PaginationProps {
  page: number;
  totalPages: number;
}

declare interface PlaidLinkProps {
  user: User;
  variant?: "primary" | "ghost";
}

declare interface AuthFormProps {
  type: "sign-in" | "sign-up";
}

declare interface BankDropdownProps {
  accounts: Account[];
  setValue?: UseFormSetValue<any>;
  otherStyles?: string;
}

declare interface BankTabItemProps {
  account: Account;
  appwriteItemId?: string;
}

declare interface TotlaBalanceBoxProps {
  accounts: Account[];
  totalBanks: number;
  totalCurrentBalance: number;
}

declare interface FooterProps {
  user: User;
  type?: 'mobile' | 'desktop'
}

declare interface RightSidebarProps {
  user: User;
  transactions: Transaction[];
  banks: Bank[] & Account[];
}

declare interface SidebarProps {
  user: User;
}

declare interface RecentTransactionsProps {
  accounts: Account[];
  transactions: Transaction[];
  appwriteItemId: string;
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

declare interface CategoryBadgeProps {
  category: string;
}

declare type GoalType = "manual" | "linked";
declare type GoalStatus = "active" | "completed" | "archived";

declare type Goal = {
  $id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate?: string;
  type: GoalType;
  linkedAccountId?: string;
  linkedBankId?: string;
  status: GoalStatus;
  $createdAt: string;
  $updatedAt: string;
};

declare type GoalTransaction = {
  $id: string;
  goalId: string;
  userId: string;
  amount: number;
  date: string;
  notes?: string;
  $createdAt: string;
};

declare type CreateGoalParams = {
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: string;
  type: GoalType;
  linkedAccountId?: string;
  linkedBankId?: string;
  status?: GoalStatus;
};

declare type CreateGoalTransactionParams = {
  goalId: string;
  userId: string;
  amount: number;
  date: string;
  notes?: string;
};

declare type UpdateGoalParams = {
  goalId: string;
  name?: string;
  targetAmount?: number;
  currentAmount?: number;
  targetDate?: string;
  status?: GoalStatus;
  linkedAccountId?: string;
  linkedBankId?: string;
};

// Actions
declare interface getAccountsProps {
  userId: string;
}

declare interface getAccountProps {
  appwriteItemId: string;
}

declare interface getInstitutionProps {
  institutionId: string;
}

declare interface getTransactionsProps {
  accessToken: string;
}

declare interface CreateTransactionProps {
  name: string;
  amount: string;
  senderId: string;
  senderBankId: string;
  receiverId: string;
  receiverBankId: string;
  email: string;
}

declare interface getTransactionsByBankIdProps {
  bankId: string;
}

declare interface signInProps {
  email: string;
  password: string;
}

declare interface getUserInfoProps {
  userId: string;
}

declare interface exchangePublicTokenProps {
  publicToken: string;
  user: User;
}

declare interface createBankAccountProps {
  accessToken: string;
  userId: string;
  accountId: string;
  bankId: string;
  fundingSourceUrl: string;
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

declare interface CreateInvestmentProps {
  userId: string;
  input: string;
  shareCount: number;
  notes?: string | null;
}

declare interface GetInvestmentsProps {
  userId: string;
}

declare interface DeleteInvestmentProps {
  investmentId: string;
  userId: string;
}

declare interface RawNewsArticle {
        id: number;
        headline?: string;
        summary?: string;
        source?: string;
        url?: string;
        datetime?: number;
        image?: string;
        category?: string;
        related?: string;
    };

declare interface MarketNewsArticle {
        id: number;
        headline: string;
        summary: string;
        source: string;
        url: string;
        datetime: number;
        category: string;
        related: string;
        image?: string;
    };

declare interface Stock {
  symbol: string;
  name: string;
  exchange: string;
  type: string;
};

declare interface StockWithWatchlistStatus extends Stock {
        isInWatchlist: boolean;
    };

declare interface FinnhubSearchResult {
        symbol: string;
        description: string;
        displaySymbol?: string;
        type: string;
    };

declare interface FinnhubSearchResponse {
        count: number;
        result: FinnhubSearchResult[];
    };

declare interface SearchCommandProps {
    renderAs?: 'button' | 'text' | 'bar';
    label?: string;
    initialStocks: StockWithWatchlistStatus[];
  };

declare interface StockDetailsPageProps {
        params: Promise<{
            symbol: string;
        }>;
    };

declare type Bill = {
  $id: string;
  userId: string;
  name: string;
  amount: number;
  dueDate: string; // ISO Date string or day of month
  frequency: "weekly" | "bi-weekly" | "monthly" | "yearly";
  category: string;
  isAutoDetected: boolean;
  linkedAccountId?: string; // Link to Plaid Account
  status: "active" | "paused";
  nextPaymentDate: string;
  $createdAt: string;
  $updatedAt: string;
};

declare type Debt = {
  $id: string;
  userId: string;
  name: string;
  totalAmount: number; // Current remaining balance
  initialAmount?: number; // For progress calculation
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string;
  type: "credit_card" | "loan" | "bnpl" | "other";
  linkedAccountId?: string; // Link to Plaid Account
  lastPaymentDate?: string;
  payoffTargetDate?: string;
  $createdAt: string;
  $updatedAt: string;
};

declare type CreateBillParams = {
  userId: string;
  name: string;
  amount: number;
  dueDate: string;
  frequency: string;
  category?: string;
  linkedAccountId?: string;
  isAutoDetected?: boolean;
  status?: string;
  nextPaymentDate: string;
};

declare type CreateDebtParams = {
  userId: string;
  name: string;
  totalAmount: number;
  type: string;
  initialAmount?: number;
  interestRate?: number;
  minimumPayment?: number;
  dueDate?: string;
  linkedAccountId?: string;
  payoffTargetDate?: string;
};
