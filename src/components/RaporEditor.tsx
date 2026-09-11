/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, ChangeEvent } from 'react';
import { RaporData, SubjectGrade, Extracurricular, P5Project, calculatePromotionDecision } from '../types';
import { calculatePredicate, getPredicateRanges } from '../initialData';
import { Save, RefreshCw, Sparkles, BookOpen, User, Calendar, Award, Copy, Info, AlertCircle, Trash2, UserPlus, Plus, Edit, Check } from 'lucide-react';

interface RaporEditorProps {
  data: RaporData;
  onChange: (updatedData: RaporData) => void;
  onReset: () => void;
  userRole?: 'admin' | 'user';
  studentList?: { key: string; name: string; nis: string }[];
  selectedStudentKey?: string;
  onSelectStudent?: (key: string) => void;
  onAddStudent?: (newStudentData: { name: string; nis: string; nisn: string; studentClass?: string }) => void;
  onDeleteStudent?: (key: string) => void;
}

type TabType = 'school' | 'student' | 'grades' | 'p5' | 'extra' | 'attendance';

export default function RaporEditor({ 
  data, 
  onChange: onParentChange, 
  onReset, 
  userRole = 'admin',
  studentList = [],
  selectedStudentKey = 'template_budi',
  onSelectStudent,
  onAddStudent,
  onDeleteStudent
}: RaporEditorProps) {
  const onChange = (updatedData: RaporData) => {
    const calc = calculatePromotionDecision(
      updatedData.grades,
      updatedData.student.studentClass,
      updatedData.school.schoolName || 'SMP NEGERI 7 SENTANI'
    );
    onParentChange({
      ...updatedData,
      promotionDecision: calc.decision
    });
  };

  const [activeTab, setActiveTab] = useState<TabType>('grades');
  const { school, student, p5, extracurriculars, attendance, signatures } = data;
  const isReadOnly = userRole === 'user';

  const interval = (100 - data.kktp) / 3;
  const autoLimitB = data.kktp + Math.round(interval);
  const autoLimitA = data.kktp + Math.round(2 * interval);

  const hasInvalidGrades = data.grades.some(g => {
    const kVal = g.knowledgeScore !== undefined ? g.knowledgeScore : g.score;
    const sVal = g.skillsScore !== undefined ? g.skillsScore : g.score;
    return kVal < 0 || kVal > 100 || sVal < 0 || sVal > 100 || g.score < 0 || g.score > 100;
  });

  // State hooks for registering a new student
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentNis, setNewStudentNis] = useState('');
  const [newStudentNisn, setNewStudentNisn] = useState('');
  const [newStudentClass, setNewStudentClass] = useState('VIII-A');
  const [studentSearch, setStudentSearch] = useState('');

  // State for managing editing mode in Extracurriculars tab
  const [editingExtraId, setEditingExtraId] = useState<string | null>(null);

  const handleAddExtracurricular = () => {
    const newId = `extra-${Date.now()}`;
    const newExtra: Extracurricular = {
      id: newId,
      name: "Ekstrakurikuler Baru",
      grade: "Baik",
      description: "Mengikuti kegiatan dengan baik dan aktif."
    };
    const updated = [...(data.extracurriculars || []), newExtra];
    handleExtracurricularChange(updated);
    setEditingExtraId(newId);
  };

  const handleDeleteExtracurricular = (idToDelete: string) => {
    const updated = (data.extracurriculars || []).filter(ex => ex.id !== idToDelete);
    handleExtracurricularChange(updated);
    if (editingExtraId === idToDelete) {
      setEditingExtraId(null);
    }
  };

  // Trigger state updates
  const handleSchoolChange = (key: string, value: any) => {
    onChange({
      ...data,
      school: {
        ...data.school,
        [key]: value
      }
    });
  };

  const handleLogoUpload = (e: ChangeEvent<HTMLInputElement>, fieldName: 'schoolLogoUrl' | 'pemdaLogoUrl') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        handleSchoolChange(fieldName, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleStudentChange = (key: string, value: any) => {
    onChange({
      ...data,
      student: {
        ...data.student,
        [key]: value
      }
    });
  };

  const handleGradesChange = (updatedGrades: SubjectGrade[]) => {
    onChange({
      ...data,
      grades: updatedGrades
    });
  };

  const handleP5Change = (key: string, value: any) => {
    onChange({
      ...data,
      p5: {
        ...data.p5,
        [key]: value
      }
    });
  };

  const handleExtracurricularChange = (updatedExtras: Extracurricular[]) => {
    onChange({
      ...data,
      extracurriculars: updatedExtras
    });
  };

  const handleAttendanceChange = (key: string, value: number) => {
    onChange({
      ...data,
      attendance: {
        ...data.attendance,
        [key]: value
      }
    });
  };

  const handleSignatureChange = (key: string, value: any) => {
    onChange({
      ...data,
      signatures: {
        ...data.signatures,
        [key]: value
      }
    });
  };

  const handleKktpAndCalculations = (newKktp: number, newLimitB?: number, newLimitA?: number) => {
    const updatedGrades = data.grades.map(g => ({
      ...g,
      predicate: calculatePredicate(g.score, newKktp, newLimitB, newLimitA)
    }));
    onChange({
      ...data,
      kktp: newKktp,
      kktpLimitB: newLimitB,
      kktpLimitA: newLimitA,
      grades: updatedGrades
    });
  };

  const handleKnowledgeChange = (gradeId: string, val: number) => {
    const updatedGrades = data.grades.map(g => {
      if (g.id === gradeId) {
        const skillsVal = g.skillsScore !== undefined ? g.skillsScore : g.score;
        const newScore = Math.round((val + skillsVal) / 2);
        return {
          ...g,
          knowledgeScore: val,
          score: newScore,
          predicate: calculatePredicate(newScore, data.kktp, data.kktpLimitB, data.kktpLimitA)
        };
      }
      return g;
    });
    handleGradesChange(updatedGrades);
  };

  const handleSkillsChange = (gradeId: string, val: number) => {
    const updatedGrades = data.grades.map(g => {
      if (g.id === gradeId) {
        const knowledgeVal = g.knowledgeScore !== undefined ? g.knowledgeScore : g.score;
        const newScore = Math.round((knowledgeVal + val) / 2);
        return {
          ...g,
          skillsScore: val,
          score: newScore,
          predicate: calculatePredicate(newScore, data.kktp, data.kktpLimitB, data.kktpLimitA)
        };
      }
      return g;
    });
    handleGradesChange(updatedGrades);
  };

  // Helper helper to autogenerate typical Indonesian description narratives
  const generateAutodescription = (subjectName: string, score: number) => {
    const { limitB, limitA } = getPredicateRanges(data.kktp, data.kktpLimitB, data.kktpLimitA);
    let text = "";
    if (score >= limitA) {
      text = `Menunjukkan penguasaan kompetensi yang sangat luar biasa dalam mengidentifikasi, memecahkan masalah, serta merumuskan kesimpulan teoretis materi ${subjectName} dengan sangat percaya diri di kelas.`;
    } else if (score >= limitB) {
      text = `Menunjukkan penguasaan kompetensi yang baik dan konsisten dalam mempraktikkan serta mengaplikasikan konsep-konsep dasar ${subjectName} selama proses pengerjaan tugas mandiri maupun kelompok.`;
    } else if (score >= data.kktp) {
      text = `Menunjukkan ketercapaian kompetensi yang cukup dalam materi dasar ${subjectName}. Memerlukan sedikit bimbingan tambahan dan ketekunan latihan untuk memperdalam beberapa submateri tertentu.`;
    } else {
      text = `Masih berjuang untuk memahami sebagian besar tujuan pembelajaran pokok ${subjectName}. Memerlukan perhatian intensif, program bimbingan remedial berkala, serta kemauan belajar lebih tekun.`;
    }
    return text;
  };

  const applyAutoDescriptionToAll = () => {
    const updatedGrades = data.grades.map(g => ({
      ...g,
      description: generateAutodescription(g.name, g.score)
    }));
    handleGradesChange(updatedGrades);
  };

  const [editorTheme, setEditorTheme] = useState<'dark' | 'light'>('dark');
  const [savedTab, setSavedTab] = useState<string | null>(null);

  const handleSaveTab = (tabName: string) => {
    setSavedTab(tabName);
    setTimeout(() => {
      setSavedTab(null);
    }, 2500);
  };

  const isDark = editorTheme === 'dark';

  // State-derived dynamic design tokens
  const containerClass = isDark
    ? "bg-zinc-900 border border-zinc-700 text-zinc-100 flex flex-col h-full no-print"
    : "bg-zinc-50 border border-zinc-300 text-zinc-900 shadow-md flex flex-col h-full no-print";

  const menuHeaderClass = isDark
    ? "flex items-center justify-between px-3 py-1.5 border-b select-none text-[10px] bg-zinc-950 border-zinc-850 text-zinc-400 font-mono"
    : "flex items-center justify-between px-3 py-1.5 border-b select-none text-[10px] bg-zinc-105 border-zinc-250 text-zinc-650 font-mono border-zinc-250";

  const tabsContainerClass = isDark
    ? "grid grid-cols-3 sm:grid-cols-6 border-b border-zinc-750 bg-zinc-950 p-1 gap-1 select-none text-[10.5px]"
    : "grid grid-cols-3 sm:grid-cols-6 border-b border-zinc-250 bg-zinc-100 p-1 gap-1 select-none text-[10.5px]";

  const tabButtonClass = (tab: TabType) => {
    const isActive = activeTab === tab;
    if (isDark) {
      return `flex flex-col items-center justify-center py-2 px-1 rounded-sm text-[10px] sm:text-xs font-bold tracking-wide transition-all ${
        isActive
          ? 'bg-zinc-850 text-white border border-zinc-600'
          : 'text-zinc-400 hover:bg-zinc-800/60 hover:text-zinc-200 border border-transparent'
      }`;
    } else {
      return `flex flex-col items-center justify-center py-2 px-1 rounded-sm text-[10px] sm:text-xs font-bold tracking-wide transition-all ${
        isActive
          ? 'bg-white text-zinc-950 border border-zinc-300 shadow-sm'
          : 'text-zinc-650 hover:bg-zinc-200/60 hover:text-zinc-900 border border-transparent'
      }`;
    }
  };

  const itemCardClass = isDark
    ? "p-4 rounded-xl bg-zinc-950/40 border border-zinc-850 hover:border-zinc-750 transition space-y-3"
    : "p-4 rounded-xl bg-white border border-zinc-250 hover:border-zinc-300/80 shadow-sm transition space-y-3";

  const sectionHeaderBorderClass = isDark ? "flex items-center justify-between border-b border-zinc-805 pb-2.5" : "flex items-center justify-between border-b border-zinc-250 pb-2.5";
  const sectionTitleClass = isDark ? "text-sm font-bold tracking-tight text-white uppercase sm:text-base" : "text-sm font-extrabold tracking-tight text-zinc-900 uppercase sm:text-base";
  const bodyTextClass = isDark ? "text-zinc-400" : "text-zinc-650 font-medium";
  const subtitleClass = isDark ? "text-[10px] text-zinc-400" : "text-[10px] text-zinc-600 font-medium";

  const subHeaderClass = isDark
    ? "text-xs font-semibold text-sky-400 uppercase tracking-widest pl-1 border-l-2 border-sky-500"
    : "text-xs font-bold text-sky-700 uppercase tracking-widest pl-1 border-l-2 border-sky-600";

  const labelClass = isDark
    ? "text-[10px] font-semibold text-zinc-400 block"
    : "text-[10px] font-bold text-zinc-650 block";

  const inputClass = isDark
    ? "w-full h-9 bg-zinc-950 text-zinc-100 p-2.5 rounded border border-zinc-800 text-xs focus:outline-none focus:border-zinc-600"
    : "w-full h-9 bg-white text-zinc-900 p-2.5 border border-zinc-300 text-xs focus:outline-none focus:border-zinc-400 shadow-sm";

  const selectClass = isDark
    ? "h-8 bg-zinc-950 text-sky-400 border border-zinc-800 p-1.5 rounded focus:outline-none text-[10.5px] font-bold"
    : "h-8 bg-white text-sky-700 border border-zinc-300 p-1.5 rounded focus:outline-none text-[10.5px] font-bold shadow-sm";

  const renderSaveButton = (tabName: string, label: string) => {
    const isSchoolTabLocked = tabName === "Sekolah & TTD" && isReadOnly;
    return (
      <div className={`mt-6 pt-4 border-t flex items-center justify-between ${isDark ? 'border-zinc-800' : 'border-zinc-250'}`}>
        <span className={`text-[9.5px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-500 font-medium'}`}>
          Tersinkronisasi ke Layar Kertas Rapor • SMPN 7 SENTANI
        </span>
        <button
          onClick={() => !isSchoolTabLocked && handleSaveTab(tabName)}
          disabled={isSchoolTabLocked}
          className={`flex items-center gap-1.5 font-extrabold text-[10.5px] py-1.5 px-3 rounded-sm transition-all active:scale-95 uppercase shadow-sm font-sans ${
            isSchoolTabLocked
              ? 'bg-zinc-700/55 text-zinc-400 border border-zinc-650 cursor-not-allowed pointer-events-none'
              : 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600 hover:border-emerald-500 cursor-pointer'
          }`}
        >
          <Save className="w-3.5 h-3.5" />
          <span>{label}</span>
        </button>
      </div>
    );
  };

  return (
    <div className={containerClass}>
      
      {/* Gelap / Terang Control Toolbar (Menu Background Selector) */}
      <div className={menuHeaderClass}>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 bg-sky-400 rounded-full animate-pulse" />
          <span>SINKRONISASI AKTIF</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={isDark ? "text-zinc-500 font-semibold" : "text-zinc-600 font-bold"}>LATAR MENU:</span>
          <div className="flex bg-zinc-950 p-0.5 border border-zinc-800 rounded-sm">
            <button
              onClick={() => setEditorTheme('dark')}
              className={`px-2 py-0.5 text-[9px] font-bold uppercase transition rounded-xs cursor-pointer ${
                isDark 
                  ? 'bg-zinc-800 text-white border border-zinc-750' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              🌙 Gelap
            </button>
            <button
              onClick={() => setEditorTheme('light')}
              className={`px-2 py-0.5 text-[9px] font-bold uppercase transition rounded-xs cursor-pointer ${
                !isDark 
                  ? 'bg-zinc-100 text-zinc-950 border border-zinc-300' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              ☀️ Terang
            </button>
          </div>
        </div>
      </div>

      {/* Editor Navigation Grid Tabs */}
      <div className={tabsContainerClass}>
        <button
          onClick={() => setActiveTab('grades')}
          className={tabButtonClass('grades')}
        >
          <BookOpen className="w-3.5 h-3.5 mb-1 text-sky-400" />
          <span>Nilai Mapel</span>
        </button>

        <button
          onClick={() => setActiveTab('student')}
          className={tabButtonClass('student')}
        >
          <User className="w-3.5 h-3.5 mb-1 text-sky-400" />
          <span>Data Siswa</span>
        </button>

        <button
          onClick={() => setActiveTab('school')}
          className={tabButtonClass('school')}
        >
          <Info className="w-3.5 h-3.5 mb-1 text-sky-400" />
          <span>Sekolah & TTD</span>
        </button>

        <button
          onClick={() => setActiveTab('p5')}
          className={tabButtonClass('p5')}
        >
          <Sparkles className="w-3.5 h-3.5 mb-1 text-sky-400" />
          <span>Karakter P5</span>
        </button>

        <button
          onClick={() => setActiveTab('extra')}
          className={tabButtonClass('extra')}
        >
          <Award className="w-3.5 h-3.5 mb-1 text-sky-400" />
          <span>Ekstra</span>
        </button>

        <button
          onClick={() => setActiveTab('attendance')}
          className={tabButtonClass('attendance')}
        >
          <Calendar className="w-3.5 h-3.5 mb-1 text-sky-400" />
          <span>Catatan & Absen</span>
        </button>
      </div>

      {/* Beautiful saved notification alert bar */}
      {savedTab && (
        <div className="no-print px-4 pt-3.5">
          <div className="flex items-center gap-2.5 bg-emerald-700/10 border border-emerald-600/30 text-emerald-500 p-2.5 rounded-sm text-[11px] font-bold leading-none animate-fadeIn select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>✓ BERHASIL DISIMPAN: Semua perubahan pada menu "{savedTab}" aman dan tersinkronisasi!</span>
          </div>
        </div>
      )}

      {/* Panel Workspace (Scroller area) */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 max-h-[70vh]">
        {isReadOnly && (
          <div className="no-print mb-4 animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-sky-500/10 border border-sky-500/30 text-sky-450 p-3.5 rounded-lg text-xs leading-relaxed font-sans">
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-sky-400 mt-0.5 sm:mt-0" />
              <div>
                <span className="font-extrabold uppercase text-[10.5px] block mb-0.5">Mode Pengguna Aktif (Guru / Staff Pengisi)</span>
                Anda berhak mengisi data rapor siswa, mengedit nilai, deskripsi, proyek P5, ekstrakurikuler, dan ketidakhadiran secara penuh. <strong>Namun, profil sekolah, status, akreditasi, stempel kantor, keputusan kenaikan kelas, dan kredensial kepala sekolah dikunci/baca saja (hanya bisa diubah oleh Administrator).</strong>
              </div>
            </div>
          </div>
        )}

        <div>

          {/* Tab 1: Grades & Academic Subjects */}
        {activeTab === 'grades' && (
          <div className="space-y-4">
            <div className={sectionHeaderBorderClass}>
              <div>
                <h3 className={sectionTitleClass}>10 Mata Pelajaran Standar</h3>
                <p className={subtitleClass}>Atur skor angka (KKTP: {data.kktp}) dan ubah deskripsi capaian siswa.</p>
              </div>
              <button
                onClick={applyAutoDescriptionToAll}
                className={`flex items-center gap-1.5 font-mono text-[10px] font-semibold py-1.5 px-2.5 rounded border transition active:scale-95 cursor-pointer ${
                  isDark 
                    ? 'bg-zinc-805 hover:bg-zinc-750 text-sky-400 hover:text-sky-300 border-zinc-700/60' 
                    : 'bg-sky-50 hover:bg-sky-100 text-sky-700 border-sky-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 animate-pulse" />
                <span>Auto-Isi Semua Deskripsi</span>
              </button>
            </div>

            {hasInvalidGrades && (
              <div className="flex items-start gap-3 bg-rose-500/10 border border-rose-500/20 text-rose-455 p-3.5 rounded-lg text-xs leading-relaxed font-sans mb-3 animate-pulse">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-500 mt-0.5 animate-pulse" />
                <div>
                  <span className="font-extrabold uppercase text-[10.5px] block mb-0.5 text-rose-450">Peringatan: Nilai di Luar Jangkauan Standar!</span>
                  Ada nilai yang diinput di luar rentang standar <strong>0 - 100</strong>. Kolom atau kotak nilai yang tidak valid ditandai dengan warna merah menyala. Harap disesuaikan kembali nilai aslinya sebelum dokumen cetak diunduh.
                </div>
              </div>
            )}

            <div className="overflow-x-auto border rounded-xl shadow-xs transition-colors duration-200 bg-zinc-950/20 border-zinc-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className={`border-b text-[10px] font-black uppercase tracking-wider font-mono select-none ${
                    isDark 
                      ? 'bg-zinc-950 text-zinc-400 border-zinc-800' 
                      : 'bg-zinc-100 text-zinc-600 border-zinc-250'
                  }`}>
                    <th className="p-3 text-center w-10">No</th>
                    <th className="p-3 min-w-[140px] md:min-w-[180px]">Mata Pelajaran</th>
                    <th className="p-3 text-center w-24">Pengetahuan (K)</th>
                    <th className="p-3 text-center w-24">Keterampilan (S)</th>
                    <th className="p-3 text-center w-24">Nilai Akhir (NA)</th>
                    <th className="p-3 text-center w-20">Predikat</th>
                    <th className="p-3 min-w-[280px]">Catatan Deskripsi Capaian</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-zinc-850' : 'divide-zinc-200'}`}>
                  {data.grades.map((grade, index) => {
                    const knowledgeVal = grade.knowledgeScore !== undefined ? grade.knowledgeScore : grade.score;
                    const skillsVal = grade.skillsScore !== undefined ? grade.skillsScore : grade.score;
                    const isBelowKktp = grade.score < data.kktp;
                    
                    return (
                      <tr key={grade.id} className={`transition duration-150 ${
                        isDark 
                          ? 'hover:bg-zinc-850/30' 
                          : 'hover:bg-zinc-50/60'
                      }`}>
                        {/* No */}
                        <td className="p-3 text-center font-mono text-zinc-500 font-bold">{index + 1}</td>
                        
                        {/* Mata Pelajaran Name & Code */}
                        <td className="p-3">
                          <div className="flex flex-col gap-0.5">
                            <span className="text-[10px] font-mono font-extrabold text-sky-500">{grade.code}</span>
                            <span className={`font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`}>{grade.name}</span>
                          </div>
                        </td>
                        
                        {/* Pengetahuan Score Input */}
                        <td className="p-3 text-center">
                          <div className="relative inline-block">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={knowledgeVal}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                const parsedVal = isNaN(val) ? 0 : val;
                                handleKnowledgeChange(grade.id, parsedVal);
                              }}
                              className={`w-16 h-8 text-center text-xs font-mono font-extrabold rounded border transition-all duration-250 focus:outline-none focus:ring-2 ${
                                (knowledgeVal < 0 || knowledgeVal > 100)
                                  ? 'bg-rose-950/20 border-rose-605 text-rose-500 focus:border-rose-500 focus:ring-rose-500/30 ring-2 ring-rose-500/15 font-black'
                                  : isDark 
                                    ? 'bg-zinc-950 border-zinc-800 text-sky-450 focus:border-sky-550 focus:ring-sky-550/35' 
                                    : 'bg-white border-zinc-300 text-sky-805 focus:border-sky-620 focus:ring-sky-600/20 shadow-xs'
                              }`}
                            />
                            {(knowledgeVal < 0 || knowledgeVal > 100) && (
                              <div className="absolute -top-1 -right-1 w-2.2 h-2.2 bg-rose-600 rounded-full border border-zinc-950 animate-ping" />
                            )}
                          </div>
                        </td>
                        
                        {/* Keterampilan Score Input */}
                        <td className="p-3 text-center">
                          <div className="relative inline-block">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={skillsVal}
                              onChange={(e) => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value);
                                const parsedVal = isNaN(val) ? 0 : val;
                                handleSkillsChange(grade.id, parsedVal);
                              }}
                              className={`w-16 h-8 text-center text-xs font-mono font-extrabold rounded border transition-all duration-250 focus:outline-none focus:ring-2 ${
                                (skillsVal < 0 || skillsVal > 100)
                                  ? 'bg-rose-950/20 border-rose-605 text-rose-500 focus:border-rose-500 focus:ring-rose-500/30 ring-2 ring-rose-500/15 font-black'
                                  : isDark 
                                    ? 'bg-zinc-950 border-zinc-800 text-sky-450 focus:border-sky-550 focus:ring-sky-550/35' 
                                    : 'bg-white border-zinc-300 text-sky-850 focus:border-sky-600 focus:ring-sky-600/20 shadow-xs'
                              }`}
                            />
                            {(skillsVal < 0 || skillsVal > 100) && (
                              <div className="absolute -top-1 -right-1 w-2.2 h-2.2 bg-rose-600 rounded-full border border-zinc-950 animate-ping" />
                            )}
                          </div>
                        </td>
                        
                        {/* Nilai Akhir Score Badging */}
                        <td className="p-3 text-center">
                          <div className="flex flex-col items-center justify-center gap-0.5">
                            <div className="flex items-center justify-center gap-1">
                              <span className={`text-sm font-mono font-black ${
                                (grade.score < 0 || grade.score > 100)
                                  ? 'text-rose-550 font-black underline decoration-wavy animate-bounce'
                                  : isBelowKktp 
                                    ? 'text-rose-500 font-extrabold underline decoration-wavy' 
                                    : isDark ? 'text-zinc-150' : 'text-zinc-900'
                              }`}>
                                {grade.score}
                              </span>
                              {(grade.score < 0 || grade.score > 100) && (
                                <AlertCircle className="w-3.5 h-3.5 text-rose-555 animate-pulse shrink-0" />
                              )}
                            </div>
                            {(grade.score < 0 || grade.score > 100) && (
                              <span className="text-[8px] font-sans font-extrabold uppercase text-rose-550 tracking-wide">
                                NA Error
                              </span>
                            )}
                          </div>
                        </td>
                        
                        {/* Predicate */}
                        <td className="p-3 text-center">
                          <span className={`inline-block text-[10px] font-black w-7 py-0.5 rounded text-center border font-mono ${
                            grade.predicate === 'A' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                            grade.predicate === 'B' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                            grade.predicate === 'C' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                            'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {grade.predicate}
                          </span>
                        </td>
                        
                        {/* Narrative Description & Instant Autogen */}
                        <td className="p-3">
                          <div className="relative flex flex-col gap-1">
                            <textarea
                              rows={1}
                              value={grade.description}
                              onChange={(e) => {
                                const updated = data.grades.map(g => {
                                  if (g.id === grade.id) {
                                    return { ...g, description: e.target.value };
                                  }
                                  return g;
                                });
                                handleGradesChange(updated);
                              }}
                              placeholder="Masukkan deskripsi capaian..."
                              className={`w-full min-h-[44px] text-[10.5px] p-2 pr-20 leading-relaxed rounded border focus:outline-none focus:ring-1 resize-y ${
                                isDark 
                                  ? 'bg-zinc-950 text-zinc-300 border-zinc-800 focus:border-zinc-600 focus:ring-zinc-600/20 placeholder-zinc-700' 
                                  : 'bg-white text-zinc-900 border-zinc-300 focus:border-zinc-400 focus:ring-zinc-400/20 shadow-xs placeholder-zinc-400'
                              }`}
                            />
                            
                            {/* Generator Mini-Sparkle Button */}
                            <button
                              onClick={() => {
                                const generated = generateAutodescription(grade.name, grade.score);
                                const updated = data.grades.map(g => {
                                  if (g.id === grade.id) {
                                    return { ...g, description: generated };
                                  }
                                  return g;
                                });
                                handleGradesChange(updated);
                              }}
                              className={`absolute right-1.5 bottom-1.5 flex items-center gap-0.5 text-[8.5px] font-sans font-black select-none tracking-tight py-0.5 px-2 rounded-xs transition duration-150 border active:scale-95 cursor-pointer ${
                                isDark 
                                  ? 'bg-zinc-800 hover:bg-zinc-700 border-zinc-700 text-sky-400 hover:text-sky-350' 
                                  : 'bg-sky-50 hover:bg-sky-100 border-sky-200 text-sky-700 shadow-2xs'
                              }`}
                              title="Bantu buat narasi kompetensi otomatis"
                            >
                              <Sparkles className="w-2.5 h-2.5 text-sky-500 animate-pulse" />
                              <span>Bantu Isi</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Save Button for Nilai Mapel */}
            {renderSaveButton("Nilai Mata Pelajaran", "Simpan Data Nilai")}
          </div>
        )}

        {/* Tab 2: Student Information & Details */}
        {activeTab === 'student' && (
          <div className="space-y-6">
            {/* Subsection A: Student Management Database */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-950/30 border-zinc-800' : 'bg-white border-zinc-250 shadow-xs'} space-y-4`}>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
                <div>
                  <h4 className="text-xs font-bold text-sky-400 uppercase tracking-widest pl-1 border-l-2 border-sky-500">
                    Sistem Kelola Kelompok Belajar / Daftar Siswa
                  </h4>
                  <p className={subtitleClass}>Daftarkan siswa baru atau pilih siswa aktif untuk dikonfigurasi nilai & identitasnya.</p>
                </div>
                {/* Search field */}
                <div className="shrink-0 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="Cari nama atau NIS..."
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    className="w-full sm:w-48 h-8 bg-zinc-900 border border-zinc-800 px-2.5 rounded text-xs text-zinc-200 focus:outline-none focus:border-zinc-700"
                  />
                </div>
              </div>

              {/* Grid: List (Left) and Add Form (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* List of Registered Students */}
                <div className="lg:col-span-7 space-y-2">
                  <span className="text-[10px] font-mono font-bold uppercase bg-zinc-900 text-zinc-400 py-0.5 px-2 border border-zinc-800 tracking-wider">
                    Daftar Siswa Terdaftar ({studentList.length})
                  </span>
                  <div className="max-h-[220px] overflow-y-auto border border-zinc-800 rounded bg-zinc-950/30 divide-y divide-zinc-850/50">
                    {studentList
                      .filter(item => item.name.toLowerCase().includes(studentSearch.toLowerCase()) || item.nis.includes(studentSearch))
                      .map((item) => {
                        const isActive = item.key === selectedStudentKey;
                        return (
                          <div
                            key={item.key}
                            className={`flex items-center justify-between p-2.5 transition ${
                              isActive 
                                ? 'bg-sky-950/35 border-l-2 border-sky-500' 
                                : 'hover:bg-zinc-900/40'
                            }`}
                          >
                            <div className="space-y-0.5 min-w-0 pr-2">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="text-xs font-bold text-white truncate max-w-[160px] sm:max-w-none">{item.name}</span>
                                {isActive && (
                                  <span className="text-[8px] font-black uppercase bg-emerald-950/80 text-emerald-400 px-1 border border-emerald-800/70 font-mono animate-pulse rounded-xs shrink-0">
                                    Sedang Diedit
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-zinc-400 font-mono">
                                NIS: {item.nis || '-'} • Kelas: {isActive ? student.studentClass : (item.key === 'template_budi' ? 'VIII-A' : 'VII-A')}
                              </p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={() => onSelectStudent && onSelectStudent(item.key)}
                                className={`text-[10px] font-sans font-bold py-1 px-2.5 rounded transition cursor-pointer select-none ${
                                  isActive
                                    ? 'bg-zinc-800 text-zinc-400 border border-zinc-700/50 cursor-not-allowed'
                                    : 'bg-sky-700 hover:bg-sky-600 text-white border border-sky-650 active:scale-95'
                                }`}
                                disabled={isActive}
                              >
                                {isActive ? 'Dipilih' : 'Pilih & Edit'}
                              </button>
                              <button
                                onClick={() => onDeleteStudent && onDeleteStudent(item.key)}
                                className="p-1 pb-1.5 text-zinc-550 hover:text-rose-400 hover:bg-zinc-900 rounded transition cursor-pointer select-none"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    {studentList.filter(item => item.name.toLowerCase().includes(studentSearch.toLowerCase()) || item.nis.includes(studentSearch)).length === 0 && (
                      <div className="p-5 text-center text-zinc-500 text-xs font-mono">
                        Tidak ada siswa yang cocok dengan pencarian Anda.
                      </div>
                    )}
                  </div>
                </div>

                {/* New Student Register Column */}
                <div className="lg:col-span-5 p-3.5 rounded-lg border border-zinc-800 bg-zinc-900/40 space-y-3">
                  <span className="text-[10px] font-mono uppercase bg-zinc-900 text-sky-400 py-0.5 px-2 border border-zinc-800 tracking-wider block w-max select-none">
                    Registrasi Siswa Baru
                  </span>
                  
                  <div className="space-y-2">
                    <div className="space-y-1">
                      <label className={labelClass}>Nama Lengkap Siswa</label>
                      <input
                        type="text"
                        placeholder="Contoh: Muhammad Akhyar"
                        value={newStudentName}
                        onChange={(e) => setNewStudentName(e.target.value)}
                        className="w-full h-8 bg-zinc-950 text-zinc-100 px-2 py-1 rounded border border-zinc-800 text-xs focus:outline-none focus:border-zinc-650"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className={labelClass}>NIS</label>
                        <input
                          type="text"
                          placeholder="240822"
                          value={newStudentNis}
                          onChange={(e) => setNewStudentNis(e.target.value)}
                          className="w-full h-8 bg-zinc-950 text-zinc-100 px-2 py-1 rounded border border-zinc-800 text-xs focus:outline-none focus:border-zinc-650 font-mono"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className={labelClass}>NISN</label>
                        <input
                          type="text"
                          placeholder="0123456789"
                          value={newStudentNisn}
                          onChange={(e) => setNewStudentNisn(e.target.value)}
                          className="w-full h-8 bg-zinc-950 text-zinc-100 px-2 py-1 rounded border border-zinc-800 text-xs focus:outline-none focus:border-zinc-650 font-mono"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className={labelClass}>Kelas Bawaan</label>
                      <input
                        type="text"
                        placeholder="VIII-A"
                        value={newStudentClass}
                        onChange={(e) => setNewStudentClass(e.target.value)}
                        className="w-full h-8 bg-zinc-950 text-zinc-100 px-2 py-1 rounded border border-zinc-800 text-xs focus:outline-none focus:border-zinc-650 font-sans font-bold"
                      />
                    </div>

                    <button
                      onClick={() => {
                        if (!newStudentName.trim()) {
                          alert("Mohon masukkan nama lengkap siswa.");
                          return;
                        }
                        if (!newStudentNis.trim()) {
                          alert("Mohon masukkan nomor induk siswa (NIS).");
                          return;
                        }
                        if (onAddStudent) {
                          onAddStudent({
                            name: newStudentName.trim(),
                            nis: newStudentNis.trim(),
                            nisn: newStudentNisn.trim() || '---------',
                            studentClass: newStudentClass.trim() || 'VIII-A'
                          });
                          // Reset form
                          setNewStudentName('');
                          setNewStudentNis('');
                          setNewStudentNisn('');
                        }
                      }}
                      className="w-full h-8 bg-sky-700 hover:bg-sky-600 border border-sky-650 text-white font-extrabold text-xs uppercase rounded transition-all active:scale-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Daftarkan Siswa</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Subsection B: Detailed Identity Form for Active Student */}
            <div className={`p-4 rounded-xl border ${isDark ? 'bg-zinc-950/30 border-zinc-800' : 'bg-white border-zinc-250 shadow-xs'} space-y-4`}>
              <div className="border-b border-zinc-850 pb-2.5">
                <span className="text-[9px] font-mono uppercase bg-amber-950/50 text-amber-500 py-0.5 px-2 border border-amber-900 font-bold tracking-wider select-none">
                  Tempat Edit Data Siswa Aktif
                </span>
                <div className="mt-2 text-xs text-zinc-300">
                  <span>Sedang Mengedit Identitas & Nilai Siswa: </span>
                  <span className="font-extrabold text-white bg-zinc-900 border border-zinc-800 px-2 py-0.5 ml-1 rounded font-mono select-all">{student.name}</span>
                </div>
                <p className={`${subtitleClass} mt-2`}>
                  💡 Isi formulir identitas di bawah ini untuk mengubah data kesiswaan yang tercetak di kertas rapor. Nilai pelajaran siswa ini dapat diatur melalui tab <strong className="text-sky-450 hover:underline cursor-pointer" onClick={() => setActiveTab('grades')}>"Nilai Pelajaran"</strong> dan projek melalui tab <strong className="text-amber-500 hover:underline cursor-pointer" onClick={() => setActiveTab('p5')}>"Projek P5"</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4">
                  <h4 className={subHeaderClass}>Identitas Utama</h4>
                  
                  <div className="space-y-1.5">
                    <label className={labelClass}>Nama Lengkap Siswa</label>
                    <input
                      type="text"
                      value={student.name}
                      onChange={(e) => handleStudentChange('name', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className={labelClass}>NIS (Nomor Induk)</label>
                      <input
                        type="text"
                        value={student.nis}
                        onChange={(e) => handleStudentChange('nis', e.target.value)}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>NISN Nasional</label>
                      <input
                        type="text"
                        value={student.nisn}
                        onChange={(e) => handleStudentChange('nisn', e.target.value)}
                        className={`${inputClass} font-mono`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Tempat Lahir</label>
                      <input
                        type="text"
                        value={student.birthPlace}
                        onChange={(e) => handleStudentChange('birthPlace', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Tanggal Lahir</label>
                      <input
                        type="text"
                        value={student.birthDate}
                        onChange={(e) => handleStudentChange('birthDate', e.target.value)}
                        className={inputClass}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                    <div className="space-y-1.5">
                      <label className={labelClass}>Kelas</label>
                      <input
                        type="text"
                        value={student.studentClass}
                        onChange={(e) => handleStudentChange('studentClass', e.target.value)}
                        className={`${inputClass} font-bold text-center`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Semester</label>
                      <input
                        type="text"
                        value={student.semester}
                        onChange={(e) => handleStudentChange('semester', e.target.value)}
                        className={`${inputClass} text-center`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>Tahun Pelajaran</label>
                      <input
                        type="text"
                        value={student.academicYear}
                        onChange={(e) => handleStudentChange('academicYear', e.target.value)}
                        className={`${inputClass} font-mono text-center`}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className={subHeaderClass}>Data Orang Tua / Wali</h4>
                  
                  <div className="space-y-1.5">
                    <label className={labelClass}>Nama Ayah Kandung</label>
                    <input
                      type="text"
                      value={student.fatherName}
                      onChange={(e) => handleStudentChange('fatherName', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Nama Ibu Kandung</label>
                    <input
                      type="text"
                      value={student.motherName}
                      onChange={(e) => handleStudentChange('motherName', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Pekerjaan Orang Tua</label>
                    <input
                      type="text"
                      value={student.parentOccupation}
                      onChange={(e) => handleStudentChange('parentOccupation', e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className={`space-y-1.5 p-3 rounded-xl border ${isDark ? 'bg-zinc-950/20 border-zinc-800' : 'bg-zinc-100/50 border-zinc-200'}`}>
                    <h5 className="text-[10px] font-bold text-sky-550 uppercase font-mono tracking-wider mb-1">💡 Tips Guru:</h5>
                    <p className={`text-[10px] leading-relaxed ${isDark ? 'text-zinc-350' : 'text-zinc-650 font-medium'}`}>
                      Pastikan penulisan NISN berjumlah 10 digit angka dan ditulis secara benar agar data tersinkronisasi sempurna pada sistem EMIS/Dapodik sekolah.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button for Data Siswa */}
            {renderSaveButton("Data Siswa", "Simpan Data Siswa")}
          </div>
        )}

        {/* Tab 3: School Profile & Signatures Credentials */}
        {activeTab === 'school' && (
          <div className="space-y-4">
            <div className={sectionHeaderBorderClass}>
              <div>
                <h3 className={sectionTitleClass}>Informasi Sekolah & Otoritas Tanda Tangan</h3>
                <p className={subtitleClass}>Ubah profil administrasi sekolah, tanda tangan kepala sekolah, dan keputusan kenaikan.</p>
              </div>
            </div>

            {isReadOnly && (
              <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/30 text-red-400 p-3.5 rounded-lg text-xs font-semibold leading-relaxed font-sans">
                <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-400" />
                <div>
                  <span className="font-extrabold uppercase text-[10px] tracking-wider block mb-0.5">Akses Terbatas: Perlu Hak Akses Administrator</span>
                  Profil sekolah, logo, stempel kantor, keputusan kenaikan se-sekolah, dan NIP kepala sekolah bersifat administratif. Opsi ini terkunci untuk Guru/Pengguna Biasa. Silakan masuk sebagai Admin di bagian kanan atas jika Anda perlu memperbarui informasi ini.
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <h4 className={subHeaderClass}>Profil Sekolah</h4>
                
                <div className="space-y-1.5">
                  <label className={labelClass}>Nama Sekolah</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={data.school.schoolName}
                    onChange={(e) => handleSchoolChange('schoolName', e.target.value)}
                    className={`${inputClass} font-bold disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>NPSN Nasional</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={data.school.npsn}
                      onChange={(e) => handleSchoolChange('npsn', e.target.value)}
                      className={`${inputClass} font-mono disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Status Akreditasi</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      placeholder="Contoh: A"
                      value={data.school.accreditation || ''}
                      onChange={(e) => handleSchoolChange('accreditation', e.target.value)}
                      className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Status Sekolah</label>
                    <select
                      disabled={isReadOnly}
                      value={data.school.schoolStatus || 'Negeri'}
                      onChange={(e) => handleSchoolChange('schoolStatus', e.target.value)}
                      className={`${selectClass} w-full disabled:opacity-65 disabled:cursor-not-allowed`}
                    >
                      <option value="Negeri">Negeri</option>
                      <option value="Swasta">Swasta</option>
                      <option value="Yayasan">Yayasan</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Logo Stempel</label>
                    <select
                      disabled={isReadOnly}
                      value={data.school.logoType || 'standard'}
                      onChange={(e) => handleSchoolChange('logoType', e.target.value)}
                      className={`${selectClass} w-full disabled:opacity-65 disabled:cursor-not-allowed`}
                    >
                      <option value="standard">Circular Seal (Tut Wuri Style)</option>
                      <option value="modern">Modern Shield Emblem</option>
                      <option value="custom">Minimalist Star Badge</option>
                    </select>
                  </div>
                </div>

                {/* Custom School & Pemda Logo Upload Block */}
                <div className={`space-y-3 p-3 rounded-xl border ${isDark ? 'bg-zinc-950/20 border-zinc-800' : 'bg-zinc-100/30 border-zinc-200'} ${isReadOnly ? 'opacity-70' : ''}`}>
                  <h5 className="text-[10px] font-bold text-sky-650 dark:text-sky-400 uppercase font-mono tracking-wider">
                    🖼️ Upload Logo Kustom Sekolah & Pemda
                  </h5>
                  <p className={`text-[9.5px] leading-tight ${isDark ? 'text-zinc-400' : 'text-zinc-650 font-medium'}`}>
                    Unggah logo Pemda setempat (kiri) & logo sekolah Anda (kanan). Jika diunggah, logo kustom ini otomatis diprioritaskan pada cetak rapor.
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1.5">
                    <div className="space-y-1">
                      <span className={`text-[9.5px] font-semibold block ${isDark ? 'text-zinc-400' : 'text-zinc-700'}`}>1. Logo Pemda (Sisi Kiri)</span>
                      
                      <div className="flex flex-col gap-1.5">
                        {data.school.pemdaLogoUrl ? (
                          <div className={`flex items-center gap-2 p-1.5 rounded border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-250 shadow-sm'}`}>
                            <img src={data.school.pemdaLogoUrl} className="w-8 h-8 object-contain rounded border bg-white" alt="Pemda logo thumb" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <span className={`text-[8.5px] block font-mono truncate ${isDark ? 'text-zinc-400' : 'text-zinc-650'}`}>Logo Berhasil Diunggah</span>
                            </div>
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => handleSchoolChange('pemdaLogoUrl', undefined)}
                              className="text-[9.5px] text-red-505 hover:text-red-600 font-bold px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/20 disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        ) : (
                          <label className={`flex items-center justify-center h-10 border border-dashed rounded text-[9.5px] font-semibold transition ${isDark ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-400' : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-600 shadow-sm'} ${isReadOnly ? 'pointer-events-none opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <input
                              type="file"
                              disabled={isReadOnly}
                              accept="image/*"
                              onChange={(e) => handleLogoUpload(e, 'pemdaLogoUrl')}
                              className="hidden"
                            />
                            <span>📁 Pilih Logo Pemda</span>
                          </label>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className={`text-[9.5px] font-semibold block ${isDark ? 'text-zinc-400' : 'text-zinc-700'}`}>2. Logo Sekolah (Sisi Kanan)</span>
                      
                      <div className="flex flex-col gap-1.5">
                        {data.school.schoolLogoUrl ? (
                          <div className={`flex items-center gap-2 p-1.5 rounded border ${isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-250 shadow-sm'}`}>
                            <img src={data.school.schoolLogoUrl} className="w-8 h-8 object-contain rounded border bg-white" alt="School logo thumb" referrerPolicy="no-referrer" />
                            <div className="flex-1 min-w-0">
                              <span className={`text-[8.5px] block font-mono truncate ${isDark ? 'text-zinc-400' : 'text-zinc-650'}`}>Logo Berhasil Diunggah</span>
                            </div>
                            <button
                              type="button"
                              disabled={isReadOnly}
                              onClick={() => handleSchoolChange('schoolLogoUrl', undefined)}
                              className="text-[9.5px] text-red-505 hover:text-red-600 font-bold px-1.5 py-0.5 rounded border border-red-200 dark:border-red-900 bg-red-55 dark:bg-red-950/20 disabled:pointer-events-none disabled:opacity-30 cursor-pointer"
                            >
                              Hapus
                            </button>
                          </div>
                        ) : (
                          <label className={`flex items-center justify-center h-10 border border-dashed rounded text-[9.5px] font-semibold transition ${isDark ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-850 text-zinc-400' : 'border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-600 shadow-sm'} ${isReadOnly ? 'pointer-events-none opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
                            <input
                              type="file"
                              disabled={isReadOnly}
                              accept="image/*"
                              onChange={(e) => handleLogoUpload(e, 'schoolLogoUrl')}
                              className="hidden"
                            />
                            <span>📁 Pilih Logo Sekolah</span>
                          </label>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Alamat Kantor Lengkap</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={data.school.address}
                    onChange={(e) => handleSchoolChange('address', e.target.value)}
                    className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Telepon / Fax</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={data.school.phone}
                      onChange={(e) => handleSchoolChange('phone', e.target.value)}
                      className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Email Kantor</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={data.school.email}
                      onChange={(e) => handleSchoolChange('email', e.target.value)}
                      className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className={subHeaderClass}>Tanda Tangan & NIP</h4>
                
                <div className="space-y-1.5">
                  <label className={labelClass}>Lokasi & Tanggal Pembagian (e.g. Sentani, 19 Juni 2026)</label>
                  <input
                    type="text"
                    disabled={isReadOnly}
                    value={signatures.locationAndDate}
                    onChange={(e) => handleSignatureChange('locationAndDate', e.target.value)}
                    className={`${inputClass} disabled:opacity-60 disabled:cursor-not-allowed`}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Nama Wali Kelas</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={signatures.classTeacherName}
                      onChange={(e) => handleSignatureChange('classTeacherName', e.target.value)}
                      className={`${inputClass} font-semibold disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>NIP Wali Kelas</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={signatures.classTeacherNip}
                      onChange={(e) => handleSignatureChange('classTeacherNip', e.target.value)}
                      className={`${inputClass} font-mono disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Nama Kepala Sekolah</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={signatures.principalName}
                      onChange={(e) => handleSignatureChange('principalName', e.target.value)}
                      className={`${inputClass} font-semibold disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>NIP Kepala Sekolah</label>
                    <input
                      type="text"
                      disabled={isReadOnly}
                      value={signatures.principalNip}
                      onChange={(e) => handleSignatureChange('principalNip', e.target.value)}
                      className={`${inputClass} font-mono disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="space-y-1.5">
                    <label className={labelClass}>Target Kenaikan Minimum (KKTP)</label>
                    <input
                      type="number"
                      disabled={isReadOnly}
                      value={data.kktp}
                      onChange={(e) => {
                        const val = parseInt(e.target.value) || 0;
                        handleKktpAndCalculations(val, data.kktpLimitB, data.kktpLimitA);
                      }}
                      className={`${inputClass} text-center font-bold text-sky-600 disabled:opacity-60 disabled:cursor-not-allowed`}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>Keputusan Kenaikan (Ditentukan Otomatis)</label>
                    {(() => {
                      const calc = calculatePromotionDecision(
                        data.grades,
                        data.student.studentClass,
                        data.school.schoolName || 'SMP NEGERI 7 SENTANI'
                      );
                      const isPromoted = calc.isPromoted;

                      return (
                        <div className="space-y-1">
                          <div className={`p-1.5 rounded border text-[11px] font-bold text-center flex flex-col justify-center ${
                            isPromoted
                              ? 'bg-emerald-950/20 text-emerald-405 border-emerald-900/60'
                              : 'bg-rose-950/20 text-rose-405 border-rose-900/60'
                          }`}>
                            <span className="uppercase tracking-wider block text-[8px] opacity-60 font-mono mb-0.5">
                              Status Keputusan {calc.dGradesCount > 0 ? `(Predikat D: ${calc.dGradesCount})` : ''}
                            </span>
                            <span className="text-[10px] font-black uppercase text-white">
                              {calc.decision}
                            </span>
                          </div>
                          <p className="text-[9.5px] leading-snug text-zinc-400 mt-1">
                            {isPromoted ? (
                              <span className="text-emerald-500 font-semibold">✓ Siswa Naik Kelas/Lulus karena memiliki &lt; 4 mata pelajaran dengan Predikat D.</span>
                            ) : (
                              <span className="text-rose-400 font-extrabold block bg-rose-950/40 p-1 border border-rose-900/30 rounded mt-0.5">
                                🚨 TINGGAL KELAS: Memiliki {calc.dGradesCount} mata pelajaran berpredikat D (melebihi batas maksimal 3).
                              </span>
                            )}
                          </p>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Visual block for dynamic grading range configuration */}
                <div className={`p-4 rounded-xl border mt-3 ${isDark ? 'bg-zinc-950/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono tracking-wider font-extrabold text-sky-500 uppercase">
                      🛠️ Batas Rentang Predikat Nilai (A/B/C/D)
                    </span>
                    <button
                      type="button"
                      disabled={isReadOnly}
                      onClick={() => {
                        // Reset to automated interval bounds
                        handleKktpAndCalculations(data.kktp, undefined, undefined);
                      }}
                      className="text-[9px] font-bold text-rose-500 hover:text-rose-400 hover:underline transition cursor-pointer select-none bg-none border-none p-0 disabled:opacity-40"
                    >
                      Reset Batas Otomatis
                    </button>
                  </div>
                  
                  <p className={`text-[10px] leading-relaxed ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Kurikulum Merdeka membagi selisih nilai kelulusan (<strong className="font-mono">100 - {data.kktp} = {100 - data.kktp}</strong>) menjadi 3 rentang kompetensi lulus (C, B, A). Silakan sesuaikan batas di bawah untuk kustomisasi predikat khusus.
                  </p>

                  <div className="grid grid-cols-3 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wide">Batas Min C (KKTP)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={isReadOnly}
                        value={data.kktp}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          handleKktpAndCalculations(val, data.kktpLimitB, data.kktpLimitA);
                        }}
                        className={`w-full h-8 px-2 text-center text-xs font-mono font-bold rounded border transition-all duration-200 ${
                          (data.kktp < 0 || data.kktp > 100)
                            ? 'bg-rose-950/20 border-rose-600 text-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
                            : isDark ? 'bg-zinc-900 border-zinc-850 text-amber-500' : 'bg-white border-zinc-300 text-amber-605 font-extrabold'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wide">Batas Min B</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={isReadOnly}
                        value={data.kktpLimitB !== undefined ? data.kktpLimitB : autoLimitB}
                        placeholder={autoLimitB.toString()}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          handleKktpAndCalculations(data.kktp, val, data.kktpLimitA);
                        }}
                        className={`w-full h-8 px-2 text-center text-xs font-mono font-bold rounded border transition-all duration-200 ${
                          ((data.kktpLimitB !== undefined ? data.kktpLimitB : autoLimitB) < 0 || (data.kktpLimitB !== undefined ? data.kktpLimitB : autoLimitB) > 100)
                            ? 'bg-rose-950/20 border-rose-600 text-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
                            : isDark ? 'bg-zinc-900 border-zinc-850 text-blue-400' : 'bg-white border-zinc-300 text-blue-700 font-extrabold'
                        }`}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-zinc-500 font-bold uppercase block tracking-wide">Batas Min A</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        disabled={isReadOnly}
                        value={data.kktpLimitA !== undefined ? data.kktpLimitA : autoLimitA}
                        placeholder={autoLimitA.toString()}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 0;
                          handleKktpAndCalculations(data.kktp, data.kktpLimitB, val);
                        }}
                        className={`w-full h-8 px-2 text-center text-xs font-mono font-bold rounded border transition-all duration-200 ${
                          ((data.kktpLimitA !== undefined ? data.kktpLimitA : autoLimitA) < 0 || (data.kktpLimitA !== undefined ? data.kktpLimitA : autoLimitA) > 100)
                            ? 'bg-rose-950/20 border-rose-600 text-rose-500 focus:border-rose-500 focus:ring-rose-500/30'
                            : isDark ? 'bg-zinc-900 border-zinc-850 text-emerald-400' : 'bg-white border-zinc-300 text-emerald-700 font-extrabold'
                        }`}
                      />
                    </div>
                  </div>

                  {/* Summary of active ranges */}
                  <div className="grid grid-cols-4 gap-2 text-center pt-2 border-t border-zinc-800/40 font-mono text-[9.5px]">
                    <div className={`p-1.5 rounded flex flex-col items-center ${isDark ? 'bg-rose-950/15 border border-rose-900/30' : 'bg-rose-50 border border-rose-200'}`}>
                      <span className="text-rose-500 font-extrabold uppercase">D (Kurang)</span>
                      <span className={`font-semibold mt-0.5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>{`< ${data.kktp}`}</span>
                    </div>
                    <div className={`p-1.5 rounded flex flex-col items-center ${isDark ? 'bg-amber-950/15 border border-amber-900/30' : 'bg-amber-50 border border-amber-200'}`}>
                      <span className="text-amber-500 font-extrabold uppercase">C (Cukup)</span>
                      <span className={`font-semibold mt-0.5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        {data.kktp} - {(data.kktpLimitB !== undefined ? data.kktpLimitB : autoLimitB) - 1}
                      </span>
                    </div>
                    <div className={`p-1.5 rounded flex flex-col items-center ${isDark ? 'bg-blue-950/15 border border-blue-900/30' : 'bg-blue-50 border border-blue-200'}`}>
                      <span className="text-blue-400 font-extrabold uppercase">B (Baik)</span>
                      <span className={`font-semibold mt-0.5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        {(data.kktpLimitB !== undefined ? data.kktpLimitB : autoLimitB)} - {(data.kktpLimitA !== undefined ? data.kktpLimitA : autoLimitA) - 1}
                      </span>
                    </div>
                    <div className={`p-1.5 rounded flex flex-col items-center ${isDark ? 'bg-emerald-950/15 border border-emerald-900/30' : 'bg-emerald-50 border border-emerald-200'}`}>
                      <span className="text-emerald-400 font-extrabold uppercase">A (Sangat Baik)</span>
                      <span className={`font-semibold mt-0.5 ${isDark ? 'text-zinc-300' : 'text-zinc-600'}`}>
                        {(data.kktpLimitA !== undefined ? data.kktpLimitA : autoLimitA)} - 100
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Save Button for Sekolah & TTD */}
            {renderSaveButton("Sekolah & TTD", "Simpan Profil & TTD")}
          </div>
        )}

        {/* Tab 4: P5 Characters dimensions */}
        {activeTab === 'p5' && (
          <div className="space-y-4">
            <div className={sectionHeaderBorderClass}>
              <div>
                <h3 className={sectionTitleClass}>Penguatan Profil Pelajar Pancasila (P5)</h3>
                <p className={subtitleClass}>Tentukan ketercapaian 3 dimensi utama karakter luhur pancasila.</p>
              </div>
            </div>

            <div className={itemCardClass}>
              <h4 className={subHeaderClass}>Identifikasi Projek</h4>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-3">
                <div className="space-y-1.5">
                  <label className={labelClass}>Tema Projek Besar</label>
                  <input
                    type="text"
                    value={p5.theme}
                    onChange={(e) => handleP5Change('theme', e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className={labelClass}>Durasi Waktu Alokasi (JP)</label>
                  <input
                    type="number"
                    value={p5.durationJp}
                    onChange={(e) => handleP5Change('durationJp', parseInt(e.target.value) || 0)}
                    className={`${inputClass} font-mono`}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className={labelClass}>Judul Gerakan Projek</label>
                <input
                  type="text"
                  value={p5.title}
                  onChange={(e) => handleP5Change('title', e.target.value)}
                  className={`${inputClass} font-semibold`}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className={subHeaderClass}>Pencapaian Dimensi Karakter</h4>

              {p5.dimensionsDetails.map((dim, idx) => (
                <div key={idx} className={itemCardClass}>
                  <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b pb-2 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold font-mono ${isDark ? 'bg-zinc-805 text-zinc-400' : 'bg-zinc-200 text-zinc-600'}`}>{idx + 1}</span>
                      <input
                        type="text"
                        value={dim.dimension}
                        onChange={(e) => {
                          const updatedDetails = [...p5.dimensionsDetails];
                          updatedDetails[idx].dimension = e.target.value;
                          handleP5Change('dimensionsDetails', updatedDetails);
                        }}
                        className={`bg-transparent text-xs font-bold border-b border-dashed focus:outline-none w-64 max-w-full ${isDark ? 'text-zinc-200 border-zinc-700 focus:border-blue-500' : 'text-zinc-800 border-zinc-350 focus:border-blue-700'}`}
                      />
                    </div>

                    <select
                      value={dim.achievement}
                      onChange={(e) => {
                        const updatedDetails = [...p5.dimensionsDetails];
                        updatedDetails[idx].achievement = e.target.value as any;
                        handleP5Change('dimensionsDetails', updatedDetails);
                      }}
                      className={selectClass}
                    >
                      <option value="Belum Berkembang">Belum Berkembang (BB)</option>
                      <option value="Mulai Berkembang">Mulai Berkembang (MB)</option>
                      <option value="Berkembang Sesuai Harapan">Semua Harapan (BSH)</option>
                      <option value="Sangat Berkembang">Sangat Berkembang (SB)</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className={labelClass}>Sasaran / Capaian Target Kompetensi</label>
                    <textarea
                      rows={2}
                      value={dim.target}
                      onChange={(e) => {
                        const updatedDetails = [...p5.dimensionsDetails];
                        updatedDetails[idx].target = e.target.value;
                        handleP5Change('dimensionsDetails', updatedDetails);
                      }}
                      className={`${isDark ? 'w-full text-xs bg-zinc-950 border border-zinc-800 p-2 rounded focus:outline-none focus:border-blue-500 text-zinc-300' : 'w-full text-xs bg-white border border-zinc-300 p-2 rounded focus:outline-none focus:border-blue-700 text-zinc-800 shadow-sm'}`}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* P5 Text narrative */}
            <div className="space-y-1.5">
              <label className={labelClass}>Catatan Kesimpulan / Deskripsi Projek Siswa (P5)</label>
              <textarea
                rows={3}
                value={p5.summary}
                onChange={(e) => handleP5Change('summary', e.target.value)}
                className={`${isDark ? 'w-full text-xs bg-zinc-950 p-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-blue-500 text-zinc-300' : 'w-full text-xs bg-white p-3 rounded-xl border border-zinc-300 focus:outline-none focus:border-blue-700 text-zinc-800 shadow-sm font-medium'}`}
                placeholder="Rangkum perilaku khas siswa selama menjalankan proyek..."
              />
            </div>

            {/* Save Button for Character P5 */}
            {renderSaveButton("Karakter P5", "Simpan Data P5")}
          </div>
        )}

        {/* Tab 5: Extracurricular Activities */}
        {activeTab === 'extra' && (
          <div className="space-y-4">
            <div className={sectionHeaderBorderClass}>
              <div>
                <h3 className={sectionTitleClass}>Kegiatan Ekstrakurikuler Siswa</h3>
                <p className={subtitleClass}>Isi minimal 3 kegiatan ekstrakurikuler (Pramuka, Olahraga, Keagamaan/Seni).</p>
              </div>
              <button
                type="button"
                onClick={handleAddExtracurricular}
                className={`py-1.5 px-3 rounded-lg border text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm cursor-pointer ${
                  isDark
                    ? 'bg-sky-950/40 border-sky-800 hover:bg-sky-900 text-sky-400 hover:border-sky-700'
                    : 'bg-sky-50 border-sky-200 hover:bg-sky-100 text-sky-705 hover:border-sky-300'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Tambah Ekstra</span>
              </button>
            </div>
            
            <div className="space-y-4">
              {data.extracurriculars.map((extra, index) => {
                const isEditing = editingExtraId === extra.id;
                return (
                  <div key={extra.id} className={itemCardClass}>
                    {isEditing ? (
                      /* EDIT MODE CANVAS */
                      <div className="space-y-3.5">
                        <div className="flex items-center justify-between border-b pb-2 border-zinc-200/50 dark:border-zinc-800/40">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-mono font-bold ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'}`}>{index + 1}</span>
                            <span className="text-[10px] uppercase font-mono font-extrabold text-sky-500 tracking-wider">Mode Mengedit</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingExtraId(null)}
                              className="py-1 px-2.5 bg-emerald-950/40 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 font-bold rounded-md transition text-[10.5px] flex items-center gap-1 cursor-pointer"
                              title="Kunci data & simpan perubahan ini"
                            >
                              <Check className="w-3 h-3 text-emerald-450" />
                              <span>Simpan</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteExtracurricular(extra.id)}
                              className="py-1 px-2.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-800 text-rose-400 font-bold rounded-md transition text-[10.5px] flex items-center gap-1 cursor-pointer"
                              title="Hapus kegiatan ekstra ini"
                            >
                              <Trash2 className="w-3 h-3 text-rose-450" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div className="space-y-1">
                            <label className={labelClass}>Nama Kegiatan Ekstrakurikuler:</label>
                            <input
                              type="text"
                              value={extra.name}
                              onChange={(e) => {
                                const updated = data.extracurriculars.map(ex => {
                                  if (ex.id === extra.id) {
                                    return { ...ex, name: e.target.value };
                                  }
                                  return ex;
                                });
                                handleExtracurricularChange(updated);
                              }}
                              className={inputClass}
                              placeholder="Contoh: Pramuka, OSIS, Basket"
                            />
                          </div>

                          <div className="space-y-1 border-b border-transparent">
                            <label className={labelClass}>Predikat:</label>
                            <select
                              value={extra.grade}
                              onChange={(e) => {
                                const updated = data.extracurriculars.map(ex => {
                                  if (ex.id === extra.id) {
                                    return { ...ex, grade: e.target.value as any };
                                  }
                                  return ex;
                                });
                                handleExtracurricularChange(updated);
                              }}
                              className={`${selectClass} w-full`}
                            >
                              <option value="Sangat Baik">Sangat Baik</option>
                              <option value="Baik">Baik</option>
                              <option value="Cukup">Cukup</option>
                              <option value="Kurang">Kurang</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <label className={labelClass}>Keterangan / Deskripsi Kegiatan</label>
                          <textarea
                            rows={2}
                            value={extra.description}
                            onChange={(e) => {
                              const updated = data.extracurriculars.map(ex => {
                                if (ex.id === extra.id) {
                                  return { ...ex, description: e.target.value };
                                }
                                  return ex;
                              });
                              handleExtracurricularChange(updated);
                            }}
                            className={`${isDark ? 'w-full text-xs bg-zinc-950/55 p-2 rounded border border-zinc-800 focus:outline-none focus:border-blue-500 text-zinc-300' : 'w-full text-xs bg-white p-2 border border-zinc-300 focus:outline-none focus:border-blue-700 text-zinc-800 shadow-sm'}`}
                            placeholder="Jelaskan kontribusi, keaktifan, dan pencapaian siswa..."
                          />
                        </div>
                      </div>
                    ) : (
                      /* READ-ONLY VIEW MODE */
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b pb-2 border-zinc-200/50 dark:border-zinc-800/40">
                          <div className="flex items-center gap-2.5">
                            <span className={`w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-mono font-bold ${isDark ? 'bg-zinc-800 text-zinc-400' : 'bg-zinc-200 text-zinc-600'}`}>{index + 1}</span>
                            <span className={`text-[12px] font-bold ${isDark ? 'text-zinc-200' : 'text-zinc-950'}`}>
                              {extra.name || "(Nama belum diisi)"}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingExtraId(extra.id)}
                              className="py-1 px-2.5 bg-sky-950/40 hover:bg-sky-900 border border-sky-850 hover:border-sky-850 text-sky-400 font-bold rounded-md transition text-[10.5px] flex items-center gap-1 cursor-pointer"
                              title="Sunting data ini"
                            >
                              <Edit className="w-3 h-3 text-sky-450" />
                              <span>Edit</span>
                            </button>
                            
                            <button
                              type="button"
                              onClick={() => handleDeleteExtracurricular(extra.id)}
                              className="py-1 px-2.5 bg-rose-950/40 hover:bg-rose-900 border border-rose-850 text-rose-400 font-bold rounded-md transition text-[10.5px] flex items-center gap-1 cursor-pointer"
                              title="Hapus data ini"
                            >
                              <Trash2 className="w-3 h-3 text-rose-450" />
                              <span>Hapus</span>
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 pt-1">
                          <div className="md:col-span-3 flex md:flex-col items-start gap-1 justify-start">
                            <span className="text-[10px] text-zinc-500 font-bold">Predikat:</span>
                            <span className={`px-2 py-0.5 rounded-md font-black text-[9px] uppercase tracking-wide inline-block ${
                              extra.grade === 'Sangat Baik' 
                                ? isDark ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                : extra.grade === 'Baik'
                                  ? isDark ? 'bg-sky-950/80 text-sky-400 border border-sky-900' : 'bg-sky-50 text-sky-800 border border-sky-200'
                                  : extra.grade === 'Cukup'
                                    ? isDark ? 'bg-amber-950/80 text-amber-500 border border-amber-900' : 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : isDark ? 'bg-rose-950/80 text-rose-450 border border-rose-900' : 'bg-rose-50 text-rose-800 border border-rose-200'
                            }`}>
                              {extra.grade}
                            </span>
                          </div>

                          <div className="md:col-span-9">
                            <span className="text-[10px] text-zinc-500 font-bold block mb-1">Keterangan / Deskripsi:</span>
                            <p className={`text-xs leading-relaxed italic border-l-2 pl-2.5 ${isDark ? 'text-zinc-400 border-zinc-800' : 'text-zinc-650 font-medium border-zinc-200'}`}>
                              {extra.description || "(Keterangan kegiatan kosong)"}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {data.extracurriculars.length === 0 && (
                <div className={`text-center p-8 rounded-xl border border-dashed text-xs leading-relaxed ${isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-250 text-zinc-500 font-medium'}`}>
                  Belum ada ekstrakurikuler yang ditambahkan untuk siswa ini. Klik tombol <span className="font-bold text-sky-505">"Tambah Ekstra"</span> di atas untuk menambahkan kegiatan baru.
                </div>
              )}
            </div>

            {/* Save Button for Ekstra */}
            {renderSaveButton("Kegiatan Ekstra", "Simpan Ekstrakurikuler")}
          </div>
        )}

        {/* Tab 6: Attendance & Class Teacher Notes */}
        {activeTab === 'attendance' && (
          <div className="space-y-4">
            <div className={sectionHeaderBorderClass}>
              <div>
                <h3 className={sectionTitleClass}>Rekap Absensi & Catatan Perkembangan</h3>
                <p className={subtitleClass}>Atur jumlah hari ketidakhadiran siswa dan berikan catatan motivasi wali kelas.</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={itemCardClass}>
                <h4 className={subHeaderClass}>Rekapitulasi Absensi</h4>
                
                <div className="space-y-3 pt-2">
                  <div className={`flex items-center justify-between p-2.5 rounded border ${isDark ? 'bg-zinc-950/60 border-zinc-850' : 'bg-zinc-100/50 border-zinc-200'}`}>
                    <span className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>1. Sakit (S)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={data.attendance.sick}
                        onChange={(e) => handleAttendanceChange('sick', parseInt(e.target.value) || 0)}
                        className={`w-14 h-8 text-center text-sm font-bold rounded ${isDark ? 'bg-zinc-950 border border-zinc-800 text-zinc-100' : 'bg-white border border-zinc-300 text-zinc-900 shadow-sm'}`}
                      />
                      <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500 font-semibold'}`}>Hari</span>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between p-2.5 rounded border ${isDark ? 'bg-zinc-950/60 border-zinc-850' : 'bg-zinc-100/50 border-zinc-200'}`}>
                    <span className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>2. Izin (I)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={data.attendance.permit}
                        onChange={(e) => handleAttendanceChange('permit', parseInt(e.target.value) || 0)}
                        className={`w-14 h-8 text-center text-sm font-bold rounded ${isDark ? 'bg-zinc-950 border border-zinc-800 text-zinc-100' : 'bg-white border border-zinc-300 text-zinc-900 shadow-sm'}`}
                      />
                      <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500 font-semibold'}`}>Hari</span>
                    </div>
                  </div>

                  <div className={`flex items-center justify-between p-2.5 rounded border ${isDark ? 'bg-zinc-950/60 border-zinc-850' : 'bg-zinc-100/30 border-zinc-200'}`}>
                    <span className={`text-xs font-semibold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>3. Tanpa Keterangan / Alpha (A)</span>
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        value={data.attendance.alpha}
                        onChange={(e) => handleAttendanceChange('alpha', parseInt(e.target.value) || 0)}
                        className={`w-14 h-8 text-center text-sm font-rose-500 font-bold rounded ${isDark ? 'bg-zinc-950 border border-zinc-805 text-rose-500' : 'bg-white border border-zinc-300 text-rose-600 shadow-sm'}`}
                      />
                      <span className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-500 font-semibold'}`}>Hari</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={itemCardClass}>
                <h4 className={subHeaderClass}>Catatan Wali Kelas</h4>
                
                <div className="space-y-1.5 pt-2">
                  <textarea
                    rows={4}
                    value={data.teacherNotes}
                    onChange={(e) => onChange({ ...data, teacherNotes: e.target.value })}
                    className={`${isDark ? 'w-full text-xs bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-zinc-200 focus:outline-none' : 'w-full text-xs bg-white p-3 border border-zinc-300 rounded-lg text-zinc-800 focus:outline-none shadow-sm font-medium'}`}
                    placeholder="Tuliskan saran konstruktif mengenai bakat, disiplin, perkembangan psikologis, serta rekomendasi bagi murid ini..."
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={labelClass}>Feedback Orang Tua (Contoh / Simulasi)</label>
                  <input
                    type="text"
                    value={data.parentNotesPlaceholder}
                    onChange={(e) => onChange({ ...data, parentNotesPlaceholder: e.target.value })}
                    className={`${isDark ? 'w-full h-8 bg-zinc-950 px-2 rounded border border-zinc-800 text-[10.5px] italic text-zinc-400' : 'w-full h-8 bg-white px-2 border border-zinc-300 rounded text-[10.5px] italic text-zinc-650 font-medium shadow-sm'}`}
                    placeholder="Masukkan teks feedback yang disimulasikan..."
                  />
                </div>
              </div>
            </div>

            {/* Save Button for Attendance & Catatan */}
            {renderSaveButton("Catatan & Absen", "Simpan Catatan & Absen")}
          </div>
        )}
        </div>
      </div>

      {/* Editor Control Footer Toolbar */}
      <div className={`p-4 border-t flex items-center justify-between ${isDark ? 'border-zinc-800 bg-zinc-950/90' : 'border-zinc-250 bg-zinc-100'}`}>
        <button
          onClick={onReset}
          disabled={isReadOnly}
          className={`flex items-center gap-1.5 py-2 px-3.5 rounded-lg text-xs font-semibold tracking-wide transition border active:scale-95 cursor-pointer ${
            isReadOnly ? "opacity-40 cursor-not-allowed pointer-events-none" : ""
          } ${
            isDark 
              ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-400 hover:text-zinc-200 border-zinc-750/50' 
              : 'bg-white hover:bg-zinc-50 text-zinc-655 hover:text-zinc-900 border-zinc-300 shadow-sm'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reset Semua</span>
        </button>

        <div className={`flex items-center gap-2 text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-500 font-bold'}`}>
          <span>Format Kurikulum Merdeka v2.0 • SMP Negeri 7 Sentani/MTs</span>
        </div>
      </div>
    </div>
  );
}
