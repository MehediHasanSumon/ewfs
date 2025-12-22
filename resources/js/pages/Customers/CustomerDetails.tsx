import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, DollarSign, CreditCard, Banknote, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface Customer {
    id: number;
    code?: string;
    name: string;
    mobile?: string;
    email?: string;
    nid_number?: string;
    vat_reg_no?: string;
    tin_no?: string;
    trade_license?: string;
    discount_rate?: number;
    security_deposit?: number;
    credit_limit?: number;
    address?: string;
    status: boolean;
    account?: {
        id: number;
        name: string;
        ac_number: string;
    };
    vehicles?: Array<{
        id: number;
        vehicle_number: string;
        vehicle_name?: string;
        vehicle_type?: string;
        reg_date?: string;
        products?: Array<{
            id: number;
            product_name: string;
        }>;
    }>;
    created_at: string;
}

interface RecentPayment {
    id: number;
    voucher_no: string;
    date: string;
    amount: number;
    type: string;
    sub_type: string;
    status: string;
}

interface RecentSale {
    id: number;
    date: string;
    amount: number;
    quantity: number;
    vehicle_number: string;
    invoice_no: string;
    status: boolean;
}

interface CustomerDetailsProps {
    customer: Customer;
    recentPayments: RecentPayment[];
    recentSales: RecentSale[];
    totalSales: number;
    salesCount: number;
    totalPaid: number;
    paymentCount: number;
    currentDue: number;
}

