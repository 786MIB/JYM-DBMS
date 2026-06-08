import React, { useRef, useState } from 'react';
import { translations } from '../translations';
import { 
  Download, 
  Upload, 
  Trash2, 
  FileSpreadsheet, 
  Database, 
  CheckCircle, 
  Server, 
  AlertTriangle,
  RotateCcw,
  Sparkles,
  RefreshCw,
  Terminal,
  Shield,
  UserCheck,
  UserX
} from 'lucide-react';
import { DbState, StaffRole, LocalUser } from '../types';

interface AdminProps {
  db: DbState;
  onRestoreDb: (restoredState: DbState) => void;
  onResetDb: () => void;
  activeRole: StaffRole;
  syncStatus: 'synced' | 'pending' | 'offline';
  isSyncing: boolean;
  onRefresh: () => void;
  lang: 'en' | 'ur';
  currentUser: LocalUser | null;
  onUpdateUserRole: (targetUserId: string, newRole: StaffRole) => Promise<void>;
}

export const AdminPanel: React.FC<AdminProps> = ({
  db,
  onRestoreDb,
  onResetDb,
  activeRole,
  syncStatus,
  isSyncing,
  onRefresh,
  lang,
  currentUser,
  onUpdateUserRole
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [roleError, setRoleError] = useState('');

  const isAdmin = activeRole === 'Admin';
  const isMasterAdmin = currentUser?.email?.toLowerCase() === 'mibrahim.acca@gmail.com';

  // 1. Download database state as Offline JSON Backup
  const downloadJsonBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(db, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      
      const fileTimestamp = new Date().toISOString().slice(0, 10);
      downloadAnchor.setAttribute("download", `Islamic_Institute_Backup_${fileTimestamp}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (err) {
      alert('Failed to generate local JSON backup download.');
    }
  };

  // 2. Upload / Restore Database from JSON backup
  const handleJsonRestoreUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImportError('');
    setImportSuccess(false);
    
    const file = e.target.files?.[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string) as DbState;
        
        // Assert basic schema checks
        if (!parsed.students || !Array.isArray(parsed.students) || 
            !parsed.feeRecords || !Array.isArray(parsed.feeRecords) || 
            !parsed.studentAttendance || !Array.isArray(parsed.studentAttendance) ||
            !parsed.topicCoverage || !Array.isArray(parsed.topicCoverage)) {
          setImportError('Invalid schema definition detected. The selected JSON file is not a valid Islamic Institute Database backup.');
          return;
        }

        // Trigger restore save
        onRestoreDb(parsed);
        setImportSuccess(true);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } catch (err) {
        setImportError('Failed to parse selected backup file. Ensure it is a valid, uncorrupted JSON document.');
      }
    };
    fileReader.readAsText(file);
  };

  // Helper: Convert array of objects to CSV string
  const arrayToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    for (const row of data) {
      const values = headers.map(header => {
        const val = row[header];
        const escaped = ('' + (val ?? '')).replace(/"/g, '""');
        return `"${escaped}"`;
      });
      csvRows.push(values.join(','));
    }
    return csvRows.join('\n');
  };

  // Helper: Trigger browser file download
  const triggerCsvDownload = (csvContent: string, fileName: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 3. Export Modules to CSV
  const exportStudentsToCSV = () => {
    const formatted = db.students.map(s => ({
      ID: s.id,
      FullName: s.fullName,
      Gender: s.gender,
      DOB: s.dateOfBirth,
      EnrollmentDate: s.enrollmentDate,
      TrackLevel: s.level,
      EmergencyContactName: s.parentName,
      DirectContactPhone: s.parentPhone,
      DirectEmail: s.parentEmail,
      StatusStanding: s.status,
      HomeAddress: s.address || ''
    }));
    triggerCsvDownload(arrayToCSV(formatted), 'Students_Roster_Register.csv');
  };

  const exportFeesToCSV = () => {
    const formatted = db.feeRecords.map(f => ({
      TransactionID: f.id,
      StudentID: f.studentId,
      StudentName: f.studentName,
      TermPeriod: f.term,
      AmountDue: `PKR ${f.amountDue}`,
      AmountPaid: `PKR ${f.amountPaid}`,
      StatusStanding: f.status,
      DatePaid: f.datePaid || 'Unposted',
      ReceiptNumber: f.receiptNumber || 'Unassigned',
      PaymentMethod: f.paymentMethod || 'N/A'
    }));
    triggerCsvDownload(arrayToCSV(formatted), 'Tuition_Ledger_Balances.csv');
  };

  const exportAttendanceToCSV = () => {
    const formatted = db.studentAttendance.map(a => ({
      RecordID: a.id,
      StudentID: a.studentId,
      StudentName: a.studentName,
      CheckinDate: a.date,
      ClassMatched: a.class,
      StatusStanding: a.status,
      TeacherRemarks: a.notes || ''
    }));
    triggerCsvDownload(arrayToCSV(formatted), 'Student_Attendance_Journal.csv');
  };

  const exportCurriculumToCSV = () => {
    const formatted = db.topicCoverage.map(t => ({
      LessonID: t.id,
      SubjectMatched: t.subject,
      ClassLevel: t.level,
      TopicCovered: t.topicName,
      CoverageDate: t.dateCovered,
      InstructingTeacher: t.teacherName,
      StatusStanding: t.progressStatus,
      PedagogyNotes: t.notes || ''
    }));
    triggerCsvDownload(arrayToCSV(formatted), 'Curriculum_Syllabi_Progression.csv');
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-6" id="admin-controls-dashboard" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      
      {/* Title */}
      <div>
        <h3 className="text-lg font-serif font-bold text-slate-800">{translations[lang].adminHeading}</h3>
        <p className="text-xs text-slate-500 mt-1">{translations[lang].adminSubtitle}</p>
      </div>

      {/* Access restrictions for Non-Admins */}
      {!isAdmin && (
        <div className="flex items-start gap-2.5 bg-rose-50 border border-rose-100 p-4 rounded-xl text-rose-800 text-xs">
          <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div>
            <p className="font-bold">{translations[lang].adminLockedTitle || "System Administration Locked"}</p>
            <p className="mt-1 leading-relaxed">
              {translations[lang].activeSessionRestriction} <strong>{translations[lang][activeRole] || activeRole}</strong>.
            </p>
          </div>
        </div>
      )}

      {/* Main grids for backups and diagnostics */}
      <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 ${!isAdmin ? 'opacity-40 pointer-events-none' : ''}`}>
        
        {/* Offline Backup Operations Box */}
        <div className="p-5 border border-slate-200 rounded-xl space-y-5">
          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 font-serif">
            <Database className="w-4.5 h-4.5 text-emerald-700 font-bold" />
            Durable JSON Storage & Backups
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Protect your institution archives from server connection downtime. Download structured copies locally or retrieve them back instantly inside any tablet or computer workstation.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            
            {/* Download */}
            <button
              onClick={downloadJsonBackup}
              disabled={!isAdmin}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-750 hover:bg-emerald-800 text-emerald-800 bg-emerald-50 border border-emerald-200 text-xs font-semibold rounded-lg cursor-pointer transition-colors"
            >
              <Download className="w-4 h-4 text-emerald-700" /> Download JSON Backup
            </button>

            {/* Upload Selector */}
            <label className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-50 border border-indigo-200 text-indigo-800 text-xs font-semibold rounded-lg cursor-pointer transition-colors hover:bg-indigo-100">
              <Upload className="w-4 h-4 text-indigo-700" />
              Upload & Restore JSON
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleJsonRestoreUpload}
                className="hidden"
                disabled={!isAdmin}
              />
            </label>

          </div>

          {/* Feedback messages */}
          {importSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 text-emerald-850 rounded-lg text-xs flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 shrink-0 text-emerald-600" />
              <span>Database successfully restored and synchronized with offline registers!</span>
            </div>
          )}

          {importError && (
            <div className="p-3 bg-rose-50 border border-rose-100 text-rose-800 rounded-lg text-xs">
              {importError}
            </div>
          )}

        </div>

        {/* Database Spreadsheet Export Box */}
        <div className="p-5 border border-slate-200 rounded-xl space-y-5">
          <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5 font-serif">
            <FileSpreadsheet className="w-4.5 h-4.5 text-emerald-700 font-bold" />
            CSV Spreadsheet Journals
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            Extract records to view in Microsoft Excel, Google Sheets, or Numbers. Clean, standardized data layout formatted instantly from your browser memory.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={exportStudentsToCSV}
              className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
            >
              Ex Student Roster
            </button>
            
            <button
              onClick={exportFeesToCSV}
              className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
            >
              Ex Fee Invoices
            </button>

            <button
              onClick={exportAttendanceToCSV}
              className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
            >
              Ex Student Attendance
            </button>

            <button
              onClick={exportCurriculumToCSV}
              className="flex items-center justify-center gap-1.5 p-2 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-medium rounded-lg cursor-pointer transition-colors"
            >
              Ex Courses Coverage
            </button>
          </div>
        </div>

      </div>

      {/* Diagnostics Diagnostics and status overview */}
      <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${!isAdmin ? 'opacity-40 pointer-events-none' : ''}`}>
        
        {/* Core telemetry */}
        <div className="md:col-span-2 p-5 border border-slate-200 rounded-xl space-y-4 bg-slate-950 text-slate-300 font-mono text-xs">
          <div className="flex justify-between items-center border-b border-slate-800 pb-2">
            <span className="flex items-center gap-1 text-slate-400 font-bold">
              <Terminal className="w-4 h-4 text-emerald-500" />
              SYSTEM PORT DIAGNOSTICS
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">PORT: 3000</span>
          </div>

          <div className="space-y-1 text-slate-400">
            <p><span className="text-emerald-500">SYSTEM:</span> [JAMIA YAHYA AL MADNI Admin Portal v2.1.0]</p>
            <p><span className="text-emerald-500">SYNC_CH:</span> Cloud sync status: <strong className="text-white uppercase">{syncStatus}</strong></p>
            <p><span className="text-emerald-500">RECS:</span> Total Students size: <strong className="text-slate-200">{db.students.length} units</strong></p>
            <p><span className="text-emerald-500">METS:</span> Logged Attendances: <strong className="text-slate-200">{db.studentAttendance.length} reconds</strong></p>
            <p><span className="text-emerald-500">BILL:</span> Fee records: <strong className="text-slate-200">{db.feeRecords.length} records</strong></p>
            <p><span className="text-emerald-500">LAST:</span> Sync Timestamp: <strong className="text-emerald-400">{db.lastSynced || 'Never'}</strong></p>
          </div>
        </div>

        {/* Diagnostic formatting operations */}
        <div className="p-5 border border-slate-200 rounded-xl space-y-4 flex flex-col justify-between bg-slate-50">
          <div>
            <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase">Emergency Diagnostics & Records Clear</h4>
            <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
              Wipe all registries to start with a completely empty registry for the institute, or restore high-fidelity educational seed items for demonstration.
            </p>
          </div>

          <div className="space-y-2">
            {/* DESTROY & CLEAR ALL RECORDS BUTTON */}
            <button
              onClick={() => {
                if (confirm('⚠️ CRITICAL WARNING: This action will completely WIPE and delete all students, teachers, fee records, topic coverages, and attendance history logs from JAMIA YAHYA AL MADNI databases. This cannot be undone! Clear all records now?')) {
                  const blankDb: DbState = {
                    students: [],
                    studentAttendance: [],
                    feeRecords: [],
                    teacherAttendance: [],
                    topicCoverage: [],
                    users: db.users || [],
                    lastSynced: new Date().toISOString(),
                    version: 1
                  };
                  onRestoreDb(blankDb);
                  alert('JAMIA YAHYA AL MADNI registries wiped! Database of all records has been successfully cleared.');
                }
              }}
              disabled={!isAdmin}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-300 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
            >
              <Trash2 className="w-4 h-4 shrink-0" />
              Wipe & Clear All Records
            </button>

            {/* RESTORE ORIGINAL DEMO DATA */}
            <button
              onClick={() => {
                if (confirm('Overwrite current roster with standard factory default seed data for demonstration?')) {
                  onResetDb();
                  alert('Database registry reset to default administrative items.');
                }
              }}
              disabled={!isAdmin}
              className="w-full flex items-center justify-center gap-2 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-50 text-xs font-medium rounded-lg cursor-pointer transition-colors border border-slate-200"
            >
              <RotateCcw className="w-3.5 h-3.5 shrink-0 text-slate-500" />
              Restore Demo Seed Data
            </button>
          </div>
        </div>

      </div>

      {/* User Accounts & Role Permissions Panel (RBAC Segment) */}
      <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs mt-6">
        <div className="bg-slate-900 px-5 py-4 text-white flex justify-between items-center select-none">
          <div>
            <h4 className="text-sm font-serif font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
              <Shield className="w-4.5 h-4.5 text-amber-400" />
              {lang === 'ur' ? 'صارفین کے اکاؤنٹس اور اجازت نامے' : 'User Accounts & Role Permissions'}
            </h4>
            <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
              {lang === 'ur' 
                ? 'رجسٹرڈ صارفین کے کردار اور ڈیٹا بیس تک رسائی کا نظام' 
                : 'Enforce security protocols and assign authorized teaching or administrative categories.'}
            </p>
          </div>
          <span className="text-[10px] bg-slate-800 text-amber-300 border border-slate-700 font-mono px-2 py-0.5 rounded-full select-none uppercase">
            {lang === 'ur' ? 'صرف مولیٰ ایڈمنسٹریٹر' : 'Secure Admin Scope'}
          </span>
        </div>

        <div className="p-5 space-y-4">
          {/* Master admin constraint label */}
          {!isMasterAdmin && (
            <div className="bg-rose-50 border border-rose-100 p-3 rounded-lg text-xs text-rose-800 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>
                {lang === 'ur'
                  ? 'صرف مرکزی ایڈمنسٹریٹر اکاؤنٹ (mibrahim.acca@gmail.com) کردار تبدیل کرنے کا مجاز ہے۔'
                  : 'Role updates are restricted. Only the master administrator (mibrahim.acca@gmail.com) can modify security rankings.'}
              </span>
            </div>
          )}

          {roleError && (
            <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-lg text-xs text-rose-800">
              {roleError}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 font-sans">
              <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 uppercase border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 text-slate-700">{lang === 'ur' ? 'صارف کا نام' : 'Name'}</th>
                  <th className="px-4 py-3 text-slate-700">{lang === 'ur' ? 'ای میل ایڈریس' : 'Email'}</th>
                  <th className="px-4 py-3 text-slate-700">{lang === 'ur' ? 'سورس لاگ ان' : 'Provider'}</th>
                  <th className="px-4 py-3 text-slate-700">{lang === 'ur' ? 'تفویض کردہ رول' : 'Assigned Role'}</th>
                  <th className="px-4 py-3 text-right text-slate-700">{lang === 'ur' ? 'اقدامات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(db.users || [
                  { id: 'USR-1', email: 'mibrahim.acca@gmail.com', fullName: 'M. Ibrahim', role: 'Admin', provider: 'local' }
                ]).map((user: LocalUser) => {
                  const isPowerUser = user.email.toLowerCase() === 'mibrahim.acca@gmail.com';
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-4 py-3.5 font-semibold text-slate-900 flex items-center gap-1.5">
                        <span className="text-base select-none">{isPowerUser ? '👑' : '👤'}</span>
                        {user.fullName}
                      </td>
                      <td className="px-4 py-3.5 font-mono text-[11px] text-slate-500">{user.email}</td>
                      <td className="px-4 py-3.5">
                        <span className="capitalize px-2 py-0.5 rounded-full text-[10px] font-semibold tracking-wide bg-slate-100 text-slate-700 border border-slate-200/55 inline-flex items-center gap-1">
                          {user.provider === 'google' && <span className="text-xs">🌐</span>}
                          {user.provider === 'microsoft' && <span className="text-xs text-indigo-500">❖</span>}
                          {user.provider === 'local' && <span className="text-xs text-slate-400">✉</span>}
                          {user.provider}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {isMasterAdmin && !isPowerUser ? (
                          <select
                            value={user.role}
                            onChange={async (e) => {
                              try {
                                setUpdatingUserId(user.id);
                                setRoleError('');
                                await onUpdateUserRole(user.id, e.target.value as StaffRole);
                              } catch (err: any) {
                                setRoleError(err.message || 'Error updating user role assignment');
                              } finally {
                                setUpdatingUserId(null);
                              }
                            }}
                            disabled={updatingUserId === user.id}
                            className="bg-slate-50 border border-slate-300 text-slate-800 text-[11.5px] font-bold rounded-lg focus:ring-emerald-500 focus:border-emerald-500 focus:outline-hidden p-1 min-w-[120px] shadow-sm select-auto"
                          >
                            <option value="Guest">{lang === 'ur' ? 'مہمان (Guest)' : 'Guest'}</option>
                            <option value="Teacher">{lang === 'ur' ? 'استاد (Teacher)' : 'Teacher'}</option>
                            <option value="Finance">{lang === 'ur' ? 'ناظمِ مالیات (Finance)' : 'Finance'}</option>
                            <option value="Registrar">{lang === 'ur' ? 'ناظمِ داخلہ (Registrar)' : 'Registrar'}</option>
                            <option value="Admin">{lang === 'ur' ? 'ایڈمن (Admin)' : 'Admin'}</option>
                          </select>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-md text-[10.5px] font-bold border ${
                            user.role === 'Admin'
                              ? 'bg-amber-50 text-amber-800 border-amber-200'
                              : user.role === 'Teacher'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : user.role === 'Finance'
                              ? 'bg-indigo-50 text-indigo-800 border-indigo-200'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}>
                            {translations[lang][user.role] || user.role}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 text-right font-mono text-[10px] text-slate-400">
                        {updatingUserId === user.id ? (
                          <span className="text-emerald-600 font-bold flex items-center justify-end gap-1 select-none animate-pulse">
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Synchronizing...
                          </span>
                        ) : isPowerUser ? (
                          <span className="text-amber-600 font-bold tracking-wider select-none">DATABASE OWNER</span>
                        ) : (
                          <span>ACTIVE WORKER</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
