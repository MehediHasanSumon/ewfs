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
import { SearchableSelect } from '@/components/ui/searchable-select';
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

interface CreditSale {
    id: number;
    sale_date: string;
    invoice_no: string;
    customer: { id: number; name: string };
    vehicle: { id: number; vehicle_number: string };
    product_id: number;
    shift: { name: string };
    quantity: number;
    total_amount: number;
    paid_amount: number;
    due_amount: number;
    remarks: string;
    created_at: string;
}

interface Customer {
    id: number;
    name: string;
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
    sales_price: number;
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
        title: 'Credit Sales',
        href: '/credit-sales',
    },
];

interface CreditSalesProps {
    creditSales: {
        data: CreditSale[];
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
    customers: Customer[];
    shifts: Shift[];
    closedShifts: ClosedShift[];
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

export default function CreditSales({ creditSales, accounts = [], groupedAccounts = {}, products = [], vehicles = [], customers = [], shifts = [], closedShifts = [], filters = {} }: CreditSalesProps) {
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [editingSale, setEditingSale] = useState<CreditSale | null>(null);
    const [deletingSale, setDeletingSale] = useState<CreditSale | null>(null);
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
                customer_id: '',
                vehicle_id: '',
                memo_no: '',
                quantity: '',
                amount: '',
                due_amount: '',
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
                    customer_id: '',
                    vehicle_id: '',
                    memo_no: '',
                    quantity: '',
                    amount: '',
                    due_amount: '',
                    remarks: '',
                }
            ],
        });
    };

    const [processing, setProcessing] = useState(false);
    const [availableShifts, setAvailableShifts] = useState<Shift[]>(shifts);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const validProducts = data.products.filter(p => p.product_id && p.customer_id && p.vehicle_id && p.quantity);
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
                customer_id: validProducts[0].customer_id,
                vehicle_id: validProducts[0].vehicle_id,
                memo_no: validProducts[0].memo_no,
                quantity: validProducts[0].quantity,
                amount: validProducts[0].amount,
                due_amount: validProducts[0].due_amount,
                remarks: validProducts[0].remarks,
            };
            
            router.put(`/credit-sales/${editingSale.id}`, updateData, {
                onSuccess: () => {
                    setIsCreateOpen(false);
                    setEditingSale(null);
                    reset();
                },
            });
        } else {
            setProcessing(true);
            router.post('/credit-sales', submitData, {
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

    const handleEdit = async (sale: CreditSale) => {
        setEditingSale(sale);
        try {
            const response = await fetch(`/credit-sales/${sale.id}/edit`);
            const data = await response.json();
            const saleData = data.creditSale;
            
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
                        customer_id: saleData.customer_id?.toString() || '',
                        vehicle_id: saleData.vehicle_id?.toString() || '',
                        memo_no: saleData.memo_no || '',
                        quantity: saleData.quantity?.toString() || '',
                        amount: saleData.amount?.toString() || '',
                        due_amount: saleData.due_amount?.toString() || '',
                        remarks: saleData.remarks || '',
                    }
                ],
            });
            setIsCreateOpen(true);
        } catch (error) {
            console.error('Error loading sale:', error);
        }
    };

    const handleDelete = (sale: CreditSale) => {
        setDeletingSale(sale);
    };

    const confirmDelete = () => {
        if (deletingSale) {
            router.delete(`/credit-sales/${deletingSale.id}`, {
                onSuccess: () => setDeletingSale(null),
            });
        }
    };

    const handleBulkDelete = () => {
        setIsBulkDeleting(true);
    };

    const confirmBulkDelete = () => {
        router.delete('/credit-sales/bulk/delete', {
            data: { ids: selectedSales },
            onSuccess: () => {
                setSelectedSales([]);
                setIsBulkDeleting(false);
            },
        });
    };

    const applyFilters = () => {
        router.get(
            '/credit-sales',
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
            '/credit-sales',
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
            '/credit-sales',
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
            '/credit-sales',
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
        if (selectedSales.length === creditSales.data.length) {
            setSelectedSales([]);
        } else {
            setSelectedSales(creditSales.data.map((sale) => sale.id));
        }
    };

    const toggleSelectSale = (saleId: number) => {
        if (selectedSales.includes(saleId)) {
            setSelectedSales(selectedSales.filter((id) => id !== saleId));
        } else {
            setSelectedSales([...selectedSales, saleId]);
        }
    };

    const addProduct = () => {
        const firstProduct = data.products[0];
        if (!firstProduct.product_id || !firstProduct.customer_id || !firstProduct.vehicle_id || !firstProduct.quantity) {
            alert('Please fill product, customer, vehicle and quantity');
            return;
        }

        const newProducts = [
            {
                product_id: '',
                customer_id: '',
                vehicle_id: '',
                memo_no: '',
                quantity: '',
                amount: '',
                due_amount: '',
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

            if (field === 'vehicle_id' && value) {
                const selectedVehicle = vehicles.find(v => v.id.toString() === value);
                if (selectedVehicle) {
                    newProducts[index].customer_id = selectedVehicle.customer_id.toString();
                    if (selectedVehicle.products && selectedVehicle.products.length > 0) {
                        newProducts[index].product_id = selectedVehicle.products[0].id.toString();
                    }
                }
            }

            if (field === 'product_id' && value) {
                const selectedProduct = products.find(p => p.id.toString() === value);
                if (selectedProduct && selectedProduct.sales_price) {
                    const quantity = parseFloat(newProducts[index].quantity) || 0;
                    const amount = selectedProduct.sales_price * quantity;
                    newProducts[index].amount = amount.toString();
                    newProducts[index].due_amount = amount.toFixed(2);
                }
            }
            
            if (field === 'quantity' && value) {
                const selectedProduct = products.find(p => p.id.toString() === newProducts[index].product_id);
                if (selectedProduct && selectedProduct.sales_price) {
                    const quantity = parseFloat(value) || 0;
                    const amount = selectedProduct.sales_price * quantity;
                    newProducts[index].amount = amount.toString();
                    newProducts[index].due_amount = amount.toFixed(2);
                }
            }
            
            if (field === 'amount' && value) {
                const selectedProduct = products.find(p => p.id.toString() === newProducts[index].product_id);
                if (selectedProduct && selectedProduct.sales_price && selectedProduct.sales_price > 0) {
                    const amount = parseFloat(value) || 0;
                    newProducts[index].quantity = (amount / selectedProduct.sales_price).toFixed(2);
                    newProducts[index].due_amount = amount.toFixed(2);
                }
            }
            
            return {
                ...prevData,
                products: newProducts
            };
        });
    };

    const getFilteredVehicles = (customerId: string) => {
        if (!customerId) return vehicles;
        return vehicles.filter(v => v.customer_id.toString() === customerId);
    };

    const getFilteredProducts = (vehicleId: string) => {
        if (!vehicleId) return products;
        const selectedVehicle = vehicles.find(v => v.id.toString() === vehicleId);
        if (!selectedVehicle || !selectedVehicle.products || selectedVehicle.products.length === 0) {
            return [];
        }
        return products.filter(p => selectedVehicle.products!.some(vp => vp.id === p.id));
    };

    const getAvailableShifts = (selectedDate: string) => {
        if (!selectedDate) return shifts;
        
        const closedShiftIds = closedShifts
            .filter(cs => cs.close_date === selectedDate)
            .map(cs => cs.shift_id);
        
        return shifts.filter(shift => !closedShiftIds.includes(shift.id));
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
            <Head title="Credit Sales" />

            <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">
                            Credit Sales
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Manage credit sales and customer transactions
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
                                window.location.href = `/credit-sales/download-pdf?${params.toString()}`;
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
                                        {customers.map((cust) => (
                                            <SelectItem key={cust.id} value={cust.id.toString()}>
                                                {cust.name}
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
                                                checked={selectedSales.length === creditSales.data.length && creditSales.data.length > 0}
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
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Due Amount</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Status</th>
                                        <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {creditSales.data.length > 0 ? (
                                        creditSales.data.map((sale) => (
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
                                                <td className="p-4 text-[13px] dark:text-gray-300">{sale.customer.name}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">
                                                    {products.find(p => p.id === sale.product_id)?.product_name || 'N/A'}
                                                </td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{sale.vehicle.vehicle_number}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{sale.quantity}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{sale.total_amount.toLocaleString()}</td>
                                                <td className="p-4 text-[13px] dark:text-gray-300">{sale.due_amount.toLocaleString()}</td>
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
                                            <td colSpan={12} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                <ShoppingCart className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                                                No sales found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={creditSales.current_page}
                            lastPage={creditSales.last_page}
                            from={creditSales.from}
                            to={creditSales.to}
                            total={creditSales.total}
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
                    className="max-w-[65vw] max-h-[90vh]"
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
                                        Memo No
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
                                    <SearchableSelect
                                        options={customers.map(customer => ({
                                            value: customer.id.toString(),
                                            label: customer.name
                                        }))}
                                        value={data.products[0]?.customer_id || ''}
                                        onValueChange={(value) => updateProduct(0, 'customer_id', value)}
                                        placeholder="Select customer"
                                        searchPlaceholder="Search customers..."
                                    />
                                </div>
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">
                                        Vehicle <span className="text-red-500">*</span>
                                    </Label>
                                    <SearchableSelect
                                        options={getFilteredVehicles(data.products[0]?.customer_id).map(vehicle => ({
                                            value: vehicle.id.toString(),
                                            label: vehicle.vehicle_number,
                                            subtitle: vehicle.customer?.name
                                        }))}
                                        value={data.products[0]?.vehicle_id || ''}
                                        onValueChange={(value) => updateProduct(0, 'vehicle_id', value)}
                                        placeholder="Select vehicle"
                                        searchPlaceholder="Search vehicles..."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-5 gap-4">
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">Product</Label>
                                    <Select value={data.products[0]?.product_id || ''} onValueChange={(value) => updateProduct(0, 'product_id', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select product" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getFilteredProducts(data.products[0]?.vehicle_id).map((product) => (
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
                                        value={getFilteredProducts(data.products[0]?.vehicle_id).find(p => p.id.toString() === data.products[0]?.product_id)?.sales_price || ''}
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
                                <div>
                                    <Label className="text-sm font-medium dark:text-gray-200">
                                        Total Amount
                                    </Label>
                                    <Input
                                        type="number"
                                        step="0.01"
                                        value={data.products[0]?.due_amount || ''}
                                        readOnly
                                        className="bg-gray-100 dark:border-gray-600 dark:bg-gray-600 dark:text-white"
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
                                            const selectedCustomer = customers.find(c => c.id.toString() === product.customer_id);
                                            const selectedVehicle = vehicles.find(v => v.id.toString() === product.vehicle_id);
                                            const actualIndex = index + 1;
                                            return (
                                                <tr key={actualIndex} className="border-t dark:border-gray-600">
                                                    <td className="p-2 text-sm dark:text-white">{index + 1}</td>
                                                    <td className="p-2 text-sm dark:text-white">{selectedCustomer?.name || '-'}</td>
                                                    <td className="p-2 text-sm dark:text-white">{selectedVehicle?.vehicle_number || '-'}</td>
                                                    <td className="p-2 text-sm dark:text-white">{selectedProduct?.product_name}</td>
                                                    <td className="p-2 text-sm dark:text-white">{product.quantity}</td>

                                                    <td className="p-2 text-sm dark:text-white">{product.due_amount || '0'}</td>
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
