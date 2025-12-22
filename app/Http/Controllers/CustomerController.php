<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Account;
use App\Models\Group;
use App\Models\Vehicle;
use App\Models\Product;
use App\Models\CompanySetting;
use App\Helpers\AccountHelper;
use App\Helpers\CustomerHelper;
use App\Models\CreditSale;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class CustomerController extends Controller
{
    public function index(Request $request)
    {
        $query = Customer::select('id', 'account_id', 'code', 'name', 'mobile', 'email', 'nid_number', 'vat_reg_no', 'tin_no', 'trade_license', 'discount_rate', 'security_deposit', 'credit_limit', 'address', 'status', 'created_at')
            ->with('account:id,name,ac_number,group_id', 'account.group:id,code,name');

        // Apply filters
        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('code', 'like', '%' . $request->search . '%')
                    ->orWhere('mobile', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status === 'active');
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        // Paginate
        $perPage = $request->get('per_page', 10);
        $customers = $query->paginate($perPage)->withQueryString()->through(function ($customer) {
            // Calculate total sales for this customer
            $totalSales = CreditSale::where('customer_id', $customer->id)->sum('total_amount');

            // Calculate total paid for this customer
            $totalPaid = 0;
            if ($customer->account) {
                $totalPaid = Voucher::join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
                    ->where('vouchers.voucher_type', 'Receipt')
                    ->where('vouchers.from_account_id', $customer->account->id)
                    ->sum('transactions.amount');
            }

            // Calculate current due/advanced (Total Sales - Total Paid)
            $currentDue = $totalSales - $totalPaid;

            return [
                'id' => $customer->id,
                'account_id' => $customer->account_id,
                'code' => $customer->code,
                'name' => $customer->name,
                'mobile' => $customer->mobile,
                'email' => $customer->email,
                'nid_number' => $customer->nid_number,
                'vat_reg_no' => $customer->vat_reg_no,
                'tin_no' => $customer->tin_no,
                'trade_license' => $customer->trade_license,
                'discount_rate' => $customer->discount_rate,
                'security_deposit' => $customer->security_deposit,
                'credit_limit' => $customer->credit_limit,
                'address' => $customer->address,
                'status' => $customer->status,
                'account' => $customer->account,
                'total_sales' => $totalSales,
                'total_paid' => $totalPaid,
                'current_due' => $currentDue,
                'created_at' => $customer->created_at->format('Y-m-d'),
            ];
        });

        $groups = Group::where('status', true)->get(['id', 'code', 'name']);
        $products = Product::where('status', 1)->get(['id', 'product_name as name']);

        // Get last customer's group for auto selection
        $lastCustomerGroup = null;
        $lastCustomer = Customer::with('account.group')->latest()->first();
        if ($lastCustomer && $lastCustomer->account && $lastCustomer->account->group) {
            $lastCustomerGroup = [
                'id' => $lastCustomer->account->group->id,
                'code' => $lastCustomer->account->group->code
            ];
        }

        return Inertia::render('Customers/Customers', [
            'customers' => $customers,
            'groups' => $groups,
            'products' => $products,
            'lastCustomerGroup' => $lastCustomerGroup,
            'filters' => $request->only(['search', 'status', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:150',
            'mobile' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:50',
            'nid_number' => 'nullable|string|max:100',
            'vat_reg_no' => 'nullable|string|max:100',
            'tin_no' => 'nullable|string|max:100',
            'trade_license' => 'nullable|string|max:100',
            'discount_rate' => 'nullable|numeric|min:0',
            'security_deposit' => 'nullable|numeric|min:0',
            'credit_limit' => 'nullable|numeric|min:0',
            'previous_due' => 'nullable|numeric|min:0',
            'address' => 'nullable|string',
            'status' => 'boolean',
            'product_ids' => 'nullable|array',
            'product_ids.*' => 'exists:products,id',
            'vehicle_type' => 'nullable|string|max:150',
            'vehicle_name' => 'nullable|string|max:150',
            'vehicle_number' => 'nullable|string|max:50',
            'reg_date' => 'nullable|date'
        ]);

        $account = Account::create([
            'name' => $request->name,
            'ac_number' => AccountHelper::generateAccountNumber(),
            'group_id' => 7,
            'group_code' => '100020001',
            'status' => $request->status ?? true,
        ]);

        $customer = Customer::create([
            'account_id' => $account->id,
            'code' => CustomerHelper::generateCustomerCode(),
            'name' => $request->name,
            'mobile' => $request->mobile,
            'email' => $request->email,
            'nid_number' => $request->nid_number,
            'vat_reg_no' => $request->vat_reg_no,
            'tin_no' => $request->tin_no,
            'trade_license' => $request->trade_license,
            'discount_rate' => $request->discount_rate ?? 0,
            'security_deposit' => $request->security_deposit ?? 0,
            'credit_limit' => $request->credit_limit ?? 0,
            'address' => $request->address,
            'status' => $request->status ?? true,
        ]);

        if ($request->product_ids || $request->vehicle_type || $request->vehicle_name || $request->vehicle_number) {
            $vehicle = Vehicle::create([
                'customer_id' => $customer->id,
                'vehicle_type' => $request->vehicle_type,
                'vehicle_name' => $request->vehicle_name,
                'vehicle_number' => $request->vehicle_number,
                'reg_date' => $request->reg_date,
                'status' => $request->status ?? true,
            ]);

            if ($request->product_ids) {
                $vehicle->products()->attach($request->product_ids);
            }
        }

        if ($request->previous_due && $request->previous_due > 0) {
            CreditSale::create([
                'customer_id' => $customer->id,
                'total_amount' => $request->previous_due,
                'due_amount' => $request->previous_due,
                'type' => 'previous',
                'remarks' => 'Previous Due',
                'status' => true,
            ]);
        }

        return redirect()->back()->with('success', 'Customer created successfully.');
    }

    public function show(Customer $customer)
    {
        $customer->load([
            'account:id,name,ac_number',
            'vehicles:id,customer_id,vehicle_number,vehicle_name,vehicle_type,reg_date',
            'vehicles.products:id,product_name'
        ]);

        $recentPayments = [];
        if ($customer->account) {
            $recentPayments = Voucher::join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
                ->join('payment_sub_types', 'vouchers.payment_sub_type_id', '=', 'payment_sub_types.id')
                ->where('vouchers.voucher_type', 'Receipt')
                ->where('vouchers.from_account_id', $customer->account->id)
                ->select(
                    'vouchers.id',
                    'vouchers.voucher_no',
                    'vouchers.date',
                    'transactions.amount',
                    'transactions.payment_type as type',
                    'payment_sub_types.name as sub_type',
                    'vouchers.description',
                    \DB::raw("'Received' as status")
                )
                ->orderBy('vouchers.date', 'desc')
                ->limit(5)
                ->get();
        }

        $recentSales = CreditSale::where('customer_id', $customer->id)
            ->where('type', 'regular')
            ->with('vehicle:id,vehicle_number')
            ->orderBy('sale_date', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'date' => $sale->sale_date,
                    'amount' => $sale->total_amount,
                    'quantity' => $sale->quantity,
                    'vehicle_number' => $sale->vehicle->vehicle_number ?? 'N/A',
                    'invoice_no' => $sale->invoice_no,
                    'status' => $sale->status,
                ];
            });

        $totalSales = CreditSale::where('customer_id', $customer->id)
            ->sum('total_amount');

        $salesCount = CreditSale::where('customer_id', $customer->id)
            ->count();

        $totalPaid = 0;
        $paymentCount = 0;
        if ($customer->account) {
            $totalPaid = Voucher::join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
                ->where('vouchers.voucher_type', 'Receipt')
                ->where('vouchers.from_account_id', $customer->account->id)
                ->sum('transactions.amount');

            $paymentCount = Voucher::where('voucher_type', 'Receipt')
                ->where('from_account_id', $customer->account->id)
                ->count();
        }

        $currentDue = $totalSales - $totalPaid;

        return Inertia::render('Customers/CustomerDetails', [
            'customer' => [
                'id' => $customer->id,
                'code' => $customer->code,
                'name' => $customer->name,
                'mobile' => $customer->mobile,
                'email' => $customer->email,
                'nid_number' => $customer->nid_number,
                'vat_reg_no' => $customer->vat_reg_no,
                'tin_no' => $customer->tin_no,
                'trade_license' => $customer->trade_license,
                'discount_rate' => $customer->discount_rate,
                'security_deposit' => $customer->security_deposit,
                'credit_limit' => $customer->credit_limit,
                'address' => $customer->address,
                'status' => $customer->status,
                'account' => $customer->account,
                'vehicles' => $customer->vehicles,
                'created_at' => $customer->created_at->format('Y-m-d H:i:s'),
            ],
            'recentPayments' => $recentPayments,
            'recentSales' => $recentSales,
            'totalSales' => $totalSales,
            'salesCount' => $salesCount,
            'totalPaid' => $totalPaid,
            'paymentCount' => $paymentCount,
            'currentDue' => $currentDue
        ]);
    }

    public function statement(Request $request, Customer $customer)
    {
        $customer->load('account:id,name,ac_number');

        $year = $request->get('year', date('Y'));

        $sales = CreditSale::where('customer_id', $customer->id)
            ->with('vehicle:id,vehicle_number')
            ->orderBy('sale_date', 'desc')
            ->get()
            ->map(function ($sale) {
                return [
                    'id' => $sale->id,
                    'date' => $sale->sale_date,
                    'type' => 'Sale',
                    'description' => 'Credit Sale - ' . ($sale->vehicle->vehicle_number ?? 'N/A'),
                    'debit' => $sale->total_amount,
                    'credit' => 0,
                    'invoice_no' => $sale->invoice_no,
                ];
            });

        $payments = [];
        if ($customer->account) {
            $payments = Voucher::join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
                ->where('vouchers.voucher_type', 'Receipt')
                ->where('vouchers.from_account_id', $customer->account->id)
                ->orderBy('vouchers.date', 'desc')
                ->select('vouchers.*', 'transactions.amount')
                ->get()
                ->map(function ($voucher) {
                    return [
                        'id' => $voucher->id,
                        'date' => $voucher->date,
                        'type' => 'Payment',
                        'description' => 'Payment Received - ' . ($voucher->remarks ?? 'N/A'),
                        'debit' => 0,
                        'credit' => $voucher->amount,
                        'voucher_no' => $voucher->voucher_no,
                    ];
                });
        }

        $transactions = collect($sales)->merge($payments)->sortByDesc('date')->values();

        $balance = 0;
        $transactions = $transactions->map(function ($transaction) use (&$balance) {
            $balance += $transaction['debit'] - $transaction['credit'];
            $transaction['balance'] = $balance;
            return $transaction;
        });

        $monthlySales = CreditSale::where('customer_id', $customer->id)
            ->whereYear('sale_date', $year)
            ->selectRaw('YEAR(sale_date) as year, MONTH(sale_date) as month, SUM(total_amount) as total')
            ->groupBy('year', 'month')
            ->orderBy('month', 'asc')
            ->get()
            ->map(function ($sale) {
                return [
                    'month' => date('F Y', mktime(0, 0, 0, $sale->month, 1, $sale->year)),
                    'total' => $sale->total
                ];
            });

        $availableYears = CreditSale::where('customer_id', $customer->id)
            ->selectRaw('DISTINCT YEAR(sale_date) as year')
            ->orderBy('year', 'desc')
            ->pluck('year')
            ->toArray();

        $recentPayments = collect([]);
        if ($customer->account) {
            $query = Voucher::join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
                ->where('vouchers.voucher_type', 'Receipt')
                ->where('vouchers.from_account_id', $customer->account->id)
                ->select('vouchers.*', 'transactions.amount');

            if ($request->start_date) {
                $query->whereDate('vouchers.date', '>=', $request->start_date);
            }
            if ($request->end_date) {
                $query->whereDate('vouchers.date', '<=', $request->end_date);
            }

            $recentPayments = $query->orderBy('vouchers.date', 'desc')
                ->paginate(10)
                ->withQueryString()
                ->through(function ($voucher) {
                    return [
                        'id' => $voucher->id,
                        'date' => $voucher->date,
                        'amount' => $voucher->amount,
                        'remarks' => $voucher->remarks,
                    ];
                });
        }

        return Inertia::render('Customers/CustomerStatement', [
            'customer' => [
                'id' => $customer->id,
                'code' => $customer->code,
                'name' => $customer->name,
                'mobile' => $customer->mobile,
                'address' => $customer->address,
                'security_deposit' => $customer->security_deposit,
                'account' => $customer->account,
            ],
            'transactions' => $transactions,
            'currentBalance' => $balance,
            'monthlySales' => $monthlySales,
            'availableYears' => $availableYears,
            'recentPayments' => $recentPayments
        ]);
    }

    public function update(Request $request, Customer $customer)
    {
        $request->validate([
            'code' => 'nullable|string|max:150',
            'name' => 'required|string|max:150',
            'mobile' => 'nullable|string|max:100',
            'email' => 'nullable|email|max:50',
            'nid_number' => 'nullable|string|max:100',
            'vat_reg_no' => 'nullable|string|max:100',
            'tin_no' => 'nullable|string|max:100',
            'trade_license' => 'nullable|string|max:100',
            'discount_rate' => 'nullable|numeric|min:0',
            'security_deposit' => 'nullable|numeric|min:0',
            'credit_limit' => 'nullable|numeric|min:0',
            'previous_due' => 'nullable|numeric|min:0',
            'address' => 'nullable|string',
            'status' => 'boolean'
        ]);

        if ($customer->account) {
            $customer->account->update([
                'name' => $request->name,
                'status' => $request->status ?? true,
            ]);
        }

        $customer->update([
            'code' => $request->code,
            'name' => $request->name,
            'mobile' => $request->mobile,
            'email' => $request->email,
            'nid_number' => $request->nid_number,
            'vat_reg_no' => $request->vat_reg_no,
            'tin_no' => $request->tin_no,
            'trade_license' => $request->trade_license,
            'discount_rate' => $request->discount_rate ?? 0,
            'security_deposit' => $request->security_deposit ?? 0,
            'credit_limit' => $request->credit_limit ?? 0,
            'address' => $request->address,
            'status' => $request->status ?? true,
        ]);

        if ($request->previous_due && $request->previous_due > 0) {
            CreditSale::create([
                'customer_id' => $customer->id,
                'total_amount' => $request->previous_due,
                'due_amount' => $request->previous_due,
                'type' => 'previous',
                'remarks' => 'Previous Due',
                'status' => true,
            ]);
        }

        return redirect()->back()->with('success', 'Customer updated successfully.');
    }

    public function destroy(Customer $customer)
    {
        $customer->delete();
        return redirect()->back()->with('success', 'Customer deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:customers,id'
        ]);

        Customer::whereIn('id', $request->ids)->delete();

        return redirect()->back()->with('success', count($request->ids) . ' customers deleted successfully.');
    }

    public function downloadPdf(Request $request)
    {
        $query = Customer::select('id', 'account_id', 'code', 'name', 'mobile', 'email', 'status', 'created_at')
            ->with('account:id,name,ac_number');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                    ->orWhere('code', 'like', '%' . $request->search . '%')
                    ->orWhere('mobile', 'like', '%' . $request->search . '%')
                    ->orWhere('email', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->status && $request->status !== 'all') {
            $query->where('status', $request->status === 'active');
        }

        $sortBy = $request->get('sort_by', 'created_at');
        $sortOrder = $request->get('sort_order', 'desc');
        $query->orderBy($sortBy, $sortOrder);

        $customers = $query->get()->map(function ($customer) {
            $totalSales = CreditSale::where('customer_id', $customer->id)->sum('total_amount');

            $totalPaid = 0;
            if ($customer->account) {
                $totalPaid = Voucher::join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
                    ->where('vouchers.voucher_type', 'Receipt')
                    ->where('vouchers.from_account_id', $customer->account->id)
                    ->sum('transactions.amount');
            }

            $currentDue = $totalSales - $totalPaid;

            $customer->total_sales = $totalSales;
            $customer->total_paid = $totalPaid;
            $customer->current_due = $currentDue;

            return $customer;
        });

        $companySetting = CompanySetting::first();

        $pdf = Pdf::loadView('pdf.customers', compact('customers', 'companySetting'));
        return $pdf->stream('customers.pdf');
    }

    public function downloadSalesPdf(Request $request, Customer $customer)
    {
        $customer->load('account');

        $year = $request->get('year', date('Y'));

        $monthlySales = CreditSale::where('customer_id', $customer->id)
            ->where('type', 'regular')
            ->whereYear('sale_date', $year)
            ->selectRaw('YEAR(sale_date) as year, MONTH(sale_date) as month, SUM(total_amount) as total')
            ->groupBy('year', 'month')
            ->orderBy('month', 'asc')
            ->get()
            ->map(function ($sale) {
                return [
                    'month' => date('F Y', mktime(0, 0, 0, $sale->month, 1, $sale->year)),
                    'total' => $sale->total
                ];
            });

        $companySetting = CompanySetting::first();

        $pdf = Pdf::loadView('pdf.customer-sales', compact('customer', 'monthlySales', 'year', 'companySetting'));
        return $pdf->stream('customer-sales.pdf');
    }

    public function downloadPaymentsPdf(Request $request, Customer $customer)
    {
        $customer->load('account');

        $query = Voucher::join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->where('vouchers.voucher_type', 'Receipt')
            ->where('vouchers.from_account_id', $customer->account->id)
            ->select('vouchers.*', 'transactions.amount', 'transactions.payment_type');

        if ($request->start_date) {
            $query->whereDate('vouchers.date', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $query->whereDate('vouchers.date', '<=', $request->end_date);
        }

        $payments = $query->orderBy('vouchers.date', 'desc')
            ->get()
            ->map(function ($voucher) {
                return [
                    'id' => $voucher->id,
                    'date' => $voucher->date,
                    'amount' => $voucher->amount,
                    'payment_type' => $voucher->payment_type,
                    'remarks' => $voucher->remarks,
                ];
            });

        $companySetting = CompanySetting::first();

        $pdf = Pdf::loadView('pdf.customer-payments', compact('customer', 'payments', 'companySetting'));
        return $pdf->stream('customer-payments.pdf');
    }
}
