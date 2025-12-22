<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class CashBookLedgerController extends Controller
{
    public function index(Request $request)
    {
        $startDate = $request->start_date ?? date('Y-m-d');
        $endDate = $request->end_date ?? date('Y-m-d');

        // Get cash accounts (assuming cash accounts have specific group or name pattern)
        $cashAccounts = Account::with('group')
            ->where('status', true)
            ->where(function($query) {
                $query->where('name', 'like', '%cash%')
                      ->orWhere('name', 'like', '%Cash%')
                      ->orWhereHas('group', function($q) {
                          $q->where('name', 'like', '%cash%')
                            ->orWhere('name', 'like', '%Cash%');
                      });
            })
            ->get();

        $ledgers = [];

        foreach ($cashAccounts as $account) {
            // Get all transactions for this cash account
            $transactions = DB::table('transactions')
                ->where('ac_number', $account->ac_number)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->orderBy('transaction_date', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

            // Calculate running balance
            $runningBalance = 0;
            $processedTransactions = $transactions->map(function ($transaction) use (&$runningBalance) {
                if ($transaction->transaction_type === 'Dr') {
                    $runningBalance -= $transaction->amount;
                } else {
                    $runningBalance += $transaction->amount;
                }
                $transaction->balance = $runningBalance;
                return $transaction;
            });

            if ($processedTransactions->count() > 0) {
                $ledgers[] = [
                    'account' => $account,
                    'transactions' => $processedTransactions,
                    'total_debit' => $processedTransactions->where('transaction_type', 'Dr')->sum('amount'),
                    'total_credit' => $processedTransactions->where('transaction_type', 'Cr')->sum('amount'),
                    'closing_balance' => $runningBalance
                ];
            }
        }

        return Inertia::render('CashBookLedger/Index', [
            'ledgers' => $ledgers,
            'filters' => $request->only(['start_date', 'end_date'])
        ]);
    }

    public function downloadPdf(Request $request)
    {
        $startDate = $request->start_date ?? date('Y-m-d');
        $endDate = $request->end_date ?? date('Y-m-d');

        $cashAccounts = Account::with('group')
            ->where('status', true)
            ->where(function($query) {
                $query->where('name', 'like', '%cash%')
                      ->orWhere('name', 'like', '%Cash%')
                      ->orWhereHas('group', function($q) {
                          $q->where('name', 'like', '%cash%')
                            ->orWhere('name', 'like', '%Cash%');
                      });
            })
            ->get();

        $ledgers = [];

        foreach ($cashAccounts as $account) {
            $transactions = DB::table('transactions')
                ->where('ac_number', $account->ac_number)
                ->whereBetween('transaction_date', [$startDate, $endDate])
                ->orderBy('transaction_date', 'asc')
                ->orderBy('created_at', 'asc')
                ->get();

            $runningBalance = 0;
            $processedTransactions = $transactions->map(function ($transaction) use (&$runningBalance) {
                if ($transaction->transaction_type === 'Dr') {
                    $runningBalance -= $transaction->amount;
                } else {
                    $runningBalance += $transaction->amount;
                }
                $transaction->balance = $runningBalance;
                return $transaction;
            });

            if ($processedTransactions->count() > 0) {
                $ledgers[] = [
                    'account' => $account,
                    'transactions' => $processedTransactions,
                    'total_debit' => $processedTransactions->where('transaction_type', 'Dr')->sum('amount'),
                    'total_credit' => $processedTransactions->where('transaction_type', 'Cr')->sum('amount'),
                    'closing_balance' => $runningBalance
                ];
            }
        }

        $companySetting = CompanySetting::first();

        $pdf = Pdf::loadView('pdf.cash-book-ledger', compact('ledgers', 'companySetting', 'startDate', 'endDate'));
        return $pdf->stream('cash-book-ledger.pdf');
    }
}