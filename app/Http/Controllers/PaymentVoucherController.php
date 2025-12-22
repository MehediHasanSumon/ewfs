<?php

namespace App\Http\Controllers;

use App\Models\Voucher;
use App\Models\Account;
use App\Models\Shift;
use App\Models\Transaction;
use App\Models\CompanySetting;
use App\Models\VoucherCategory;
use App\Models\PaymentSubType;
use App\Models\IsShiftClose;
use App\Helpers\TransactionHelper;
use App\Helpers\VoucherHelper;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class PaymentVoucherController extends Controller
{
    public function index(Request $request)
    {
        $query = Voucher::with(['fromAccount', 'toAccount', 'shift', 'voucherCategory', 'paymentSubType', 'transaction'])
            ->where('voucher_type', 'Payment');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('fromAccount', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                })
                    ->orWhereHas('toAccount', function ($q) use ($request) {
                        $q->where('name', 'like', '%' . $request->search . '%');
                    });
            });
        }
        if ($request->payment_method && $request->payment_method !== 'all') {
            $query->whereHas('transaction', function($q) use ($request) {
                $q->where('payment_type', strtolower($request->payment_method));
            });
        }
        if ($request->start_date) {
            $query->where('date', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $query->where('date', '<=', $request->end_date);
        }
        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $vouchers = $query->paginate($request->per_page ?? 10);

        $vouchers->getCollection()->transform(function ($voucher) {
            $voucher->payment_type = $voucher->payment_method;
            $voucher->from_account = $voucher->fromAccount;
            $voucher->to_account = $voucher->toAccount;
            $voucher->shift = $voucher->shift;
            return $voucher;
        });

        $shifts = Shift::where('status', true)->select('id', 'name')->get();
        $closedShifts = IsShiftClose::select('close_date', 'shift_id')->get()->map(function($item) {
            return [
                'close_date' => $item->close_date->format('Y-m-d'),
                'shift_id' => $item->shift_id
            ];
        });
        $accounts = Account::select('id', 'name', 'ac_number')->get();
        $groupedAccounts = Account::with('group')
            ->select('id', 'name', 'ac_number', 'group_code')
            ->get()
            ->groupBy(function ($account) {
                return $account->group ? $account->group->name : 'Other';
            });
        $voucherCategories = VoucherCategory::where('status', true)->get();
        $paymentSubTypes = PaymentSubType::with('voucherCategory')->where('status', true)->get();

        return Inertia::render('Vouchers/PaymentVoucher', [
            'vouchers' => $vouchers,
            'accounts' => $accounts,
            'groupedAccounts' => $groupedAccounts,
            'shifts' => $shifts,
            'closedShifts' => $closedShifts,
            'voucherCategories' => $voucherCategories,
            'paymentSubTypes' => $paymentSubTypes,
            'filters' => $request->only(['search', 'payment_method', 'start_date', 'end_date', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'date' => 'required|date',
            'voucher_category_id' => 'required|exists:voucher_categories,id',
            'payment_sub_type_id' => 'required|exists:payment_sub_types,id',
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:Cash,Bank,Mobile Bank',
            'description' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request) {
            $fromAccount = Account::find($request->from_account_id);
            $toAccount = Account::find($request->to_account_id);
            $fromAccount->decrement('total_amount', $request->amount);
            $toAccount->increment('total_amount', $request->amount);

            $transaction = Transaction::create([
                'transaction_id' => TransactionHelper::generateTransactionId(),
                'ac_number' => $fromAccount->ac_number,
                'transaction_type' => 'Dr',
                'amount' => $request->amount,
                'description' => $request->description ?? 'Payment to ' . $toAccount->name,
                'payment_type' => strtolower($request->payment_method),
                'bank_name' => $request->bank_name,
                'branch_name' => $request->branch_name,
                'account_number' => $request->account_no,
                'cheque_type' => $request->bank_type,
                'cheque_no' => $request->cheque_no,
                'cheque_date' => $request->cheque_date,
                'mobile_bank_name' => $request->mobile_bank,
                'mobile_number' => $request->mobile_number,
                'transaction_date' => $request->date,
                'transaction_time' => now()->format('H:i:s'),
            ]);

            Voucher::create([
                'voucher_no' => VoucherHelper::generateVoucherNo(),
                'voucher_type' => 'Payment',
                'voucher_category_id' => $request->voucher_category_id,
                'payment_sub_type_id' => $request->payment_sub_type_id,
                'date' => $request->date,
                'shift_id' => $request->shift_id,
                'from_account_id' => $request->from_account_id,
                'to_account_id' => $request->to_account_id,
                'transaction_id' => $transaction->id,
                'description' => $request->description,
                'remarks' => $request->remarks,
            ]);
        });

        return redirect()->back()->with('success', 'Payment voucher created successfully.');
    }

    public function update(Request $request, Voucher $voucher)
    {
        $request->validate([
            'date' => 'required|date',
            'voucher_category_id' => 'required|exists:voucher_categories,id',
            'payment_sub_type_id' => 'required|exists:payment_sub_types,id',
            'from_account_id' => 'required|exists:accounts,id',
            'to_account_id' => 'required|exists:accounts,id',
            'amount' => 'required|numeric|min:0',
            'payment_method' => 'required|in:Cash,Bank,Mobile Bank',
            'description' => 'nullable|string',
            'remarks' => 'nullable|string',
        ]);

        DB::transaction(function () use ($request, $voucher) {
            $oldFromAccount = Account::find($voucher->from_account_id);
            $oldToAccount = Account::find($voucher->to_account_id);
            $oldAmount = $voucher->transaction->amount;
            $oldFromAccount->increment('total_amount', $oldAmount);
            $oldToAccount->decrement('total_amount', $oldAmount);

            $newFromAccount = Account::find($request->from_account_id);
            $newToAccount = Account::find($request->to_account_id);
            $newFromAccount->decrement('total_amount', $request->amount);
            $newToAccount->increment('total_amount', $request->amount);

            $voucher->update([
                'voucher_category_id' => $request->voucher_category_id,
                'payment_sub_type_id' => $request->payment_sub_type_id,
                'date' => $request->date,
                'shift_id' => $request->shift_id,
                'from_account_id' => $request->from_account_id,
                'to_account_id' => $request->to_account_id,
                'amount' => $request->amount,
                'payment_method' => $request->payment_method,
                'description' => $request->description,
                'remarks' => $request->remarks,
            ]);

            $voucher->transaction->update([
                'ac_number' => $newFromAccount->ac_number,
                'amount' => $request->amount,
                'description' => $request->description ?? 'Payment to ' . $newToAccount->name,
                'payment_type' => strtolower($request->payment_method),
                'transaction_date' => $request->date,
            ]);
        });

        return redirect()->back()->with('success', 'Payment voucher updated successfully.');
    }

    public function destroy(Voucher $voucher)
    {
        DB::transaction(function () use ($voucher) {
            $fromAccount = Account::find($voucher->from_account_id);
            $toAccount = Account::find($voucher->to_account_id);
            $amount = $voucher->transaction->amount;
            $fromAccount->increment('total_amount', $amount);
            $toAccount->decrement('total_amount', $amount);
            $voucher->transaction?->delete();
            $voucher->delete();
        });

        return redirect()->back()->with('success', 'Payment voucher deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:vouchers,id'
        ]);

        DB::transaction(function () use ($request) {
            $vouchers = Voucher::whereIn('id', $request->ids)->get();
            foreach ($vouchers as $voucher) {
                $fromAccount = Account::find($voucher->from_account_id);
                $toAccount = Account::find($voucher->to_account_id);
                $amount = $voucher->transaction->amount;
                $fromAccount->increment('total_amount', $amount);
                $toAccount->decrement('total_amount', $amount);
                $voucher->transaction?->delete();
                $voucher->delete();
            }
        });

        return redirect()->back()->with('success', 'Payment vouchers deleted successfully.');
    }

    public function downloadPdf(Request $request)
    {
        $query = Voucher::with(['fromAccount', 'toAccount', 'shift'])
            ->where('voucher_type', 'Payment');

        if ($request->search) {
            $query->where(function ($q) use ($request) {
                $q->whereHas('fromAccount', function ($q) use ($request) {
                    $q->where('name', 'like', '%' . $request->search . '%');
                })
                    ->orWhereHas('toAccount', function ($q) use ($request) {
                        $q->where('name', 'like', '%' . $request->search . '%');
                    });
            });
        }

        if ($request->payment_method && $request->payment_method !== 'all') {
            $query->whereHas('transaction', function($q) use ($request) {
                $q->where('payment_type', strtolower($request->payment_method));
            });
        }

        if ($request->start_date) {
            $query->where('date', '>=', $request->start_date);
        }

        if ($request->end_date) {
            $query->where('date', '<=', $request->end_date);
        }

        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $vouchers = $query->get();
        $companySetting = CompanySetting::first();

        $pdf = Pdf::loadView('pdf.payment-vouchers', compact('vouchers', 'companySetting'));
        return $pdf->stream();
    }
}
