export interface Student {
  id: string;
  fullName: string;
  dateOfBirth: string;
  enrollmentDate: string;
  gender: 'Male' | 'Female';
  level: string; // "Year 1 / Al-Oula", "Year 2 / Al-Thaniya", etc. (Dars-e-Nizami Aalim Course levels)
  parentName: string; // Used for "Next of Kin / Contact reference person" since all are adult students
  parentPhone: string; // Direct Student Contact Phone / Mobile (Adult student direct phone)
  parentEmail: string; // Direct Student Email Address (Adult student direct email)
  status: 'Active' | 'Inactive' | 'Graduated';
  address?: string;
}

export type IslamicSubject =
  | 'Quran Translation & Tafseer'
  | 'Hadith & Usul al-Hadith'
  | 'Fiqh & Usul al-Fiqh'
  | 'Arabic Grammar (Sarf & Nahw)'
  | 'Arabic Literature (Balaghah)'
  | 'Islamic Beliefs & Aqeedah'
  | 'Seerah & Islamic History'
  | 'Mantiq (Logic & Philosophy)';

export interface StudentAttendance {
  id: string;
  studentId: string;
  studentName: string;
  date: string; // YYYY-MM-DD
  class: string;
  status: 'Present' | 'Absent' | 'Late' | 'Excused';
  notes?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  studentName: string;
  term: string; // e.g., "June 2026", "Ramadan Term"
  amountDue: number;
  amountPaid: number;
  datePaid?: string; // YYYY-MM-DD
  paymentMethod?: 'Cash' | 'Bank Transfer' | 'Card' | 'Online';
  status: 'Paid' | 'Pending' | 'Overdue';
  receiptNumber?: string;
}

export interface TeacherAttendance {
  id: string;
  teacherName: string;
  designation: string; // 'Quran Sheikh', 'Arabic Instructor', etc.
  date: string; // YYYY-MM-DD
  status: 'Present' | 'Absent' | 'Late' | 'Sick Leave';
  classAssigned: string;
}

export interface TopicCoverage {
  id: string;
  subject: IslamicSubject;
  level: string; // "Level 1", "Level 2", etc.
  topicName: string; // e.g., "Madd Rules in Tajweed", "Fiqh of Wudu"
  dateCovered: string; // YYYY-MM-DD
  teacherName: string;
  progressStatus: 'Completed' | 'In Progress' | 'Review Needed';
  notes?: string;
}

export type StaffRole = 'Admin' | 'Teacher' | 'Finance' | 'Registrar' | 'Guest';

export interface LocalUser {
  id: string;
  email: string;
  fullName: string;
  role: StaffRole;
  provider: 'local' | 'google' | 'microsoft';
  password?: string;
}

export interface UserSession {
  username: string;
  fullName: string;
  role: StaffRole;
}

export interface DbState {
  students: Student[];
  studentAttendance: StudentAttendance[];
  feeRecords: FeeRecord[];
  teacherAttendance: TeacherAttendance[];
  topicCoverage: TopicCoverage[];
  users: LocalUser[];
  lastSynced: string;
  version: number;
}
