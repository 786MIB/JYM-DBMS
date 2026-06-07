import React, { useMemo } from 'react';
import jamiaLogo from '../assets/images/jamia_logo_1780742048729.png';
import { translations } from '../translations';
import { 
  Users, 
  CheckSquare, 
  DollarSign, 
  BookOpen, 
  ShieldCheck, 
  RefreshCw, 
  TrendingUp, 
  AlertCircle 
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Cell 
} from 'recharts';
import { DbState, StaffRole } from '../types';

interface DashboardProps {
  db: DbState;
  activeRole: StaffRole;
  isSyncing: boolean;
  onRefresh: () => void;
  syncStatus: 'synced' | 'pending' | 'offline';
  onTabChange: (tab: string) => void;
  lang: 'en' | 'ur';
}

export const DashboardPanel: React.FC<DashboardProps> = ({
  db,
  activeRole,
  isSyncing,
  onRefresh,
  syncStatus,
  onTabChange,
  lang
}) => {
  // Statistics Computations
  const totalStudents = db.students.length;
  const activeStudents = db.students.filter(s => s.status === 'Active').length;
  
  const studentAttendanceRate = useMemo(() => {
    const records = db.studentAttendance;
    if (records.length === 0) return 0;
    const presents = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
    return Math.round((presents / records.length) * 100);
  }, [db.studentAttendance]);

  const teacherAttendanceRate = useMemo(() => {
    const records = db.teacherAttendance;
    if (records.length === 0) return 0;
    const presents = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
    return Math.round((presents / records.length) * 100);
  }, [db.teacherAttendance]);

  const financialOverview = useMemo(() => {
    let collected = 0;
    let due = 0;
    db.feeRecords.forEach(f => {
      collected += f.amountPaid;
      due += f.amountDue;
    });
    const percentage = due > 0 ? Math.round((collected / due) * 100) : 100;
    return { collected, due, percentage };
  }, [db.feeRecords]);

  const syllabusProgress = useMemo(() => {
    const total = db.topicCoverage.length;
    if (total === 0) return 0;
    const completed = db.topicCoverage.filter(t => t.progressStatus === 'Completed').length;
    return Math.round((completed / total) * 100);
  }, [db.topicCoverage]);

  // Chart 1: Financial status aggregation (Fee Record stats)
  const feeChartData = useMemo(() => {
    const paidCount = db.feeRecords.filter(f => f.status === 'Paid').length;
    const pendingCount = db.feeRecords.filter(f => f.status === 'Pending').length;
    const overdueCount = db.feeRecords.filter(f => f.status === 'Overdue').length;

    return [
      { name: 'Paid Records', count: paidCount, color: '#047857' },
      { name: 'Pending Checks', count: pendingCount, color: '#f59e0b' },
      { name: 'Overdue Tuition', count: overdueCount, color: '#be123c' }
    ];
  }, [db.feeRecords]);

  // Chart 2: Student levels distribution
  const levelDistributionData = useMemo(() => {
    const counts: Record<string, number> = {};
    db.students.forEach(s => {
      counts[s.level] = (counts[s.level] || 0) + 1;
    });
    return Object.entries(counts).map(([name, count]) => ({
      name: name.split(' ')[0], // abbreviation for mobile fits
      fullName: name,
      count
    }));
  }, [db.students]);

  // Recent Action Log simulated from db updates (Audit log)
  const activityLogs = useMemo(() => {
    const logs = [];
    if (db.students.length > 0) {
      logs.push({
        id: 'log-1',
        user: 'Sister Amina (Registrar)',
        action: `Verified student records. Total cohort active is ${db.students.length}.`,
        time: 'Just now',
        tag: 'Student'
      });
    }
    if (db.topicCoverage.length > 0) {
      const top = db.topicCoverage[0];
      logs.push({
        id: 'log-2',
        user: top.teacherName,
        action: `Logged topic coverage: "${top.topicName}" under ${top.subject}.`,
        time: '1 hour ago',
        tag: 'Curriculum'
      });
    }
    if (db.feeRecords.length > 0) {
      const paidList = db.feeRecords.filter(f => f.status === 'Paid');
      if (paidList.length > 0) {
        logs.push({
          id: 'log-3',
          user: 'Br. Ahmed (Finance Admin)',
          action: `Received tuition payment clearance of $150 for ${paidList[0].studentName}.`,
          time: '3 hours ago',
          tag: 'Finance'
        });
      }
    }
    return logs;
  }, [db]);

  return (
    <div className="space-y-6" id="dashboard-tab-panel" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      {/* Synchronization & Welcome Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 shrink-0 rounded-xl bg-slate-50 border border-slate-150 p-1 flex items-center justify-center overflow-hidden">
            <img
              src={jamiaLogo}
              alt="JAMIA YAHYA AL MADNI Logo"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          <div>
            <h2 className="text-xl font-serif text-slate-800 font-bold flex items-center gap-2">
              {translations[lang].welcomeTitle}
            </h2>
            <p className="text-sm text-slate-500 mt-0.5">
              {translations[lang].welcomeSubtitle}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-slate-50">
            <span className="text-slate-400">{translations[lang].activeRoleDesc}</span>
            <span className={`px-2 py-0.5 rounded-sm capitalize font-bold text-white ${
              activeRole === 'Admin' ? 'bg-indigo-600' :
              activeRole === 'Teacher' ? 'bg-emerald-600' :
              activeRole === 'Finance' ? 'bg-amber-600' :
              activeRole === 'Registrar' ? 'bg-teal-600' : 'bg-slate-500'
            }`}>
              {translations[lang][activeRole] || activeRole}
            </span>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border bg-slate-50">
            <span className={`h-2.5 w-2.5 rounded-full inline-block ${
              syncStatus === 'synced' ? 'bg-emerald-500 animate-pulse' :
              syncStatus === 'pending' ? 'bg-amber-500 animate-bounce' : 'bg-rose-500'
            }`} />
            <span className="text-slate-600 font-mono select-none">
              {syncStatus === 'synced' ? translations[lang].synced :
               syncStatus === 'pending' ? translations[lang].pending : translations[lang].offline}
            </span>
          </div>

          <button
            id="refresh-db-btn"
            onClick={onRefresh}
            disabled={isSyncing}
            className="p-2 text-slate-600 hover:text-emerald-700 bg-slate-100 hover:bg-emerald-50 rounded-lg cursor-pointer transition-colors border border-slate-200"
            title={translations[lang].syncNow}
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Bento Grid Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1 */}
        <div 
          id="kpi-students-card"
          onClick={() => onTabChange('students')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{translations[lang].totalStudents}</p>
              <h3 className="text-2xl font-bold font-serif text-slate-800 mt-1">{totalStudents}</h3>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="text-emerald-600 font-medium font-mono">+{activeStudents}</span> {translations[lang].activeCohorts}
              </p>
            </div>
            <div className={`p-3 rounded-lg bg-indigo-50 text-indigo-700 group-hover:bg-indigo-100 transition-colors ${lang === 'ur' ? 'mr-auto' : 'ml-auto'}`}>
              <Users className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* KPI 2 */}
        <div 
          id="kpi-attendance-card"
          onClick={() => onTabChange('attendance')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{translations[lang].dailyStudentAttendance}</p>
              <h3 className="text-2xl font-bold font-serif text-slate-800 mt-1">{studentAttendanceRate}%</h3>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="text-emerald-600 font-medium font-mono">{teacherAttendanceRate}%</span> {translations[lang].teacherCheckIns}
              </p>
            </div>
            <div className={`p-3 rounded-lg bg-emerald-50 text-emerald-700 group-hover:bg-emerald-100 transition-colors ${lang === 'ur' ? 'mr-auto' : 'ml-auto'}`}>
              <CheckSquare className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* KPI 3 */}
        <div 
          id="kpi-financials-card"
          onClick={() => onTabChange('finance')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{translations[lang].tuitionFeeCollections}</p>
              <h3 className="text-2xl font-bold font-serif text-slate-800 mt-1">{financialOverview.percentage}%</h3>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="text-emerald-600 font-medium font-mono">${financialOverview.collected}</span> {translations[lang].fundsCollectedOf} ${financialOverview.due}
              </p>
            </div>
            <div className={`p-3 rounded-lg bg-amber-50 text-amber-700 group-hover:bg-amber-100 transition-colors ${lang === 'ur' ? 'mr-auto' : 'ml-auto'}`}>
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* KPI 4 */}
        <div 
          id="kpi-curriculum-card"
          onClick={() => onTabChange('curriculum')}
          className="bg-white p-5 rounded-xl border border-slate-200 hover:border-emerald-500 hover:shadow-xs transition-all cursor-pointer group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{translations[lang].syllabusCoverageProgress}</p>
              <h3 className="text-2xl font-bold font-serif text-slate-800 mt-1">{syllabusProgress}%</h3>
              <p className="text-xs text-slate-500 mt-2 flex items-center gap-1">
                <span className="text-indigo-600 font-medium font-mono">
                  {db.topicCoverage.filter(t => t.progressStatus === 'Completed').length}
                </span> {translations[lang].completedTopicsPct}
              </p>
            </div>
            <div className={`p-3 rounded-lg bg-teal-50 text-teal-700 group-hover:bg-teal-100 transition-colors ${lang === 'ur' ? 'mr-auto' : 'ml-auto'}`}>
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Main Charts & Activity Bento row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Chart 1 Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-sm font-bold text-slate-700">{translations[lang].financialClearings}</h4>
              <p className="text-xs text-slate-400">{translations[lang].financialStatusAggregation}</p>
            </div>
            <span className="text-xs font-mono font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-sm">
              {translations[lang].paidInvoices}
            </span>
          </div>

          <div className="h-64 pr-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={feeChartData} barSize={40}>
                <XAxis dataKey="name" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#888888" fontSize={11} allowDecimals={false} tickLine={false} axisLine={false} />
                <Tooltip 
                  cursor={{ fill: 'rgba(237, 242, 247, 0.4)' }}
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '6px', color: '#fff' }} 
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {feeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution & Statistics Panel */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <h4 className="text-sm font-bold text-slate-700">{translations[lang].levelDistribution}</h4>
              <span className="text-[10px] font-mono bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm">
                {translations[lang].cohortBreakdown}
              </span>
            </div>

            {levelDistributionData.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{translations[lang].noStudentsRegistered}</p>
            ) : (
              <div className="space-y-4">
                {levelDistributionData.map((level, idx) => {
                  const percent = Math.round((level.count / totalStudents) * 100);
                  const displayLevelName = translations[lang][level.fullName] || translations[lang][level.name] || level.fullName;
                  return (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-xs font-medium">
                        <span className="text-slate-600 truncate max-w-[180px]" title={level.fullName}>
                          {displayLevelName}
                        </span>
                        <span className="text-slate-800 font-mono">{level.count} {lang === 'ur' ? 'طالب علم' : 'student(s)'} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3.5 mt-4 text-xs text-emerald-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">Device Adaptive Access Safe</p>
              <p className="mt-0.5 leading-relaxed text-[11px] text-emerald-700">
                Data persists in offline Local Cache and synchronizes instantly on safe-host server port: 3000.
              </p>
            </div>
          </div>
        </div>

      </div>

      {/* Real-time Collaboration log & Active Role Guide */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Real-time Collaboration Audit Log */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <h4 className="text-sm font-bold text-slate-700 mb-3 flex items-center justify-between">
            <span>{translations[lang].recentActivityLogs}</span>
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping inline-block" />
          </h4>
          
          <div className="divide-y divide-slate-100 overflow-y-auto max-h-56">
            {activityLogs.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">{translations[lang].noActivitiesLogged}</p>
            ) : (
              activityLogs.map((log) => (
                <div key={log.id} className="py-2.5 first:pt-0 last:pb-0 flex gap-2.5 items-start">
                  <div className={`text-[10px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-sm ${
                    log.tag === 'Finance' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                    log.tag === 'Curriculum' ? 'bg-teal-50 text-teal-700 border border-teal-100' :
                    'bg-indigo-50 text-indigo-700 border border-indigo-100'
                  }`}>
                    {translations[lang][log.tag] || log.tag}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-slate-700 font-light">
                      <span className="font-semibold text-slate-800">{log.user}:</span> {log.action}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 font-mono">{log.time}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Security Role Mapping Center */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <h4 className="text-sm font-bold text-slate-700 mb-2">{translations[lang].serverRolePermissionsMatrix}</h4>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            The database protects operations depending on the user session context:
          </p>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <p className="font-bold text-slate-800">🔑 {translations[lang].Admin}</p>
              <p className="text-[10.5px] text-slate-500 mt-0.5">Full unrestricted workspace read, write & backup imports.</p>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <p className="font-bold text-emerald-800">📚 {translations[lang].Teacher}</p>
              <p className="text-[10.5px] text-slate-500 mt-0.5">Check attendance, log custom subjects progress & lessons.</p>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <p className="font-bold text-amber-800">🪙 {translations[lang].Finance}</p>
              <p className="text-[10.5px] text-slate-500 mt-0.5">Clear tuition fee registers, write billing records, read stats.</p>
            </div>

            <div className="p-2.5 rounded-lg border border-slate-100 bg-slate-50/50">
              <p className="font-bold text-teal-800">📝 {translations[lang].Registrar}</p>
              <p className="text-[10.5px] text-slate-500 mt-0.5">Manage new student registrations and profile updates.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
