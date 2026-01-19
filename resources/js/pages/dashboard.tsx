import { PlaceholderPattern } from '@/components/ui/placeholder-pattern';
import { usePermission } from '@/hooks/usePermission';
import AppLayout from '@/layouts/app-layout';
import { dashboard } from '@/routes';
import { type BreadcrumbItem } from '@/types';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Banknote, TrendingUp, ShoppingCart, Receipt } from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Dashboard',
        href: dashboard().url,
    },
];

interface DashboardProps {
    stats: {
        cashInHand: number;
        outstandingBalance: number;
        cashSale: number;
        officeExpenses: number;
    };
}

export default function Dashboard({ stats }: DashboardProps) {
    const { can, permissions } = usePermission();
    
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-BD', {
            style: 'currency',
            currency: 'BDT',
            minimumFractionDigits: 2
        }).format(amount);
    };

    // Chart data
    const salesChartData = {
        labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug'],
        datasets: [
            {
                label: 'Sale',
                data: [16000000, 2500000, 0, 0, 0],
                backgroundColor: '#facc15',
            },
            {
                label: 'Purchase',
                data: [0, 0, 0, 0, 0],
                backgroundColor: '#60a5fa',
            },
        ],
    };

    const purchaseChartData = {
        labels: ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Mar'],
        datasets: [
            {
                label: 'Current Year',
                data: [150000, 200000, 80000, 50000, 0, 30000],
                backgroundColor: '#60a5fa',
            },
            {
                label: 'Previous Year',
                data: [0, 0, 0, 0, 40000, 0],
                backgroundColor: '#facc15',
            },
        ],
    };

    const stockChartData = {
        labels: ['Diesel', 'Petrol', 'Other'],
        datasets: [
            {
                data: [35546, 15000, 8000],
                backgroundColor: ['#22c55e', '#3b82f6', '#f59e0b'],
            },
        ],
    };

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
                borderColor: 'rgba(255, 255, 255, 0.1)',
                borderWidth: 1,
            },
        },
        scales: {
            y: {
                display: false,
                grid: {
                    display: false,
                },
            },
            x: {
                display: false,
                grid: {
                    display: false,
                },
            },
        },
        elements: {
            bar: {
                borderRadius: 4,
                borderSkipped: false,
            },
        },
    };

    const doughnutOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false,
            },
            tooltip: {
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                titleColor: 'white',
                bodyColor: 'white',
            },
        },
        cutout: '60%',
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dashboard" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="grid auto-rows-min gap-4 md:grid-cols-4">
                    <Card className="border-l-4 border-l-green-500 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900 dark:to-green-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">Cash in Hand</CardTitle>
                            <Banknote className="h-4 w-4 text-green-600 dark:text-green-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-green-800 dark:text-green-200">{formatCurrency(stats?.cashInHand || 0)}</div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-blue-500 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900 dark:to-blue-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">Outstanding Balance</CardTitle>
                            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-blue-800 dark:text-blue-200">{formatCurrency(stats?.outstandingBalance || 0)}</div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-purple-500 bg-gradient-to-r from-purple-100 to-purple-200 dark:from-purple-900 dark:to-purple-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Cash Sale</CardTitle>
                            <ShoppingCart className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-purple-800 dark:text-purple-200">{formatCurrency(stats?.cashSale || 0)}</div>
                        </CardContent>
                    </Card>
                    
                    <Card className="border-l-4 border-l-red-500 bg-gradient-to-r from-red-100 to-red-200 dark:from-red-900 dark:to-red-800">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium text-red-700 dark:text-red-300">Office Expenses</CardTitle>
                            <Receipt className="h-4 w-4 text-red-600 dark:text-red-400" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold text-red-800 dark:text-red-200">{formatCurrency(stats?.officeExpenses || 0)}</div>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="grid auto-rows-min gap-6 md:grid-cols-2">
                    {/* Month Wise Sales Report */}
                    <Card className="shadow-sm border-0 bg-white dark:bg-gray-900">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <div className="flex gap-2 mb-3">
                                    <Select defaultValue="sale">
                                        <SelectTrigger className="w-20 h-8 border-gray-200 dark:border-gray-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="sale">Sale</SelectItem>
                                            <SelectItem value="purchase">Purchase</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select defaultValue="diesel">
                                        <SelectTrigger className="w-24 h-8 border-gray-200 dark:border-gray-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="diesel">Diesel</SelectItem>
                                            <SelectItem value="petrol">Petrol</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select defaultValue="pump">
                                        <SelectTrigger className="w-20 h-8 border-gray-200 dark:border-gray-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pump">Pump</SelectItem>
                                            <SelectItem value="all">All</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">Month Wise Sales Report</CardTitle>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition-colors">
                                    Graph
                                </button>
                                <button className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 rounded-md text-xs font-medium transition-colors">
                                    Data
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-52 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4">
                                <Bar data={salesChartData} options={chartOptions} />
                            </div>
                            <div className="flex gap-4 mt-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                                    <span className="text-gray-600 dark:text-gray-400">Purchase</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
                                    <span className="text-gray-600 dark:text-gray-400">Sale</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Available Stock */}
                    <Card className="shadow-sm border-0 bg-white dark:bg-gray-900">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">Available Stock</CardTitle>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition-colors">
                                    Graph
                                </button>
                                <button className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 rounded-md text-xs font-medium transition-colors">
                                    Data
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-52 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4 flex items-center justify-center">
                                <div className="w-36 h-36 relative">
                                    <Doughnut data={stockChartData} options={doughnutOptions} />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="text-lg font-bold text-gray-800 dark:text-gray-200">58.5K</div>
                                            <div className="text-xs text-gray-500 dark:text-gray-400">Total Stock</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-4 mt-4 text-xs justify-center">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                                    <span className="text-gray-600 dark:text-gray-400">Diesel</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-sm"></div>
                                    <span className="text-gray-600 dark:text-gray-400">Petrol</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-500 rounded-sm"></div>
                                    <span className="text-gray-600 dark:text-gray-400">Other</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* Year Wise Purchase Comparison */}
                    <Card className="shadow-sm border-0 bg-white dark:bg-gray-900">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <div>
                                <div className="flex gap-2 mb-3">
                                    <Select defaultValue="purchase">
                                        <SelectTrigger className="w-24 h-8 border-gray-200 dark:border-gray-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="purchase">Purchase</SelectItem>
                                            <SelectItem value="sale">Sale</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select defaultValue="all-items">
                                        <SelectTrigger className="w-28 h-8 border-gray-200 dark:border-gray-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all-items">All Items</SelectItem>
                                            <SelectItem value="diesel">Diesel</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Select defaultValue="pump">
                                        <SelectTrigger className="w-20 h-8 border-gray-200 dark:border-gray-700">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="pump">Pump</SelectItem>
                                            <SelectItem value="all">All</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">Year Wise Purchase Comparison</CardTitle>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition-colors">
                                    Graph
                                </button>
                                <button className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 rounded-md text-xs font-medium transition-colors">
                                    Data
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-52 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg p-4">
                                <Bar data={purchaseChartData} options={chartOptions} />
                            </div>
                            <div className="flex gap-4 mt-4 text-xs">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-400 rounded-sm"></div>
                                    <span className="text-gray-600 dark:text-gray-400">Current Year</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-yellow-400 rounded-sm"></div>
                                    <span className="text-gray-600 dark:text-gray-400">Previous Year</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    
                    {/* List of Outstanding */}
                    <Card className="shadow-sm border-0 bg-white dark:bg-gray-900">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-gray-100 dark:border-gray-800">
                            <CardTitle className="text-base font-semibold text-gray-800 dark:text-gray-200">List of Outstanding</CardTitle>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-xs font-medium transition-colors">
                                    Graph
                                </button>
                                <button className="px-3 py-1.5 border border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800 rounded-md text-xs font-medium transition-colors">
                                    Data
                                </button>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="h-52 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-lg overflow-hidden">
                                <table className="w-full text-xs">
                                    <thead className="bg-gray-200 dark:bg-gray-700 sticky top-0">
                                        <tr>
                                            <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">Party Name</th>
                                            <th className="p-3 text-left font-semibold text-gray-700 dark:text-gray-300">Mobile</th>
                                            <th className="p-3 text-right font-semibold text-gray-700 dark:text-gray-300">Balance</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="p-3 text-gray-800 dark:text-gray-200">Kapil Dhakar</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">9999999999</td>
                                            <td className="p-3 text-right font-medium text-gray-800 dark:text-gray-200">৳126,253.00</td>
                                        </tr>
                                        <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="p-3 text-gray-800 dark:text-gray-200">AAMIR</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">-</td>
                                            <td className="p-3 text-right font-medium text-gray-800 dark:text-gray-200">৳59,127.53</td>
                                        </tr>
                                        <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="p-3 text-gray-800 dark:text-gray-200">Balaji Roadlines</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">8882297065</td>
                                            <td className="p-3 text-right font-medium text-gray-800 dark:text-gray-200">৳52,031.28</td>
                                        </tr>
                                        <tr className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="p-3 text-gray-800 dark:text-gray-200">Fleet Card</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">-</td>
                                            <td className="p-3 text-right font-medium text-gray-800 dark:text-gray-200">৳51,830.00</td>
                                        </tr>
                                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                            <td className="p-3 text-gray-800 dark:text-gray-200">Barwani</td>
                                            <td className="p-3 text-gray-600 dark:text-gray-400">-</td>
                                            <td className="p-3 text-right font-medium text-gray-800 dark:text-gray-200">৳45,999.91</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
                
                <div className="relative min-h-[20vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">
                    <PlaceholderPattern className="absolute inset-0 size-full stroke-neutral-900/20 dark:stroke-neutral-100/20" />
                </div>
            </div>
        </AppLayout>
    );
}
