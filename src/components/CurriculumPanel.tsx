import React, { useState } from 'react';
import { translations } from '../translations';
import { 
  Plus, 
  Search, 
  BookOpen, 
  Award, 
  HelpCircle, 
  AlertCircle, 
  Calendar, 
  Check, 
  Clock, 
  Save, 
  User,
  GraduationCap,
  X
} from 'lucide-react';
import { TopicCoverage, IslamicSubject, StaffRole } from '../types';

interface CurriculumProps {
  topicCoverage: TopicCoverage[];
  onAddTopicCoverage: (record: Omit<TopicCoverage, 'id'>) => void;
  onUpdateTopicStatus: (id: string, progressStatus: 'Completed' | 'In Progress' | 'Review Needed') => void;
  activeRole: StaffRole;
  lang: 'en' | 'ur';
}

export const CurriculumPanel: React.FC<CurriculumProps> = ({
  topicCoverage,
  onAddTopicCoverage,
  onUpdateTopicStatus,
  activeRole,
  lang
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Form toggles
  const [isAdding, setIsAdding] = useState(false);
  
  // Form fields
  const [subject, setSubject] = useState<IslamicSubject>('Quran Translation & Tafseer');
  const [level, setLevel] = useState('Year 1 / Al-Oula');
  const [topicName, setTopicName] = useState('');
  const [dateCovered, setDateCovered] = useState(new Date().toISOString().split('T')[0]);
  const [teacherName, setTeacherName] = useState('Sister Amina Siddiqui');
  const [progressStatus, setProgressStatus] = useState<'Completed' | 'In Progress' | 'Review Needed'>('Completed');
  const [notes, setNotes] = useState('');

  const subjects: IslamicSubject[] = [
    'Quran Translation & Tafseer',
    'Hadith & Usul al-Hadith',
    'Fiqh & Usul al-Fiqh',
    'Arabic Grammar (Sarf & Nahw)',
    'Arabic Literature (Balaghah)',
    'Islamic Beliefs & Aqeedah',
    'Seerah & Islamic History',
    'Mantiq (Logic & Philosophy)'
  ];

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

  const instructors = [
    'Sheikh Ibrahim Al-Azhari',
    'Sister Amina Siddiqui',
    'Ustadh Bilal Al-Tunisi',
    'Mufti Yahya Rahim'
  ];

  const canEdit = activeRole === 'Admin' || activeRole === 'Teacher';

  // Filter lists
  const filteredTopics = topicCoverage.filter(t => {
    const matchesSearch = t.topicName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          t.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === 'All' || t.subject === subjectFilter;
    const matchesStatus = statusFilter === 'All' || t.progressStatus === statusFilter;
    return matchesSearch && matchesSubject && matchesStatus;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canEdit) return;

    if (!topicName.trim()) {
      alert('Required field Topic Name is bare. Please fill in.');
      return;
    }

    onAddTopicCoverage({
      subject,
      level,
      topicName: topicName.trim(),
      dateCovered,
      teacherName,
      progressStatus,
      notes: notes.trim()
    });

    setTopicName('');
    setNotes('');
    setIsAdding(false);
    alert('Syllabus topic progression successfully logged.');
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 space-y-6" id="curriculum-syllabi-panel" dir={lang === 'ur' ? 'rtl' : 'ltr'}>
      
      {/* Header element */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-serif font-bold text-slate-800">{translations[lang].curriculumHeading}</h3>
          <p className="text-xs text-slate-500 mt-1">{translations[lang].curriculumSubtitle}</p>
        </div>
        {canEdit && (
          <button
            id="log-lesson-button"
            onClick={() => setIsAdding(!isAdding)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors shadow-sm"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? translations[lang].cancel : translations[lang].logTopicLesson}
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

      {/* Lesson Add log block form */}
      {isAdding && canEdit && (
        <form 
          id="syllabus-progress-logger-form"
          onSubmit={handleSubmit} 
          className="p-5 border border-emerald-110 bg-emerald-50/20 rounded-xl space-y-4"
        >
          <h4 className="text-sm font-bold text-emerald-800 font-serif border-b pb-2">Log Daily Lesson Card</h4>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Islamic Core Subject</label>
              <select
                value={subject}
                onChange={e => setSubject(e.target.value as IslamicSubject)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500"
              >
                {subjects.map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Class Grade Level</label>
              <select
                value={level}
                onChange={e => setLevel(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500"
              >
                {levels.map(l => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600 font-mono">Assigned Facilitator</label>
              <select
                value={teacherName}
                onChange={e => setTeacherName(e.target.value)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500"
              >
                {instructors.map(ins => (
                  <option key={ins} value={ins}>{ins}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Chapter / Topic Title / Surah Limits *</label>
              <input
                id="form-curriculum-topic"
                type="text"
                value={topicName}
                onChange={e => setTopicName(e.target.value)}
                placeholder="Demonstration of Wudu (Ablution) and Ghusl boundaries"
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500"
                required
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Lecture Completion Standings</label>
              <select
                value={progressStatus}
                onChange={e => setProgressStatus(e.target.value as any)}
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500"
              >
                <option value="Completed">Completed</option>
                <option value="In Progress">In Progress</option>
                <option value="Review Needed">Review Needed</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Lesson Coverage Date</label>
              <input
                type="date"
                value={dateCovered}
                onChange={e => setDateCovered(e.target.value)}
                className="w-full text-xs p-2 border border-slate-200 bg-white rounded-md focus:outline-emerald-500 font-mono"
              />
            </div>

            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold text-slate-600">Pedagogy Notes & Individual Scholar Performance Remarks</label>
              <input
                id="form-curriculum-notes"
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Aisha Siddiquie achieved full marks. Hifz level reviews showed Surah Maryam needs extra work on Madd rules."
                className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-md focus:outline-emerald-500"
              />
            </div>

          </div>

          <div className="flex justify-end gap-2.5 border-t pt-3">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-4 py-2 border border-slate-200 text-slate-700 bg-white text-xs font-semibold rounded-md hover:bg-slate-50 cursor-pointer"
            >
              Discard Lesson
            </button>
            <button
              id="submit-syllabus-card-btn"
              type="submit"
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-md cursor-pointer transition-colors shadow-xs"
            >
              Commit Lesson Progression Card
            </button>
          </div>
        </form>
      )}

      {/* Topics lookup filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4.5 h-4.5 absolute left-3 top-3 text-slate-400" />
          <input
            id="syllabus-search-input"
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Search topics, teacher remarks, notes..."
            className="w-full text-xs pl-9 pr-3 py-2.5 border border-slate-200 rounded-lg focus:outline-emerald-500"
          />
        </div>

        <div>
          <select
            id="filter-syllabus-subject"
            value={subjectFilter}
            onChange={e => setSubjectFilter(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-emerald-500 bg-white"
          >
            <option value="All">All Subjects Core Curricula</option>
            {subjects.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            id="filter-syllabus-status"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="w-full text-xs p-2.5 border border-slate-200 rounded-lg focus:outline-emerald-500 bg-white"
          >
            <option value="All">All Progression Status</option>
            <option value="Completed">Syllabus Completed</option>
            <option value="In Progress">Lessons In Progress</option>
            <option value="Review Needed">Requires Class Review</option>
          </select>
        </div>
      </div>

      {/* Grid of Course coverage item blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4" id="curriculum-deck">
        {filteredTopics.length === 0 ? (
          <div className="col-span-2 text-center text-slate-400 py-10 font-light border border-slate-100 rounded-lg">
            No logged lesson syllabi match selected core queries.
          </div>
        ) : (
          filteredTopics.map((item) => (
            <div 
              key={item.id} 
              id={`syllabus-card-${item.id}`}
              className="p-5 border border-slate-200 rounded-xl space-y-4 hover:border-emerald-500 transition-colors shadow-xs flex flex-col justify-between"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  {/* Category Pill */}
                  <span className="text-[10px] tracking-wider uppercase font-extrabold bg-emerald-50 border border-emerald-100 text-emerald-800 px-2.5 py-1 rounded">
                    {item.subject}
                  </span>
                  
                  {/* Status toggle inline dropdown if admin/teacher */}
                  {canEdit ? (
                    <select
                      value={item.progressStatus}
                      onChange={e => onUpdateTopicStatus(item.id, e.target.value as any)}
                      className="text-[10px] font-mono border border-slate-200 rounded bg-white px-2 py-0.5 focus:outline-emerald-500 cursor-pointer"
                    >
                      <option value="Completed">Completed</option>
                      <option value="In Progress">In Progress</option>
                      <option value="Review Needed">Review Needed</option>
                    </select>
                  ) : (
                    <span className={`text-[10px] font-bold uppercase ${
                      item.progressStatus === 'Completed' ? 'text-emerald-700' :
                      item.progressStatus === 'In Progress' ? 'text-amber-600' : 'text-rose-600'
                    }`}>
                      {item.progressStatus}
                    </span>
                  )}
                </div>

                <h4 className="text-sm font-bold font-serif text-slate-800 mt-1 leading-tight">{item.topicName}</h4>
                <p className="text-[11px] text-slate-400 font-medium">{item.level}</p>

                {item.notes && (
                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 border border-slate-100 p-2.5 rounded-md italic mt-2">
                    "{item.notes}"
                  </p>
                )}
              </div>

              {/* Bottom author and date stamp */}
              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[10.5px] text-slate-500">
                <span className="flex items-center gap-1 font-semibold truncate max-w-[170px]" title={item.teacherName}>
                  <User className="w-3.5 h-3.5 text-slate-400" /> {item.teacherName}
                </span>

                <span className="flex items-center gap-1 font-mono text-[10px] font-semibold text-slate-400">
                  <Calendar className="w-3.5 h-3.5" /> {item.dateCovered}
                </span>
              </div>

            </div>
          ))
        )}
      </div>

    </div>
  );
};
