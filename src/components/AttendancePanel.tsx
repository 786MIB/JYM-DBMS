import React, { useState, useMemo } from 'react';
import { translations } from '../translations';
import { 
  Users, 
  BookOpen, 
  CheckCircle, 
  HelpCircle, 
  AlertCircle, 
  Calendar, 
  Save, 
  Sparkles,
  Search,
  Check,
  UserCheck,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import { Student, StudentAttendance, TeacherAttendance, IslamicSubject, StaffRole } from '../types';

interface AttendanceProps {
  students: Student[];
  studentAttendance: StudentAttendance[];
  teacherAttendance: TeacherAttendance[];
  onSaveStudentAttendance: (records: Omit<StudentAttendance, 'id'>[]) => void;
  onSaveTeacherAttendance: (record: Omit<TeacherAttendance, 'id'>) => void;
  activeRole: StaffRole;
  lang: 'en' | 'ur';
}

export const AttendancePanel: React.FC<AttendanceProps> = ({
  students,
  studentAttendance,
  teacherAttendance,
  onSaveStudentAttendance,
  onSaveTeacherAttendance,
  activeRole,
  lang
}) => {
  const [subTab, setSubTab] = useState<'students' | 'teachers'>('students');

  // Generic CSV Exporter
  const exportToCSV = (filename: string, headers: string[], rows: any[][]) => {
    const content = [
      headers.join(','),
      ...rows.map(row => 
        row.map(val => {
          const str = val === null || val === undefined ? '' : String(val);
          return `"${str.replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportStudentsRegistry = () => {
    const headers = [
      'ID',
      'Full Name',
      'Academic Level',
      'Status',
      'Guardian Name',
      'Primary Phone',
      'Admission Date',
      'Monthly Fee',
      'Outstanding Dues'
    ];
    const rows = students.map(s => [
      s.id,
      s.fullName,
      s.level,
      s.status,
      s.guardianName,
      s.phone,
      s.admissionDate,
      s.monthlyFee,
      s.duesOutstanding
    ]);
    exportToCSV(`jamia_students_registry_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const handleExportStudentAttendance = () => {
    const headers = [
      'Record ID',
      'Student ID',
      'Student Name',
      'Date',
      'Class',
      'Attendance Standing',
      'Notes & Lesson Progress'
    ];
    const rows = studentAttendance.map(a => [
      a.id,
      a.studentId,
      a.studentName,
      a.date,
      a.class,
      a.status,
      a.notes || ''
    ]);
    exportToCSV(`jamia_student_attendance_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };

  const handleExportTeacherAttendance = () => {
    const headers = [
      'Record ID',
      'Instructor Name',
      'Designation',
      'Roster Date',
      'Duty Status',
      'Assigned Level Class'
    ];
    const rows = teacherAttendance.map(t => [
      t.id,
      t.teacherName,
      t.designation,
      t.date,
      t.status,
      t.classAssigned
    ]);
    exportToCSV(`jamia_teacher_attendance_${new Date().toISOString().split('T')[0]}.csv`, headers, rows);
  };
  
  // Date selection - defaults to current local date
  const [selectedDate, setSelectedDate] = useState('2026-06-03'); // Using realistic dates matching seed
  const [selectedClass, setSelectedClass] = useState('Year 1 / Al-Oula');
  
  // Teacher attendance states
  const [teacherName, setTeacherName] = useState('Sheikh Ibrahim Al-Azhari');
  const [teacherStatus, setTeacherStatus] = useState<'Present' | 'Absent' | 'Late' | 'Sick Leave'>('Present');
  const [classAssigned, setClassAssigned] = useState('Class A - Tajweed Masterclass');

  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  const classesList = [
    'Year 1 / Al-Oula',
    'Year 2 / Al-Thaniya',
    'Year 3 / Al-Thalitha',
    'Year 4 / Al-Rabia',
    'Year 5 / Al-Kamila',
    'Class A - Tajweed Masterclass',
    'Class B - Arabic Grammar',
    'Class C - Hadith Studies'
  ];

  const teachersList = [
    'Sheikh Ibrahim Al-Azhari',
    'Sister Amina Siddiqui',
    'Ustadh Bilal Al-Tunisi',
    'Mufti Yahya Rahim'
  ];

  const canEdit = activeRole === 'Admin' || activeRole === 'Teacher';

  // State to hold temporary form checkboxes for students for the selected date + class
  const [tempAttendance, setTempAttendance] = useState<Record<string, {
    status: 'Present' | 'Absent' | 'Late' | 'Excused';
    notes: string;
  }>>({});

  // Reset or populate temporary structures when date/class changes
  const activeStudents = useMemo(() => {
    return students.filter(s => s.status === 'Active');
  }, [students]);

  const filteredActiveStudents = useMemo(() => {
    return activeStudents.filter(s =>
      s.fullName.toLowerCase().includes(studentSearchQuery.toLowerCase())
    );
  }, [activeStudents, studentSearchQuery]);

  // Read existing records if any
  const existingRecords = useMemo(() => {
    const records = studentAttendance.filter(
      r => r.date === selectedDate && r.class === selectedClass
    );
    const mapped: Record<string, StudentAttendance> = {};
    records.forEach(r => {
      mapped[r.studentId] = r;
    });
    return mapped;
  }, [studentAttendance, selectedDate, selectedClass]);

  // Set default state for temporary check-ins
  React.useEffect(() => {
    const initial: typeof tempAttendance = {};
    activeStudents.forEach(s => {
      const exist = existingRecords[s.id];
      if (exist) {
        initial[s.id] = { status: exist.status, notes: exist.notes || '' };
      } else {
        initial[s.id] = { status: 'Present', notes: '' };
      }
    });
    setTempAttendance(initial);
  }, [selectedDate, selectedClass, activeStudents, existingRecords]);

  // Bulk set all students to present/absent
  const handleBulkStatus = (status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    if (!canEdit) return;
    const updated = { ...tempAttendance };
    activeStudents.forEach(s => {
      if (updated[s.id]) {
        updated[s.id].status = status;
      } else {
        updated[s.id] = { status, notes: '' };
      }
    });
    setTempAttendance(updated);
  };

  const handleStatusChange = (studentId: string, status: 'Present' | 'Absent' | 'Late' | 'Excused') => {
    if (!canEdit) return;
    setTempAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        status
      }
    }));
  };

  const handleNotesChange = (studentId: string, notes: string) => {
    if (!canEdit) return;
    setTempAttendance(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        notes
      }
    }));
  };

  const handleSubmitStudentAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const recordsToSave = activeStudents.map(s => {
      const state = tempAttendance[s.id] || { status: 'Present', notes: 'Checked' };
      return {
        studentId: s.id,
        studentName: s.fullName,
        date: selectedDate,
        class: selectedClass,
        status: state.status,
        notes: state.notes
      };
    });

    onSaveStudentAttendance(recordsToSave);
    alert('Attendance ledger successfully logged and synchronized with cloud database.');
  };

  const handleSubmitTeacherAttendance = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    const designation = teacherName.includes('Sheikh') ? 'Chief Sheikh & Quran Mentor' :
                        teacherName.includes('Mufti') ? 'Islamic Jurisprudence Principal' :
                        teacherName.includes('Sister') ? 'Islamic History Instructor' : 'Arabic Language Lecturer';

    onSaveTeacherAttendance({
      teacherName,
      designation,
      date: selectedDate,
      status: teacherStatus,
      classAssigned
    });

    alert(`Attendance logged for ${teacherName}.`);
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-6" id="attendance-tracking-panel" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      
      {/* Tab Switcher & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-slate-800">{translations[lang].attendanceHeading}</h3>
          <p className="text-xs text-slate-500 mt-0.5">{translations[lang].attendanceSubtitle}</p>
        </div>
        
        {/* Toggle Pills */}
        <div className="inline-flex bg-slate-100 p-1 rounded-lg self-start">
          <button
            onClick={() => setSubTab('students')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'students' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {translations[lang].studentCheckInToggle || "Student Check-In"}
          </button>
          <button
            onClick={() => setSubTab('teachers')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors cursor-pointer ${
              subTab === 'teachers' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            {translations[lang].teacherAttendanceToggle || "Teacher Standings"}
          </button>
        </div>
      </div>

      {/* Premium Dynamic Data Exports Box */}
      <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl space-y-3">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-800 shrink-0" />
          <div>
            <h4 className="text-xs font-serif font-bold text-slate-700 tracking-wide">
              {lang === 'ur' ? 'لیجر اور حاضری ڈیٹا ایکسپورٹ پورٹل' : 'Madrasah Exports & Institutional Ledger Downloads'}
            </h4>
            <p className="text-[10px] text-slate-500">
              {lang === 'ur' ? 'جامعہ کے فعال طلباء، روزانہ کوائف کی حاضری ریکارڈز اور اساتذہ کے حاضری کوائف کے الگ ایکسل اور سی ایس وی شیٹ ڈاؤن لوڈ کریں' : 'Download comprehensive local spreadsheet datasets for students registry, student class tracking, and teacher standings.'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
          <button
            type="button"
            onClick={handleExportStudentsRegistry}
            className="flex items-center justify-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg shadow-2xs hover:border-slate-300 transition-all cursor-pointer active:scale-98 select-none"
          >
            <Download className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>{lang === 'ur' ? 'طلباء کا رجسٹر (CSV)' : 'Export Academic Roster (CSV)'}</span>
          </button>
          
          <button
            type="button"
            onClick={handleExportStudentAttendance}
            className="flex items-center justify-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg shadow-2xs hover:border-slate-300 transition-all cursor-pointer active:scale-98 select-none"
          >
            <Download className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{lang === 'ur' ? 'طلباء حاضری ریکارڈز (CSV)' : 'Export Student Attendance (CSV)'}</span>
          </button>
          
          <button
            type="button"
            onClick={handleExportTeacherAttendance}
            className="flex items-center justify-center gap-2 px-3.5 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-medium rounded-lg shadow-2xs hover:border-slate-300 transition-all cursor-pointer active:scale-98 select-none"
          >
            <Download className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>{lang === 'ur' ? 'معزز اساتذہ لاگ رجسٹر (CSV)' : 'Export Teacher Duty Logs (CSV)'}</span>
          </button>
        </div>
      </div>

      {/* Access restrictions warning banner */}
      {!canEdit && (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 p-3 rounded-lg text-amber-800 text-xs">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600" />
          <p>
            {translations[lang].activeSessionRestriction} <strong>{translations[lang][activeRole] || activeRole}</strong>.
          </p>
        </div>
      )}

      {/* Student Attendance Panel Block */}
      {subTab === 'students' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Attendance Date</label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full text-xs pl-9 pr-3 py-2 border border-slate-200 bg-white rounded-md focus:outline-emerald-500 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {lang === 'ur' ? 'کلاس / درجہ' : 'Class / Grade Level'}
              </label>
              <select
                value={selectedClass}
                onChange={e => setSelectedClass(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-md focus:outline-emerald-500"
                id="selected-class-field"
              >
                {classesList.map((cls) => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Student Name</label>
              <input
                type="text"
                value={studentSearchQuery}
                onChange={e => setStudentSearchQuery(e.target.value)}
                placeholder="Enter Student Name..."
                className="w-full text-xs p-2.5 border border-slate-200 bg-white rounded-md focus:outline-emerald-500"
                id="student-name-field"
              />
            </div>

            <div className="flex flex-col justify-end">
              {canEdit && (
                <div className="flex flex-wrap items-center gap-1.5 pb-1">
                  <span className="text-[10px] uppercase font-mono text-slate-400 mr-1">Bulk:</span>
                  <button
                    type="button"
                    onClick={() => handleBulkStatus('Present')}
                    className="px-2.5 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-100 text-[10.5px] font-medium rounded hover:bg-emerald-100 transition-colors cursor-pointer"
                  >
                    All Present
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkStatus('Absent')}
                    className="px-2.5 py-1.5 bg-rose-50 text-rose-800 border border-rose-100 text-[10.5px] font-medium rounded hover:bg-rose-100 transition-colors cursor-pointer"
                  >
                    All Absent
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Student Listing & statuses */}
          <form onSubmit={handleSubmitStudentAttendance} className="space-y-4">
            
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-left border-collapse" id="student-attendance-table">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3.5 pl-4">Student Name</th>
                    <th className="p-3.5">Attendance Status Check</th>
                    <th className="p-3.5">Tajweed/Syllabus Memo Progress Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {filteredActiveStudents.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="p-8 text-center text-slate-400 font-light">
                        No active student profiles registered or matching the search filter.
                      </td>
                    </tr>
                  ) : (
                    filteredActiveStudents.map((student) => {
                      const rowState = tempAttendance[student.id] || { status: 'Present', notes: '' };
                      return (
                        <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                          
                          {/* Student identity */}
                          <td className="p-3.5 pl-4">
                            <span className="font-bold text-slate-800">{student.fullName}</span>
                            <div className="text-[10px] font-mono text-slate-400 mt-0.5">{student.id} • {student.level}</div>
                          </td>

                          {/* Status Options Selector */}
                          <td className="p-3.5">
                            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5">
                              {/* Present */}
                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => handleStatusChange(student.id, 'Present')}
                                className={`px-2.5 py-1.5 rounded-md text-[10.5px] font-semibold transition-colors cursor-pointer ${
                                  rowState.status === 'Present' 
                                    ? 'bg-emerald-600 text-white shadow-xs' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                Present
                              </button>
                              
                              {/* Late */}
                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => handleStatusChange(student.id, 'Late')}
                                className={`px-2.5 py-1.5 rounded-md text-[10.5px] font-semibold transition-colors cursor-pointer ${
                                  rowState.status === 'Late' 
                                    ? 'bg-amber-500 text-white shadow-xs' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                Late
                              </button>

                              {/* Absent */}
                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => handleStatusChange(student.id, 'Absent')}
                                className={`px-2.5 py-1.5 rounded-md text-[10.5px] font-semibold transition-colors cursor-pointer ${
                                  rowState.status === 'Absent' 
                                    ? 'bg-rose-600 text-white shadow-xs' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                Absent
                              </button>

                              {/* Excused */}
                              <button
                                type="button"
                                disabled={!canEdit}
                                onClick={() => handleStatusChange(student.id, 'Excused')}
                                className={`px-2.5 py-1.5 rounded-md text-[10.5px] font-semibold transition-colors cursor-pointer ${
                                  rowState.status === 'Excused' 
                                    ? 'bg-sky-600 text-white shadow-xs' 
                                    : 'text-slate-500 hover:text-slate-700'
                                }`}
                              >
                                Excused
                              </button>
                            </div>
                          </td>

                          {/* Notes field */}
                          <td className="p-3.5">
                            <input
                              type="text"
                              disabled={!canEdit}
                              value={rowState.notes}
                              onChange={e => handleNotesChange(student.id, e.target.value)}
                              placeholder="Surah Al-Imran v120-130 revised/absent excuse..."
                              className="w-full text-xs px-2.5 py-1.5 border border-slate-200 bg-white rounded-md focus:outline-emerald-500"
                            />
                          </td>

                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Form actions */}
            {canEdit && activeStudents.length > 0 && (
              <div className="flex justify-end pt-2">
                <button
                  id="save-attendance-btn"
                  type="submit"
                  className="flex items-center gap-1.5 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
                >
                  <Save className="w-5 h-5 shrink-0" />
                  {lang === 'ur' ? 'طلباء اور کلاس حاضری رجسٹر محفوظ کریں' : 'Save Student & Class Attendance Registry'}
                </button>
              </div>
            )}
          </form>
        </div>
      )}

      {/* Teacher attendance panel section */}
      {subTab === 'teachers' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Form input - Teacher check-ins */}
          {canEdit ? (
            <form onSubmit={handleSubmitTeacherAttendance} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
              <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase border-b pb-2">Log Daily Teacher Attendance</h4>
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Teacher Name</label>
                <input
                  type="text"
                  required
                  value={teacherName}
                  onChange={e => setTeacherName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500"
                  placeholder="Enter Teacher Name, e.g. Sheikh Ibrahim Al-Azhari"
                  list="suggested-teachers"
                  id="teacher-name-input-field"
                />
                <datalist id="suggested-teachers">
                  {teachersList.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Checkin Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-200 bg-white rounded-md focus:outline-emerald-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase font-mono">Duty Status</label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {['Present', 'Absent', 'Late', 'Sick Leave'].map((stat) => (
                    <button
                      key={stat}
                      type="button"
                      onClick={() => setTeacherStatus(stat as any)}
                      className={`py-2 px-1 border rounded-md text-center transition-colors font-medium cursor-pointer ${
                        teacherStatus === stat 
                          ? 'bg-indigo-600 text-white border-indigo-700' 
                          : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                      }`}
                    >
                      {stat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Assigned Class/Level</label>
                <input
                  type="text"
                  value={classAssigned}
                  onChange={e => setClassAssigned(e.target.value)}
                  placeholder="Class A - Tajweed Masterclass"
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 bg-indigo-700 hover:bg-indigo-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-xs"
              >
                <UserCheck className="w-4 h-4 shrink-0" />
                Commit Teacher Log
              </button>
            </form>
          ) : (
            <div className="bg-slate-50 p-5 rounded-xl border border-slate-100 text-center text-slate-400 text-xs flex flex-col items-center justify-center py-10">
              <BookOpen className="w-8 h-8 text-slate-300 mb-2" />
              <p className="font-semibold">Instructor Log Restriced</p>
              <p className="max-w-[200px] mt-1 text-[11px] text-slate-500">Only Admins can log teacher daily duty schedules.</p>
            </div>
          )}

          {/* History Ledger List - Teacher attendance */}
          <div className="md:col-span-2 space-y-4">
            <h4 className="text-xs font-bold text-slate-700 tracking-wider uppercase">Active Teacher Standings Historical Log</h4>
            
            <div className="overflow-x-auto rounded-lg border border-slate-100">
              <table className="w-full text-left border-collapse" id="teacher-attendance-records-table">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-3">Teacher Name</th>
                    <th className="p-3">Check-In Date</th>
                    <th className="p-3">Class Assigned</th>
                    <th className="p-3 text-right">Standing Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-600">
                  {teacherAttendance.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-slate-400 font-light">No records registered.</td>
                    </tr>
                  ) : (
                    teacherAttendance.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3">
                          <div className="font-bold text-slate-800">{record.teacherName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">{record.designation}</div>
                        </td>
                        <td className="p-3 font-mono text-[11px]">{record.date}</td>
                        <td className="p-3">{record.classAssigned}</td>
                        <td className="p-3 text-right">
                          <span className={`px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold ${
                            record.status === 'Present' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' :
                            record.status === 'Late' ? 'bg-amber-50 text-amber-800 border border-amber-100' :
                            record.status === 'Sick Leave' ? 'bg-indigo-50 text-indigo-800 border border-indigo-100' :
                            'bg-rose-50 text-rose-800 border border-rose-100'
                          }`}>
                            {record.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
