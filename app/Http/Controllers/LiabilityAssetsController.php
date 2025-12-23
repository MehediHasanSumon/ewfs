<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\Voucher;
use App\Models\Account;
use App\Models\CompanySetting;
use App\Models\CreditSale;
use App\Models\Customer;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class LiabilityAssetsController extends Controller
{
    public function index(Request $request)
    {
        // Calculate Purchase Due (total purchases - total supplier payments)
        $totalPurchases = Purchase::sum('net_total_amount');

        // Calculate total payments to suppliers through vouchers
        $totalSupplierPayments = Voucher::join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->join('suppliers', 'vouchers.to_account_id', '=', 'suppliers.account_id')
            ->where('vouchers.voucher_type', 'Payment')
            ->sum('transactions.amount');

        $purchaseDue = $totalPurchases - $totalSupplierPayments;
        $purchaseDue = $purchaseDue > 0 ? $purchaseDue : 0;

        // Calculate Customer Advance (total customer payments - total credit sales)
        $totalCreditSales = CreditSale::sum('total_amount');
        $totalCustomerPayments = Voucher::join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->join('customers', 'vouchers.from_account_id', '=', 'customers.account_id')
            ->where('vouchers.voucher_type', 'Receipt')
            ->sum('transactions.amount');
        $customerAdvance = $totalCustomerPayments - $totalCreditSales;
        $customerAdvance = $customerAdvance > 0 ? $customerAdvance : 0;

        // Calculate Customer Security
        $customerSecurity = Customer::sum('security_deposit');

        // Calculate Bank Loan (total loan received - total loan payments)
        $bankLoanAccounts = Account::where('group_code', '400010002')->pluck('id');
        $totalLoanReceived = Voucher::whereIn('to_account_id', $bankLoanAccounts)
            ->where('voucher_type', 'Receipt')
            ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');
        $totalLoanReceived += Voucher::whereIn('from_account_id', $bankLoanAccounts)
            ->where('voucher_type', 'Receipt')
            ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');
        $totalLoanPayments = Voucher::whereIn('from_account_id', $bankLoanAccounts)
            ->where('voucher_type', 'Payment')
            ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');
        $totalLoanPayments += Voucher::whereIn('to_account_id', $bankLoanAccounts)
            ->where('voucher_type', 'Payment')
            ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');
        $bankLoan = $totalLoanReceived - $totalLoanPayments;
        $bankLoan = $bankLoan > 0 ? $bankLoan : 0;

        $liabilities = collect([
            [
                'name' => 'Purchase Due',
                'group_name' => 'Accounts Payable',
                'balance' => $purchaseDue,
                'type' => 'Liability'
            ],
            [
                'name' => 'Customer Advance',
                'group_name' => 'Current Liabilities',
                'balance' => $customerAdvance,
                'type' => 'Liability'
            ],
            [
                'name' => 'Customer Security',
                'group_name' => 'Current Liabilities',
                'balance' => $customerSecurity,
                'type' => 'Liability'
            ],
            [
                'name' => 'Bank Loan',
                'group_name' => 'Long Term Liabilities',
                'balance' => $bankLoan,
                'type' => 'Liability'
            ]
        ]);

        $assets = collect([]);

        return Inertia::render('LiabilityAssets/Index', [
            'liabilities' => $liabilities,
            'assets' => $assets,
            'totalLiabilities' => $liabilities->sum('balance'),
            'totalAssets' => $assets->sum('balance')
        ]);
    }

    public function downloadPdf(Request $request)
    {
        // Calculate liability amounts from voucher transactions
        $totalPurchases = Purchase::sum('net_total_amount');
        $totalSupplierPayments = Voucher::join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->join('suppliers', 'vouchers.to_account_id', '=', 'suppliers.account_id')
            ->where('vouchers.voucher_type', 'Payment')
            ->sum('transactions.amount');
        $purchaseDue = $totalPurchases - $totalSupplierPayments;
        $purchaseDue = $purchaseDue > 0 ? $purchaseDue : 0;

        // Calculate Customer Security
        $customerSecurity = Customer::sum('security_deposit');

        // Calculate Bank Loan
        $bankLoanAccounts = Account::where('group_code', '400010002')->pluck('id');
        $totalLoanReceived = Voucher::whereIn('to_account_id', $bankLoanAccounts)
            ->where('voucher_type', 'Receipt')
            ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');
        $totalLoanReceived += Voucher::whereIn('from_account_id', $bankLoanAccounts)
            ->where('voucher_type', 'Receipt')
            ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');
        $totalLoanPayments = Voucher::whereIn('from_account_id', $bankLoanAccounts)
            ->where('voucher_type', 'Payment')
            ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');
        $totalLoanPayments += Voucher::whereIn('to_account_id', $bankLoanAccounts)
            ->where('voucher_type', 'Payment')
            ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');
        $bankLoan = $totalLoanReceived - $totalLoanPayments;
        $bankLoan = $bankLoan > 0 ? $bankLoan : 0;

        $liabilities = collect([
            [
                'name' => 'Purchase Due',
                'group_name' => 'Accounts Payable',
                'balance' => $purchaseDue
            ],
            [
                'name' => 'Customer Security',
                'group_name' => 'Current Liabilities',
                'balance' => $customerSecurity
            ],
            [
                'name' => 'Bank Loan',
                'group_name' => 'Long Term Liabilities',
                'balance' => $bankLoan
            ]
        ]);

        // Get asset data
        $assets = Account::whereIn('group_code', ['100010001', '100010002', '100010003'])
            ->with('group')
            ->get()
            ->map(function ($account) {
                return [
                    'name' => $account->name,
                    'ac_number' => $account->ac_number,
                    'group_name' => $account->group->name ?? 'N/A',
                    'balance' => $account->opening_balance ?? 0
                ];
            });

        $companySetting = CompanySetting::first();
        $totalLiabilities = $liabilities->sum('balance');
        $totalAssets = $assets->sum('balance');

        $pdf = Pdf::loadView('pdf.liability-assets', compact('liabilities', 'assets', 'totalLiabilities', 'totalAssets', 'companySetting'));
        return $pdf->stream('liability-assets.pdf');
    }
}
