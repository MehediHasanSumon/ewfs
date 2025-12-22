import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteModal } from '@/components/ui/delete-modal';
import { FormModal } from '@/components/ui/form-modal';
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
import { Head, router, useForm } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronUp,
    Edit,
    FileText,
    Filter,
    Plus,
    Receipt,
    Trash2,
    X,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface ReceivedVoucher {
    id: number;
    voucher_type: string;
    date: string;
    shift?: { id: number; name: string };
    from_account: { id: number; name: string };
    to_account: { id: number; name: string };
    transaction?: { amount: number; payment_type: string };
    voucher_category?: { id: number; name: string };
    payment_sub_type?: { id: number; name: string };
    description?: string;
    remarks: string;
    created_at: string;
}

interface VoucherCategory {
    id: number;
    name: string;
}

interface PaymentSubType {
    id: number;
    name: string;
    voucher_category_id: number;
}

interface Account {
    id: number;
    name: string;
    ac_number: string;
}

interface Shift {
    id: number;
    name: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Received Voucher',
        href: '/vouchers/received',
    },
];

interface ReceivedVoucherProps {
    vouchers?: {
        data: ReceivedVoucher[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    accounts?: Account[];
    groupedAccounts?: Record<string, Account[]>;
    shifts?: Shift[];
    closedShifts?: Array<{close_date: string; shift_id: number}>;
    voucherCategories?: VoucherCategory[];
    paymentSubTypes?: PaymentSubType[];
    filters?: {
        search?: string;
        shift?: string;
        payment_method?: string;
        start_date?: string;
        end_date?: string;
        sort_by?: string;
        sort_order?: string;
        per_page?: number;
    };
}

export default function ReceivedVoucher({
    vouchers = {
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: 0,
        from: 0,
        to: 0,
    },
    accounts = [],
    groupedAccounts = {},
    shifts = [], closedShifts = [],
    voucherCategories = [],
    paymentSubTypes = [],
    filters = {},
}: ReceivedVoucherProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingVoucher, setEditingVoucher] =
        useState<ReceivedVoucher | null>(null);
    const [deletingVoucher, setDeletingVoucher] =
        useState<ReceivedVoucher | null>(null);
    const [selectedVouchers, setSelectedVouchers] = useState<number[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [search, setSearch] = useState(filters?.search || '');

    const [paymentMethod, setPaymentMethod] = useState(
        filters?.payment_method || 'all',
    );
    const [startDate, setStartDate] = useState(filters?.start_date || '');
    const [endDate, setEndDate] = useState(filters?.end_date || '');
    const [sortBy, setSortBy] = useState(filters?.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState(filters?.sort_order || 'desc');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    const { data, setData, post, put, processing, errors, reset } = useForm({
        date: '',
        shift_id: '',
        voucher_category_id: '',
        payment_sub_type_id: '',
        from_account_id: '',
        to_account_id: '',
        amount: '',
        payment_method: 'Cash',
        bank_type: '',
        bank_name: '',
        cheque_no: '',
        cheque_date: '',
        account_no: '',
        branch_name: '',
        mobile_bank: '',
        mobile_number: '',
        description: '',
        remarks: '',
    });

    const getFilteredAccounts = () => {
        const groupName =
            data.payment_method === 'Cash'
                ? 'Cash in hand'
                : data.payment_method === 'Bank'
                  ? 'Bank Account'
                  : data.payment_method === 'Mobile Bank'
                    ? 'Mobile Bank'
                    : 'Other';
        return groupedAccounts[groupName] || [];
    };

    const getAvailableShifts = useCallback(() => {
        if (!data.date) return [];
        
        const selectedDate = data.date;
        const closedShiftIds = closedShifts
            .filter(cs => cs.close_date === selectedDate)
            .map(cs => cs.shift_id);
        
        return shifts.filter(shift => !closedShiftIds.includes(shift.id));
    }, [data.date, shifts, closedShifts]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingVoucher) {
            put(`/vouchers/received/${editingVoucher.id}`, {
                onSuccess: () => {
                    setEditingVoucher(null);
                    reset();
                },
            });
        } else {
            post('/vouchers/received', {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                },
            });
        }
    };

    const handleEdit = (voucher: ReceivedVoucher) => {
        setEditingVoucher(voucher);
        setData({
            date: voucher.date?.split('T')[0] || '',
            shift_id: voucher.shift?.id?.toString() || '',
            voucher_category_id: voucher.voucher_category?.id?.toString() || '',
            payment_sub_type_id: voucher.payment_sub_type?.id?.toString() || '',
            from_account_id: voucher.from_account?.id?.toString() || '',
            to_account_id: voucher.to_account?.id?.toString() || '',
            amount: voucher.transaction?.amount?.toString() || '',
            payment_method: voucher.transaction?.payment_type ? 
                voucher.transaction.payment_type.charAt(0).toUpperCase() + voucher.transaction.payment_type.slice(1) : 'Cash',
            description: voucher.description || '',
            bank_type: '',
            bank_name: '',
            cheque_no: '',
            cheque_date: '',
            account_no: '',
            branch_name: '',
            mobile_bank: '',
            mobile_number: '',
            remarks: voucher.remarks || '',
        });
    };

    const handleDelete = (voucher: ReceivedVoucher) => {
        setDeletingVoucher(voucher);
    };

    const confirmDelete = () => {
        if (deletingVoucher) {
            router.delete(`/vouchers/received/${deletingVoucher.id}`, {
                onSuccess: () => setDeletingVoucher(null),
            });
        }
    };

    const handleBulkDelete = () => {
        setIsBulkDeleting(true);
    };

    const confirmBulkDelete = () => {
        router.delete('/vouchers/received/bulk/delete', {
            data: { ids: selectedVouchers },
            onSuccess: () => {
                setSelectedVouchers([]);
                setIsBulkDeleting(false);
            },
        });
    };

    const applyFilters = () => {
        router.get(
            '/vouchers/received',
            {
                search: search || undefined,
                payment_method: paymentMethod === 'all' ? undefined : paymentMethod,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                sort_by: sortBy,
                sort_order: sortOrder,
                per_page: perPage,
            },
            { preserveState: true },
        );
    };

    const clearFilters = () => {
        setSearch('');

        setPaymentMethod('all');
        setStartDate('');
        setEndDate('');
        router.get(
            '/vouchers/received',
            {
                sort_by: sortBy,
                sort_order: sortOrder,
                per_page: perPage,
            },
            { preserveState: true },
        );
    };

    const handleSort = (column: string) => {
        const newOrder =
            sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(column);
        setSortOrder(newOrder);
        router.get(
            '/vouchers/received',
            {
                search: search || undefined,
                payment_method: paymentMethod === 'all' ? undefined : paymentMethod,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                sort_by: column,
                sort_order: newOrder,
                per_page: perPage,
            },
            { preserveState: true },
        );
    };

    const handlePageChange = (page: number) => {
        router.get(
            '/vouchers/received',
            {
                search: search || undefined,
                payment_method: paymentMethod === 'all' ? undefined : paymentMethod,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                sort_by: sortBy,
                sort_order: sortOrder,
                per_page: perPage,
                page,
            },
            { preserveState: true },
        );
    };

    const toggleSelectAll = () => {
        if (selectedVouchers.length === vouchers.data.length) {
            setSelectedVouchers([]);
        } else {
            setSelectedVouchers(vouchers.data.map((voucher) => voucher.id));
        }
    };

    const toggleSelectVoucher = (voucherId: number) => {
        if (selectedVouchers.includes(voucherId)) {
            setSelectedVouchers(
                selectedVouchers.filter((id) => id !== voucherId),
            );
        } else {
            setSelectedVouchers([...selectedVouchers, voucherId]);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters?.search || '')) {
                applyFilters();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search, filters?.search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Received Voucher" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                            Received Voucher
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage received vouchers and transactions
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedVouchers.length > 0 && (
                            <Button
                                variant="destructive"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected ({selectedVouchers.length})
                            </Button>
                        )}
                        <Button
                            variant="success"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (search) params.append('search', search);

                                if (paymentMethod !== 'all')
                                    params.append('payment_method', paymentMethod);
                                if (startDate)
                                    params.append('start_date', startDate);
                                if (endDate) params.append('end_date', endDate);
                                if (sortBy) params.append('sort_by', sortBy);
                                if (sortOrder)
                                    params.append('sort_order', sortOrder);
                                window.location.href = `/vouchers/received/download-pdf?${params.toString()}`;
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Received Voucher
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
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
                            <div>
                                <Label className="dark:text-gray-200">
                                    Search
                                </Label>
                                <Input
                                    placeholder="Search vouchers..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>

                            <div>
                                <Label className="dark:text-gray-200">
                                    Payment Method
                                </Label>
                                <Select
                                    value={paymentMethod}
                                    onValueChange={(value) => {
                                        setPaymentMethod(value);
                                        applyFilters();
                                    }}
                                >
                                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                        <SelectValue placeholder="All types" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">
                                            All types
                                        </SelectItem>
                                        <SelectItem value="Cash">
                                            Cash
                                        </SelectItem>
                                        <SelectItem value="Bank">
                                            Bank
                                        </SelectItem>
                                        <SelectItem value="Mobile Bank">
                                            Mobile Bank
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
                            <div className="flex items-end gap-2">
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

                <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b dark:border-gray-700">
                                        <th className="p-4 text-left font-medium dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={
                                                    selectedVouchers.length ===
                                                        vouchers.data.length &&
                                                    vouchers.data.length > 0
                                                }
                                                onChange={toggleSelectAll}
                                                className="rounded border-gray-300 dark:border-gray-600"
                                            />
                                        </th>
                                        <th
                                            className="cursor-pointer p-4 text-left text-[13px] font-medium dark:text-gray-300"
                                            onClick={() => handleSort('date')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Date
                                                {sortBy === 'date' &&
                                                    (sortOrder === 'asc' ? (
                                                        <ChevronUp className="h-4 w-4" />
                                                    ) : (
                                                        <ChevronDown className="h-4 w-4" />
                                                    ))}
                                            </div>
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Shift
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            From Account
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            To Account
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Amount
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Category
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Sub Type
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Payment Method
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vouchers.data.length > 0 ? (
                                        vouchers.data.map((voucher) => (
                                            <tr
                                                key={voucher.id}
                                                className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700"
                                            >
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedVouchers.includes(
                                                            voucher.id,
                                                        )}
                                                        onChange={() =>
                                                            toggleSelectVoucher(
                                                                voucher.id,
                                                            )
                                                        }
                                                        className="rounded border-gray-300 dark:border-gray-600"
                                                    />
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-white">
                                                    {new Date(
                                                        voucher.date,
                                                    ).toLocaleDateString()}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {voucher.shift?.name || 'N/A'}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {voucher.from_account.name}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {voucher.to_account.name}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {voucher.transaction?.amount ? Number(voucher.transaction.amount).toLocaleString() : 'N/A'}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {voucher.voucher_category?.name || 'N/A'}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {voucher.payment_sub_type?.name || 'N/A'}
                                                </td>
                                                <td className="p-4">
                                                    <span className="rounded bg-green-100 px-2 py-1 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                                                        {voucher.transaction?.payment_type || 'N/A'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleEdit(
                                                                    voucher,
                                                                )
                                                            }
                                                            className="text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() =>
                                                                handleDelete(
                                                                    voucher,
                                                                )
                                                            }
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={9}
                                                className="p-8 text-center text-gray-500 dark:text-gray-400"
                                            >
                                                <Receipt className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                                No received vouchers found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={vouchers.current_page}
                            lastPage={vouchers.last_page}
                            from={vouchers.from}
                            to={vouchers.to}
                            total={vouchers.total}
                            perPage={perPage}
                            onPageChange={handlePageChange}
                            onPerPageChange={(newPerPage) => {
                                setPerPage(newPerPage);
                                applyFilters();
                            }}
                        />
                    </CardContent>
                </Card>

