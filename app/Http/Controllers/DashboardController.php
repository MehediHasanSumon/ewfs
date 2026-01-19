<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Account;
use App\Models\Sale;
use App\Models\OfficePayment;
use App\Models\Transaction;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function index()
    {
        // Cash in Hand - Cash account balance
        $cashInHand = Account::where('name', 'LIKE', '%cash%')
            ->orWhere('name', 'LIKE', '%Cash%')
            ->sum('total_amount');

        // Outstanding Balance - Total due amounts from customers
        $outstandingBalance = Account::whereHas('customer')
            ->sum('due_amount');

        // Cash Sale - Today's cash sales
        $cashSale = Sale::whereDate('sale_date', today())
            ->sum('paid_amount');

        // Office Expenses - Today's office payments
        $officeExpenses = OfficePayment::whereDate('date', today())
            ->join('transactions', 'office_payments.transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');

        return Inertia::render('dashboard', [
            'stats' => [
                'cashInHand' => $cashInHand,
                'outstandingBalance' => $outstandingBalance,
                'cashSale' => $cashSale,
                'officeExpenses' => $officeExpenses
            ]
        ]);
    }
}