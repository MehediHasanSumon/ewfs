<?php

namespace App\Http\Controllers;

use App\Models\WhiteSale;
use App\Models\Shift;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class WhiteSaleController extends Controller
{
    public function index(Request $request)
    {
        $query = WhiteSale::with('shift');
        
        if ($request->search) {
            $query->where(function($q) use ($request) {
                $q->where('invoice_no', 'like', '%' . $request->search . '%')
                  ->orWhereDate('sale_date', 'like', '%' . $request->search . '%');
            });
        }
        
        if ($request->start_date) {
            $query->whereDate('sale_date', '>=', $request->start_date);
        }
        if ($request->end_date) {
            $query->whereDate('sale_date', '<=', $request->end_date);
        }
        
        $sortBy = $request->sort_by ?? 'sale_date';
        $sortOrder = $request->sort_order ?? 'desc';
        $perPage = $request->per_page ?? 10;
        
        $whiteSales = $query->orderBy($sortBy, $sortOrder)->paginate($perPage);
        
        return Inertia::render('WhiteSales/Index', [
            'whiteSales' => $whiteSales,
            'filters' => $request->only(['search', 'start_date', 'end_date', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }

    public function create()
    {
        $shifts = Shift::where('status', 1)->get();
        $products = Product::where('status', 1)->get();
        $categories = Category::where('status', 1)->get();
        
        return Inertia::render('WhiteSales/Create', [
            'shifts' => $shifts,
            'products' => $products,
            'categories' => $categories
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'sale_date' => 'required|date',
            'sale_time' => 'required',
            'invoice_no' => 'required|string|unique:white_sales',
            'shift_id' => 'required|exists:shifts,id',
            'products' => 'required|array|min:1',
            'products.*.product' => 'required|string',
            'products.*.category' => 'required|string',
            'products.*.purchase_price' => 'required|numeric|min:0',
            'products.*.unit' => 'required|string',
            'products.*.quantity' => 'required|numeric|min:0',
            'products.*.amount' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'status' => 'sometimes|integer|in:0,1'
        ]);

        WhiteSale::create($request->all());

        return redirect()->route('white-sales.index')
            ->with('success', 'White sale created successfully.');
    }

    public function show(WhiteSale $whiteSale)
    {
        $whiteSale->load('shift');
        
        return Inertia::render('WhiteSales/Show', [
            'whiteSale' => $whiteSale
        ]);
    }

    public function edit(WhiteSale $whiteSale)
    {
        $shifts = Shift::where('status', 1)->get();
        $products = Product::where('status', 1)->get();
        $categories = Category::where('status', 1)->get();
        
        return Inertia::render('WhiteSales/Edit', [
            'whiteSale' => $whiteSale,
            'shifts' => $shifts,
            'products' => $products,
            'categories' => $categories
        ]);
    }

    public function update(Request $request, WhiteSale $whiteSale)
    {
        $request->validate([
            'sale_date' => 'required|date',
            'sale_time' => 'required',
            'invoice_no' => 'required|string|unique:white_sales,invoice_no,' . $whiteSale->id,
            'shift_id' => 'required|exists:shifts,id',
            'products' => 'required|array|min:1',
            'products.*.product' => 'required|string',
            'products.*.category' => 'required|string',
            'products.*.purchase_price' => 'required|numeric|min:0',
            'products.*.unit' => 'required|string',
            'products.*.quantity' => 'required|numeric|min:0',
            'products.*.amount' => 'required|numeric|min:0',
            'total_amount' => 'required|numeric|min:0',
            'status' => 'sometimes|integer|in:0,1'
        ]);

        $whiteSale->update($request->all());

        return redirect()->route('white-sales.index')
            ->with('success', 'White sale updated successfully.');
    }

    public function destroy(WhiteSale $whiteSale)
    {
        $whiteSale->delete();

        return redirect()->route('white-sales.index')
            ->with('success', 'White sale deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:white_sales,id'
        ]);

        WhiteSale::whereIn('id', $request->ids)->delete();

        return redirect()->route('white-sales.index')
            ->with('success', 'Selected white sales deleted successfully.');
    }
}
