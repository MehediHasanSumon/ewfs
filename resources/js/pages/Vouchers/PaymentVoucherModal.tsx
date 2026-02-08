import { FormModal } from '@/components/ui/form-modal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { useForm } from '@inertiajs/react';
import { useCallback, useEffect } from 'react';

export interface PaymentVoucher {
    id: number;
    voucher_type: string;
    date: string;
    from_account: { id: number; name: string };
    to_account: { id: number; name: string };
    shift?: { id: number; name: string };
    transaction?: { amount: number; payment_type: string };
    voucher_category?: { id: number; name: string };
    payment_sub_type?: { id: number; name: string };
    description?: string;
    remarks: string;
    created_at: string;
}

interface VoucherCategory {
    id: number;
    name: string;
}

interface PaymentSubType {
    id: number;
    name: string;
    voucher_category_id: number;
}

interface Account {
    id: number;
    name: string;
    ac_number: string;
}

interface Shift {
    id: number;
    name: string;
}

interface PaymentVoucherModalProps {
    isOpen: boolean;
    onClose: () => void;
    editingVoucher: PaymentVoucher | null;
    accounts: Account[];
    groupedAccounts: Record<string, Account[]>;
    shifts: Shift[];
    closedShifts: Array<{close_date: string; shift_id: number}>;
    voucherCategories: VoucherCategory[];
    paymentSubTypes: PaymentSubType[];
}

