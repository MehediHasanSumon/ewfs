<?php

namespace App\Http\Controllers;

use App\Models\IsShiftClose;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        
        DB::table('daily_readings')
            ->where('shift_id', $shiftClosed->shift_id)
            ->whereDate('created_at', $shiftClosed->close_date)
            ->delete();
            
        DB::table('dispenser_readings')
            ->where('shift_id', $shiftClosed->shift_id)
            ->whereDate('created_at', $shiftClosed->close_date)
            ->delete();
        
        $shiftClosed->delete();
        return redirect()->back()->with('success', 'Shift and related data deleted successfully.');
    }

    public function bulkDelete(Request $request)
    {
        $request->validate([
            'ids' => 'required|array',
            'ids.*' => 'exists:is_shift_closes,id'
        ]);

        $shiftClosedRecords = IsShiftClose::whereIn('id', $request->ids)->get();
        
        foreach ($shiftClosedRecords as $record) {
            DB::table('daily_readings')
                ->where('shift_id', $record->shift_id)
                ->whereDate('created_at', $record->close_date)
                ->delete();
                
            DB::table('dispenser_readings')
                ->where('shift_id', $record->shift_id)
                ->whereDate('created_at', $record->close_date)
                ->delete();
        }
        
        IsShiftClose::whereIn('id', $request->ids)->delete();
        return redirect()->back()->with('success', 'Selected records and related data deleted successfully.');
    }
}