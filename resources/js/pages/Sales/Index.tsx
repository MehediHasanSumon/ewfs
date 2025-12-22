import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DeleteModal } from '@/components/ui/delete-modal';
import { FormModal } from '@/components/ui/form-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Pagination } from '@/components/ui/pagination';
import { Combobox } from '@/components/ui/combobox';
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
    ChevronDown,
    ChevronUp,
    Edit,
    FileText,
    Filter,
    Plus,
    Trash2,
    ShoppingCart,
    X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface Sale {
    id: number;
    sale_date: string;
    invoice_no: string;
    customer: string;
    vehicle_no: string;
    product_id: number;
    shift: { name: string };
    quantity: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    remarks: string;
    created_at: string;
    batch_code?: string;
    transaction?: {
        payment_type: string;
    };
}

interface Account {
    id: number;
    name: string;
    ac_number: string;
}

interface Product {
    id: number;
    product_name: string;
    product_code: string;
    unit: { name: string };
    sales_price: number;
    stock?: {
        current_stock: number;
        available_stock: number;
    };
}

interface Vehicle {
    id: number;
    vehicle_number: string;
    customer_id: number;
    products?: {
        id: number;
        product_name: string;
    }[];
    customer: {
        id: number;
        name: string;
    } | null;
}

interface Shift {
    id: number;
    name: string;
}

interface ClosedShift {
    close_date: string;
    shift_id: number;
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
    {
        title: 'Sales',
        href: '/sales',
    },
];

interface SalesHistory {
    vehicle_no: string;
    customer: string;
    product_id: number;
}

