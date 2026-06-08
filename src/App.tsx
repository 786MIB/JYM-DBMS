import { useState, useEffect } from 'react';
import jamiaLogo from './assets/images/jamia_logo_1780742048729.png';
import { translations } from './translations';
import { 
  Menu, 
  X, 
  GraduationCap, 
  Users, 
  CheckSquare, 
  DollarSign, 
  BookOpen, 
  BrainCircuit, 
  ShieldAlert, 
  Database,
  Smartphone,
  Tablet,
  Monitor,
  HelpCircle,
  FileText,
  LogOut
} from 'lucide-react';
import { DbState, StaffRole, Student, StudentAttendance, FeeRecord, TeacherAttendance, TopicCoverage, LocalUser } from './types';
import { DashboardPanel } from './components/DashboardPanel';
import { StudentsPanel } from './components/StudentsPanel';
import { AttendancePanel } from './components/AttendancePanel';
import { FinancePanel } from './components/FinancePanel';
import { CurriculumPanel } from './components/CurriculumPanel';
import { GeminiAISummary } from './components/GeminiAISummary';
import { AdminPanel } from './components/AdminPanel';
import { LoginSignupPanel } from './components/LoginSignupPanel';

export default function App() {
  const [currentUser, setCurrentUser] = useState<LocalUser | null>(() => {
    const saved = localStorage.getItem('JAMIA_USER_SESSION');
    if (saved) {
      try {
        return JSON.parse(saved) as LocalUser;
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [activeRole, setActiveRole] = useState<StaffRole>(() => {
    const saved = localStorage.getItem('JAMIA_USER_SESSION');
    if (saved) {
      try {
        return (JSON.parse(saved) as LocalUser).role;
      } catch (e) {
        return 'Guest';
      }
    }
    return 'Guest';
  });

  // Sync role whenever currentUser changes
  useEffect(() => {
    if (currentUser) {
      setActiveRole(currentUser.role);
    } else {
      setActiveRole('Guest');
    }
  }, [currentUser]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'synced' | 'pending' | 'offline'>('synced');
  
  // Multi-lingual Language State (English default, persisting to cache)
  const [lang, setLang] = useState<'en' | 'ur'>(() => {
    return (localStorage.getItem('JAMIA_LANGUAGE') as 'en' | 'ur') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('JAMIA_LANGUAGE', lang);
    // Dynamically adjust Right-to-Left or Left-to-Right layout on html element level
    document.documentElement.dir = lang === 'ur' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
  }, [lang]);

  // Core database state reflecting students, finances, and curriculums
  const [db, setDb] = useState<DbState>({
    students: [],
    studentAttendance: [],
    feeRecords: [],
    teacherAttendance: [],
    topicCoverage: [],
    lastSynced: '',
    version: 0
  });

  // Load cache on bootstrap
  useEffect(() => {
    const cached = localStorage.getItem('JAMIA_YAHYA_AL_MADNI_DB_CACHE');
    if (cached) {
      try {
        setDb(JSON.parse(cached));
      } catch (e) {
        console.error("Local storage DB cache parse error:", e);
      }
    }
    // Pull from Express server instantly
    fetchStateFromServer();
  }, []);

  // Fetch full state from Express full-stack port
  const fetchStateFromServer = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        const text = await res.text();
        let serverDb: DbState;
        try {
          serverDb = JSON.parse(text) as DbState;
        } catch {
          throw new Error("Unable to parse database state response as JSON.");
        }
        setDb(serverDb);
        localStorage.setItem('JAMIA_YAHYA_AL_MADNI_DB_CACHE', JSON.stringify(serverDb));
        setSyncStatus('synced');
      } else {
        setSyncStatus('offline');
      }
    } catch (err) {
      console.error("Error pulling database state from Express server:", err);
      setSyncStatus('offline'); // offline fallback automatically active
    } finally {
      setIsSyncing(false);
    }
  };

  // Push full database state to Express server database
  const pushStateToServer = async (targetDb: DbState) => {
    setSyncStatus('pending');
    try {
      const res = await fetch('/api/db/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(targetDb)
      });
      if (res.ok) {
        const text = await res.text();
        let savedDb: DbState;
        try {
          savedDb = JSON.parse(text) as DbState;
        } catch {
          throw new Error("Unable to parse sync state response as JSON.");
        }
        setDb(savedDb);
        localStorage.setItem('JAMIA_YAHYA_AL_MADNI_DB_CACHE', JSON.stringify(savedDb));
        setSyncStatus('synced');
      } else {
        setSyncStatus('offline');
      }
    } catch (err) {
      console.error("Error pushing synchronized DB state:", err);
      setSyncStatus('offline');
    }
  };

  // Core CRUD Operators (Modifying actions trigger push state triggers)
  const handleUpdateAndSync = (updatedDb: DbState) => {
    updatedDb.lastSynced = new Date().toISOString();
    setDb(updatedDb);
    localStorage.setItem('JAMIA_YAHYA_AL_MADNI_DB_CACHE', JSON.stringify(updatedDb));
    pushStateToServer(updatedDb);
  };

  // 1. Students CRUD
  const handleAddStudent = (studentData: Omit<Student, 'id'>) => {
    const newStudent: Student = {
      ...studentData,
      id: `STU-${Math.floor(1000 + Math.random() * 9000)}` // Safe random ID generation
    };
    const updated = {
      ...db,
      students: [newStudent, ...db.students]
    };
    handleUpdateAndSync(updated);
  };

  const handleUpdateStudent = (id: string, partial: Partial<Student>) => {
    const updated = {
      ...db,
      students: db.students.map(s => s.id === id ? { ...s, ...partial } : s)
    };
    handleUpdateAndSync(updated);
  };

  const handleDeleteStudent = (id: string) => {
    // Delete profile (actually marks Inactive for safe data preservation as per Madrasah guidelines)
    const updated = {
      ...db,
      students: db.students.map(s => s.id === id ? { ...s, status: 'Inactive' as const } : s)
    };
    handleUpdateAndSync(updated);
  };

  // 2. Attendance tracking (Student list checkins)
  const handleSaveStudentAttendance = (records: Omit<StudentAttendance, 'id'>[]) => {
    // Generate IDs and replace entries on the matching date/class to prevent duplicate logs
    const newRecords = records.map(r => ({
      ...r,
      id: `ATT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
    }));

    // Filter out previous records representing same dates and classes
    const filteredPrevious = db.studentAttendance.filter(exist => {
      const match = records.some(
        req => req.date === exist.date && req.class === exist.class && req.studentId === exist.studentId
      );
      return !match;
    });

    const updated = {
      ...db,
      studentAttendance: [...newRecords, ...filteredPrevious]
    };
    handleUpdateAndSync(updated);
  };

  // 3. Teacher attendance logger
  const handleSaveTeacherAttendance = (record: Omit<TeacherAttendance, 'id'>) => {
    const newRecord: TeacherAttendance = {
      ...record,
      id: `TATT-${Math.random().toString(36).substring(2, 6).toUpperCase()}`
    };
    const updated = {
      ...db,
      teacherAttendance: [newRecord, ...db.teacherAttendance]
    };
    handleUpdateAndSync(updated);
  };

  // 4. Financial invoices / payments Clearings
  const handleAddFeeCharge = (charges: Omit<FeeRecord, 'id'>[]) => {
    const newCharges = charges.map(c => ({
      ...c,
      id: `FEE-${Math.floor(1000 + Math.random() * 9000)}`
    }));
    const updated = {
      ...db,
      feeRecords: [...newCharges, ...db.feeRecords]
    };
    handleUpdateAndSync(updated);
  };

  const handleUpdateFeeStatus = (id: string, amountPaid: number, status: 'Paid' | 'Pending' | 'Overdue', paymentMethod?: any) => {
    const targetObj = db.feeRecords.find(f => f.id === id);
    let receiptNumber = targetObj?.receiptNumber;
    let datePaid = targetObj?.datePaid;

    if (status === 'Paid') {
      receiptNumber = `REC-${Math.floor(90000 + Math.random() * 9999)}`;
      datePaid = new Date().toISOString().split('T')[0];
    }

    const updated = {
      ...db,
      feeRecords: db.feeRecords.map(f => f.id === id ? { 
        ...f, 
        amountPaid, 
        status, 
        paymentMethod, 
        receiptNumber, 
        datePaid 
      } : f)
    };
    handleUpdateAndSync(updated);
  };

  // 5. Syllabus curriculum Loggers
  const handleAddTopicCoverage = (record: Omit<TopicCoverage, 'id'>) => {
    const newRecord: TopicCoverage = {
      ...record,
      id: `TOP-${Math.floor(1000 + Math.random() * 9000)}`
    };
    const updated = {
      ...db,
      topicCoverage: [newRecord, ...db.topicCoverage]
    };
    handleUpdateAndSync(updated);
  };

  const handleUpdateTopicStatus = (id: string, progressStatus: 'Completed' | 'In Progress' | 'Review Needed') => {
    const updated = {
      ...db,
      topicCoverage: db.topicCoverage.map(t => t.id === id ? { ...t, progressStatus } : t)
    };
    handleUpdateAndSync(updated);
  };

  // 6. Admin Panel overrides
  const handleRestoreDb = (restored: DbState) => {
    handleUpdateAndSync(restored);
  };

  const handleResetDb = async () => {
    try {
      const res = await fetch('/api/db');
      if (res.ok) {
        localStorage.removeItem('JAMIA_YAHYA_AL_MADNI_DB_CACHE');
        fetchStateFromServer();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('JAMIA_USER_SESSION');
    setActiveTab('dashboard');
  };

  const handleUpdateUserRole = async (targetUserId: string, newRole: StaffRole) => {
    if (!currentUser || currentUser.email.toLowerCase() !== 'mibrahim.acca@gmail.com') {
      throw new Error('Unauthorized');
    }
    const res = await fetch('/api/users/update-role', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        adminEmail: currentUser.email,
        targetUserId,
        newRole
      })
    });
    const text = await res.text();
    let data: any = {};
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error(`Invalid response received from server during role update (Status: ${res.status}).`);
    }
    if (res.ok) {
      setDb(prev => ({
        ...prev,
        users: data.users
      }));
    } else {
      throw new Error(data.error || 'Failed to update user role');
    }
  };

  if (!currentUser) {
    return (
      <LoginSignupPanel
        lang={lang}
        onLoginSuccess={(signedInUser) => {
          setCurrentUser(signedInUser);
          localStorage.setItem('JAMIA_USER_SESSION', JSON.stringify(signedInUser));
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" id="applet-container">
      
      {/* Upper Navigation Header Bar */}
      <header className="bg-slate-900 border-b border-slate-800 text-white shadow-md z-45 no-print">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row justify-between items-center gap-3 sm:px-6 lg:px-8">
          
          {/* Logo & Branding */}
          <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={() => setActiveTab('dashboard')}>
            <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center overflow-hidden border border-slate-700 shadow-inner p-1">
              <img
                src={jamiaLogo}
                alt="JAMIA YAHYA AL MADNI Logo"
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <h1 className="text-sm font-serif font-bold tracking-tight text-slate-100 uppercase">
                {translations[lang].appTitle}
              </h1>
              <p className="text-[9px] uppercase tracking-wider font-mono text-emerald-400">
                {translations[lang].subtitle}
              </p>
            </div>
          </div>

          {/* Quick Platform indicator showing Mobile vs Tablet Responsive assurance */}
          <div className="hidden lg:flex items-center gap-3 bg-slate-800/65 border border-slate-700/50 px-3 py-1.5 rounded-full text-[10px] font-mono text-slate-400">
            <span className="text-slate-500">{translations[lang].accessibility}</span>
            <div className="flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-400" title="Android Mobile optimized" /> {translations[lang].mobile}
              <Tablet className="w-3.5 h-3.5 text-emerald-400" title="Tablet tactile views" /> {translations[lang].tablet}
              <Monitor className="w-3.5 h-3.5 text-emerald-400" title="Desktop admin dashboards" /> {translations[lang].computer}
            </div>
          </div>

          {/* Languages Toggler & Active session role switches */}
          <div className="flex flex-wrap items-center gap-3">
            
            {/* Native Urdu <-> English Switch Button */}
            <button
              onClick={() => setLang(lang === 'en' ? 'ur' : 'en')}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-600 border border-emerald-600 text-white text-[11px] font-bold rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-sm"
              title={lang === 'en' ? "اردو زبان منتخب کریں" : "Switch to English"}
            >
              <span className="text-sm">🌐</span>
              <span className="font-semibold">{lang === 'en' ? 'اردو (Urdu)' : 'English'}</span>
            </button>

            {/* Session Context Roles */}
            <div className="flex items-center gap-2" id="rbac-profile-badge">
              <div className="flex items-center bg-slate-800 border border-slate-700 px-2.5 py-1 rounded-lg text-xs" title="Logged In Session Profile">
                <span className="text-[10px] uppercase font-mono text-slate-400 font-bold mr-1.5 hidden sm:inline">User:</span>
                <span className="font-bold text-amber-300">{currentUser?.fullName}</span>
                <span className={`ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                  activeRole === 'Admin' ? 'bg-amber-500 text-slate-900' : 'bg-emerald-600 text-white'
                }`}>
                  {translations[lang][activeRole] || activeRole}
                </span>
              </div>

              {/* Master admin role simulator for previewing and testing roles */}
              {currentUser?.email?.toLowerCase() === 'mibrahim.acca@gmail.com' && (
                <div className="hidden lg:flex items-center bg-slate-800 border border-slate-700 p-0.5 rounded-lg" title="Admin Perspective Switcher">
                  {(['Admin', 'Teacher', 'Finance', 'Registrar', 'Guest'] as StaffRole[]).map(r => (
                    <button
                      key={r}
                      onClick={() => {
                        setActiveRole(r);
                      }}
                      className={`px-1.5 py-0.5 text-[9.5px] font-bold rounded-md transition-all cursor-pointer ${
                        activeRole === r ? 'bg-amber-500 text-slate-950 shadow-xs' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {translations[lang][r] || r}
                    </button>
                  ))}
                </div>
              )}

              {/* Logout Trigger Button */}
              <button
                onClick={handleLogout}
                className="p-1.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-900/40 hover:border-rose-800 text-slate-300 hover:text-white rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1 text-[11px] font-bold"
                title={lang === 'ur' ? "لاگ آؤٹ کریں" : "Secure Log Out"}
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">{lang === 'ur' ? 'لاگ آؤٹ' : 'Log Out'}</span>
              </button>
            </div>

            {/* Mobile Navigation Toggler */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 hover:bg-slate-800 rounded-lg transition-colors md:hidden border border-slate-700 text-slate-400 hover:text-white cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </header>

      {/* Primary Layout Roster Core */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row p-4 sm:p-6 lg:p-8 gap-6">
        
        {/* Navigation Sidebar Drawer for Computers and Tablets */}
        <nav className="w-64 shrink-0 hidden md:block space-y-1.5 no-print" id="desktop-sidebar-navigation">
          <div className="p-3 bg-slate-100 text-slate-500 font-bold text-[10px] uppercase tracking-wider font-mono select-none rounded-t-lg">
            {translations[lang].journals}
          </div>

          {[
            { id: 'dashboard', name: translations[lang].dashboard, icon: GraduationCap },
            { id: 'students', name: translations[lang].students, icon: Users },
            { id: 'attendance', name: translations[lang].attendance, icon: CheckSquare },
            { id: 'finance', name: translations[lang].finance, icon: DollarSign },
            { id: 'curriculum', name: translations[lang].curriculum, icon: BookOpen },
            { id: 'gemini', name: translations[lang].gemini, icon: BrainCircuit },
            { id: 'admin', name: translations[lang].admin, icon: Database }
          ].map(item => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                  activeTab === item.id 
                    ? 'bg-slate-900 text-white border-l-4 border-emerald-500 shadow-sm' 
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                }`}
              >
                <Icon className={`w-4 h-4 ${activeTab === item.id ? 'text-emerald-400 font-bold' : 'text-slate-400'}`} />
                {item.name}
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-200 mt-6 text-center">
            <span className="text-[10px] text-slate-400 font-mono">{translations[lang].syncedPort}</span>
          </div>
        </nav>

        {/* Navigation Layer sliding overlay for Mobiles */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 bg-slate-950/20 backdrop-blur-3xs z-40 md:hidden no-print" onClick={() => setMobileMenuOpen(false)}>
            <div className={`bg-white w-64 h-full p-6 space-y-4 shadow-xl border-slate-200 ${lang === 'ur' ? 'border-l mr-auto' : 'border-r ml-auto'}`} onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-center pb-4 border-b">
                <span className="text-xs font-bold text-slate-700 font-serif uppercase tracking-wider">
                  {translations[lang].journals}
                </span>
                <button onClick={() => setMobileMenuOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg cursor-pointer text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-1">
                {[
                  { id: 'dashboard', name: translations[lang].dashboard, icon: GraduationCap },
                  { id: 'students', name: translations[lang].students, icon: Users },
                  { id: 'attendance', name: translations[lang].attendance, icon: CheckSquare },
                  { id: 'finance', name: translations[lang].finance, icon: DollarSign },
                  { id: 'curriculum', name: translations[lang].curriculum, icon: BookOpen },
                  { id: 'gemini', name: translations[lang].gemini, icon: BrainCircuit },
                  { id: 'admin', name: translations[lang].admin, icon: Database }
                ].map(item => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wide transition-all cursor-pointer ${
                        activeTab === item.id 
                          ? 'bg-slate-900 text-white shadow-sm' 
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-emerald-600" />
                      {item.name}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Primary workspace switch renderer */}
        <main className="flex-1 overflow-hidden min-h-[400px]">
          {activeTab === 'dashboard' && (
            <DashboardPanel
              db={db}
              activeRole={activeRole}
              isSyncing={isSyncing}
              onRefresh={fetchStateFromServer}
              syncStatus={syncStatus}
              onTabChange={setActiveTab}
              lang={lang}
            />
          )}

          {activeTab === 'students' && (
            <StudentsPanel
              students={db.students}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              activeRole={activeRole}
              lang={lang}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendancePanel
              students={db.students}
              studentAttendance={db.studentAttendance}
              teacherAttendance={db.teacherAttendance}
              onSaveStudentAttendance={handleSaveStudentAttendance}
              onSaveTeacherAttendance={handleSaveTeacherAttendance}
              activeRole={activeRole}
              lang={lang}
            />
          )}

          {activeTab === 'finance' && (
            <FinancePanel
              students={db.students}
              feeRecords={db.feeRecords}
              onAddFeeCharge={handleAddFeeCharge}
              onUpdateFeeStatus={handleUpdateFeeStatus}
              activeRole={activeRole}
              lang={lang}
            />
          )}

          {activeTab === 'curriculum' && (
            <CurriculumPanel
              topicCoverage={db.topicCoverage}
              onAddTopicCoverage={handleAddTopicCoverage}
              onUpdateTopicStatus={handleUpdateTopicStatus}
              activeRole={activeRole}
              lang={lang}
            />
          )}

          {activeTab === 'gemini' && (
            <GeminiAISummary
              activeRole={activeRole}
              lang={lang}
            />
          )}

          {activeTab === 'admin' && (
            <AdminPanel
              db={db}
              onRestoreDb={handleRestoreDb}
              onResetDb={handleResetDb}
              activeRole={activeRole}
              syncStatus={syncStatus}
              isSyncing={isSyncing}
              onRefresh={fetchStateFromServer}
              lang={lang}
              currentUser={currentUser}
              onUpdateUserRole={handleUpdateUserRole}
            />
          )}
        </main>

      </div>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 py-6 font-mono text-[10.5px] no-print">
        <div className="max-w-7xl mx-auto px-4 text-center space-y-2 sm:px-6 lg:px-8">
          <p>© {new Date().getFullYear()} {translations[lang].appTitle}. {translations[lang].allRightsReserved}</p>
          <p className="text-slate-600">
            {translations[lang].footerNote}
          </p>
        </div>
      </footer>

    </div>
  );
}
