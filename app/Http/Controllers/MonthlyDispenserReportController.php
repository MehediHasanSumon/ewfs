<?php

namespace App\Http\Controllers;

use App\Models\CompanySetting;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Barryvdh\DomPDF\Facade\Pdf;

class MonthlyDispenserReportController extends Controller
{
    public function index(Request $request)
    {
        // Get shifts with closed data
        $query = DB::table('is_shift_closes')
            ->join('shifts', 'is_shift_closes.shift_id', '=', 'shifts.id')
            ->select(
                'is_shift_closes.*',
                'shifts.name as shift_name'
            );
            
        if ($request->start_date) {
            $query->whereDate('is_shift_closes.close_date', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $query->whereDate('is_shift_closes.close_date', '<=', $request->end_date);
        }
        
        $shiftClosedList = $query->orderBy('close_date', 'desc')->paginate(10);
        
        // Get all products (dispenser + other products)
        $products = collect();
        
        // Get dispenser products with sales
        $dispenserProducts = DB::table('products')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('dispenser_readings')
                    ->whereColumn('dispenser_readings.product_id', 'products.id')
                    ->where('dispenser_readings.net_reading', '>', 0);
            })
            ->select('id', 'product_name')
            ->get();
            
        // Get other products with sales
        $otherProducts = DB::table('products')
            ->whereExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('daily_other_product_sales')
                    ->whereColumn('daily_other_product_sales.product_id', 'products.id')
                    ->where('daily_other_product_sales.sell_quantity', '>', 0);
            })
            ->select('id', 'product_name')
            ->get();
            
        $products = $dispenserProducts->merge($otherProducts)->unique('id');
            
        // Transform data with product sales
        $readings = $shiftClosedList->getCollection()->map(function ($shift, $index) {
            // Get daily reading for financial summary
            $dailyReading = DB::table('daily_readings')
                ->where('shift_id', $shift->shift_id)
                ->whereDate('created_at', $shift->close_date)
                ->first();
                
            // Get voucher data for received_due_paid and expenses
            $voucherData = DB::table('vouchers')
                ->join('transactions', 'vouchers.transaction_id', '=', 'transactions.id')
                ->where('vouchers.shift_id', $shift->shift_id)
                ->whereDate('vouchers.date', $shift->close_date)
                ->selectRaw('SUM(CASE WHEN vouchers.voucher_type = "Receipt" THEN transactions.amount ELSE 0 END) as received_due_paid')
                ->selectRaw('SUM(CASE WHEN vouchers.voucher_type = "Payment" THEN transactions.amount ELSE 0 END) as expenses')
                ->first();
                
            // Get product-wise sales for this shift (dispenser + other products)
            $dispenserSales = DB::table('dispenser_readings')
                ->join('products', 'dispenser_readings.product_id', '=', 'products.id')
                ->where('dispenser_readings.shift_id', $shift->shift_id)
                ->whereDate('dispenser_readings.created_at', $shift->close_date)
                ->where('dispenser_readings.net_reading', '>', 0)
                ->select(
                    'products.id as product_id',
                    'products.product_name',
                    DB::raw('SUM(dispenser_readings.net_reading) as total_sale'),
                    DB::raw('AVG(dispenser_readings.item_rate) as price'),
                    DB::raw('SUM(dispenser_readings.total_sale) as amount')
                )
                ->groupBy('products.id', 'products.product_name')
                ->get();
                
            $otherSales = DB::table('daily_other_product_sales')
                ->join('products', 'daily_other_product_sales.product_id', '=', 'products.id')
                ->where('daily_other_product_sales.shift_id', $shift->shift_id)
                ->whereDate('daily_other_product_sales.date', $shift->close_date)
                ->where('daily_other_product_sales.sell_quantity', '>', 0)
                ->select(
                    'products.id as product_id',
                    'products.product_name',
                    DB::raw('SUM(daily_other_product_sales.sell_quantity) as total_sale'),
                    DB::raw('AVG(daily_other_product_sales.item_rate) as price'),
                    DB::raw('SUM(daily_other_product_sales.total_sales) as amount')
                )
                ->groupBy('products.id', 'products.product_name')
                ->get();
                
            $productSales = $dispenserSales->merge($otherSales)->toArray();
                
            return [
                'id' => $shift->id,
                'sl' => $index + 1,
                'date' => $shift->close_date,
                'shift' => $shift->shift_name,
                'product_sales' => $productSales,
                'received_due_paid' => $voucherData->received_due_paid ?? 0,
                'amount' => $dailyReading->total_cash ?? 0,
                'credit_sale' => $dailyReading->credit_sales ?? 0,
                'bank_sale' => $dailyReading->bank_sales ?? 0,
                'expenses' => $voucherData->expenses ?? 0,
                'purchase' => 0, // Add if available in daily_readings
                'cash_in_hand' => $dailyReading->cash_payment ?? 0,
                'total_balance' => ($dailyReading->total_cash ?? 0) - ($dailyReading->credit_sales ?? 0) - ($dailyReading->bank_sales ?? 0) - ($voucherData->expenses ?? 0) - 0 // amount - credit - bank - expenses - purchase
            ];
        });
        
        $shiftClosedList->setCollection($readings);

        return Inertia::render('Reports/MonthlyDispenserReport', [
            'readings' => $shiftClosedList,
            'dispensers' => [],
            'products' => $products->toArray(),
            'filters' => $request->only(['search', 'dispenser_id', 'product_id', 'start_date', 'end_date', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }

    public function downloadPdf(Request $request)
    {
        // TODO: Add PDF generation logic here
        $readings = collect();
        $companySetting = CompanySetting::first();

        $pdf = Pdf::loadView('pdf.monthly-dispenser-report', compact('readings', 'companySetting'));
        return $pdf->stream('monthly-dispenser-report.pdf');
    }
}