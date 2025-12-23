<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Balance Sheet</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
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
        .date-info {
            font-size: 12px;
            margin-top: 5px;
        }
        .balance-sheet-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
        }
        .balance-sheet-table th,
        .balance-sheet-table td {
            border: 1px solid #333;
            padding: 8px;
            text-align: left;
        }
        .balance-sheet-table th {
            background-color: #f0f0f0;
            font-weight: bold;
        }
        .amount {
            text-align: right;
        }
        .total-row {
            font-weight: bold;
            background-color: #f9f9f9;
        }
        .net-worth {
            margin-top: 20px;
            text-align: center;
            font-size: 14px;
            font-weight: bold;
            padding: 10px;
            border: 2px solid #333;
            background-color: #f0f0f0;
        }
    </style>
</head>
<body>
    <div class="header">
        <div class="company-name">{{ config('app.name', 'Company Name') }}</div>
        <div class="report-title">Balance Sheet</div>
        <div class="date-info">As of: {{ \Carbon\Carbon::parse($data['date'])->format('F j, Y') }}</div>
    </div>

    <table class="balance-sheet-table">
        <thead>
            <tr>
                <th style="width: 25%;">Assets</th>
                <th style="width: 25%;">Amount (৳)</th>
                <th style="width: 25%;">Liabilities</th>
                <th style="width: 25%;">Amount (৳)</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Office Cash</td>
                <td class="amount">{{ number_format($data['assets']['office_cash'], 2) }}</td>
                <td>Purchase Due</td>
                <td class="amount">{{ number_format($data['liabilities']['purchase_due'], 2) }}</td>
            </tr>
            <tr>
                <td>Bank Deposit</td>
                <td class="amount">{{ number_format($data['assets']['bank_deposit'], 2) }}</td>
                <td>Customer Advance</td>
                <td class="amount">{{ number_format($data['liabilities']['customer_advance'], 2) }}</td>
            </tr>
            <tr>
                <td>Customer Due</td>
                <td class="amount">{{ number_format($data['assets']['customer_due'], 2) }}</td>
                <td>Customer Security</td>
                <td class="amount">{{ number_format($data['liabilities']['customer_security'], 2) }}</td>
            </tr>
            <tr>
                <td>Stock Value</td>
                <td class="amount">{{ number_format($data['assets']['stock_value'], 2) }}</td>
                <td>Bank Loan</td>
                <td class="amount">{{ number_format($data['liabilities']['bank_loan'], 2) }}</td>
            </tr>
            <tr class="total-row">
                <td><strong>Total Assets</strong></td>
                <td class="amount"><strong>{{ number_format($data['assets']['total_assets'], 2) }}</strong></td>
                <td><strong>Total Liabilities</strong></td>
                <td class="amount"><strong>{{ number_format($data['liabilities']['total_liabilities'], 2) }}</strong></td>
            </tr>
        </tbody>
    </table>

    <div class="net-worth">
        Net Worth (Assets - Liabilities): ৳{{ number_format($data['net_worth'], 2) }}
    </div>
</body>
</html>