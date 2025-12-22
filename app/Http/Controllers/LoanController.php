<?php

namespace App\Http\Controllers;

use App\Models\Account;
use App\Models\Voucher;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoanController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Account::where('group_code', '400010002')
            ->with('group');

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('ac_number', 'like', "%{$search}%");
            });
        }

        if ($request->filled('status')) {
            $status = $request->status === 'active' ? 1 : 0;
            $query->where('status', $status);
        }

        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');

        $sortColumn = match ($sortBy) {
            'lender_name' => 'name',
            'amount' => 'total_amount',
            'due_amount' => 'due_amount',
            'paid_amount' => 'paid_amount',
            default => 'name'
        };

        $query->orderBy($sortColumn, $sortOrder);

        $perPage = $request->get('per_page', 10);
        $accounts = $query->paginate($perPage);

        $loans = $accounts->through(function ($account) {
            $totalLoan = Voucher::where('to_account_id', $account->id)
                ->where('voucher_type', 'Receipt')
                ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
                ->sum('transactions.amount') ?? 0;

            $totalLoan += Voucher::where('from_account_id', $account->id)
                ->where('voucher_type', 'Receipt')
                ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
                ->sum('transactions.amount') ?? 0;

            $totalPayment = Voucher::where('from_account_id', $account->id)
                ->where('voucher_type', 'Payment')
                ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
                ->sum('transactions.amount') ?? 0;

            $totalPayment += Voucher::where('to_account_id', $account->id)
                ->where('voucher_type', 'Payment')
                ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
                ->sum('transactions.amount') ?? 0;

            return [
                'id' => $account->id,
                'lender_name' => $account->name,
                'total_loan' => $totalLoan,
                'total_payment' => $totalPayment,
                'total' => $totalLoan - $totalPayment,
                'account_number' => $account->ac_number,
                'status' => $account->status ? 'active' : 'inactive'
            ];
        });

        return Inertia::render('loans/index', [
            'loans' => $loans,
            'filters' => $request->only(['search', 'status', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }
}
