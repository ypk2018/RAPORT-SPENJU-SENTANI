/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface SchoolInfo {
  schoolName: string;
  npsn: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logoType: 'standard' | 'modern' | 'custom';
  accreditation?: string; // e.g., "A"
  schoolStatus?: 'Negeri' | 'Swasta' | 'Yayasan'; // e.g., "Negeri", "Swasta", "Yayasan"
  schoolLogoUrl?: string; // custom base64 school logo
  pemdaLogoUrl?: string;  // custom base64 pemda logo
}

export interface StudentInfo {
  name: string;
  nis: string;
  nisn: string;
  birthPlace: string;
  birthDate: string;
  studentClass: string;
  semester: string;
  academicYear: string;
  fatherName: string;
  motherName: string;
  parentOccupation: string;
  guardianName?: string;
}

export interface SubjectGrade {
  id: string; // e.g. "mapel_1"
  code: string;
  name: string;
  score: number;
  predicate: 'A' | 'B' | 'C' | 'D';
  description: string;
  knowledgeScore?: number; // Nilai Pengetahuan
  skillsScore?: number;    // Nilai Keterampilan
}

export interface P5Project {
  theme: string;
  title: string;
  durationJp: number;
  dimensionsDetails: {
    dimension: string;
    target: string;
    achievement: 'Belum Berkembang' | 'Mulai Berkembang' | 'Berkembang Sesuai Harapan' | 'Sangat Berkembang';
  }[];
  summary: string;
}

export interface Extracurricular {
  id: string;
  name: string;
  grade: 'Sangat Baik' | 'Baik' | 'Cukup' | 'Kurang';
  description: string;
}

export interface Attendance {
  sick: number;     // Sakit
  permit: number;   // Izin
  alpha: number;    // Tanpa Keterangan
}

export interface Signatures {
  className: string;
  classTeacherName: string;
  classTeacherNip: string;
  principalName: string;
  principalNip: string;
  locationAndDate: string; // e.g., "Sentani, 19 Juni 2026"
}

export interface RaporData {
  school: SchoolInfo;
  student: StudentInfo;
  grades: SubjectGrade[];
  p5: P5Project;
  extracurriculars: Extracurricular[];
  attendance: Attendance;
  signatures: Signatures;
  kktp: number; // Kriteria Ketercapaian Tujuan Pembelajaran (KKTP)
  kktpLimitB?: number; // Batas B (e.g. 80)
  kktpLimitA?: number; // Batas A (e.g. 90)
  promotionDecision: string; // e.g., "Naik ke Kelas VIII (Delapan)" or "Tinggal di Kelas VII (Tujuh)"
  teacherNotes: string; // Catatan Wali Kelas
  parentNotesPlaceholder: string; // Kolom feedback orang tua placeholder
}

export function calculatePromotionDecision(
  grades: { predicate: 'A' | 'B' | 'C' | 'D' | string }[],
  studentClass: string,
  schoolName: string
): { isPromoted: boolean; decision: string; dGradesCount: number } {
  const dGradesCount = grades.filter(g => g.predicate === 'D').length;
  // Siswa dinyatakan tidak lulus/tidak naik kelas jika predikat D sebanyak 4 atau lebih (dGradesCount >= 4)
  const isPromoted = dGradesCount < 4;

  const cls = studentClass.toUpperCase();
  let nextKelas = "";
  let currentKelasText = "";
  let isGraduating = false;

  if (cls.includes('IX') || cls.includes('9')) {
    isGraduating = true;
    currentKelasText = "IX (Sembilan)";
  } else if (cls.includes('VIII') || cls.includes('8')) {
    nextKelas = "IX (Sembilan)";
    currentKelasText = "VIII (Delapan)";
  } else if (cls.includes('VII') || cls.includes('7')) {
    nextKelas = "VIII (Delapan)";
    currentKelasText = "VII (Tujuh)";
  } else if (cls.includes('VI') || cls.includes('6')) {
    isGraduating = true;
    currentKelasText = "VI (Enam)";
  } else if (cls.includes('V') || cls.includes('5')) {
    nextKelas = "VI (Enam)";
    currentKelasText = "V (Lima)";
  } else if (cls.includes('IV') || cls.includes('4')) {
    nextKelas = "V (Lima)";
    currentKelasText = "IV (Empat)";
  } else if (cls.includes('III') || cls.includes('3')) {
    nextKelas = "IV (Empat)";
    currentKelasText = "III (Tiga)";
  } else if (cls.includes('II') || cls.includes('2')) {
    nextKelas = "III (Tiga)";
    currentKelasText = "II (Dua)";
  } else if (cls.includes('I') || cls.includes('1')) {
    nextKelas = "II (Dua)";
    currentKelasText = "I (Satu)";
  } else {
    // Default fallback
    nextKelas = "VIII (Delapan)";
    currentKelasText = "VII (Tujuh)";
  }

  let decision = "";
  if (isPromoted) {
    if (isGraduating) {
      decision = `Lulus dari ${schoolName}`;
    } else {
      decision = `Naik ke Kelas ${nextKelas}`;
    }
  } else {
    if (isGraduating) {
      decision = `Tidak Lulus (Tinggal di Kelas ${currentKelasText})`;
    } else {
      decision = `Tinggal di Kelas ${currentKelasText}`;
    }
  }

  return {
    isPromoted,
    decision,
    dGradesCount
  };
}

