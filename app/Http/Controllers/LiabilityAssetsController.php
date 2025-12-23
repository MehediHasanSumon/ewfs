<?php

namespace App\Http\Controllers;

use App\Models\Purchase;
use App\Models\Voucher;
use App\Models\Account;
use App\Models\CompanySetting;
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

        $liabilities = collect([
            [
                'name' => 'Purchase Due',
                'group_name' => 'Accounts Payable',
                'balance' => $purchaseDue,
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

        $liabilities = collect([
            [
                'name' => 'Purchase Due',
                'group_name' => 'Accounts Payable',
                'balance' => $purchaseDue
            ]
        ]);

        // Get asset data
        $assets = Account::whereIn('group_code', ['100010001', '100010002', '100010003'])
            ->with('group')
            ->get()
            ->map(function($account) {
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