export default function CustomerDetails({ customer, recentPayments, recentSales, totalSales, salesCount, totalPaid, paymentCount, currentDue }: CustomerDetailsProps) {
    const [isVehicleOpen, setIsVehicleOpen] = useState(false);
    
    return (
        <AppLayout>
            <Head title={`Customer - ${customer.name}`} />
            
            {/* Header */}
            <div className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold dark:text-white">{customer.name}</h1>
                        <p className="text-gray-600 dark:text-gray-400">Customer details and information</p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="success"
                            onClick={() => window.location.href = `/customers/${customer.id}/download-pdf`}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Download
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.get(`/customers/${customer.id}/statement`)}
                        >
                            <FileText className="mr-2 h-4 w-4" />
                            Statement
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => router.get('/customers')}
                        >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to List
                        </Button>
                    </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="dark:border-gray-700 dark:bg-gray-800">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Security Deposit</p>
                                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{customer.security_deposit?.toLocaleString() || '0'}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="dark:border-gray-700 dark:bg-gray-800">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Sales</p>
                                    <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{totalSales.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{salesCount} sales</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="dark:border-gray-700 dark:bg-gray-800">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Paid</p>
                                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{totalPaid.toLocaleString()}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">{paymentCount} payments</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="dark:border-gray-700 dark:bg-gray-800">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        {currentDue > 0 ? 'Current Due' : currentDue < 0 ? 'Current Advanced' : 'Balanced'}
                                    </p>
                                    <p className={`text-2xl font-bold ${
                                        currentDue > 0 
                                            ? 'text-red-600 dark:text-red-400' 
                                            : currentDue < 0 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : 'text-gray-900 dark:text-white'
                                    }`}>
                                        {currentDue < 0 ? '-' : ''}{Math.abs(currentDue).toLocaleString()}
                                    </p>
                                    {currentDue > 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Outstanding</p>
                                    )}
                                    {currentDue < 0 && (
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Advance Paid</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Customer Details Card */}
                <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                        <CardTitle className="dark:text-white">Customer Details</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Name</label>
                                    <p className="text-gray-900 dark:text-white">{customer.name}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Code</label>
                                    <p className="text-gray-900 dark:text-white">{customer.code || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Mobile</label>
                                    <p className="text-gray-900 dark:text-white">{customer.mobile || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                                    <p className="text-gray-900 dark:text-white">{customer.email || 'N/A'}</p>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">NID Number</label>
                                    <p className="text-gray-900 dark:text-white">{customer.nid_number || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Address</label>
                                    <p className="text-gray-900 dark:text-white">{customer.address || 'N/A'}</p>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status</label>
                                    <span className={`px-2 py-1 rounded text-xs ${
                                        customer.status 
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                    }`}>
                                        {customer.status ? 'Active' : 'Inactive'}
                                    </span>
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Created Date</label>
                                    <p className="text-gray-900 dark:text-white">{new Date(customer.created_at).toLocaleDateString('en-GB')}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
                
                {/* Action Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="dark:border-gray-700 dark:bg-gray-800 cursor-pointer" onClick={() => router.get('/sales')}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                                    <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Cash Sale</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Create new cash sale</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="dark:border-gray-700 dark:bg-gray-800 cursor-pointer" onClick={() => router.get('/credit-sales')}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
                                    <CreditCard className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Credit Sale</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Create new credit sale</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="dark:border-gray-700 dark:bg-gray-800 cursor-pointer" onClick={() => router.get('/vouchers/received')}>
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                                    <Banknote className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Receive Payment</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Receive customer payment</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Recent Activity Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="dark:border-gray-700 dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="dark:text-white">Recent Sales</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b dark:border-gray-700">
                                            <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Date</th>
                                            <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Vehicle Number</th>
                                            <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Quantity</th>
                                            <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Amount</th>
                                            <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentSales && recentSales.length > 0 ? (
                                            recentSales.map((sale) => (
                                                <tr key={sale.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                                    <td className="p-4 text-[13px] dark:text-white">
                                                        {new Date(sale.date).toLocaleDateString('en-GB')}
                                                    </td>
                                                    <td className="p-4 text-[13px] dark:text-gray-300">
                                                        {sale.vehicle_number}
                                                    </td>
                                                    <td className="p-4 text-[13px] dark:text-gray-300">
                                                        {sale.quantity}
                                                    </td>
                                                    <td className="p-4 text-[13px] dark:text-white font-semibold">
                                                        {sale.amount.toLocaleString()}
                                                    </td>
                                                    <td className="p-4">
                                                        <span className={`px-2 py-1 rounded text-xs ${
                                                            sale.status 
                                                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                                                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                                        }`}>
                                                            {sale.status ? 'Active' : 'Inactive'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                    No recent sales found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                    
                    <Card className="dark:border-gray-700 dark:bg-gray-800">
                        <CardHeader>
                            <CardTitle className="dark:text-white">Recent Payments</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b dark:border-gray-700">
                                            <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">SL</th>
                                            <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Voucher No</th>
                                            <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Date</th>
                                            <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Amount</th>
                                            <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Type</th>
                                            <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Payment Type</th>
                                            <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentPayments && recentPayments.length > 0 ? (
                                            recentPayments.map((payment, index) => (
                                                <tr key={payment.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                                    <td className="p-4 text-[13px] dark:text-white">{index + 1}</td>
                                                    <td className="p-4 text-[13px] dark:text-white">{payment.voucher_no}</td>
                                                    <td className="p-4 text-[13px] dark:text-white">
                                                        {new Date(payment.date).toLocaleDateString('en-GB')}
                                                    </td>
                                                    <td className="p-4 text-[13px] dark:text-white font-semibold">
                                                        {payment.amount.toLocaleString()}
                                                    </td>
                                                    <td className="p-4 text-[13px] dark:text-gray-300">{payment.sub_type}</td>
                                                    <td className="p-4 text-[13px] dark:text-gray-300">{payment.type}</td>
                                                    <td className="p-4">
                                                        <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                            {payment.status}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="p-8 text-center text-gray-500 dark:text-gray-400">
                                                    No recent payments found
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                {/* Vehicle Accordion */}
                <Card className="dark:border-gray-700 dark:bg-gray-800">
                    <CardHeader>
                        <button
                            onClick={() => setIsVehicleOpen(!isVehicleOpen)}
                            className="flex items-center justify-between w-full text-left cursor-pointer"
                        >
                            <CardTitle className="dark:text-white">Show vehicle</CardTitle>
                            {isVehicleOpen ? (
                                <ChevronUp className="h-5 w-5 dark:text-white" />
                            ) : (
                                <ChevronDown className="h-5 w-5 dark:text-white" />
                            )}
                        </button>
                    </CardHeader>
                    <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                        isVehicleOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0'
                    }`}>
                        <CardContent className={isVehicleOpen ? 'pb-6' : 'pb-0'}>
                            {customer.vehicles && customer.vehicles.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b dark:border-gray-700">
                                                <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">SL</th>
                                                <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Vehicle Number</th>
                                                <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Vehicle Name</th>
                                                <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Type</th>
                                                <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Product</th>
                                                <th className="p-4 text-left text-[13px] font-medium dark:text-gray-300">Registration Date</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {customer.vehicles.map((vehicle, index) => (
                                                <tr key={vehicle.id} className="border-b hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-700">
                                                    <td className="p-4 text-[13px] dark:text-white">{index + 1}</td>
                                                    <td className="p-4 text-[13px] dark:text-white">{vehicle.vehicle_number}</td>
                                                    <td className="p-4 text-[13px] dark:text-gray-300">{vehicle.vehicle_name || 'N/A'}</td>
                                                    <td className="p-4 text-[13px] dark:text-gray-300">{vehicle.vehicle_type || 'N/A'}</td>
                                                    <td className="p-4">
                                                        {vehicle.products && vehicle.products.length > 0 ? (
                                                            <div className="flex flex-wrap gap-1">
                                                                {vehicle.products.map(p => (
                                                                    <Badge key={p.id} variant="secondary">
                                                                        {p.product_name}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        ) : (
                                                            <span className="text-[13px] dark:text-gray-300">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="p-4 text-[13px] dark:text-gray-300">
                                                        {vehicle.reg_date ? new Date(vehicle.reg_date).toLocaleDateString('en-GB') : 'N/A'}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-gray-500 dark:text-gray-400 text-center py-8">No vehicles found</p>
                            )}
                        </CardContent>
                    </div>
                </Card>
                
                {/* Design your page here */}
                
            </div>
        </AppLayout>
    );
}