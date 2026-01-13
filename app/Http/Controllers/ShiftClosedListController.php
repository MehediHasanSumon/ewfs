<?php

namespace App\Http\Controllers;

use App\Models\IsShiftClose;
use App\Models\Shift;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ShiftClosedListController extends Controller
{
    public function index(Request $request)
    {
        $query = IsShiftClose::with('shift');

        if ($request->search) {
            $query->whereHas('shift', function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%');
            });
        }

        if ($request->shift_id) {
            $query->where('shift_id', $request->shift_id);
        }

        if ($request->start_date) {
            $query->whereDate('close_date', '>=', $request->start_date);
        }

        if ($request->end_date) {
            $query->whereDate('close_date', '<=', $request->end_date);
        }

        $sortField = $request->sort ?? 'close_date';
        $sortDirection = $request->direction ?? 'desc';
        $query->orderBy($sortField, $sortDirection);

        $shiftClosedList = $query->paginate(10);
        $shifts = Shift::all();

        return Inertia::render('ShiftClosedList/Index', [
            'shiftClosedList' => $shiftClosedList,
            'shifts' => $shifts,
            'filters' => $request->only(['search', 'shift_id', 'start_date', 'end_date', 'sort', 'direction'])
        ]);
    }

    public function destroy($id)
    {
        $shiftClosed = IsShiftClose::findOrFail($id);
        $shiftClosed->delete();
        return redirect()->back()->with('success', 'Shift closed record deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:is_shift_closes,id'
        ]);

        IsShiftClose::whereIn('id', $request->ids)->delete();
        return redirect()->back()->with('success', 'Selected records deleted successfully.');
    }
}