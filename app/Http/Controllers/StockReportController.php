<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\CompanySetting;
use App\Models\Stock;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Barryvdh\DomPDF\Facade\Pdf;

class StockReportController extends Controller
{
    public function index(Request $request)
    {
        $query = Stock::with(['product.unit', 'product.category']);

        if ($request->search) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('product_name', 'like', '%' . $request->search . '%')
                    ->orWhere('product_code', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->category) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('category_id', $request->category);
            });
        }

        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $stocks = $query->paginate($request->per_page ?? 10);

        return Inertia::render('StockReport/Index', [
            'stocks' => $stocks,
            'categories' => Category::select('id', 'name')->get(),
            'filters' => $request->only(['search', 'category', 'sort_by', 'sort_order', 'per_page'])
        ]);
    }

    public function downloadPdf(Request $request)
    {
        $query = Stock::with(['product.unit', 'product.category']);

        if ($request->search) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('product_name', 'like', '%' . $request->search . '%')
                    ->orWhere('product_code', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->category) {
            $query->whereHas('product', function ($q) use ($request) {
                $q->where('category_id', $request->category);
            });
        }

        $sortBy = $request->sort_by ?? 'created_at';
        $sortOrder = $request->sort_order ?? 'desc';
        $query->orderBy($sortBy, $sortOrder);

        $stocks = $query->get();
        $companySetting = CompanySetting::first();

        $pdf = Pdf::loadView('pdf.stock-report', compact('stocks', 'companySetting'));
        return $pdf->stream('stock-report.pdf');
    }
}