                <FormModal
                    isOpen={isCreateOpen || !!editingVoucher}
                    onClose={() => {
                        setIsCreateOpen(false);
                        setEditingVoucher(null);
                        reset();
                    }}
                    title={
                        editingVoucher
                            ? 'Edit Received Voucher'
                            : 'Create Received Voucher'
                    }
                    onSubmit={handleSubmit}
                    processing={processing}
                    submitText={editingVoucher ? 'Update' : 'Create'}
                    className="max-w-2xl"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label
                                htmlFor="date"
                                className="dark:text-gray-200"
                            >
                                Date
                            </Label>
                            <Input
                                id="date"
                                type="date"
                                value={data.date}
                                onChange={(e) =>
                                    setData('date', e.target.value)
                                }
                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                            {errors.date && (
                                <span className="text-sm text-red-500">
                                    {errors.date}
                                </span>
                            )}
                        </div>
                        <div>
                            <Label
                                htmlFor="shift_id"
                                className="dark:text-gray-200"
                            >
                                Shift
                            </Label>
                            <Select
                                value={data.shift_id}
                                onValueChange={(value) =>
                                    setData('shift_id', value)
                                }
                                disabled={!data.date}
                            >
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    <SelectValue placeholder="Choose shift" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAvailableShifts().map((shift) => (
                                        <SelectItem
                                            key={shift.id}
                                            value={shift.id.toString()}
                                        >
                                            {shift.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.shift_id && (
                                <span className="text-sm text-red-500">
                                    {errors.shift_id}
                                </span>
                            )}
                        </div>
                    </div>
                    <div>
                        <Label className="dark:text-gray-200">Category</Label>
                        <div className="mt-2 flex flex-wrap gap-4">
                            {voucherCategories.map((category) => (
                                <label key={category.id} className="flex items-center space-x-2">
                                    <input
                                        type="radio"
                                        name="voucher_category_id"
                                        value={category.id.toString()}
                                        checked={data.voucher_category_id === category.id.toString()}
                                        onChange={(e) => {
                                            setData('voucher_category_id', e.target.value);
                                            setData('payment_sub_type_id', '');
                                        }}
                                        className="rounded border-gray-300 dark:border-gray-600"
                                    />
                                    <span className="text-sm dark:text-gray-300">{category.name}</span>
                                </label>
                            ))}
                        </div>
                        {errors.voucher_category_id && <span className="text-sm text-red-500">{errors.voucher_category_id}</span>}
                    </div>
                    <div>
                        <Label htmlFor="payment_sub_type_id" className="dark:text-gray-200">Payment Sub Type</Label>
                        <Select 
                            value={data.payment_sub_type_id} 
                            onValueChange={(value) => setData('payment_sub_type_id', value)}
                            disabled={!data.voucher_category_id}
                        >
                            <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                <SelectValue placeholder="Choose sub type" />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentSubTypes.filter(subType => 
                                    subType.voucher_category_id.toString() === data.voucher_category_id
                                ).map((subType) => (
                                    <SelectItem key={subType.id} value={subType.id.toString()}>
                                        {subType.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.payment_sub_type_id && <span className="text-sm text-red-500">{errors.payment_sub_type_id}</span>}
                    </div>

                    <div>
                        <Label
                            htmlFor="payment_method"
                            className="dark:text-gray-200"
                        >
                            Payment Method
                        </Label>
                        <Select
                            value={data.payment_method}
                            onValueChange={(value) => {
                                setData('payment_method', value);
                                setData('from_account_id', '');
                            setData('to_account_id', '');
                            }}
                        >
                            <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                <SelectValue placeholder="Choose payment method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Cash">Cash</SelectItem>
                                <SelectItem value="Bank">Bank</SelectItem>
                                <SelectItem value="Mobile Bank">
                                    Mobile Bank
                                </SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.payment_method && (
                            <span className="text-sm text-red-500">
                                {errors.payment_method}
                            </span>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label
                                htmlFor="from_account_id"
                                className="dark:text-gray-200"
                            >
                                From Account (Payer)
                            </Label>
                            <Select
                                value={data.from_account_id}
                                onValueChange={(value) =>
                                    setData('from_account_id', value)
                                }
                            >
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    <SelectValue placeholder="Choose payer account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {accounts.map((account) => (
                                        <SelectItem
                                            key={account.id}
                                            value={account.id.toString()}
                                        >
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.from_account_id && (
                                <span className="text-sm text-red-500">
                                    {errors.from_account_id}
                                </span>
                            )}
                        </div>
                        <div>
                            <Label
                                htmlFor="to_account_id"
                                className="dark:text-gray-200"
                            >
                                To Account (Receiver)
                            </Label>
                            <Select
                                value={data.to_account_id}
                                onValueChange={(value) =>
                                    setData('to_account_id', value)
                                }
                            >
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    <SelectValue placeholder="Choose receiver account" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getFilteredAccounts().map((account) => (
                                        <SelectItem
                                            key={account.id}
                                            value={account.id.toString()}
                                        >
                                            {account.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {errors.to_account_id && (
                                <span className="text-sm text-red-500">
                                    {errors.to_account_id}
                                </span>
                            )}
                        </div>
                    </div>

                    {data.payment_method === 'Bank' && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium dark:text-white">
                                Bank Payment Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label
                                        htmlFor="bank_type"
                                        className="dark:text-gray-200"
                                    >
                                        Bank Type
                                    </Label>
                                    <Select
                                        value={data.bank_type}
                                        onValueChange={(value) =>
                                            setData('bank_type', value)
                                        }
                                    >
                                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cheque">
                                                Cheque
                                            </SelectItem>
                                            <SelectItem value="Cash Deposit">
                                                Cash Deposit
                                            </SelectItem>
                                            <SelectItem value="Online">
                                                Online
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label
                                        htmlFor="bank_name"
                                        className="dark:text-gray-200"
                                    >
                                        Bank Name
                                    </Label>
                                    <Input
                                        id="bank_name"
                                        value={data.bank_name}
                                        onChange={(e) =>
                                            setData('bank_name', e.target.value)
                                        }
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                            {data.bank_type === 'Cheque' && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label
                                            htmlFor="cheque_no"
                                            className="dark:text-gray-200"
                                        >
                                            Cheque No
                                        </Label>
                                        <Input
                                            id="cheque_no"
                                            value={data.cheque_no}
                                            onChange={(e) =>
                                                setData(
                                                    'cheque_no',
                                                    e.target.value,
                                                )
                                            }
                                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                    <div>
                                        <Label
                                            htmlFor="cheque_date"
                                            className="dark:text-gray-200"
                                        >
                                            Cheque Date
                                        </Label>
                                        <Input
                                            id="cheque_date"
                                            type="date"
                                            value={data.cheque_date}
                                            onChange={(e) =>
                                                setData(
                                                    'cheque_date',
                                                    e.target.value,
                                                )
                                            }
                                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {data.payment_method === 'Mobile Bank' && (
                        <div className="space-y-4 border-t pt-4">
                            <h4 className="font-medium dark:text-white">
                                Mobile Bank Details
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label
                                        htmlFor="mobile_bank"
                                        className="dark:text-gray-200"
                                    >
                                        Mobile Bank
                                    </Label>
                                    <Select
                                        value={data.mobile_bank}
                                        onValueChange={(value) =>
                                            setData('mobile_bank', value)
                                        }
                                    >
                                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                            <SelectValue placeholder="Select mobile bank" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="bKash">
                                                bKash
                                            </SelectItem>
                                            <SelectItem value="Nagad">
                                                Nagad
                                            </SelectItem>
                                            <SelectItem value="Rocket">
                                                Rocket
                                            </SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label
                                        htmlFor="mobile_number"
                                        className="dark:text-gray-200"
                                    >
                                        Mobile Number
                                    </Label>
                                    <Input
                                        id="mobile_number"
                                        value={data.mobile_number}
                                        onChange={(e) =>
                                            setData(
                                                'mobile_number',
                                                e.target.value,
                                            )
                                        }
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    <div>
                        <Label htmlFor="amount" className="dark:text-gray-200">
                            Amount
                        </Label>
                        <Input
                            id="amount"
                            type="number"
                            step="0.01"
                            placeholder="Enter amount"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                        {errors.amount && (
                            <span className="text-sm text-red-500">
                                {errors.amount}
                            </span>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="description" className="dark:text-gray-200">Description</Label>
                        <Input
                            id="description"
                            placeholder="Enter description (optional)"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>

                    <div>
                        <Label htmlFor="remarks" className="dark:text-gray-200">
                            Remarks
                        </Label>
                        <Input
                            id="remarks"
                            placeholder="Enter remarks (optional)"
                            value={data.remarks}
                            onChange={(e) => setData('remarks', e.target.value)}
                            className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                        />
                    </div>
                </FormModal>

                <DeleteModal
                    isOpen={!!deletingVoucher}
                    onClose={() => setDeletingVoucher(null)}
                    onConfirm={confirmDelete}
                    title="Delete Received Voucher"
                    message={`Are you sure you want to delete this received voucher? This action cannot be undone.`}
                />

                <DeleteModal
                    isOpen={isBulkDeleting}
                    onClose={() => setIsBulkDeleting(false)}
                    onConfirm={confirmBulkDelete}
                    title="Delete Selected Vouchers"
                    message={`Are you sure you want to delete ${selectedVouchers.length} selected vouchers? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
}

