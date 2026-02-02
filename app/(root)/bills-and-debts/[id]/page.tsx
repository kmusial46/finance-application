import HeaderBox from '@/components/ui/header-box';
import { getLoggedInUser } from '@/lib/actions/user.actions';
import { getBill, getDebt } from '@/lib/actions/bills-debts.actions';
import { formatAmount } from '@/lib/utils';
import { Progress } from "@/components/ui/progress";
import Link from 'next/link';
import { EditBillDialog } from '@/components/bills/edit-bill-dialog';
import { EditDebtDialog } from '@/components/debts/edit-debt-dialog';

const BillDebtDetails = async ({ params, searchParams }: SearchParamProps) => {
  const { id } = await params;
  const { type } = (await searchParams) ?? {};
  const loggedIn = await getLoggedInUser();

  if (!loggedIn) return null;

  let item: Bill | Debt | undefined;
  let isBill = type === 'bill';

  if (isBill) {
    item = await getBill({ id });
  } else {
    item = await getDebt({ id });
  }

  if (!item) {
    return (
        <section className="home">
            <div className="home-content">
                <p>Item not found</p>
                <Link href="/bills-and-debts" className="text-blue-600 hover:underline">Back to list</Link>
            </div>
        </section>
    )
  }

  return (
    <section className="home">
      <div className="home-content">
        <header className="home-header">
          <HeaderBox
            type="title"
            title={item.name}
            subtext={`${isBill ? 'Bill' : 'Debt'} Details`}
            user={loggedIn.firstName}
          />
        </header>

        <div className="space-y-8 bg-white p-8 rounded-xl border">
            <div className="flex justify-between items-center border-b pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">{item.name}</h2>
                    <p className="text-gray-500 capitalize">{isBill ? (item as Bill).category : (item as Debt).type.replace('_', ' ')}</p>
                </div>
                <div className="text-right">
                    <p className="text-3xl font-bold text-blue-600">
                        {formatAmount(isBill ? (item as Bill).amount : Math.max(0, (item as Debt).initialAmount - (item as Debt).totalAmountPaid))}
                    </p>
                    <p className="text-sm text-gray-500">
                        {isBill ? 'Amount Due' : 'Remaining Balance'}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Payment Information</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-500">Due Date</p>
                            <p className="font-medium">
                                {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                        {isBill && (
                            <div>
                                <p className="text-sm text-gray-500">Frequency</p>
                                <p className="font-medium capitalize">{(item as Bill).frequency}</p>
                            </div>
                        )}
                        {!isBill && (
                            <>
                                <div>
                                    <p className="text-sm text-gray-500">Interest Rate</p>
                                    <p className="font-medium">{(item as Debt).interestRate}%</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Min Payment</p>
                                    <p className="font-medium">{formatAmount((item as Debt).minimumPayment || 0)}</p>
                                </div>
                            </>
                        )}
                    </div>

                    {!isBill && (item as Debt).initialAmount && (
                        <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                                <span>Payoff Progress</span>
                                <span>
                                    {Math.round(((item as Debt).totalAmountPaid / (item as Debt).initialAmount!) * 100)}%
                                </span>
                            </div>
                            <Progress value={((item as Debt).totalAmountPaid / (item as Debt).initialAmount!) * 100} />
                        </div>
                    )}
                </div>

                <div className="space-y-6">
                    <h3 className="text-lg font-semibold">Linked Account</h3>
                    {item.linkedAccountId ? (
                        <div className="p-4 border rounded-lg bg-gray-50">
                            <p className="font-medium">Linked to Plaid Account</p>
                            <p className="text-sm text-gray-500">ID: {item.linkedAccountId}</p>
                        </div>
                    ) : (
                        <div className="p-4 border rounded-lg bg-gray-50 border-dashed">
                            <p className="text-gray-500 text-center">No account linked</p>
                        </div>
                    )}

                    <div className="pt-4">
                        <h3 className="text-lg font-semibold mb-4">History</h3>
                        <p className="text-gray-500 text-sm">No payment history available yet.</p>
                    </div>
                </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-6 border-t">
                <Link href="/bills-and-debts" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-md">
                    Back
                </Link>
                {isBill ? (
                    <EditBillDialog bill={item as Bill} />
                ) : (
                    <EditDebtDialog debt={item as Debt} />
                )}
            </div>
        </div>
      </div>
    </section>
  );
};

export default BillDebtDetails;
