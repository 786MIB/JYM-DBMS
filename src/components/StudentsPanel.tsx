import React, { useState } from 'react';
import { translations } from '../translations';
import { 
  Plus, 
  Search, 
  Filter, 
  UserPlus, 
  Phone, 
  Mail, 
  Calendar, 
  GraduationCap, 
  MapPin, 
  Edit2, 
  Check, 
  X, 
  Trash2,
  AlertCircle 
} from 'lucide-react';
import { Student, StaffRole } from '../types';

interface StudentsProps {
  students: Student[];
  onAddStudent: (student: Omit<Student, 'id'>) => void;
  onUpdateStudent: (id: string, updated: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  activeRole: StaffRole;
  lang: 'en' | 'ur';
}

export const StudentsPanel: React.FC<StudentsProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  activeRole,
  lang
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [levelFilter, setLevelFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  
  // Create / Edit modal or view-states
  const [isAdding, setIsAdding] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);

  // Form states for adding new student
  const [fullName, setFullName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [enrollmentDate, setEnrollmentDate] = useState(new Date().toISOString().split('T')[0]);
  const [gender, setGender] = useState<'Male' | 'Female'>('Male');
  const [level, setLevel] = useState('Year 1 / Al-Oula');
  const [parentName, setParentName] = useState('');
  const [parentPhone, setParentPhone] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');

  // Editing draft states
  const [editFields, setEditFields] = useState<Partial<Student>>({});

  const levels = [
    'Year 1 / Al-Oula',
    'Year 2 / Al-Thaniya',
    'Year 3 / Al-Thalitha',
    'Year 4 / Al-Rabia',
    'Year 5 / Al-Khamisa',
    'Year 6 / Al-Sadisa',
    'Year 7 / Al-Sabi\'ah',
    'Year 8 / Dawra-e-Hadith'
  ];

  const canEdit = activeRole === 'Admin' || activeRole === 'Registrar';

  // Filters
  const filteredStudents = students.filter(student => {
    const matchesSearch = student.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (student.parentName && student.parentName.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          student.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = levelFilter === 'All' || student.level === levelFilter;
    const matchesStatus = statusFilter === 'All' || student.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const handleSaveAdd = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim() || !parentName.trim() || !parentPhone.trim()) {
      setFormError('Please enter Student Name, Emergency Contact Name, and Student Direct Phone.');
      return;
    }

    onAddStudent({
      fullName: fullName.trim(),
      dateOfBirth,
      enrollmentDate,
      gender,
      level,
      parentName: parentName.trim(),
      parentPhone: parentPhone.trim(),
      parentEmail: parentEmail.trim(),
      status: 'Active',
      address: address.trim()
    });

    // Reset fields
    setFullName('');
    setDateOfBirth('');
    setParentName('');
    setParentPhone('');
    setParentEmail('');
    setAddress('');
    setIsAdding(false);
  };

  const startEditing = (student: Student) => {
    setEditingStudentId(student.id);
    setEditFields({ ...student });
  };

  const handleSaveEdit = (id: string) => {
    if (!editFields.fullName?.trim() || !editFields.parentName?.trim() || !editFields.parentPhone?.trim()) {
      alert('Required field validation failed. Student Name, emergency contact, and direct phone are mandatory.');
      return;
    }
    onUpdateStudent(id, editFields);
    setEditingStudentId(null);
    setEditFields({});
  };

  const handleStatusChange = (id: string, status: 'Active' | 'Inactive' | 'Graduated') => {
    onUpdateStudent(id, { status });
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-6" id="student-management-panel" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-slate-800">{translations[lang].studentRegistryHeading}</h3>
          <p className="text-xs text-slate-500 mt-1">{translations[lang].studentRegistrySubtitle}</p>
        </div>
        {canEdit && (
          <button
            id="register-student-button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            {isAdding ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isAdding ? translations[lang].cancel : translations[lang].enrollScholar}
          </button>
        )}
      </div>

      {/* Permission Disclaimer if not registrar or admin */}
      {!canEdit && (
        <div className="flex items-center gap-2.5 bg-amber-50 border border-amber-100 p-3 rounded-lg text-amber-800 text-xs">
          <AlertCircle className="w-4.5 h-4.5 shrink-0 text-amber-600" />
          <p>
            {translations[lang].activeSessionRestriction} <strong>{translations[lang][activeRole] || activeRole}</strong>.
          </p>
        </div>
      )}

      {/* Adding Student Form Drawer */}
      {isAdding && canEdit && (
        <form 
          id="student-enrollment-form"
          onSubmit={handleSaveAdd} 
          className="p-5 border border-emerald-100 bg-emerald-50/20 rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <h4 className="text-sm font-bold text-emerald-800 font-serif">New Enrollment Worksheet</h4>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-sm">Step 1 Profile setup</span>
          </div>

          {formError && (
            <div className="p-2.5 bg-rose-50 text-rose-800 font-medium text-xs rounded-md border border-rose-100">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* General Fields */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Full Name *</label>
              <input
                id="form-student-name"
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                placeholder="Tariq Al-Mansoor"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-emerald-500 bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Date of Birth</label>
              <input
                id="form-student-dob"
                type="date"
                value={dateOfBirth}
                onChange={e => setDateOfBirth(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-emerald-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Gender</label>
              <select
                id="form-student-gender"
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-emerald-500 bg-white"
              >
                <option value="Male">Male(Boy)</option>
                <option value="Female">Female(Girl)</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Enrollment Date</label>
              <input
                id="form-student-enrolldate"
                type="date"
                value={enrollmentDate}
                onChange={e => setEnrollmentDate(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-emerald-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">{translations[lang].academicLevel}</label>
              <select
                id="form-student-level"
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-emerald-500 bg-white"
              >
                {levels.map((lvl) => (
                  <option key={lvl} value={lvl}>{lvl}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">{translations[lang].parentName} *</label>
              <input
                id="form-student-parent"
                type="text"
                value={parentName}
                onChange={e => setParentName(e.target.value)}
                placeholder="Next of Kin / Spouse / Reference"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-emerald-500 bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">{translations[lang].parentPhone} *</label>
              <input
                id="form-student-phone"
                type="tel"
                value={parentPhone}
                onChange={e => setParentPhone(e.target.value)}
                placeholder="+92 300 1234567"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-emerald-500 bg-white"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">{translations[lang].parentEmail}</label>
              <input
                id="form-student-email"
                type="email"
                value={parentEmail}
                onChange={e => setParentEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-emerald-500 bg-white"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Home Address</label>
              <input
                id="form-student-address"
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                placeholder="Apartment 102, Green Lane"
                className="w-full text-xs p-2.5 border border-slate-200 rounded-md focus:outline-emerald-500 bg-white"
              />
            </div>

          </div>

          <div className="flex justify-end gap-2.5 border-t border-slate-100 pt-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 bg-white text-xs font-semibold rounded-md hover:bg-slate-50 cursor-pointer"
            >
              Discard Form
            </button>
            <button
              id="submit-enrolment-btn"
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md cursor-pointer transition-colors shadow-xs"
            >
              Complete Registration & ID Generation
            </button>
          </div>
        </form>
      )}

      {/* Query Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4.5 h-4.5 absolute left-3 top-3 text-slate-400" />
          <input
            id="student-search-input"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search by ID, Name, or Parent..."
            className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-emerald-500"
          />
        </div>

        <div>
          <select
            id="filter-student-level"
            value={levelFilter}
            onChange={e => setLevelFilter(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-emerald-500 bg-white"
          >
            <option value="All">{lang === 'ur' ? 'تمام تعلیمی سرگزشت (سال)' : 'All Dars-e-Nizami Years'}</option>
            {levels.map((lvl) => (
              <option key={lvl} value={lvl}>{lvl}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            id="filter-student-status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-emerald-500 bg-white"
          >
            <option value="All">All Status Standings</option>
            <option value="Active">Active Standing</option>
            <option value="Inactive">Suspended/Inactive</option>
            <option value="Graduated">Graduated (Huffaz)</option>
          </select>
        </div>
      </div>

      {/* Students Data Grid/Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-100">
        <table className="w-full text-left border-collapse" id="students-database-table">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <th className="p-4">{lang === 'ur' ? 'طالبِ علم کا نام اور رجسٹریشن نمبر' : 'Student Scholar ID & Name'}</th>
              <th className="p-4">{lang === 'ur' ? 'تعلیمی سال / درجہ' : 'Aalim Stage / Level'}</th>
              <th className="p-4">{translations[lang].parentName}</th>
              <th className="p-4">{lang === 'ur' ? 'براہِ راست رابطہ' : 'Student Direct Contact'}</th>
              <th className="p-4">{lang === 'ur' ? 'تعلیمی سٹیٹس' : 'Status Standing'}</th>
              {canEdit && <th className="p-4 text-right">{lang === 'ur' ? 'انتظامی امور' : 'Actions'}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
            {filteredStudents.length === 0 ? (
              <tr>
                <td colSpan={canEdit ? 6 : 5} className="p-8 text-center text-slate-400 font-light">
                  No scholar profile matches the selected filters.
                </td>
              </tr>
            ) : (
              filteredStudents.map((student) => {
                const isEditing = editingStudentId === student.id;

                return (
                  <tr 
                    key={student.id} 
                    id={`student-row-${student.id}`}
                    className="hover:bg-slate-50/50 transition-colors"
                  >
                    {/* Column 1: ID & Name */}
                    <td className="p-4">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editFields.fullName || ''}
                            onChange={e => setEditFields({ ...editFields, fullName: e.target.value })}
                            className="p-1 border text-xs rounded bg-white w-full"
                          />
                          <span className="text-[10px] font-mono text-slate-400">{student.id}</span>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-slate-800">{student.fullName}</div>
                          <div className="text-[10px] font-mono text-emerald-700 mt-0.5">{student.id}</div>
                        </div>
                      )}
                    </td>

                    {/* Column 2: Track */}
                    <td className="p-4">
                      {isEditing ? (
                        <select
                          value={editFields.level || ''}
                          onChange={e => setEditFields({ ...editFields, level: e.target.value })}
                          className="p-1 border text-xs rounded bg-white"
                        >
                          {levels.map((lvl) => (
                            <option key={lvl} value={lvl}>{lvl}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-indigo-50 text-indigo-700">
                          {student.level}
                        </span>
                      )}
                    </td>

                    {/* Column 3: Parent */}
                    <td className="p-4">
                      {isEditing ? (
                        <input
                          type="text"
                          value={editFields.parentName || ''}
                          onChange={e => setEditFields({ ...editFields, parentName: e.target.value })}
                          className="p-1 border text-xs rounded bg-white w-full"
                        />
                      ) : (
                        <div>
                          <div className="font-medium text-slate-700">{student.parentName}</div>
                          <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> DOB: {student.dateOfBirth || 'N/A'}
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Column 4: Contact */}
                    <td className="p-4">
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editFields.parentPhone || ''}
                            onChange={e => setEditFields({ ...editFields, parentPhone: e.target.value })}
                            className="p-1 border text-xs rounded bg-white w-full"
                          />
                          <input
                            type="text"
                            value={editFields.parentEmail || ''}
                            onChange={e => setEditFields({ ...editFields, parentEmail: e.target.value })}
                            className="p-1 border text-xs rounded bg-white w-full"
                          />
                        </div>
                      ) : (
                        <div className="space-y-1 font-mono text-[11px]">
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <Phone className="w-3 h-3 text-slate-400" /> {student.parentPhone}
                          </div>
                          {student.parentEmail && (
                            <div className="flex items-center gap-1.5 text-slate-500">
                              <Mail className="w-3 h-3 text-slate-400" /> {student.parentEmail}
                            </div>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Column 5: Status */}
                    <td className="p-4">
                      {isEditing ? (
                        <select
                          value={editFields.status || ''}
                          onChange={e => setEditFields({ ...editFields, status: e.target.value as any })}
                          className="p-1 border text-xs rounded bg-white"
                        >
                          <option value="Active">Active</option>
                          <option value="Inactive">Inactive</option>
                          <option value="Graduated">Graduated</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${
                            student.status === 'Active' ? 'bg-emerald-500' :
                            student.status === 'Graduated' ? 'bg-indigo-500 animate-pulse' : 'bg-slate-400'
                          }`} />
                          <span className={`text-[11px] font-semibold uppercase ${
                            student.status === 'Active' ? 'text-emerald-700' :
                            student.status === 'Graduated' ? 'text-indigo-700 font-bold' : 'text-slate-500'
                          }`}>
                            {student.status}
                          </span>
                        </div>
                      )}
                    </td>

                    {/* Column 6: Actions */}
                    {canEdit && (
                      <td className="p-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleSaveEdit(student.id)}
                              className="p-1.5 bg-emerald-50 text-emerald-800 rounded-md hover:bg-emerald-100 transition-colors"
                              title="Commit updates"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setEditingStudentId(null);
                                setEditFields({});
                              }}
                              className="p-1.5 bg-rose-50 text-rose-800 rounded-md hover:bg-rose-100 transition-colors"
                              title="Discard updates"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => startEditing(student)}
                              className="p-1.5 text-slate-500 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-md transition-colors"
                              title="Edit profile"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            
                            <button
                              onClick={() => {
                                if (confirm(`Are you absolutely sure you want to deactivate ${student.fullName}?`)) {
                                  handleStatusChange(student.id, 'Inactive');
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-700 bg-slate-100 hover:bg-rose-50 rounded-md transition-colors"
                              title="Inactivate Scholar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    )}

                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
