<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Balance Sheet</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 15px;
        }
        .company-name {
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .report-title {
            font-size: 16px;
            font-weight: bold;
            margin-top: 10px;
        }
        .balance-sheet-container {
            display: table;
            width: 100%;
            margin-top: 20px;
        }
        .liabilities-section, .assets-section {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding: 0 10px;
        }
        .section-title {
            font-size: 14px;
            font-weight: bold;
            background-color: #f5f5f5;
            padding: 8px;
            text-align: center;
            border: 1px solid #ddd;
            margin-bottom: 0;
        }
        .liabilities-title {
            background-color: #fee;
            color: #c53030;
        }
        .assets-title {
            background-color: #f0fff4;
            color: #38a169;
        }
        .group-header {
            font-weight: bold;
            background-color: #f8f9fa;
            padding: 6px 8px;
            border: 1px solid #ddd;
            border-top: none;
            font-size: 11px;
        }
        .item-row {
            display: flex;
            justify-content: space-between;
            padding: 4px 8px;
            border-left: 1px solid #ddd;
            border-right: 1px solid #ddd;
            border-bottom: 1px solid #eee;
        }
        .item-name {
            flex: 1;
        }
        .item-amount {
            font-weight: bold;
            text-align: right;
            min-width: 80px;
        }
        .total-row {
            display: flex;
            justify-content: space-between;
            padding: 8px;
            border: 1px solid #ddd;
            border-top: 2px solid #333;
            background-color: #f8f9fa;
            font-weight: bold;
            font-size: 13px;
        }
        .liabilities-total {
            color: #c53030;
        }
        .assets-total {
            color: #38a169;
        }
        .summary {
            margin-top: 30px;
            text-align: center;
            border: 2px solid #333;
            padding: 15px;
            background-color: #f8f9fa;
        }
        .summary-title {
            font-size: 14px;
            font-weight: bold;
            margin-bottom: 15px;
        }
        .summary-row {
            display: inline-block;
            margin: 0 20px;
            text-align: center;
        }
        .summary-amount {
            font-size: 16px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        .summary-label {
            font-size: 11px;
            color: #666;
        }
        .net-worth {
            color: #2d3748;
        }
        .net-worth.positive {
            color: #38a169;
        }
        .net-worth.negative {
            color: #c53030;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ $companySetting->company_name ?? 'Company Name' }}</div>
        <div>{{ $companySetting->address ?? 'Company Address' }}</div>
        <div class="report-title">Balance Sheet</div>
        <div>As of {{ date('F d, Y') }}</div>
    </div>

    <div class="balance-sheet-container">
        <div class="liabilities-section">
            <div class="section-title liabilities-title">LIABILITIES</div>
            
            @php
                $groupedLiabilities = $liabilities->groupBy('group_name');
            @endphp
            
            @foreach($groupedLiabilities as $groupName => $items)
                <div class="group-header">{{ $groupName }}</div>
                @foreach($items as $item)
                    <div class="item-row">
                        <span class="item-name">{{ $item['name'] }}</span>
                        <span class="item-amount">৳{{ number_format($item['balance'], 2) }}</span>
                    </div>
                @endforeach
            @endforeach
            
            <div class="total-row liabilities-total">
                <span>Total Liabilities</span>
                <span>৳{{ number_format($totalLiabilities, 2) }}</span>
            </div>
        </div>

        <div class="assets-section">
            <div class="section-title assets-title">ASSETS</div>
            
            @php
                $groupedAssets = $assets->groupBy('group_name');
            @endphp
            
            @foreach($groupedAssets as $groupName => $items)
                <div class="group-header">{{ $groupName }}</div>
                @foreach($items as $item)
                    <div class="item-row">
                        <span class="item-name">{{ $item['name'] }}</span>
                        <span class="item-amount">৳{{ number_format($item['balance'], 2) }}</span>
                    </div>
                @endforeach
            @endforeach
            
            <div class="total-row assets-total">
                <span>Total Assets</span>
                <span>৳{{ number_format($totalAssets, 2) }}</span>
            </div>
        </div>
    </div>

    <div class="summary">
        <div class="summary-title">Balance Sheet Summary</div>
        <div class="summary-row">
            <div class="summary-amount liabilities-total">৳{{ number_format($totalLiabilities, 2) }}</div>
            <div class="summary-label">Total Liabilities</div>
        </div>
        <div class="summary-row">
            <div class="summary-amount assets-total">৳{{ number_format($totalAssets, 2) }}</div>
            <div class="summary-label">Total Assets</div>
        </div>
        <div class="summary-row">
            @php
                $netWorth = $totalAssets - $totalLiabilities;
                $netWorthClass = $netWorth >= 0 ? 'positive' : 'negative';
            @endphp
            <div class="summary-amount net-worth {{ $netWorthClass }}">৳{{ number_format($netWorth, 2) }}</div>
            <div class="summary-label">Net Worth</div>
        </div>
    </div>
</body>
</html>