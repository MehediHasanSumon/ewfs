import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { HandCoins } from 'lucide-react';

interface Loan {
    id: number;
    lender_name: string;
    amount: number;
    interest_rate: number;
    loan_date: string;
    due_date: string;
    status: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Loans Payable',
        href: '/loans',
    },
];

interface LoansProps {
    loans?: Loan[];
}

export default function Loans({ loans = [] }: LoansProps) {
    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Loans Payable" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                            Loans Payable
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            View loans and borrowings
                        </p>
                    </div>
                </div>

                <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Lender Name
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Amount
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Interest Rate
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Loan Date
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Due Date
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loans.length > 0 ? (
                                        loans.map((loan) => (
                                            <tr
                                                key={loan.id}
                                                className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                            >
                                                <td className="p-4 text-[13px] dark:text-white">
                                                    {loan.lender_name}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    ৳{loan.amount.toLocaleString()}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {loan.interest_rate}%
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {loan.loan_date}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {loan.due_date}
                                                </td>
                                                <td className="p-4">
                                                    <span className={`px-2 py-1 rounded text-xs ${
                                                        loan.status === 'active' 
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}>
                                                        {loan.status}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={6}
                                                className="p-8 text-center text-gray-500 dark:text-gray-400"
                                            >
                                                <HandCoins className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                                No loans found
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