export function PaymentVoucherModal({
    isOpen,
    onClose,
    editingVoucher,
    accounts,
    groupedAccounts,
    shifts,
    closedShifts,
    voucherCategories,
    paymentSubTypes,
}: PaymentVoucherModalProps) {
    const { data, setData, post, put, processing, errors, reset } = useForm({
        date: '',
        shift_id: '',
        voucher_category_id: '',
        payment_sub_type_id: '',
        from_account_id: '',
        to_account_id: '',
        amount: '',
        payment_method: 'Cash',
        bank_type: '',
        bank_name: '',
        cheque_no: '',
        cheque_date: '',
        account_no: '',
        branch_name: '',
        mobile_bank: '',
        mobile_number: '',
        description: '',
        remarks: '',
    });

    const getFilteredAccounts = useCallback(() => {
        const groupName = data.payment_method === 'Cash' ? 'Cash in hand' :
                         data.payment_method === 'Bank' ? 'Bank Account' :
                         data.payment_method === 'Mobile Bank' ? 'Mobile Bank' : 'Other';
        return groupedAccounts[groupName] || [];
    }, [data.payment_method, groupedAccounts]);

    const getAvailableShifts = useCallback(() => {
        if (!data.date) return [];
        
        const selectedDate = data.date;
        const closedShiftIds = closedShifts
            .filter(cs => cs.close_date === selectedDate)
            .map(cs => cs.shift_id);
        
        return shifts.filter(shift => !closedShiftIds.includes(shift.id));
    }, [data.date, shifts, closedShifts]);

    useEffect(() => {
        if (editingVoucher && isOpen) {
            const paymentType = editingVoucher.transaction?.payment_type || 'cash';
            const formattedPaymentMethod = paymentType.charAt(0).toUpperCase() + paymentType.slice(1);
            
            setData({
                date: editingVoucher.date?.split('T')[0] || '',
                shift_id: editingVoucher.shift?.id?.toString() || '',
                from_account_id: editingVoucher.from_account?.id?.toString() || '',
                to_account_id: editingVoucher.to_account?.id?.toString() || '',
                amount: editingVoucher.transaction?.amount?.toString() || '',
                payment_method: formattedPaymentMethod,
                voucher_category_id: editingVoucher.voucher_category?.id?.toString() || '',
                payment_sub_type_id: editingVoucher.payment_sub_type?.id?.toString() || '',
                description: editingVoucher.description || '',
                bank_type: '',
                bank_name: '',
                cheque_no: '',
                cheque_date: '',
                account_no: '',
                branch_name: '',
                mobile_bank: '',
                mobile_number: '',
                remarks: editingVoucher.remarks || '',
            });
        } else if (!editingVoucher && !isOpen) {
            reset();
        }
    }, [editingVoucher, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editingVoucher) {
            put(`/vouchers/payment/${editingVoucher.id}`, {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        } else {
            post('/vouchers/payment', {
                onSuccess: () => {
                    onClose();
                    reset();
                },
            });
        }
    };

    return (
        <FormModal
            isOpen={isOpen}
            onClose={() => {
                onClose();
                reset();
            }}
            title={editingVoucher ? 'Edit Payment Voucher' : 'Create Payment Voucher'}
            onSubmit={handleSubmit}
            processing={processing}
            submitText={editingVoucher ? 'Update' : 'Create'}
            className="max-w-2xl"
        >
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="date" className="dark:text-gray-200">Date</Label>
                    <Input
                        id="date"
                        type="date"
                        value={data.date}
                        onChange={(e) => setData('date', e.target.value)}
                        className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                    {errors.date && <span className="text-sm text-red-500">{errors.date}</span>}
                </div>
                <div>
                    <Label htmlFor="shift_id" className="dark:text-gray-200">Shift</Label>
                    <Select 
                        value={data.shift_id} 
                        onValueChange={(value) => setData('shift_id', value)}
                        disabled={!data.date}
                    >
                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            <SelectValue placeholder="Choose shift" />
                        </SelectTrigger>
                        <SelectContent>
                            {getAvailableShifts().map((shift) => (
                                <SelectItem key={shift.id} value={shift.id.toString()}>
                                    {shift.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.shift_id && <span className="text-sm text-red-500">{errors.shift_id}</span>}
                </div>
            </div>
            <div>
                <Label className="dark:text-gray-200">Category</Label>
                <div className="mt-2 flex flex-wrap gap-4">
                    {voucherCategories.map((category) => (
                        <label key={category.id} className="flex items-center space-x-2">
                            <input
                                type="radio"
                                name="voucher_category_id"
                                value={category.id.toString()}
                                checked={data.voucher_category_id === category.id.toString()}
                                onChange={(e) => {
                                    setData('voucher_category_id', e.target.value);
                                    setData('payment_sub_type_id', '');
                                }}
                                className="rounded border-gray-300 dark:border-gray-600"
                            />
                            <span className="text-sm dark:text-gray-300">{category.name}</span>
                        </label>
                    ))}
                </div>
                {errors.voucher_category_id && <span className="text-sm text-red-500">{errors.voucher_category_id}</span>}
            </div>
            <div>
                <Label htmlFor="payment_sub_type_id" className="dark:text-gray-200">Payment Sub Type</Label>
                <Select 
                    value={data.payment_sub_type_id} 
                    onValueChange={(value) => setData('payment_sub_type_id', value)}
                    disabled={!data.voucher_category_id}
                >
                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                        <SelectValue placeholder="Choose sub type" />
                    </SelectTrigger>
                    <SelectContent>
                        {paymentSubTypes.filter(subType => 
                            subType.voucher_category_id.toString() === data.voucher_category_id
                        ).map((subType) => (
                            <SelectItem key={subType.id} value={subType.id.toString()}>
                                {subType.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                {errors.payment_sub_type_id && <span className="text-sm text-red-500">{errors.payment_sub_type_id}</span>}
            </div>
            <div>
                <Label htmlFor="payment_method" className="dark:text-gray-200">Payment Method</Label>
                <Select value={data.payment_method} onValueChange={(value) => {
                    setData('payment_method', value);
                    setData('from_account_id', '');
                }}>
                    <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                        <SelectValue placeholder="Choose payment method" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Cash">Cash</SelectItem>
                        <SelectItem value="Bank">Bank</SelectItem>
                        <SelectItem value="Mobile Bank">Mobile Bank</SelectItem>
                    </SelectContent>
                </Select>
                {errors.payment_method && <span className="text-sm text-red-500">{errors.payment_method}</span>}
            </div>

            {data.payment_method === 'Bank' && (
                <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium dark:text-white">Bank Payment Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="bank_type" className="dark:text-gray-200">Bank Type</Label>
                            <Select value={data.bank_type} onValueChange={(value) => setData('bank_type', value)}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    <SelectValue placeholder="Choose bank type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Cheque">Cheque</SelectItem>
                                    <SelectItem value="Cash Deposit">Cash Deposit</SelectItem>
                                    <SelectItem value="Online">Online</SelectItem>
                                    <SelectItem value="CHT">CHT</SelectItem>
                                    <SelectItem value="RTGS">RTGS</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="bank_name" className="dark:text-gray-200">Bank Name</Label>
                            <Input
                                id="bank_name"
                                placeholder="Enter bank name"
                                value={data.bank_name}
                                onChange={(e) => setData('bank_name', e.target.value)}
                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="branch_name" className="dark:text-gray-200">Branch Name</Label>
                            <Input
                                id="branch_name"
                                placeholder="Enter branch name"
                                value={data.branch_name}
                                onChange={(e) => setData('branch_name', e.target.value)}
                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div>
                            <Label htmlFor="account_no" className="dark:text-gray-200">Account Number</Label>
                            <Input
                                id="account_no"
                                placeholder="Enter account number"
                                value={data.account_no}
                                onChange={(e) => setData('account_no', e.target.value)}
                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                    {data.bank_type === 'Cheque' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="cheque_no" className="dark:text-gray-200">Cheque Number</Label>
                                <Input
                                    id="cheque_no"
                                    placeholder="Enter cheque number"
                                    value={data.cheque_no}
                                    onChange={(e) => setData('cheque_no', e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                            <div>
                                <Label htmlFor="cheque_date" className="dark:text-gray-200">Cheque Date</Label>
                                <Input
                                    id="cheque_date"
                                    type="date"
                                    value={data.cheque_date}
                                    onChange={(e) => setData('cheque_date', e.target.value)}
                                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            {data.payment_method === 'Mobile Bank' && (
                <div className="space-y-4 border-t pt-4">
                    <h4 className="font-medium dark:text-white">Mobile Bank Details</h4>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="mobile_bank" className="dark:text-gray-200">Mobile Bank</Label>
                            <Select value={data.mobile_bank} onValueChange={(value) => setData('mobile_bank', value)}>
                                <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                                    <SelectValue placeholder="Choose mobile bank" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bKash">bKash</SelectItem>
                                    <SelectItem value="Nagad">Nagad</SelectItem>
                                    <SelectItem value="Rocket">Rocket</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="mobile_number" className="dark:text-gray-200">Mobile Number</Label>
                            <Input
                                id="mobile_number"
                                placeholder="Enter mobile number"
                                value={data.mobile_number}
                                onChange={(e) => setData('mobile_number', e.target.value)}
                                className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div>
                    <Label htmlFor="from_account_id" className="dark:text-gray-200">From Account</Label>
                    <Select value={data.from_account_id} onValueChange={(value) => setData('from_account_id', value)}>
                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            <SelectValue placeholder="Choose source account" />
                        </SelectTrigger>
                        <SelectContent>
                            {getFilteredAccounts().map((account) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                    {account.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.from_account_id && <span className="text-sm text-red-500">{errors.from_account_id}</span>}
                </div>
                <div>
                    <Label htmlFor="to_account_id" className="dark:text-gray-200">To Account</Label>
                    <Select value={data.to_account_id} onValueChange={(value) => setData('to_account_id', value)}>
                        <SelectTrigger className="dark:border-gray-600 dark:bg-gray-700 dark:text-white">
                            <SelectValue placeholder="Choose destination account" />
                        </SelectTrigger>
                        <SelectContent>
                            {accounts.map((account) => (
                                <SelectItem key={account.id} value={account.id.toString()}>
                                    {account.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {errors.to_account_id && <span className="text-sm text-red-500">{errors.to_account_id}</span>}
                </div>
            </div>

            <div>
                <Label htmlFor="amount" className="dark:text-gray-200">Amount</Label>
                <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    placeholder="Enter amount"
                    value={data.amount}
                    onChange={(e) => setData('amount', e.target.value)}
                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
                {errors.amount && <span className="text-sm text-red-500">{errors.amount}</span>}
            </div>

            <div>
                <Label htmlFor="description" className="dark:text-gray-200">Description</Label>
                <Input
                    id="description"
                    placeholder="Enter description (optional)"
                    value={data.description}
                    onChange={(e) => setData('description', e.target.value)}
                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
            </div>

            <div>
                <Label htmlFor="remarks" className="dark:text-gray-200">Remarks</Label>
                <Input
                    id="remarks"
                    placeholder="Enter remarks (optional)"
                    value={data.remarks}
                    onChange={(e) => setData('remarks', e.target.value)}
                    className="dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
            </div>
        </FormModal>
    );
}
