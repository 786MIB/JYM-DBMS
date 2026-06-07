import React, { useState, useMemo } from 'react';
import jamiaLogo from '../assets/images/jamia_logo_1780742048729.png';
import { translations } from '../translations';
import { 
  DollarSign, 
  Search, 
  AlertCircle, 
  Printer, 
  FileText, 
  CreditCard, 
  CheckCircle, 
  Plus, 
  Calendar, 
  User, 
  Receipt,
  X
} from 'lucide-react';
import { FeeRecord, Student, StaffRole } from '../types';

interface FinanceProps {
  students: Student[];
  feeRecords: FeeRecord[];
  onAddFeeCharge: (records: Omit<FeeRecord, 'id'>[]) => void;
  onUpdateFeeStatus: (id: string, amountPaid: number, status: 'Paid' | 'Pending' | 'Overdue', paymentMethod?: any) => void;
  activeRole: StaffRole;
  lang: 'en' | 'ur';
}

export const FinancePanel: React.FC<FinanceProps> = ({
  students,
  feeRecords,
  onAddFeeCharge,
  onUpdateFeeStatus,
  activeRole,
  lang
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const currSymbol = lang === 'ur' ? 'PKR ' : '$';
  const [statusFilter, setStatusFilter] = useState('All');
  
  // State for Billing / Charging All Students Bulk Form
  const [isChargingBulk, setIsChargingBulk] = useState(false);
  const [billingTermName, setBillingTermName] = useState('July/August 2026');
  const [billingTermAmount, setBillingTermAmount] = useState('150');

  // Receipt modal
  const [selectedReceipt, setSelectedReceipt] = useState<FeeRecord | null>(null);

  // Fee processing modal inline
  const [processingFeeId, setProcessingFeeId] = useState<string | null>(null);
  const [processingAmount, setProcessingAmount] = useState<string>('');
  const [processingPaymentMethod, setProcessingPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Card' | 'Online'>('Cash');

  // Month-wise Fee Collection Form States
  const [subTab, setSubTab] = useState<'ledger' | 'collection'>('ledger');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('June');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [amountDue, setAmountDue] = useState('150');
  const [amountPaid, setAmountPaid] = useState('150');
  const [collectionDate, setCollectionDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Bank Transfer' | 'Card' | 'Online'>('Cash');
  const [customReceiptNo, setCustomReceiptNo] = useState(`REC-${Math.floor(90000 + Math.random() * 9999)}`);

  const activeStudents = useMemo(() => {
    return students.filter(s => s.status === 'Active');
  }, [students]);

  React.useEffect(() => {
    if (activeStudents.length > 0 && !selectedStudentId) {
      setSelectedStudentId(activeStudents[0].id);
    }
  }, [activeStudents, selectedStudentId]);

  const handleAddNewCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRole) return; // role checks are evaluated further

    if (!selectedStudentId) {
      alert('Please select a student from the active list.');
      return;
    }

    const studentObj = students.find(s => s.id === selectedStudentId);
    if (!studentObj) return;

    const due = parseFloat(amountDue);
    const paid = parseFloat(amountPaid);

    if (isNaN(due) || due <= 0 || isNaN(paid) || paid < 0) {
      alert('Please enter valid positive numeric dues and payments.');
      return;
    }

    const termName = `${selectedMonth} ${selectedYear}`;
    
    // Check if student already has a fee record for the same term
    const exists = feeRecords.some(f => f.studentId === selectedStudentId && f.term.toLowerCase() === termName.toLowerCase());
    if (exists) {
      if (!confirm(`An invoice or collection record for "${termName}" already exists for ${studentObj.fullName}. Do you wish to proceed and create another duplicate entry?`)) {
        return;
      }
    }

    const generatedReceipt = paid > 0 ? (customReceiptNo || `REC-${Math.floor(90000 + Math.random() * 9999)}`) : undefined;

    // Call onAddFeeCharge with this Omit<FeeRecord, 'id'> object
    onAddFeeCharge([{
      studentId: selectedStudentId,
      studentName: studentObj.fullName,
      term: termName,
      amountDue: due,
      amountPaid: paid,
      status: paid >= due ? 'Paid' : (paid > 0 ? 'Pending' : 'Pending'),
      datePaid: paid > 0 ? collectionDate : undefined,
      paymentMethod: paid > 0 ? paymentMethod : undefined,
      receiptNumber: generatedReceipt
    }]);

    alert(`Successfully recorded month-wise fee collection for ${studentObj.fullName} for the term "${termName}".`);
    
    // Reset form fields
    setAmountDue('150');
    setAmountPaid('150');
    setCustomReceiptNo(`REC-${Math.floor(90000 + Math.random() * 9999)}`);
    setSubTab('ledger'); // switch back to ledger list to see updated records
  };

  const canEdit = activeRole === 'Admin' || activeRole === 'Finance';

  // Computed Financial stats
  const statistics = useMemo(() => {
    let totalDue = 0;
    let totalPaid = 0;
    let overdueBalance = 0;
    let pendingCount = 0;

    feeRecords.forEach(f => {
      totalDue += f.amountDue;
      totalPaid += f.amountPaid;
      if (f.status === 'Overdue') {
        overdueBalance += (f.amountDue - f.amountPaid);
      }
      if (f.status === 'Pending') {
        pendingCount++;
      }
    });

    return {
      totalDue,
      totalPaid,
      outstanding: totalDue - totalPaid,
      overdueBalance,
      pendingCount
    };
  }, [feeRecords]);

  // Filters
  const filteredFeeRecords = feeRecords.filter(f => {
    const matchesSearch = f.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Save Bulk Billing Charges
  const handleBulkInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const activeStudents = students.filter(s => s.status === 'Active');
    if (activeStudents.length === 0) {
      alert('No active student profiles registered to build invoice listings.');
      return;
    }

    const amount = parseFloat(billingTermAmount);
    if (!billingTermName || isNaN(amount) || amount <= 0) {
      alert('Please fill a valid billing term name and billing amount.');
      return;
    }

    const charges = activeStudents.map(s => ({
      studentId: s.id,
      studentName: s.fullName,
      term: billingTermName,
      amountDue: amount,
      amountPaid: 0,
      status: 'Pending' as const
    }));

    onAddFeeCharge(charges);
    setIsChargingBulk(false);
    alert(`Successfully generated outstanding billing fees for ${activeStudents.length} active registered students for "${billingTermName}".`);
  };

  // Launch modal for payment clearance
  const startProcessingPayment = (record: FeeRecord) => {
    setProcessingFeeId(record.id);
    const balance = record.amountDue - record.amountPaid;
    setProcessingAmount(balance.toString());
  };

  // Submit payment clearance
  const handlePaymentProcessingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit || !processingFeeId) return;

    const target = feeRecords.find(f => f.id === processingFeeId);
    if (!target) return;

    const inputAmt = parseFloat(processingAmount);
    if (isNaN(inputAmt) || inputAmt < 0) {
      alert('Please state a valid positive numeric paid value.');
      return;
    }

    const newAmountPaid = target.amountPaid + inputAmt;
    let newStatus: 'Paid' | 'Pending' | 'Overdue' = 'Paid';
    
    if (newAmountPaid < target.amountDue) {
      newStatus = 'Pending';
    }

    onUpdateFeeStatus(processingFeeId, newAmountPaid, newStatus, processingPaymentMethod);
    setProcessingFeeId(null);
    alert(`Cleared payment transaction successfully. Adjusted outstanding balance.`);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-6" id="financial-ledger-panel" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      
      {/* Upper totals overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-slate-800">{translations[lang].financeHeading}</h3>
          <p className="text-xs text-slate-500 mt-1">{translations[lang].financeSubtitle}</p>
        </div>
        {canEdit && (
          <button
            id="bulk-billing-button"
            onClick={() => setIsChargingBulk(!isChargingBulk)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            {isChargingBulk ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isChargingBulk ? translations[lang].cancel : translations[lang].addBillingTerm}
          </button>
        )}
      </div>

      {/* Permission banner */}
      {!canEdit && (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 p-3 rounded-lg text-amber-800 text-xs">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600" />
          <p>
            {translations[lang].activeSessionRestriction} <strong>{translations[lang][activeRole] || activeRole}</strong>.
          </p>
        </div>
      )}

      {/* Financial health totals bento */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-emerald-50 text-emerald-800 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Received (Term)</p>
            <h4 className="text-xl font-bold font-serif text-slate-800 mt-0.5">{currSymbol}{statistics.totalPaid}</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Cleared tuition entries</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-rose-50 text-rose-800 rounded-lg">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total Outstanding Balance</p>
            <h4 className="text-xl font-bold font-serif text-rose-800 mt-0.5">{currSymbol}{statistics.outstanding}</h4>
            <p className="text-[10px] text-rose-600 font-bold font-mono mt-0.5">{currSymbol}{statistics.overdueBalance} marked Overdue</p>
          </div>
        </div>

        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="p-3 bg-amber-50 text-amber-800 rounded-lg">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Invoices Pending Action</p>
            <h4 className="text-xl font-bold font-serif text-slate-800 mt-0.5">{statistics.pendingCount} Recs</h4>
            <p className="text-[10px] text-slate-400 font-mono mt-0.5">Requires payment posting</p>
          </div>
        </div>
      </div>

      {/* Term invoice bulk generator form box */}
      {isChargingBulk && canEdit && (
        <form 
          id="bulk-billing-invoice-form"
          onSubmit={handleBulkInvoiceSubmit} 
          className="p-5 border border-indigo-100 bg-indigo-50/20 rounded-xl space-y-4"
        >
          <h4 className="text-sm font-bold text-indigo-800 font-serif border-b pb-2">Issue Term Invoice Billings (Accelerated Charge)</h4>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Billing Period Term Name</label>
              <input
                id="billing-term"
                type="text"
                value={billingTermName}
                onChange={e => setBillingTermName(e.target.value)}
                placeholder="July/August 2026 Term"
                className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-md focus:outline-emerald-500"
                required
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">
                {lang === 'ur' ? 'مقررہ رقم (PKR)' : 'Standard Charge Amount ($)'}
              </label>
              <input
                id="billing-amount"
                type="number"
                value={billingTermAmount}
                onChange={e => setBillingTermAmount(e.target.value)}
                placeholder="150"
                className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-md focus:outline-emerald-500"
                required
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-500 bg-slate-50 p-2.5 rounded-lg">
            {lang === 'ur' ? (
              <>ہر فعال طالب علم کے لیے خودکار طور پر <strong>{currSymbol}{billingTermAmount}</strong> کا چالان تیار ہو جائے گا۔</>
            ) : (
              <>Generating this term invoice automatically creates a Pending invoice record of <strong>{currSymbol}{billingTermAmount}</strong> for every Active student currently on the registry roster.</>
            )}
          </div>

          <div className="flex justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={() => setIsChargingBulk(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 bg-white text-xs font-semibold rounded-md hover:bg-slate-50 cursor-pointer"
            >
              Discard Invoicing
            </button>
            <button
              id="confirm-billing-submit-btn"
              type="submit"
              className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-md cursor-pointer transition-colors shadow-xs"
            >
              Generate & Dispatch Billings
            </button>
          </div>
        </form>
      )}

      {/* Database post process inline panel if toggled */}
      {processingFeeId && (
        <form 
          id="post-payment-fees-form"
          onSubmit={handlePaymentProcessingSubmit} 
          className="p-4 border border-emerald-100 bg-emerald-50/20 rounded-xl space-y-4"
        >
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-800">Clear Outstandings Balance Payment</h4>
            <button className="text-slate-400 hover:text-slate-600 cursor-pointer" onClick={() => setProcessingFeeId(null)}>
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Post Cash Amount Paid</label>
              <input
                type="number"
                value={processingAmount}
                onChange={e => setProcessingAmount(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 bg-white rounded-md focus:outline-emerald-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-600">Payment Gateway/Method</label>
              <select
                value={processingPaymentMethod}
                onChange={e => setProcessingPaymentMethod(e.target.value as any)}
                className="w-full text-xs p-2 border border-slate-200 bg-white rounded-md focus:outline-emerald-500"
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (Zelle/IBAN)</option>
                <option value="Card">Card Reader</option>
                <option value="Online">Online Gateway (Stripe)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <button
                type="submit"
                className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer"
              >
                Deposit & Issue Receipt Id
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Subtab Toggle Selector */}
      <div className="flex border-b border-slate-100 pb-2">
        <div className="inline-flex bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setSubTab('ledger')}
            className={`px-4.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              subTab === 'ledger' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Outstanding Invoices Ledger
          </button>
          <button
            type="button"
            onClick={() => {
              setSubTab('collection');
              setCustomReceiptNo(`REC-${Math.floor(90000 + Math.random() * 9999)}`);
            }}
            className={`px-4.5 py-1.5 text-xs font-semibold rounded-md transition-all cursor-pointer ${
              subTab === 'collection' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Log Month-wise Fee Collection
          </button>
        </div>
      </div>

      {subTab === 'ledger' ? (
        <>
          {/* Fee records filters */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-4.5 h-4.5 absolute left-3 top-3 text-slate-400" />
              <input
                id="tuition-search-input"
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search by student name or Id..."
                className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-emerald-500"
              />
            </div>

            <div>
              <select
                id="filter-fee-status"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-emerald-500 bg-white"
              >
                <option value="All">All Payment Standings</option>
                <option value="Paid">Fully Paid</option>
                <option value="Pending">Unpaid / Pending</option>
                <option value="Overdue">Overdue Balance</option>
              </select>
            </div>
          </div>

          {/* Fee accounts ledger list */}
          <div className="overflow-x-auto rounded-lg border border-slate-100">
            <table className="w-full text-left border-collapse" id="tuition-fees-ledger-table">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="p-4 pl-4">Scholar Name</th>
                  <th className="p-4">Billing Term Period</th>
                  <th className="p-4">Billing Amount</th>
                  <th className="p-4">Amount Deposited</th>
                  <th className="p-4">Receipt/Date Details</th>
                  <th className="p-4">Payment Standings</th>
                  <th className="p-4 text-right">Certificate Ledger</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredFeeRecords.map((f) => {
                  const outstanding = f.amountDue - f.amountPaid;
                  return (
                    <tr key={f.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Name */}
                      <td className="p-4 pl-4 font-bold text-slate-800">{f.studentName}</td>
                      
                      {/* Term */}
                      <td className="p-4 text-slate-500 font-medium">{f.term}</td>
                      
                      {/* Amount Due */}
                      <td className="p-4 font-mono font-bold text-slate-700">{currSymbol}{f.amountDue}</td>
                      
                      {/* Amount Paid */}
                      <td className="p-4 font-mono">
                        <span className="text-emerald-700 font-bold">{currSymbol}{f.amountPaid}</span>
                        {outstanding > 0 && <span className="text-rose-500 text-[10px] block font-semibold">
                          {lang === 'ur' ? `بقایا: ${currSymbol}${outstanding}` : `Rem: ${currSymbol}${outstanding} due`}
                        </span>}
                      </td>

                      {/* Receipt */}
                      <td className="p-4 font-mono text-[11px] text-slate-500">
                        {f.receiptNumber ? (
                          <div>
                            <div className="text-slate-700 font-bold">{f.receiptNumber}</div>
                            <div className="text-[10px] text-slate-400 mt-0.5">{f.datePaid} • {f.paymentMethod}</div>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-mono italic text-[11px]">Unposted</span>
                        )}
                      </td>

                      {/* Status Indicator */}
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-sm font-bold text-[10px] font-mono capitalize ${
                          f.status === 'Paid' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                          f.status === 'Pending' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                          'bg-rose-50 text-rose-800 border border-rose-100'
                        }`}>
                          {f.status}
                        </span>
                      </td>

                      {/* Print and Clearing post action */}
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Clearing payment action if permission check passes */}
                          {canEdit && f.status !== 'Paid' && (
                            <button
                              type="button"
                              onClick={() => startProcessingPayment(f)}
                              className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-100 text-[10.5px] font-bold rounded cursor-pointer transition-colors"
                              title="Post tuition clearance deposit"
                            >
                              Clear Balance
                            </button>
                          )}

                          {/* Receipt viewer trigger */}
                          {f.status === 'Paid' ? (
                            <button
                              type="button"
                              onClick={() => setSelectedReceipt(f)}
                              className="p-1.5 bg-slate-100 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 border border-slate-200 rounded cursor-pointer transition-colors"
                              title="View family invoice receipt sheet"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1.5 bg-slate-50 text-slate-300 rounded cursor-not-allowed"
                              title="Receipt locked until balance is fully paid"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          )}

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* Form for Month-wise Fee Collection */
        <form onSubmit={handleAddNewCollection} className="p-6 bg-slate-50 rounded-xl border border-slate-250/60 space-y-4 max-w-2xl" id="month-wise-fee-form">
          <div className="border-b pb-3 border-slate-200">
            <h4 className="text-sm font-bold text-slate-800 font-serif">Input Individual Monthly Fee Collection</h4>
            <p className="text-xs text-slate-500 mt-0.5">Quickly record a student's tuition payment collected for a specific calendar month.</p>
          </div>

          {!canEdit && (
            <div className="p-3 bg-amber-50 border border-amber-100 text-amber-800 text-xs rounded-lg flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 animate-bounce" />
              <span>You do not have administrative permissions (Finance/Admin) to commit financial collection records.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Student selection dropdown */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Select Student Scholar</label>
              <select
                value={selectedStudentId}
                onChange={e => setSelectedStudentId(e.target.value)}
                disabled={!canEdit}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500"
                required
              >
                <option value="">-- Choose Roster Scholar --</option>
                {activeStudents.map(student => (
                  <option key={student.id} value={student.id}>
                    {student.fullName} ({student.id}) — {student.level}
                  </option>
                ))}
              </select>
            </div>

            {/* Collection Date */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment Received Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  value={collectionDate}
                  onChange={e => setCollectionDate(e.target.value)}
                  disabled={!canEdit}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 bg-white rounded-md focus:outline-emerald-500 font-mono"
                  required
                />
              </div>
            </div>

            {/* Billing Month Period */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Billing Month Period</label>
              <select
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                disabled={!canEdit}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500 font-medium"
                required
              >
                {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Billing Year Period */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Billing Year Period</label>
              <select
                value={selectedYear}
                onChange={e => setSelectedYear(e.target.value)}
                disabled={!canEdit}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500 font-mono"
                required
              >
                {["2024", "2025", "2026", "2027"].map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>

            {/* Tuition Dues Amount */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'ur' ? 'مقررہ رقم (PKR)' : 'Standard Amount Due ($)'}
              </label>
              <input
                type="number"
                value={amountDue}
                onChange={e => setAmountDue(e.target.value)}
                disabled={!canEdit}
                placeholder="150"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500 font-mono"
                required
              />
            </div>

            {/* Collected Fee Amount */}
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {lang === 'ur' ? 'وصول کردہ رقم (PKR)' : 'Amount Collected ($)'}
                </label>
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setAmountPaid(amountDue)}
                    className="text-[10px] text-indigo-700 hover:underline font-semibold cursor-pointer"
                  >
                    Match Full Due
                  </button>
                )}
              </div>
              <input
                type="number"
                value={amountPaid}
                onChange={e => setAmountPaid(e.target.value)}
                disabled={!canEdit}
                placeholder="150"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500 font-mono"
                required
              />
            </div>

            {/* Payment Method select */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Payment Method / Gateway</label>
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value as any)}
                disabled={!canEdit}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500"
                required
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer (Zelle/ACH)</option>
                <option value="Card">Card Reader Terminal</option>
                <option value="Online">Online Gateway (Stripe)</option>
              </select>
            </div>

            {/* Receipt Number */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Receipt Ledger No.</label>
              <input
                type="text"
                value={customReceiptNo}
                onChange={e => setCustomReceiptNo(e.target.value)}
                disabled={!canEdit}
                placeholder="REC-99801"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500 font-mono font-semibold"
              />
            </div>

          </div>

          <div className="bg-white/60 p-3 rounded-lg border border-slate-200 text-[10.5px] text-slate-500 space-y-1 leading-relaxed">
            <p className="font-semibold text-slate-700 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              Automated Posting & Synced Audit
            </p>
            <p>
              Submitting this form immediately registers a tuition fee record for the student matching the selected month period. It generates an auto-receipt and synchronizes the ledger instantly with cloud server databases.
            </p>
          </div>

          {canEdit && (
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
              >
                <Plus className="w-4 h-4 shrink-0" />
                Commit Month-wise Fee Collection Log
              </button>
            </div>
          )}
        </form>
      )}

      {/* Printable Receipt Modal Overlay */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg border border-slate-200 max-w-md w-full p-6 space-y-6 relative overflow-hidden" id="receipt-modal">
            
            {/* Header watermarks */}
            <div className="absolute top-0 right-0 p-8 transform translate-x-8 -translate-y-8 text-slate-100 font-serif select-none pointer-events-none text-9xl">
              🕌
            </div>

            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 shrink-0 rounded-full bg-white border border-slate-100 shadow-xs p-0.5 overflow-hidden">
                  <img
                    src={jamiaLogo}
                    alt="JAMIA YAHYA AL MADNI Logo"
                    className="w-full h-full object-contain"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div>
                  <h3 className="font-serif text-slate-800 text-[15px] leading-tight font-bold">JAMIA YAHYA AL MADNI</h3>
                  <p className="text-[9px] uppercase font-mono tracking-wider text-slate-450 mt-0.5">Islamic Education Tuition Clearing</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedReceipt(null)}
                className="p-1.5 hover:bg-slate-100 rounded-md cursor-pointer text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt core information print layout */}
            <div className="border border-emerald-100 bg-emerald-50/10 rounded-lg p-4 space-y-4 font-sans text-xs">
              <div className="flex justify-between text-xs font-mono">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[8px]">Receipt ID</span>
                  <span className="font-bold text-emerald-800">{selectedReceipt.receiptNumber}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 font-bold block uppercase text-[8px]">Clearance Date</span>
                  <span className="font-bold text-slate-700">{selectedReceipt.datePaid}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Student Scholar:</span>
                  <strong className="text-slate-800 font-bold">{selectedReceipt.studentName}</strong>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span className="text-slate-500">Account Student ID:</span>
                  <span className="font-mono">{selectedReceipt.studentId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Billing Cycles (Term):</span>
                  <span className="text-slate-700 font-semibold">{selectedReceipt.term}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Payment Gateway Channel:</span>
                  <span className="text-slate-700 font-medium">{selectedReceipt.paymentMethod}</span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center bg-slate-50 p-2.5 rounded">
                <div>
                  <span className="text-slate-400 font-bold block uppercase text-[8.5px]">{lang === 'ur' ? 'کل وصول شدہ رقم' : 'Amount Paid'}</span>
                  <span className="text-sm font-bold text-slate-700">
                    {lang === 'ur' ? 'مکمل ادا شدہ ٹیوشن فیس چالان' : 'Fully Cleared Tuition Invoice'}
                  </span>
                </div>
                <span className="text-xl font-bold font-serif text-emerald-800">{currSymbol}{selectedReceipt.amountPaid}.00</span>
              </div>

              {/* Islamic Calligraphy visual block mimicking trust */}
              <div className="text-center pt-2 text-[10px] text-emerald-700 font-serif italic border-t border-slate-100 border-dashed">
                "And seek knowledge from the cradle to the grave."
              </div>

            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => window.print()}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print Receipt
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
