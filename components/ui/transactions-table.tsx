import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/investments-table"
import { transactionCategoryStyles } from "@/constants"
import { cn, formatAmount, formatDateTime, getTransactionStatus, removeSpecialCharacters } from "@/lib/utils"

const CategoryBadge = ({ category }: CategoryBadgeProps) => {
  const {
    borderColor,
    backgroundColor,
    textColor,
    chipBackgroundColor,
  } = transactionCategoryStyles[category as keyof typeof transactionCategoryStyles] || transactionCategoryStyles.default

  return (
    <div className={cn('category-badge flex items-center max-w-[140px] whitespace-nowrap overflow-hidden', borderColor, chipBackgroundColor)}>
      <div className={cn('size-2 rounded-full flex-shrink-0 min-w-[8px] min-h-[8px]', backgroundColor)} />
      <p className={cn('text-[12px] font-medium ml-1 truncate', textColor)}>{category}</p>
    </div>
  )
}

const TransactionsTable = ({ transactions }: TransactionTableProps) => {
  return (
    <Table>
      <TableHeader className="bg-[#f9fafb]">
        <TableRow>
          <TableHead className="px-2">Transaction</TableHead>
          <TableHead className="px-2 text-right">Amount</TableHead>
          <TableHead className="px-2">Status</TableHead>
          <TableHead className="px-2">Date</TableHead>
          <TableHead className="px-1 max-md:hidden w-[120px]">Channel</TableHead>
          <TableHead className="px-1 max-md:hidden w-[140px]">Category</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((t: Transaction) => {
          const status = getTransactionStatus(new Date(t.date))
          const amount = formatAmount(t.amount)

          const isDebit = t.type === 'debit';
          const isCredit = t.type === 'credit';

          // Strip any leading sign from the formatted amount so we don't end up
          // with '+-£...' when the number was already negative.
          const unsignedAmount = amount.startsWith("-") ? amount.slice(1) : amount;
          const sign = isDebit ? "-" : isCredit ? "+" : "";
          const displayAmount = `${sign}${unsignedAmount}`;

          return (
            <TableRow
              key={t.id}
              className={cn(
                isDebit ? 'bg-rose-50' : isCredit ? 'bg-emerald-50' : 'bg-white',
                'hover:bg-gray-50',
                'transition-colors duration-150'
                )}
            >
              <TableCell className="max-w-[110px] md:max-w-[230px] pl-2 pr-4">
                <div className="flex items-center gap-3">
                  <h1 className="text-14 truncate font-semibold text-[#344054]">
                    {removeSpecialCharacters(t.name)}
                  </h1>
                </div>
              </TableCell>

              <TableCell
                className={cn(
                  "pl-2 pr-4 font-medium text-right w-[90px] md:w-auto",
                  isDebit ? "text-rose-600" : isCredit ? "text-emerald-600" : "text-gray-600"
                )}
              >
                {displayAmount}
              </TableCell>

              <TableCell className="pl-2 pr-4 w-[110px]">
                <CategoryBadge category={status} />
              </TableCell>

              <TableCell className="min-w-[80px] pl-2 pr-4">
                {formatDateTime(new Date(t.date)).dateTime}
              </TableCell>

              <TableCell className="pl-2 pr-1 capitalize min-w-[60px] max-md:hidden">
               {t.paymentChannel}
              </TableCell>

              <TableCell className="pl-1 pr-2 max-md:hidden truncate">
               <CategoryBadge category={t.category} /> 
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}

export default TransactionsTable