<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SMSTemplate extends Model
{
    protected $table = 'sms_templates';
    
    protected $fillable = [
        'name',
        'content',
        'variables',
        'is_active'
    ];
    
    protected $casts = [
        'variables' => 'array',
        'is_active' => 'boolean'
    ];
    
    public function smsLogs()
    {
        return $this->hasMany(SMSLog::class);
    }
}