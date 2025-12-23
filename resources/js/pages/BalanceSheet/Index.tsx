import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { Download, FileText } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Dashboard', href: dashboard().url },
    { title: 'Accounts', href: '#' },
    { title: 'Balance Sheet', href: '/balance-sheet' },
];

interface BalanceSheetItem {
    name: string;
    group_name: string;
    balance: number;
    type: 'Asset' | 'Liability';
}

interface BalanceSheetProps {
    liabilities: BalanceSheetItem[];
    assets: BalanceSheetItem[];
    totalLiabilities: number;
    totalAssets: number;
}

export default function BalanceSheet({
    liabilities = [],
    assets = [],
    totalLiabilities = 0,
    totalAssets = 0,
}: BalanceSheetProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'decimal',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(amount);
    };

    const groupedLiabilities = liabilities.reduce((acc, item) => {
        if (!acc[item.group_name]) {
            acc[item.group_name] = [];
        }
        acc[item.group_name].push(item);
        return acc;
    }, {} as Record<string, BalanceSheetItem[]>);

    const groupedAssets = assets.reduce((acc, item) => {
        if (!acc[item.group_name]) {
            acc[item.group_name] = [];
        }
        acc[item.group_name].push(item);
        return acc;
    }, {} as Record<string, BalanceSheetItem[]>);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Balance Sheet" />
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                            Balance Sheet
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            View company's financial position with assets and liabilities
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Link
                            href="/balance-sheet/download-pdf"
                            className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                        >
                            <Download className="h-4 w-4" />
                            Download PDF
                        </Link>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
                    {/* Liabilities Section */}
                    <Card className="border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <CardHeader className="border-b border-gray-200 bg-red-50 dark:border-gray-700 dark:bg-red-900/20">
                            <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-300">
                                <FileText className="h-5 w-5" />
                                Liabilities
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {Object.entries(groupedLiabilities).map(([groupName, items]) => (
                                    <div key={groupName}>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {groupName}
                                        </h3>
                                        <div className="space-y-2">
                                            {items.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                                                >
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                                        ৳{formatCurrency(item.balance)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t border-gray-200 pt-4 dark:border-gray-600">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            Total Liabilities
                                        </span>
                                        <span className="text-lg font-bold text-red-600 dark:text-red-400">
                                            ৳{formatCurrency(totalLiabilities)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assets Section */}
                    <Card className="border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                        <CardHeader className="border-b border-gray-200 bg-green-50 dark:border-gray-700 dark:bg-green-900/20">
                            <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-300">
                                <FileText className="h-5 w-5" />
                                Assets
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="space-y-6">
                                {Object.entries(groupedAssets).map(([groupName, items]) => (
                                    <div key={groupName}>
                                        <h3 className="mb-3 text-sm font-semibold text-gray-700 dark:text-gray-300">
                                            {groupName}
                                        </h3>
                                        <div className="space-y-2">
                                            {items.map((item, index) => (
                                                <div
                                                    key={index}
                                                    className="flex justify-between items-center py-2 px-3 rounded-lg bg-gray-50 dark:bg-gray-700"
                                                >
                                                    <span className="text-sm text-gray-700 dark:text-gray-300">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-sm font-medium text-green-600 dark:text-green-400">
                                                        ৳{formatCurrency(item.balance)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                <div className="border-t border-gray-200 pt-4 dark:border-gray-600">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">
                                            Total Assets
                                        </span>
                                        <span className="text-lg font-bold text-green-600 dark:text-green-400">
                                            ৳{formatCurrency(totalAssets)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Summary Section */}
                <Card className="mt-8 border border-gray-200 shadow-sm dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader className="border-b border-gray-200 bg-blue-50 dark:border-gray-700 dark:bg-blue-900/20">
                        <CardTitle className="text-blue-700 dark:text-blue-300">
                            Balance Sheet Summary
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                                    ৳{formatCurrency(totalLiabilities)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Total Liabilities
                                </div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                    ৳{formatCurrency(totalAssets)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Total Assets
                                </div>
                            </div>
                            <div className="text-center">
                                <div className={`text-2xl font-bold ${
                                    totalAssets - totalLiabilities >= 0 
                                        ? 'text-green-600 dark:text-green-400' 
                                        : 'text-red-600 dark:text-red-400'
                                }`}>
                                    ৳{formatCurrency(totalAssets - totalLiabilities)}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-400">
                                    Net Worth
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}