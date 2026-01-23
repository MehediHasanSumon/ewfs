import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head, router } from '@inertiajs/react';
import {
    FileText,
    Filter,
    BarChart3,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import React from 'react';

interface ProductSale {
    product_id: number;
    product_name: string;
    total_sale: number;
    price: number;
    amount: number; // total_sale * price
}

interface DispenserReading {
    id: number;
    sl: number;
    date: string;
    shift: string;
    product_sales: ProductSale[]; // Dynamic products
    received_due_paid: number;
    amount: number; // Sum of all product amounts + received_due_paid
    credit_sale: number;
    bank_sale: number;
    expenses: number;
    purchase: number;
    cash_in_hand: number; // amount - credit_sale - bank_sale
    total_balance: number; // amount - credit_sale - bank_sale - expenses - purchase
}

interface Product {
    id: number;
    product_name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Reports',
        href: '/reports',
    },
    {
        title: 'Monthly Dispenser Report',
        href: '/reports/monthly-dispenser-report',
    },
];

interface MonthlyDispenserReportProps {
    readings: {
        data: DispenserReading[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    products: Product[]; // Dynamic products list
    filters: {
        search?: string;
        product_id?: string;
        start_date?: string;
        end_date?: string;
        sort_by?: string;
        sort_order?: string;
        per_page?: number;
    };
}

export default function MonthlyDispenserReport({
    readings,
    products = [],
    filters
}: MonthlyDispenserReportProps) {


    const [search, setSearch] = useState(filters?.search || '');
    const [productId, setProductId] = useState(filters?.product_id || 'all');
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Calculate total columns: 3 base + (products * 3) + 9 fixed = 12 + (products * 3)
    const totalColumns = 12 + (products.length * 3);

    const applyFilters = () => {
        router.get(
            '/reports/monthly-dispenser-report',
            {
                search: search || undefined,
                product_id: productId === 'all' ? undefined : productId,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                per_page: perPage,
            },
            { preserveState: true },
        );
    };

    const clearFilters = () => {
        setSearch('');
        setProductId('all');
        setStartDate('');
        setEndDate('');
        router.get(
            '/reports/monthly-dispenser-report',
            {
                per_page: perPage,
            },
            { preserveState: true },
        );
    };



    const handlePageChange = (page: number) => {
        router.get(
            '/reports/monthly-dispenser-report',
            {
                search: search || undefined,
                product_id: productId === 'all' ? undefined : productId,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                per_page: perPage,
                page,
            },
            { preserveState: true },
        );
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters?.search || '')) {
                applyFilters();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Monthly Dispenser Report" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                            Monthly Dispenser Report
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            View and analyze dispenser readings and sales data
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="success"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (search) params.append('search', search);
                                if (productId !== 'all') params.append('product_id', productId);
                                if (startDate) params.append('start_date', startDate);
                                if (endDate) params.append('end_date', endDate);
                                window.location.href = `/reports/monthly-dispenser-report/download-pdf?${params.toString()}`;
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Download PDF
                        </Button>
                    </div>
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
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-6">
                            <div>
                                <Label className="dark:text-gray-200">
                                    Search
                                </Label>
                                <Input
                                    placeholder="Search..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">
                                    Product
                                </Label>
                                <Select
                                    value={productId}
                                    onValueChange={(value) => {
                                        setProductId(value);
                                        router.get(
                                            '/reports/monthly-dispenser-report',
                                            {
                                                search: search || undefined,
                                                product_id: value === 'all' ? undefined : value,
                                                start_date: startDate || undefined,
                                                end_date: endDate || undefined,
                                                per_page: perPage,
                                            },
                                            { preserveState: true },
                                        );
                                    }}
                                >
                                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                        <SelectValue placeholder="All products" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All products
                                        </SelectItem>
                                        {products.map((product) => (
                                            <SelectItem
                                                key={product.id}
                                                value={product.id.toString()}
                                            >
                                                {product.product_name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">
                                    Shift
                                </Label>
                                <Select
                                    value="all"
                                    onValueChange={() => { }}
                                >
                                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                        <SelectValue placeholder="All shifts" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All shifts
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">
                                    Start Date
                                </Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
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
                            <div className="flex items-end gap-2">
                                <Button
                                    onClick={applyFilters}
                                    className="px-4"
                                >
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

                <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse border border-gray-300">
                                <thead className="sticky top-0 bg-white dark:bg-gray-800">
                                    {/* First Header Row */}
                                    <tr className="bg-gray-100 dark:bg-gray-700">
                                        <th rowSpan={2} className="border border-gray-300 p-3 text-[12px] font-semibold dark:text-gray-200 min-w-[60px]">SL</th>
                                        <th rowSpan={2} className="border border-gray-300 p-3 text-[12px] font-semibold dark:text-gray-200 min-w-[100px]">Date</th>
                                        <th rowSpan={2} className="border border-gray-300 p-3 text-[12px] font-semibold dark:text-gray-200 min-w-[80px]">Shift</th>
                                        {/* Dynamic Product Headers */}
                                        {products.map((product) => (
                                            <th key={product.id} colSpan={3} className="border border-gray-300 p-3 text-[12px] font-semibold dark:text-gray-200">
                                                {product.product_name}
                                            </th>
                                        ))}
                                        <th rowSpan={2} className="border border-gray-300 p-3 text-[12px] font-semibold dark:text-gray-200 min-w-[120px]">Received (Due Paid)</th>
                                        <th rowSpan={2} className="border border-gray-300 p-3 text-[12px] font-semibold dark:text-gray-200 min-w-[100px]">Amount</th>
                                        <th rowSpan={2} className="border border-gray-300 p-3 text-[12px] font-semibold dark:text-gray-200 min-w-[100px]">Credit Sale</th>
                                        <th rowSpan={2} className="border border-gray-300 p-3 text-[12px] font-semibold dark:text-gray-200 min-w-[100px]">Bank Sale</th>
                                        <th rowSpan={2} className="border border-gray-300 p-3 text-[12px] font-semibold dark:text-gray-200 min-w-[100px]">Expenses</th>
                                        <th rowSpan={2} className="border border-gray-300 p-3 text-[12px] font-semibold dark:text-gray-200 min-w-[100px]">Purchase</th>
                                        <th rowSpan={2} className="border border-gray-300 p-3 text-[12px] font-semibold dark:text-gray-200 min-w-[120px]">Cash in Hand</th>
                                        <th rowSpan={2} className="border border-gray-300 p-3 text-[12px] font-semibold dark:text-gray-200 min-w-[120px]">Total Balance</th>
                                    </tr>
                                    {/* Second Header Row */}
                                    <tr className="bg-gray-50 dark:bg-gray-600">
                                        {/* Dynamic Product Sub-headers */}
                                        {products.map((product) => (
                                            <React.Fragment key={`sub-${product.id}`}>
                                                <th className="border border-gray-300 p-2 text-[11px] font-medium dark:text-gray-200 text-center min-w-[80px]">Total Sale</th>
                                                <th className="border border-gray-300 p-2 text-[11px] font-medium dark:text-gray-200 text-center min-w-[80px]">Price</th>
                                                <th className="border border-gray-300 p-2 text-[11px] font-medium dark:text-gray-200 text-center min-w-[80px]">Amount</th>
                                            </React.Fragment>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {/* Real Data Rows */}
                                    {readings.data.map((reading) => (
                                        <tr key={reading.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="border border-gray-300 p-2 text-[12px] text-center font-medium dark:text-white">{reading.sl}</td>
                                            <td className="border border-gray-300 p-2 text-[12px] dark:text-white">{reading.date}</td>
                                            <td className="border border-gray-300 p-2 text-[12px] text-center dark:text-white">{reading.shift}</td>
                                            {/* Dynamic Product Data */}
                                            {products.map((product) => {
                                                const productSale = reading.product_sales.find(ps => ps.product_id === product.id);
                                                const totalSale = productSale?.total_sale || 0;
                                                const price = productSale?.price || 0;
                                                const amount = productSale?.amount || 0;

                                                return (
                                                    <React.Fragment key={`data-${product.id}`}>
                                                        <td className="border border-gray-300 p-2 text-[12px] text-right dark:text-gray-300">{Number(totalSale).toFixed(2)}</td>
                                                        <td className="border border-gray-300 p-2 text-[12px] text-right dark:text-gray-300">{Number(price).toFixed(2)}</td>
                                                        <td className="border border-gray-300 p-2 text-[12px] text-right font-semibold dark:text-white">{Number(amount).toFixed(2)}</td>
                                                    </React.Fragment>
                                                );
                                            })}
                                            <td className="border border-gray-300 p-2 text-[12px] text-right dark:text-gray-300">{Number(reading.received_due_paid).toFixed(2)}</td>
                                            <td className="border border-gray-300 p-2 text-[12px] text-right font-semibold dark:text-white">{Number(reading.amount).toFixed(2)}</td>
                                            <td className="border border-gray-300 p-2 text-[12px] text-right dark:text-gray-300">{Number(reading.credit_sale).toFixed(2)}</td>
                                            <td className="border border-gray-300 p-2 text-[12px] text-right dark:text-gray-300">{Number(reading.bank_sale).toFixed(2)}</td>
                                            <td className="border border-gray-300 p-2 text-[12px] text-right dark:text-gray-300">{Number(reading.expenses).toFixed(2)}</td>
                                            <td className="border border-gray-300 p-2 text-[12px] text-right dark:text-gray-300">{Number(reading.purchase).toFixed(2)}</td>
                                            <td className="border border-gray-300 p-2 text-[12px] text-right font-semibold dark:text-white">{Number(reading.cash_in_hand).toFixed(2)}</td>
                                            <td className="border border-gray-300 p-2 text-[12px] text-right font-semibold dark:text-white">{Number(reading.total_balance).toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {readings.data.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan={totalColumns}
                                                className="border border-gray-300 p-8 text-center text-gray-500 dark:text-gray-400"
                                            >
                                                <BarChart3 className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                                No dispenser readings found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={readings.current_page}
                            lastPage={readings.last_page}
                            from={readings.from}
                            to={readings.to}
                            total={readings.total}
                            perPage={perPage}
                            onPageChange={handlePageChange}
                            onPerPageChange={(newPerPage) => {
                                setPerPage(newPerPage);
                                router.get(
                                    '/reports/monthly-dispenser-report',
                                    {
                                        search: search || undefined,
                                        product_id: productId === 'all' ? undefined : productId,
                                        start_date: startDate || undefined,
                                        end_date: endDate || undefined,
                                        per_page: newPerPage,
                                    },
                                    { preserveState: true },
                                );
                            }}
                        />
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}