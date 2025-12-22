import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { FileText, Filter, X } from 'lucide-react';
import { useState } from 'react';

interface Account {
    id: number;
    name: string;
    ac_number: string;
    group: {
        name: string;
    };
}

interface Transaction {
    id: number;
    transaction_id: string;
    transaction_date: string;
    transaction_type: 'Dr' | 'Cr';
    amount: number;
    description: string;
    payment_type: string;
    balance: number;
}

interface Ledger {
    account: Account;
    transactions: Transaction[];
    total_debit: number;
    total_credit: number;
    closing_balance: number;
}

interface Props {
    ledgers: Ledger[];
    filters: {
        start_date?: string;
        end_date?: string;
    };
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Cash Book Ledger', href: '/cash-book-ledger' },
];

export default function CashBookLedger({ ledgers, filters }: Props) {
    const [startDate, setStartDate] = useState(
        filters?.start_date || new Date().toISOString().split('T')[0],
    );
    const [endDate, setEndDate] = useState(
        filters?.end_date || new Date().toISOString().split('T')[0],
    );

    const applyFilters = () => {
        const params = new URLSearchParams();
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        router.get(`/cash-book-ledger?${params.toString()}`);
    };

    const clearFilters = () => {
        const today = new Date().toISOString().split('T')[0];
        setStartDate(today);
        setEndDate(today);
        router.get('/cash-book-ledger');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cash Book Ledger" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                            Cash Book Ledger
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            View cash account transactions and balances
                        </p>
                    </div>
                    {ledgers.length > 0 && (
                        <Button
                            variant="success"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (startDate)
                                    params.append('start_date', startDate);
                                if (endDate) params.append('end_date', endDate);
                                window.location.href = `/cash-book-ledger/download-pdf?${params.toString()}`;
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                    )}
                </div>

                {/* Filter Card */}
                <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 dark:text-white">
                            <Filter className="h-5 w-5" />
                            Filters
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                            <div>
                                <Label className="dark:text-gray-200">
                                    Start Date
                                </Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) =>
                                        setStartDate(e.target.value)
                                    }
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">
                                    End Date
                                </Label>
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div className="flex items-end gap-2 md:col-span-2">
                                <Button onClick={applyFilters} className="px-4">
                                    Apply Filters
                                </Button>
                                <Button
                                    onClick={clearFilters}
                                    variant="secondary"
                                    className="px-4"
                                >
                                    <X className="mr-2 h-4 w-4" />
                                    Clear
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {ledgers.length > 0 ? (
                    <div className="space-y-6">
                        {ledgers.map((ledger, index) => (
                            <Card
                                key={index}
                                className="dark:border-gray-700 dark:bg-gray-800"
                            >
                                <CardHeader>
                                    <CardTitle className="mb-2 text-[16px] font-bold dark:text-white">
                                        Account Information
                                    </CardTitle>
                                    <div className="space-y-1 text-[13px]">
                                        <div>
                                            <span className="font-semibold dark:text-gray-300">
                                                Account Name:
                                            </span>{' '}
                                            <span className="dark:text-white">
                                                {ledger.account.name}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-semibold dark:text-gray-300">
                                                Account Number:
                                            </span>{' '}
                                            <span className="dark:text-white">
                                                {ledger.account.ac_number}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-semibold dark:text-gray-300">
                                                Group:
                                            </span>{' '}
                                            <span className="dark:text-white">
                                                {ledger.account.group?.name ||
                                                    'N/A'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="font-semibold dark:text-gray-300">
                                                Closing Balance:
                                            </span>
                                            <span
                                                className={`font-bold ${ledger.closing_balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                            >
                                                {Math.abs(
                                                    ledger.closing_balance,
                                                ).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="border-b dark:border-gray-700">
                                                    <th className="p-2 text-left text-[13px] font-medium dark:text-gray-300">
                                                        Date
                                                    </th>
                                                    <th className="p-2 text-left text-[13px] font-medium dark:text-gray-300">
                                                        Transaction ID
                                                    </th>
                                                    <th className="p-2 text-left text-[13px] font-medium dark:text-gray-300">
                                                        Description
                                                    </th>
                                                    <th className="p-2 text-left text-[13px] font-medium dark:text-gray-300">
                                                        Payment Type
                                                    </th>
                                                    <th className="p-2 text-right text-[13px] font-medium dark:text-gray-300">
                                                        Debit
                                                    </th>
                                                    <th className="p-2 text-right text-[13px] font-medium dark:text-gray-300">
                                                        Credit
                                                    </th>
                                                    <th className="p-2 text-right text-[13px] font-medium dark:text-gray-300">
                                                        Balance
                                                    </th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ledger.transactions.map(
                                                    (transaction) => (
                                                        <tr
                                                            key={transaction.id}
                                                            className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                                        >
                                                            <td className="p-2 text-[13px] dark:text-white">
                                                                {
                                                                    transaction.transaction_date
                                                                }
                                                            </td>
                                                            <td className="p-2 text-[13px] dark:text-gray-300">
                                                                {
                                                                    transaction.transaction_id
                                                                }
                                                            </td>
                                                            <td className="p-2 text-[13px] dark:text-gray-300">
                                                                {
                                                                    transaction.description
                                                                }
                                                            </td>
                                                            <td className="p-2 text-[13px] capitalize dark:text-gray-300">
                                                                {
                                                                    transaction.payment_type
                                                                }
                                                            </td>
                                                            <td className="p-2 text-right text-[13px] dark:text-gray-300">
                                                                {transaction.transaction_type ===
                                                                'Dr'
                                                                    ? transaction.amount.toLocaleString()
                                                                    : '-'}
                                                            </td>
                                                            <td className="p-2 text-right text-[13px] dark:text-gray-300">
                                                                {transaction.transaction_type ===
                                                                'Cr'
                                                                    ? transaction.amount.toLocaleString()
                                                                    : '-'}
                                                            </td>
                                                            <td
                                                                className={`p-2 text-right text-[13px] font-medium ${transaction.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}
                                                            >
                                                                {Math.abs(
                                                                    transaction.balance,
                                                                ).toLocaleString()}
                                                            </td>
                                                        </tr>
                                                    ),
                                                )}
                                                <tr className="border-b bg-gray-50 font-bold dark:border-gray-700 dark:bg-gray-700">
                                                    <td
                                                        colSpan={4}
                                                        className="p-2 text-[13px] dark:text-white"
                                                    >
                                                        Total:
                                                    </td>
                                                    <td className="p-2 text-right text-[13px] dark:text-white">
                                                        {ledger.total_debit.toFixed(
                                                            2,
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-right text-[13px] dark:text-white">
                                                        {ledger.total_credit.toFixed(
                                                            2,
                                                        )}
                                                    </td>
                                                    <td className="p-2 text-right text-[13px] dark:text-white">
                                                        -
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="dark:border-gray-700 dark:bg-gray-800">
                        <CardContent>
                            <p className="p-4 text-center text-[13px] text-gray-500 dark:text-gray-400">
                                No cash transactions found for the selected
                                period
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}
