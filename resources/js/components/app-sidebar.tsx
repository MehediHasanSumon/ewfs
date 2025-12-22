import {
    Sidebar,
    SidebarContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { dashboard } from '@/routes';
import { Link, usePage } from '@inertiajs/react';
import {
    BarChart3,
    Building,
    Car,
    ChevronDown,
    Clock,
    CreditCard,
    Database,
    DollarSign,
    FileText,
    Fuel,
    LayoutGrid,
    Package,
    Settings,
    Shield,
    ShoppingCart,
    Truck,
    UserCheck,
    Users,
    Warehouse,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLogo from './app-logo';

const mainNavItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'General Setting',
        icon: Settings,
        children: [
            {
                title: 'Company Setting',
                href: '/company-settings',
                icon: Building,
            },
            { title: 'Shift', href: '/shifts', icon: Clock },
        ],
    },
    {
        title: 'Dispenser',
        icon: Fuel,
        children: [
            { title: 'Credit Sales', href: '/credit-sales', icon: CreditCard },
            {
                title: 'Dispensers Calculation',
                href: '/product/dispensers-reading',
                icon: BarChart3,
            },
            { title: 'Dispensers Setting', href: '/dispensers', icon: Fuel },
        ],
    },
    {
        title: 'Customer',
        icon: Users,
        children: [
            { title: 'Customers', href: '/customers', icon: Users },
            { title: 'Vehicles', href: '/vehicles', icon: Car },
            {
                title: 'Customer Details Bill',
                href: '/customer-details-bill',
                icon: FileText,
            },
            {
                title: 'Customer Summary Bill',
                href: '/customer-summary-bill',
                icon: FileText,
            },
            {
                title: 'Customer Ledger Summary',
                href: '/customer-ledger-summary',
                icon: BarChart3,
            },
            {
                title: 'Daily Statement Report',
                href: '/daily-statement',
                icon: BarChart3,
            },
        ],
    },
    {
        title: 'Supplier',
        icon: Truck,
        children: [{ title: 'Suppliers', href: '/suppliers', icon: Truck }],
    },
    {
        title: 'Products',
        icon: Package,
        children: [
            { title: 'Products', href: '/products', icon: Package },
            {
                title: 'Product Rates',
                href: '/product-rates',
                icon: DollarSign,
            },
            { title: 'Categories', href: '/categories', icon: Package },
            { title: 'Units', href: '/units', icon: Package },
        ],
    },
    {
        title: 'Product Stock',
        icon: Warehouse,
        children: [
            { title: 'Stocks', href: '/stocks', icon: Package },
            {
                title: 'Today Stock Report',
                href: '/stock-report',
                icon: BarChart3,
            },
        ],
    },
    {
        title: 'Purchase',
        icon: ShoppingCart,
        children: [
            { title: 'Purchase', href: '/purchases', icon: ShoppingCart },
            {
                title: 'Purchase Report Details',
                href: '/purchase-report-details',
                icon: FileText,
            },
        ],
    },
    {
        title: 'Sales',
        icon: DollarSign,
        children: [
            { title: 'Sales', href: '/sales', icon: DollarSign },
            {
                title: 'Customer Sales Reports',
                href: '/customer-wise-sales-reports',
                icon: BarChart3,
            },
        ],
    },
    {
        title: 'Accounts',
        icon: Database,
        children: [
            { title: 'Groups', href: '/groups', icon: Database },
            { title: 'Accounts', href: '/accounts', icon: Database },
            {
                title: 'General Ledger',
                href: '/general-ledger',
                icon: BarChart3,
            },
            {
                title: 'Cash Book Ledger',
                href: '/cash-book-ledger',
                icon: BarChart3,
            },
            {
                title: 'Bank Book Ledger',
                href: '/bank-book-ledger',
                icon: BarChart3,
            },
            // {
            //     title: 'Journal Voucher',
            //     href: '#',
            //     icon: FileText,
            // },
            {
                title: 'Received Voucher',
                href: '/vouchers/received',
                icon: FileText,
            },
            {
                title: 'Payment Voucher',
                href: '/vouchers/payment',
                icon: FileText,
            },
            {
                title: 'Office Payment',
                href: '/office-payments',
                icon: CreditCard,
            },
        ],
    },
    {
        title: 'Employee',
        icon: UserCheck,
        children: [
            { title: 'Employees', href: '/employees', icon: UserCheck },
            { title: 'Employee Type', href: '/emp-types', icon: Users },
            { title: 'Department', href: '/emp-departments', icon: Building },
            {
                title: 'Designation',
                href: '/emp-designations',
                icon: UserCheck,
            },
        ],
    },
    {
        title: 'User Management',
        icon: Shield,
        children: [
            { title: 'Users', href: '/users', icon: Users },
            { title: 'Roles', href: '/roles', icon: Shield },
            { title: 'Permissions', href: '/permissions', icon: Shield },
        ],
    },
];