interface SalesProps {
    sales: {
        data: Sale[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
        from: number;
        to: number;
    };
    accounts: Account[];
    groupedAccounts: Record<string, Account[]>;
    products: Product[];
    vehicles: Vehicle[];
    salesHistory: SalesHistory[];
    shifts: Shift[];
    closedShifts: ClosedShift[];
    uniqueCustomers: string[];
    uniqueVehicles: string[];
    filters: {
        search?: string;
        customer?: string;
        payment_status?: string;
        start_date?: string;
        end_date?: string;
        sort_by?: string;
        sort_order?: string;
        per_page?: number;
    };
}

export default function Sales({ sales, accounts = [], groupedAccounts = {}, products = [], vehicles = [], salesHistory = [], shifts = [], closedShifts = [], uniqueCustomers = [], uniqueVehicles = [], filters = {} }: SalesProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
    const [selectedSales, setSelectedSales] = useState<number[]>([]);
    const [isBulkDeleting, setIsBulkDeleting] = useState(false);
    const [search, setSearch] = useState(filters.search || '');
    const [customer, setCustomer] = useState(filters.customer || 'all');
    const [paymentStatus, setPaymentStatus] = useState(filters.payment_status || 'all');
    const [startDate, setStartDate] = useState(filters.start_date || '');
    const [endDate, setEndDate] = useState(filters.end_date || '');
    const [sortBy, setSortBy] = useState(filters.sort_by || 'created_at');
    const [sortOrder, setSortOrder] = useState(filters.sort_order || 'desc');
    const [perPage, setPerPage] = useState(filters.per_page || 10);

    const [data, setDataState] = useState({
        sale_date: '',
        shift_id: '',
        products: [
            {
                product_id: '',
                customer: '',
                vehicle_no: '',
                memo_no: '',
                quantity: '',
                amount: '',
                discount_type: 'Fixed',
                discount: '',
                payment_type: 'Cash',
                to_account_id: '',
                paid_amount: '',
                due_amount: '',
                bank_type: '',
                bank_name: '',
                cheque_no: '',
                cheque_date: '',
                branch_name: '',
                account_no: '',
                mobile_bank: '',
                mobile_number: '',
                remarks: '',
            }
        ],
    });

    const setData = (key: string | any, value?: any) => {
        if (typeof key === 'string') {
            setDataState(prev => ({ ...prev, [key]: value }));
        } else {
            setDataState(key as any);
        }
    };

    const reset = () => {
        setDataState({
            sale_date: '',
            shift_id: '',
            products: [
                {
                    product_id: '',
                    customer: '',
                    vehicle_no: '',
                    memo_no: '',
                    quantity: '',
                    amount: '',
                    discount_type: 'Fixed',
                    discount: '',
                    payment_type: 'Cash',
                    to_account_id: '',
                    paid_amount: '',
                    due_amount: '',
                    bank_type: '',
                    bank_name: '',
                    cheque_no: '',
                    cheque_date: '',
                    branch_name: '',
                    account_no: '',
                    mobile_bank: '',
                    mobile_number: '',
                    remarks: '',
                }
            ],
        });
    };

    const [processing, setProcessing] = useState(false);
    const [availableShifts, setAvailableShifts] = useState<Shift[]>(shifts);
    const [cartErrors, setCartErrors] = useState<{[key: number]: boolean}>({});

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validProducts = data.products.filter(p => p.product_id && p.customer && p.vehicle_no && p.quantity && p.amount);
        if (validProducts.length === 0) {
            alert('Please add at least one product to cart');
            return;
        }
        
        const submitData = {
            sale_date: data.sale_date,
            shift_id: data.shift_id,
            products: validProducts
        };
        
        if (editingSale) {
            const updateData = {
                sale_date: data.sale_date,
                shift_id: data.shift_id,
                product_id: validProducts[0].product_id,
                customer: validProducts[0].customer,
                vehicle_no: validProducts[0].vehicle_no,
                memo_no: validProducts[0].memo_no,
                quantity: validProducts[0].quantity,
                amount: validProducts[0].amount,
                discount: validProducts[0].discount || 0,
                payment_type: validProducts[0].payment_type,
                to_account_id: validProducts[0].to_account_id,
                paid_amount: validProducts[0].paid_amount,
                bank_type: validProducts[0].bank_type,
                bank_name: validProducts[0].bank_name,
                cheque_no: validProducts[0].cheque_no,
                cheque_date: validProducts[0].cheque_date,
                branch_name: validProducts[0].branch_name,
                account_no: validProducts[0].account_no,
                mobile_bank: validProducts[0].mobile_bank,
                mobile_number: validProducts[0].mobile_number,
                remarks: validProducts[0].remarks,
                invoice_no: editingSale.invoice_no,
            };
            

            
            router.put(`/sales/${editingSale.id}`, updateData, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    setEditingSale(null);
                    reset();
                },
            });
        } else {
            setProcessing(true);
            router.post('/sales', submitData, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    reset();
                    setProcessing(false);
                },
                onError: () => {
                    setProcessing(false);
                },
            });
        }
    };

    const handleEdit = async (sale: Sale) => {
        setEditingSale(sale);
        try {
            const response = await fetch(`/sales/${sale.id}/edit`);
            const data = await response.json();
            const saleData = data.sale;
            
            let paymentType = 'Cash';
            const dbPaymentType = saleData.transaction?.payment_type?.toLowerCase();
            if (dbPaymentType === 'cash') paymentType = 'Cash';
            else if (dbPaymentType === 'bank') paymentType = 'Bank';
            else if (dbPaymentType === 'mobile bank' || dbPaymentType === 'mobile_bank') paymentType = 'Mobile Bank';
            
            setData({
                sale_date: saleData.sale_date.split('T')[0],
                shift_id: saleData.shift_id?.toString() || '',
                products: [
                    {
                        product_id: saleData.product_id?.toString() || '',
                        customer: saleData.customer || '',
                        vehicle_no: saleData.vehicle_no || '',
                        memo_no: saleData.memo_no || '',
                        quantity: saleData.quantity?.toString() || '',
                        amount: saleData.amount?.toString() || '',
                        discount_type: 'Fixed',
                        discount: saleData.discount?.toString() || '',
                        payment_type: paymentType,
                        to_account_id: saleData.transaction?.ac_number ? accounts.find(a => a.ac_number === saleData.transaction.ac_number)?.id.toString() || '' : '',
                        paid_amount: saleData.paid_amount?.toString() || '',
                        due_amount: saleData.due_amount?.toString() || '',
                        bank_type: saleData.transaction?.cheque_type || '',
                        bank_name: saleData.transaction?.bank_name || '',
                        cheque_no: saleData.transaction?.cheque_no || '',
                        cheque_date: saleData.transaction?.cheque_date || '',
                        branch_name: saleData.transaction?.branch_name || '',
                        account_no: saleData.transaction?.account_number || '',
                        mobile_bank: saleData.transaction?.mobile_bank_name || '',
                        mobile_number: saleData.transaction?.mobile_number || '',
                        remarks: saleData.remarks || '',
                    }
                ],
            });
            setIsCreateOpen(true);
        } catch (error) {
            console.error('Error loading sale:', error);
        }
    };

    const handleDelete = (sale: Sale) => {
        setDeletingSale(sale);
    };

    const confirmDelete = () => {
        if (deletingSale) {
            router.delete(`/sales/${deletingSale.id}`, {
                onSuccess: () => setDeletingSale(null),
            });
        }
    };

    const handleBulkDelete = () => {
        setIsBulkDeleting(true);
    };

    const confirmBulkDelete = () => {
        router.delete('/sales/bulk/delete', {
            data: { ids: selectedSales },
            onSuccess: () => {
                setSelectedSales([]);
                setIsBulkDeleting(false);
            },
        });
    };

    const applyFilters = () => {
        router.get(
            '/sales',
            {
                search: search || undefined,
                customer: customer === 'all' ? undefined : customer,
                payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
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
        setCustomer('all');
        setPaymentStatus('all');
        setStartDate('');
        setEndDate('');
        router.get(
            '/sales',
            {
                sort_by: sortBy,
                sort_order: sortOrder,
                per_page: perPage,
            },
            { preserveState: true },
        );
    };

    const handleSort = (column: string) => {
        const newOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
        setSortBy(column);
        setSortOrder(newOrder);
        router.get(
            '/sales',
            {
                search: search || undefined,
                customer: customer === 'all' ? undefined : customer,
                payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
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
            '/sales',
            {
                search: search || undefined,
                customer: customer === 'all' ? undefined : customer,
                payment_status: paymentStatus === 'all' ? undefined : paymentStatus,
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
        if (selectedSales.length === sales.data.length) {
            setSelectedSales([]);
        } else {
            setSelectedSales(sales.data.map((sale) => sale.id));
        }
    };

    const toggleSelectSale = (saleId: number) => {
        if (selectedSales.includes(saleId)) {
            setSelectedSales(selectedSales.filter((id) => id !== saleId));
        } else {
            setSelectedSales([...selectedSales, saleId]);
        }
    };

    const validateCartProduct = (product: any, index: number) => {
        const hasError = !product.product_id || !product.customer || !product.vehicle_no || !product.quantity || !product.amount || !product.to_account_id || !product.paid_amount;
        setCartErrors(prev => ({...prev, [index]: hasError}));
        return !hasError;
    };

    const addProduct = () => {
        const firstProduct = data.products[0];
        if (!validateCartProduct(firstProduct, 0)) {
            alert('Please fill all required fields');
            return;
        }

        const newProducts = [
            {
                product_id: '',
                customer: '',
                vehicle_no: '',
                memo_no: '',
                quantity: '',
                amount: '',
                discount_type: 'Fixed',
                discount: '',
                payment_type: 'Cash',
                to_account_id: '',
                paid_amount: '',
                due_amount: '',
                bank_type: '',
                bank_name: '',
                cheque_no: '',
                cheque_date: '',
                branch_name: '',
                account_no: '',
                mobile_bank: '',
                mobile_number: '',
                remarks: '',
            },
            ...data.products
        ];

        setData({
            ...data,
            products: newProducts
        });
    };

    const removeProduct = (index: number) => {
        const newProducts = data.products.filter((_, i) => i !== index);
        setData('products', newProducts);
    };

    const getFilteredAccounts = (paymentType: string) => {
        if (paymentType === 'Cash') {
            return groupedAccounts['Cash in hand'] || groupedAccounts['Cash'] || [];
        } else if (paymentType === 'Bank') {
            return groupedAccounts['Bank Account'] || groupedAccounts['Bank'] || [];
        } else if (paymentType === 'Mobile Bank') {
            return groupedAccounts['Mobile Bank'] || [];
        }
        return [];
    };

    const updateProduct = (index: number, field: string, value: string) => {
        setData((prevData: any) => {
            const newProducts = [...prevData.products];
            newProducts[index] = { ...newProducts[index], [field]: value };

            if (field === 'product_id' && value) {
                const selectedProduct = products.find(p => p.id.toString() === value);
                if (selectedProduct && selectedProduct.sales_price) {
                    const quantity = parseFloat(newProducts[index].quantity) || 0;
                    const amount = selectedProduct.sales_price * quantity;
                    const discount = parseFloat(newProducts[index].discount) || 0;
                    newProducts[index].amount = amount.toString();
                    newProducts[index].paid_amount = (amount - discount).toFixed(2);
                    newProducts[index].due_amount = '0.00';
                }
            }
            
            if (field === 'quantity' && value) {
                const selectedProduct = products.find(p => p.id.toString() === newProducts[index].product_id);
                if (selectedProduct && selectedProduct.sales_price) {
                    const quantity = parseFloat(value) || 0;
                    const amount = selectedProduct.sales_price * quantity;
                    const discount = parseFloat(newProducts[index].discount) || 0;
                    newProducts[index].amount = amount.toString();
                    newProducts[index].paid_amount = (amount - discount).toFixed(2);
                    newProducts[index].due_amount = '0.00';
                }
            }
            
            if (field === 'amount' && value) {
                const selectedProduct = products.find(p => p.id.toString() === newProducts[index].product_id);
                if (selectedProduct && selectedProduct.sales_price && selectedProduct.sales_price > 0) {
                    const amount = parseFloat(value) || 0;
                    const discount = parseFloat(newProducts[index].discount) || 0;
                    newProducts[index].quantity = (amount / selectedProduct.sales_price).toFixed(2);
                    newProducts[index].paid_amount = (amount - discount).toFixed(2);
                    newProducts[index].due_amount = '0.00';
                }
            }
            
            if (field === 'discount' && value !== undefined) {
                const amount = parseFloat(newProducts[index].amount) || 0;
                const discount = parseFloat(value) || 0;
                newProducts[index].paid_amount = (amount - discount).toFixed(2);
                newProducts[index].due_amount = '0.00';
            }
            
            if (field === 'to_account_id' && value) {
                const selectedAccount = accounts.find(a => a.id.toString() === value);
                if (selectedAccount) {
                    newProducts[index].account_no = selectedAccount.ac_number;
                }
            }
            
            return {
                ...prevData,
                products: newProducts
            };
        });
    };

    const getAvailableShifts = (selectedDate: string) => {
        if (!selectedDate) return shifts;
        
        const closedShiftIds = closedShifts
            .filter(cs => cs.close_date === selectedDate)
            .map(cs => cs.shift_id);
        
        return shifts.filter(shift => !closedShiftIds.includes(shift.id));
    };

    const handleVehicleBlur = (index: number, value: string) => {
        if (value) {
            const vehicle = vehicles.find(v => v.vehicle_number === value);
            if (vehicle) {
                setData((prevData: any) => {
                    const newProducts = [...prevData.products];
                    newProducts[index].customer = vehicle.customer?.name || '';
                    if (vehicle.products && vehicle.products.length > 0) {
                        const firstProduct = vehicle.products[0];
                        newProducts[index].product_id = firstProduct.id.toString();
                        const selectedProduct = products.find(p => p.id === firstProduct.id);
                        if (selectedProduct && selectedProduct.sales_price) {
                            const quantity = parseFloat(newProducts[index].quantity) || 0;
                            newProducts[index].amount = (selectedProduct.sales_price * quantity).toString();
                        }
                    }
                    return { ...prevData, products: newProducts };
                });
            } else {
                const saleHistory = salesHistory.find(s => s.vehicle_no === value);
                if (saleHistory) {
                    setData((prevData: any) => {
                        const newProducts = [...prevData.products];
                        newProducts[index].customer = saleHistory.customer || '';
                        if (saleHistory.product_id) {
                            newProducts[index].product_id = saleHistory.product_id.toString();
                            const selectedProduct = products.find(p => p.id === saleHistory.product_id);
                            if (selectedProduct && selectedProduct.sales_price) {
                                const quantity = parseFloat(newProducts[index].quantity) || 0;
                                newProducts[index].amount = (selectedProduct.sales_price * quantity).toString();
                            }
                        }
                        return { ...prevData, products: newProducts };
                    });
                }
            }
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => {
            if (search !== (filters.search || '')) {
                applyFilters();
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Sales" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                            Sales
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage sales orders and customer transactions
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {selectedSales.length > 0 && (
                            <Button
                                variant="destructive"
                                onClick={handleBulkDelete}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete Selected ({selectedSales.length})
                            </Button>
                        )}
                        <Button
                            variant="success"
                            onClick={() => {
                                const params = new URLSearchParams();
                                if (search) params.append('search', search);
                                if (customer !== 'all') params.append('customer', customer);
                                if (paymentStatus !== 'all') params.append('payment_status', paymentStatus);
                                if (startDate) params.append('start_date', startDate);
                                if (endDate) params.append('end_date', endDate);
                                if (sortBy) params.append('sort_by', sortBy);
                                if (sortOrder) params.append('sort_order', sortOrder);
                                window.location.href = `/sales/download-pdf?${params.toString()}`;
                            }}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                        <Button onClick={() => setIsCreateOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Sale
                        </Button>
                    </div>
                </div>

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
                                <Label className="dark:text-gray-200">Search</Label>
                                <Input
                                    placeholder="Search sales..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">Customer</Label>
                                <Select
                                    value={customer}
                                    onValueChange={(value) => {
                                        setCustomer(value);
                                        applyFilters();
                                    }}
                                >
                                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                        <SelectValue placeholder="All customers" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All customers</SelectItem>
                                        {Array.from(new Set([
                                            ...vehicles.filter(v => v.customer).map(v => v.customer!.name),
                                            ...uniqueCustomers
                                        ])).sort().map((name) => (
                                            <SelectItem key={name} value={name}>
                                                {name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">Payment Status</Label>
                                <Select
                                    value={paymentStatus}
                                    onValueChange={(value) => {
                                        setPaymentStatus(value);
                                        applyFilters();
                                    }}
                                >
                                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                        <SelectValue placeholder="All status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All status</SelectItem>
                                        <SelectItem value="paid">Paid</SelectItem>
                                        <SelectItem value="partial">Partial</SelectItem>
                                        <SelectItem value="due">Due</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">Start Date</Label>
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label className="dark:text-gray-200">End Date</Label>
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
                                <Button onClick={clearFilters} variant="secondary" className="px-4">
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
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">
                                            <input
                                                type="checkbox"
                                                checked={selectedSales.length === sales.data.length && sales.data.length > 0}
                                                onChange={toggleSelectAll}
                                                className="rounded border-gray-300 dark:border-gray-600"
                                            />
                                        </th>
                                        <th
                                            className="cursor-pointer p-4 text-left text-[13px] font-medium dark:text-gray-300"
                                            onClick={() => handleSort('sale_date')}
                                        >
                                            <div className="flex items-center gap-1">
                                                Date
                                                {sortBy === 'sale_date' && (sortOrder === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                                            </div>
                                        </th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Shift</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Invoice No</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Customer</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Product</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Vehicle</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Quantity</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Total Amount</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Paid Amount</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Payment Type</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Status</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.data.length > 0 ? (
                                        sales.data.map((sale) => (
                                            <tr key={sale.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                                <td className="p-4">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedSales.includes(sale.id)}
                                                        onChange={() => toggleSelectSale(sale.id)}
                                                        className="rounded border-gray-300 dark:border-gray-600"
                                                    />
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-white">{new Date(sale.sale_date).toLocaleDateString('en-GB')}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{sale.shift.name}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{sale.invoice_no}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{sale.customer}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {products.find(p => p.id === sale.product_id)?.product_name || 'N/A'}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{sale.vehicle_no}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{sale.quantity}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{sale.total_amount.toLocaleString()}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{sale.paid_amount.toLocaleString()}</td>
                                                <td className="p-4">
                                                    <span className={`rounded px-2 py-1 text-xs font-medium ${
                                                        (sale.transaction?.payment_type || 'cash') === 'cash' 
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : (sale.transaction?.payment_type || 'cash') === 'bank'
                                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                                            : (sale.transaction?.payment_type || 'cash') === 'mobile bank'
                                                            ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                                                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                    }`}>
                                                        {(sale.transaction?.payment_type || 'cash') === 'cash' ? 'Cash' 
                                                            : (sale.transaction?.payment_type || 'cash') === 'bank' ? 'Bank'
                                                            : (sale.transaction?.payment_type || 'cash') === 'mobile bank' ? 'Mobile Bank'
                                                            : 'Cash'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <span className={`rounded px-2 py-1 text-xs ${
                                                        parseFloat(sale.due_amount.toString()) === 0 
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                                            : parseFloat(sale.paid_amount.toString()) > 0
                                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                    }`}>
                                                        {parseFloat(sale.due_amount.toString()) === 0 ? 'Paid' : parseFloat(sale.paid_amount.toString()) > 0 ? 'Partial' : 'Due'}
                                                    </span>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex gap-2">
                                                        {sale.batch_code && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => window.open(`/sales/batch/${sale.batch_code}/pdf`, '_blank')}
                                                                className="text-blue-600 hover:text-blue-800"
                                                                title="Download Batch PDF"
                                                            >
                                                                <FileText className="h-4 w-4" />
                                                            </Button>
                                                        )}

                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleEdit(sale)}
                                                            className="text-indigo-600 hover:text-indigo-800"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => handleDelete(sale)}
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
                                            <td colSpan={13} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                                No sales found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={sales.current_page}
                            lastPage={sales.last_page}
                            from={sales.from}
                            to={sales.to}
                            total={sales.total}
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
                    isOpen={isCreateOpen}
                    onClose={() => {
                        setIsCreateOpen(false);
                        setEditingSale(null);
                        reset();
                    }}
                    title={editingSale ? "Update Sale" : "Create Sale"}
                    onSubmit={handleSubmit}
                    processing={processing}
                    submitText={editingSale ? "Update Sale" : "Create Sale"}
                    className="max-w-[65vw]"
                >
                    <div className="space-y-4">
                            <div className="grid grid-cols-5 gap-4">
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">
                                        Sale Date <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="date"
                                        value={data.sale_date}
                                        onChange={(e) => {
                                            setData('sale_date', e.target.value);
                                            setAvailableShifts(getAvailableShifts(e.target.value));
                                            setData('shift_id', '');
                                        }}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">
                                        Shift <span className="text-red-500">*</span>
                                    </Label>
                                    <Select value={data.shift_id} onValueChange={(value) => setData('shift_id', value)} disabled={!data.sale_date}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select shift" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {availableShifts.map((shift) => (
                                                <SelectItem key={shift.id} value={shift.id.toString()}>
                                                    {shift.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">
                                        Memo No <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        value={data.products[0]?.memo_no || ''}
                                        onChange={(e) => updateProduct(0, 'memo_no', e.target.value)}
                                        placeholder="Enter memo number"
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">
                                        Customer <span className="text-red-500">*</span>
                                    </Label>
                                    <Combobox
                                        options={Array.from(new Set([
                                            ...vehicles.filter(v => v.customer).map(v => v.customer!.name),
                                            ...uniqueCustomers
                                        ])).sort()}
                                        value={data.products[0]?.customer || ''}
                                        onValueChange={(value) => updateProduct(0, 'customer', value)}
                                        placeholder="Type customer name"
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">
                                        Vehicle <span className="text-red-500">*</span>
                                    </Label>
                                    <Combobox
                                        options={Array.from(new Set([
                                            ...vehicles.map(v => v.vehicle_number),
                                            ...uniqueVehicles
                                        ])).sort()}
                                        value={data.products[0]?.vehicle_no || ''}
                                        onValueChange={(value) => {
                                            updateProduct(0, 'vehicle_no', value);
                                            handleVehicleBlur(0, value);
                                        }}
                                        placeholder="Type vehicle number"
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-4">
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">
                                        Mobile Number
                                    </Label>
                                    <Input
                                        value={data.products[0]?.mobile_number || ''}
                                        onChange={(e) => updateProduct(0, 'mobile_number', e.target.value)}
                                        placeholder="Enter mobile number"
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Product</Label>
                                    <Select value={data.products[0]?.product_id || ''} onValueChange={(value) => updateProduct(0, 'product_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {products.map((product) => (
                                                <SelectItem key={product.id} value={product.id.toString()}>
                                                    {product.product_name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Sales Price</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={products.find(p => p.id.toString() === data.products[0]?.product_id)?.sales_price || ''}
                                        readOnly
                                        className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Quantity</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.products[0]?.quantity || ''}
                                        onChange={(e) => updateProduct(0, 'quantity', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Amount</Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.products[0]?.amount || ''}
                                        onChange={(e) => updateProduct(0, 'amount', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${data.products[0]?.payment_type === 'Bank' ? (data.products[0]?.bank_type === 'Cheque' ? 6 : 5) : data.products[0]?.payment_type === 'Mobile Bank' ? 5 : 3}, minmax(0, 1fr))` }}>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Payment Method</Label>
                                    <Select 
                                        value={data.products[0]?.payment_type || 'Cash'} 
                                        onValueChange={(value) => {
                                            updateProduct(0, 'payment_type', value);
                                            updateProduct(0, 'to_account_id', '');
                                        }}
                                    >
                                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                            <SelectValue placeholder="Select payment method" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Cash">Cash</SelectItem>
                                            <SelectItem value="Bank">Bank</SelectItem>
                                            <SelectItem value="Mobile Bank">Mobile Bank</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">To Account</Label>
                                    <Select value={data.products[0]?.to_account_id || ''} onValueChange={(value) => updateProduct(0, 'to_account_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select payment account" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getFilteredAccounts(data.products[0]?.payment_type || 'Cash').map((account) => (
                                                <SelectItem key={account.id} value={account.id.toString()}>
                                                    {account.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                {data.products[0]?.payment_type === 'Bank' && (
                                    <>
                                        <div>
                                            <Label className="text-sm font-medium dark:text-gray-200">Bank Type</Label>
                                            <Select value={data.products[0]?.bank_type || ''} onValueChange={(value) => updateProduct(0, 'bank_type', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select type" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Cheque">Cheque</SelectItem>
                                                    <SelectItem value="Cash Deposit">Cash Deposit</SelectItem>
                                                    <SelectItem value="Online">Online</SelectItem>
                                                    <SelectItem value="CHT">CHT</SelectItem>
                                                    <SelectItem value="RTGS">RTGS</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium dark:text-gray-200">Bank Name</Label>
                                            <Input
                                                value={data.products[0]?.bank_name || ''}
                                                onChange={(e) => updateProduct(0, 'bank_name', e.target.value)}
                                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                        {data.products[0]?.bank_type === 'Cheque' && (
                                            <div>
                                                <Label className="text-sm font-medium dark:text-gray-200">Cheque No</Label>
                                                <Input
                                                    value={data.products[0]?.cheque_no || ''}
                                                    onChange={(e) => updateProduct(0, 'cheque_no', e.target.value)}
                                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                                />
                                            </div>
                                        )}
                                    </>
                                )}
                                {data.products[0]?.payment_type === 'Mobile Bank' && (
                                    <>
                                        <div>
                                            <Label className="text-sm font-medium dark:text-gray-200">Mobile Bank</Label>
                                            <Select value={data.products[0]?.mobile_bank || ''} onValueChange={(value) => updateProduct(0, 'mobile_bank', value)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select mobile bank" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="bKash">bKash</SelectItem>
                                                    <SelectItem value="Nagad">Nagad</SelectItem>
                                                    <SelectItem value="Rocket">Rocket</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div>
                                            <Label className="text-sm font-medium dark:text-gray-200">Mobile Number</Label>
                                            <Input
                                                value={data.products[0]?.mobile_number || ''}
                                                onChange={(e) => updateProduct(0, 'mobile_number', e.target.value)}
                                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                            />
                                        </div>
                                    </>
                                )}
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">
                                        Paid Amount <span className="text-red-500">*</span>
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.products[0]?.paid_amount || ''}
                                        onChange={(e) => updateProduct(0, 'paid_amount', e.target.value)}
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-12 gap-4">
                                <div className={editingSale ? "col-span-12" : "col-span-10"}>
                                    <Label className="text-sm font-medium dark:text-gray-200">Remarks</Label>
                                    <Input
                                        value={data.products[0]?.remarks || ''}
                                        onChange={(e) => updateProduct(0, 'remarks', e.target.value)}
                                        placeholder="Enter any remarks"
                                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                    />
                                </div>
                                {!editingSale && (
                                    <div className="col-span-2 flex flex-col justify-end">
                                        <Button
                                            type="button"
                                            onClick={addProduct}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Plus className="h-4 w-4 mr-1" />
                                            Add to Cart
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {!editingSale && (
                            <div className="mt-6">
                                <table className="w-full border border-gray-300 dark:border-gray-600">
                                    <thead className="bg-gray-100 dark:bg-gray-700">
                                        <tr>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">SL</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Customer</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Vehicle</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Product Name</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Quantity</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Total</th>
                                            <th className="p-2 text-left text-sm font-medium dark:text-gray-200">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {data.products.slice(1).filter(p => p.product_id).map((product, index) => {
                                            const selectedProduct = products.find(p => p.id.toString() === product.product_id);
                                            const actualIndex = index + 1;
                                            const hasError = !product.product_id || !product.customer || !product.vehicle_no || !product.quantity || !product.amount || !product.to_account_id || !product.paid_amount;
                                            return (
                                                <tr key={actualIndex} className={`border-t dark:border-gray-600 ${hasError ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}>
                                                    <td className="p-2 text-sm dark:text-white">{index + 1}</td>
                                                    <td className="p-2 text-sm dark:text-white">{product.customer || '-'}</td>
                                                    <td className="p-2 text-sm dark:text-white">{product.vehicle_no || '-'}</td>
                                                    <td className="p-2 text-sm dark:text-white">{selectedProduct?.product_name}</td>
                                                    <td className="p-2 text-sm dark:text-white">{product.quantity}</td>
                                                    <td className="p-2 text-sm dark:text-white">{product.paid_amount || '0'}</td>
                                                    <td className="p-2">
                                                        <div className="flex gap-2">
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => {
                                                                    const editProduct = data.products[actualIndex];
                                                                    const newProducts = data.products.filter((_, i) => i !== actualIndex);
                                                                    newProducts[0] = editProduct;
                                                                    setData('products', newProducts);
                                                                }}
                                                                className="text-indigo-600 hover:text-indigo-800"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => removeProduct(actualIndex)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            )}
                    </div>
                </FormModal>

                <DeleteModal
                    isOpen={!!deletingSale}
                    onClose={() => setDeletingSale(null)}
                    onConfirm={confirmDelete}
                    title="Delete Sale"
                    message={`Are you sure you want to delete this sale? This action cannot be undone.`}
                />

                <DeleteModal
                    isOpen={isBulkDeleting}
                    onClose={() => setIsBulkDeleting(false)}
                    onConfirm={confirmBulkDelete}
                    title="Delete Selected Sales"
                    message={`Are you sure you want to delete ${selectedSales.length} selected sales? This action cannot be undone.`}
                />
            </div>
        </AppLayout>
    );
}
