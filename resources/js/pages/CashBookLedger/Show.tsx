import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import { ArrowLeft, FileText } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';

interface Transaction {
    id: number;
    transaction_id: string;
    transaction_date: string;
    transaction_time: string;
    transaction_type: 'Dr' | 'Cr';
    amount: number;
    description: string;
    payment_type: string;
    account_name: string;
}

interface ShiftClosed {
    id: number;
    close_date: string;
    shift: {
        name: string;
    };
}

interface Props {
    shiftClosed: ShiftClosed;
    cashTransactions: Transaction[];
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Cash Book Ledger', href: '/cash-book-ledger' },
    { title: 'Details', href: '#' },
];

export default function Show({ shiftClosed, cashTransactions }: Props) {
    const { can } = usePermission();
    const canDownload = can('can-account-download');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Cash Book Details" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                            Cash Book Details
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            {shiftClosed.shift.name} - {new Date(shiftClosed.close_date).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {canDownload && (
                            <Button
                                variant="success"
                                onClick={() => window.location.href = `/cash-book-ledger/${shiftClosed.id}/download-pdf`}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            onClick={() => router.get('/cash-book-ledger')}
                        >
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                    </div>
                </div>

                <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="dark:text-white">
                            Cash Transactions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Time
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Transaction ID
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Account
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Description
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Payment Type
                                        </th>
                                        <th className="p-4 text-right text-[13px] font-medium dark:text-gray-300">
                                            Debit
                                        </th>
                                        <th className="p-4 text-right text-[13px] font-medium dark:text-gray-300">
                                            Credit
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cashTransactions.length > 0 ? (
                                        cashTransactions.map((transaction) => (
                                            <tr
                                                key={transaction.id}
                                                className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                            >
                                                <td className="p-4 text-[13px] dark:text-white">
                                                    {transaction.transaction_time}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {transaction.transaction_id}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {transaction.account_name}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {transaction.description}
                                                </td>
                                                <td className="p-4 text-[13px] capitalize dark:text-gray-300">
                                                    {transaction.payment_type}
                                                </td>
                                                <td className="p-4 text-right text-[13px] dark:text-white">
                                                    {transaction.transaction_type === 'Dr'
                                                        ? Number(transaction.amount).toFixed(2)
                                                        : '-'}
                                                </td>
                                                <td className="p-4 text-right text-[13px] dark:text-white">
                                                    {transaction.transaction_type === 'Cr'
                                                        ? Number(transaction.amount).toFixed(2)
                                                        : '-'}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="p-8 text-center text-gray-500 dark:text-gray-400"
                                            >
                                                No cash transactions found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
