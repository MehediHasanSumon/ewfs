<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class WhiteSale extends Model
{
    protected $fillable = [
        'sale_date',
        'sale_time', 
        'invoice_no',
        'mobile_no',
        'company_name',
        'proprietor_name',
        'shift_id',
        'products',
        'total_amount',
        'remarks',
        'status'
    ];
    
    protected $casts = [
        'products' => 'array',
        'sale_date' => 'date',
        'sale_time' => 'datetime:H:i:s',
        'total_amount' => 'decimal:2'
    ];
    
    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }
}