export function AppSidebar() {
    const [openDropdowns, setOpenDropdowns] = useState<string[]>([]);
    const { url } = usePage();

    const toggleDropdown = (title: string) => {
        setOpenDropdowns((prev) =>
            prev.includes(title)
                ? prev.filter((item) => item !== title)
                : [title],
        );
    };

    const isActive = (href: string) => {
        if (href === '/' || href === '/dashboard')
            return url === '/' || url === '/dashboard';
        return url.startsWith(href);
    };

    const isParentActive = (children: any[]) => {
        return children.some((child) => isActive(child.href));
    };

    useEffect(() => {
        const activeParents = mainNavItems
            .filter((item) => item.children && isParentActive(item.children))
            .map((item) => item.title);
        setOpenDropdowns((prev) => [...new Set([...prev, ...activeParents])]);
    }, [url]);

    return (
        <Sidebar collapsible="icon" variant="inset" className="h-screen w-72">
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href={dashboard()} prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent className="scrollbar-ultra-thin overflow-y-auto px-4">
                <nav className="space-y-1">
                    {mainNavItems.map((item, index) => (
                        <div key={index}>
                            {item.children ? (
                                <div>
                                    <button
                                        onClick={() =>
                                            toggleDropdown(item.title)
                                        }
                                        className={`flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                                            isParentActive(item.children)
                                                ? 'bg-indigo-600 text-white'
                                                : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                        }`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        <span className="ml-1 flex-1 text-left">
                                            {item.title}
                                        </span>
                                        <ChevronDown
                                            className={`h-4 w-4 transition-transform ${
                                                openDropdowns.includes(
                                                    item.title,
                                                )
                                                    ? 'rotate-180'
                                                    : ''
                                            }`}
                                        />
                                    </button>
                                    <div
                                        className={`mt-1 ml-8 space-y-1 overflow-hidden transition-all duration-300 ease-in-out ${
                                            openDropdowns.includes(item.title)
                                                ? 'max-h-[500px] opacity-100'
                                                : 'max-h-0 opacity-0'
                                        }`}
                                    >
                                        {item.children.map(
                                            (child, childIndex) => (
                                                <Link
                                                    key={childIndex}
                                                    href={child.href}
                                                    className={`relative flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                                                        isActive(child.href)
                                                            ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200'
                                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100'
                                                    }`}
                                                >
                                                    <span
                                                        className={`h-2 w-2 flex-shrink-0 rounded-full ${
                                                            isActive(child.href)
                                                                ? 'bg-indigo-500'
                                                                : 'bg-gray-400 dark:bg-gray-500'
                                                        }`}
                                                    ></span>
                                                    <span>{child.title}</span>
                                                </Link>
                                            ),
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <Link
                                    href={item.href || '#'}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition-colors ${
                                        isActive(item.href || '#')
                                            ? 'bg-indigo-600 text-white'
                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800'
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    <span className="ml-1">{item.title}</span>
                                </Link>
                            )}
                        </div>
                    ))}
                </nav>
            </SidebarContent>
        </Sidebar>
    );
}
