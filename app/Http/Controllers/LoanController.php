<?php

namespace App\Http\Controllers;

use App\Models\Account;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class LoanController extends Controller
{
    public function index(Request $request): Response
    {
        $query = Account::where('group_code', '400010002')
            ->with('group');

        // Apply search filter
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('ac_number', 'like', "%{$search}%");
            });
        }

        // Apply status filter
        if ($request->filled('status')) {
            $status = $request->status === 'active' ? 1 : 0;
            $query->where('status', $status);
        }

        // Apply sorting
        $sortBy = $request->get('sort_by', 'name');
        $sortOrder = $request->get('sort_order', 'asc');
        
        $sortColumn = match($sortBy) {
            'lender_name' => 'name',
            'amount' => 'total_amount',
            'due_amount' => 'due_amount',
            'paid_amount' => 'paid_amount',
            default => 'name'
        };
        
        $query->orderBy($sortColumn, $sortOrder);

        // Paginate results
        $perPage = $request->get('per_page', 10);
        $accounts = $query->paginate($perPage);

        $loans = $accounts->through(function ($account) {
            return [
                'id' => $account->id,
                'lender_name' => $account->name,
                'amount' => $account->total_amount ?? 0,
                'due_amount' => $account->due_amount ?? 0,
                'paid_amount' => $account->paid_amount ?? 0,
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