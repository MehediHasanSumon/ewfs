<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\Account;
use App\Models\Sale;
use App\Models\Purchase;
use App\Models\Product;
use App\Models\Stock;
use App\Models\OfficePayment;
use App\Models\CreditSale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DashboardController extends Controller
{
    public function index()
    {
        // Cash in Hand - Cash account balance
        $cashInHand = Account::where('name', 'LIKE', '%cash%')
            ->orWhere('name', 'LIKE', '%Cash%')
            ->sum('total_amount');

        // Outstanding Balance - Total due amounts from credit sales
        $outstandingBalance = CreditSale::sum('due_amount');

        // Cash Sale - Today's total sales
        $cashSale = Sale::whereDate('sale_date', today())
            ->sum('total_amount');

        // Office Expenses - Today's office payments
        $officeExpenses = OfficePayment::whereDate('date', today())
            ->join('transactions', 'office_payments.transaction_id', '=', 'transactions.id')
            ->sum('transactions.amount');

        // Monthly Sales Data (last 6 months) - Combined sales and credit_sales
        $salesData = Sale::select(
            DB::raw('MONTH(sale_date) as month'),
            DB::raw('YEAR(sale_date) as year'),
            DB::raw('SUM(total_amount) as total')
        )
        ->where('sale_date', '>=', Carbon::now()->subMonths(6))
        ->groupBy('year', 'month')
        ->get();
        
        $creditSalesData = CreditSale::select(
            DB::raw('MONTH(sale_date) as month'),
            DB::raw('YEAR(sale_date) as year'),
            DB::raw('SUM(total_amount) as total')
        )
        ->where('sale_date', '>=', Carbon::now()->subMonths(6))
        ->groupBy('year', 'month')
        ->get();
        
        $monthlySales = collect();
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $month = $date->month;
            $year = $date->year;
            
            $saleAmount = $salesData->where('month', $month)->where('year', $year)->sum('total');
            $creditSaleAmount = $creditSalesData->where('month', $month)->where('year', $year)->sum('total');
            
            $monthlySales->push([
                'month' => $date->format('M'),
                'total' => $saleAmount + $creditSaleAmount
            ]);
        }

        // Monthly Purchase Data (last 6 months)
        $monthlyPurchases = collect();
        for ($i = 5; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $month = $date->month;
            $year = $date->year;
            
            $amount = Purchase::where(DB::raw('MONTH(purchase_date)'), $month)
                ->where(DB::raw('YEAR(purchase_date)'), $year)
                ->sum('net_total_amount');
            
            $monthlyPurchases->push([
                'month' => $date->format('M'),
                'total' => $amount
            ]);
        }

        // Stock Data by Product
        $stockData = Stock::with('product')
            ->where('current_stock', '>', 0)
            ->get()
            ->map(function($stock) {
                return [
                    'product_name' => $stock->product->product_name,
                    'current_stock' => $stock->current_stock
                ];
            });

        // Total Stock from Stock table
        $totalStock = Stock::sum('current_stock');

        // Outstanding Customers from Credit Sales
        $outstandingCustomers = CreditSale::with('customer')
            ->select('customer_id', DB::raw('SUM(due_amount) as balance'))
            ->where('due_amount', '>', 0)
            ->groupBy('customer_id')
            ->orderBy('balance', 'desc')
            ->limit(5)
            ->get()
            ->map(function($creditSale) {
                return [
                    'customer' => $creditSale->customer ? $creditSale->customer->name : 'Unknown',
                    'mobile_number' => $creditSale->customer ? $creditSale->customer->mobile : null,
                    'balance' => $creditSale->balance
                ];
            });

        // Products for dropdowns
        $products = Product::select('id', 'product_name')->get();

        return Inertia::render('dashboard', [
            'stats' => [
                'cashInHand' => $cashInHand,
                'outstandingBalance' => $outstandingBalance,
                'cashSale' => $cashSale,
                'officeExpenses' => $officeExpenses
            ],
            'chartData' => [
                'monthlySales' => $monthlySales,
                'monthlyPurchases' => $monthlyPurchases,
                'stockData' => $stockData,
                'totalStock' => $totalStock,
                'outstandingCustomers' => $outstandingCustomers
            ],
            'products' => $products
        ]);
    }

    public function getChartData(Request $request)
    {
        $productId = $request->product_id;
        $type = $request->type; // 'sale' or 'purchase'
        
        if ($type === 'sale') {
            // Get data from both sales and credit_sales tables
            $salesData = Sale::select(
                DB::raw('MONTH(sale_date) as month'),
                DB::raw('YEAR(sale_date) as year'),
                DB::raw('SUM(total_amount) as total')
            )
            ->where('sale_date', '>=', Carbon::now()->subMonths(6));
            
            if ($productId && $productId !== 'all') {
                $salesData->where('product_id', $productId);
            }
            
            $creditSalesData = CreditSale::select(
                DB::raw('MONTH(sale_date) as month'),
                DB::raw('YEAR(sale_date) as year'),
                DB::raw('SUM(total_amount) as total')
            )
            ->where('sale_date', '>=', Carbon::now()->subMonths(6));
            
            if ($productId && $productId !== 'all') {
                $creditSalesData->where('product_id', $productId);
            }
            
            // Combine both datasets
            $sales = $salesData->groupBy('year', 'month')->get();
            $creditSales = $creditSalesData->groupBy('year', 'month')->get();
            
            $combinedData = collect();
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $month = $date->month;
                $year = $date->year;
                
                $saleAmount = $sales->where('month', $month)->where('year', $year)->sum('total');
                $creditSaleAmount = $creditSales->where('month', $month)->where('year', $year)->sum('total');
                
                $combinedData->push([
                    'month' => $date->format('M'),
                    'total' => $saleAmount + $creditSaleAmount
                ]);
            }
            
            $data = $combinedData;
        } else {
            $query = Purchase::select(
                DB::raw('MONTH(purchase_date) as month'),
                DB::raw('YEAR(purchase_date) as year'),
                DB::raw('SUM(net_total_amount) as total')
            )
            ->where('purchase_date', '>=', Carbon::now()->subMonths(6));
            
            if ($productId && $productId !== 'all') {
                $query->where('product_id', $productId);
            }
            
            $data = collect();
            for ($i = 5; $i >= 0; $i--) {
                $date = Carbon::now()->subMonths($i);
                $month = $date->month;
                $year = $date->year;
                
                $amount = $query->clone()->where(DB::raw('MONTH(purchase_date)'), $month)
                    ->where(DB::raw('YEAR(purchase_date)'), $year)
                    ->sum('net_total_amount');
                
                $data->push([
                    'month' => $date->format('M'),
                    'total' => $amount
                ]);
            }
        }
        
        return response()->json($data);
    }
}