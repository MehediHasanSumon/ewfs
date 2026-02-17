<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\CompanySetting;
use App\Models\IsShiftClose;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Routing\Controllers\Middleware;
use Illuminate\Routing\Controllers\HasMiddleware;

class CashBookLedgerController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('permission:view-account', only: ['index', 'show']),
            new Middleware('permission:view-account|can-account-download', only: ['downloadPdf', 'downloadShiftPdf']),
        ];
    }
    public function index(Request $request)
    {
        $query = IsShiftClose::with('shift');

        if ($request->shift_id) {
            $query->where('shift_id', $request->shift_id);
        }

        if ($request->start_date) {
            $query->whereDate('close_date', '>=', $request->start_date);
        }

        if ($request->end_date) {
            $query->whereDate('close_date', '<=', $request->end_date);
        }

        $query->orderBy('close_date', 'desc');

        $closedShifts = $query->get();

        $closedShifts->transform(function ($item) {
            $item->daily_reading = DB::table('daily_readings')
                ->where('shift_id', $item->shift_id)
                ->whereDate('date', $item->close_date)
                ->first();
            return $item;
        });

        $shifts = Shift::where('status', true)->get();

        return Inertia::render('CashBookLedger/Index', [
            'closedShifts' => $closedShifts,
            'shifts' => $shifts,
            'filters' => $request->only(['shift_id', 'start_date', 'end_date'])
        ]);
    }

    public function show($id)
    {
        $shiftClosed = IsShiftClose::with('shift')->findOrFail($id);

        $cashTransactions = DB::table('vouchers')
            ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->join('accounts as from_account', 'vouchers.from_account_id', '=', 'from_account.id')
            ->join('accounts as to_account', 'vouchers.to_account_id', '=', 'to_account.id')
            ->join('payment_sub_types', 'vouchers.payment_sub_type_id', '=', 'payment_sub_types.id')
            ->where('vouchers.shift_id', $shiftClosed->shift_id)
            ->whereDate('vouchers.date', $shiftClosed->close_date)
            ->select(
                'vouchers.*',
                'transactions.transaction_time',
                'transactions.transaction_type',
                'transactions.amount',
                'from_account.name as from_account_name',
                'to_account.name as to_account_name',
                'payment_sub_types.name as payment_type'
            )
            ->orderBy('transactions.transaction_time', 'asc')
            ->get();

        return Inertia::render('CashBookLedger/Show', [
            'shiftClosed' => $shiftClosed,
            'cashTransactions' => $cashTransactions
        ]);
    }

    public function downloadShiftPdf($id)
    {
        $shiftClosed = IsShiftClose::with('shift')->findOrFail($id);

        $cashTransactions = DB::table('vouchers')
            ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
            ->join('accounts as from_account', 'vouchers.from_account_id', '=', 'from_account.id')
            ->join('accounts as to_account', 'vouchers.to_account_id', '=', 'to_account.id')
            ->join('payment_sub_types', 'vouchers.payment_sub_type_id', '=', 'payment_sub_types.id')
            ->where('vouchers.shift_id', $shiftClosed->shift_id)
            ->whereDate('vouchers.date', $shiftClosed->close_date)
            ->select(
                'vouchers.*',
                'transactions.transaction_time',
                'transactions.transaction_type',
                'transactions.amount',
                'from_account.name as from_account_name',
                'to_account.name as to_account_name',
                'payment_sub_types.name as payment_type'
            )
            ->orderBy('transactions.transaction_time', 'asc')
            ->get();

        $companySetting = CompanySetting::first();

        $pdf = Pdf::loadView('pdf.cash-book-shift', compact('shiftClosed', 'cashTransactions', 'companySetting'));
        return $pdf->stream('cash-book-' . $shiftClosed->shift->name . '-' . $shiftClosed->close_date . '.pdf');
    }

    public function downloadPdf(Request $request)
    {
        $startDate = $request->start_date ?? date('Y-m-d');
        $endDate = $request->end_date ?? date('Y-m-d');

        $cashAccounts = Account::with('group')
            ->where('status', true)
            ->where(function ($query) {
                $query->where('name', 'like', '%cash%')
                    ->orWhere('name', 'like', '%Cash%')
                    ->orWhereHas('group', function ($q) {
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
