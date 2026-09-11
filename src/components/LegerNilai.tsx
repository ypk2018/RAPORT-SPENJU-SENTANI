/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { RaporData, calculatePromotionDecision } from '../types';
import { defaultSubjectTemplates } from '../initialData';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { 
  Award, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  AlertTriangle, 
  CheckCircle, 
  HelpCircle, 
  ChevronUp, 
  ChevronDown, 
  Users,
  Percent,
  BookOpen,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';

interface LegerNilaiProps {
  studentList: { key: string; name: string; nis: string }[];
  getStudentRaporData: (key: string) => RaporData;
  activeStudentKey: string;
  onSelectStudent: (key: string) => void;
  paperSize: 'A4' | 'F4';
  schoolName: string;
}

export default function LegerNilai({ 
  studentList, 
  getStudentRaporData, 
  activeStudentKey,
  onSelectStudent,
  paperSize,
  schoolName
}: LegerNilaiProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [classFilter, setClassFilter] = useState('Semua');
  const [sortField, setSortField] = useState<'name' | 'scoreSum' | 'average' | 'rank' | 'nis'>('rank');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  const [legerTheme, setLegerTheme] = useState<'gelap' | 'terang'>('gelap');
  const isDark = legerTheme === 'gelap';

  const tBgOuter = isDark ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border border-zinc-200 text-zinc-900 shadow-sm";
  const tTitle = isDark ? "text-white" : "text-zinc-900";
  const tDesc = isDark ? "text-zinc-400" : "text-zinc-500";
  const tBorderBottom = isDark ? "border-zinc-800" : "border-zinc-200";
  
  // Controls & Inputs
  const tFilterBg = isDark ? "bg-zinc-950 border-zinc-800" : "bg-zinc-100 border-zinc-200";
  const tFilterText = isDark ? "text-zinc-100" : "text-zinc-850 font-bold";
  const tFilterLabel = isDark ? "text-zinc-500" : "text-zinc-500";
  const tSelect = isDark ? "bg-zinc-900 text-zinc-100 border-zinc-750" : "bg-white text-zinc-800 border-zinc-300";
  const tInput = isDark ? "bg-zinc-900 text-zinc-100 border-zinc-800" : "bg-white text-zinc-800 border-zinc-300";
  
  // Stat cards
  const tCardBg = isDark ? "bg-zinc-950 border border-zinc-800/80" : "bg-zinc-50 border border-zinc-200 shadow-xs";
  const tCardLabel = isDark ? "text-zinc-500" : "text-zinc-500 font-extrabold";
  const tCardVal = isDark ? "text-white" : "text-zinc-900 font-black";
  const tCardUnit = isDark ? "text-zinc-400" : "text-zinc-550";
  const tCardIconWrap = isDark ? "bg-zinc-900 border border-zinc-800" : "bg-white border border-zinc-200 shadow-2xs";
  
  // Main Table Area
  const tTableContainer = isDark ? "border-zinc-800" : "border-zinc-300";
  const tTableText = isDark ? "text-zinc-100" : "text-zinc-850";
  const tTrHead1 = isDark ? "bg-zinc-950 border-b border-zinc-800 text-zinc-400" : "bg-zinc-150 border-b border-zinc-300 text-zinc-650";
  const tTrHead2 = isDark ? "bg-zinc-950/80 border-b border-zinc-800 text-zinc-100" : "bg-zinc-50 border-b border-zinc-300 text-zinc-850";
  const tThBorder = isDark ? "border-r border-zinc-800" : "border-r border-zinc-250";
  
  // Rows
  const tTrHover = isDark ? "hover:bg-zinc-850/50" : "hover:bg-zinc-50/80";
  const tRowBgActive = isDark ? "bg-sky-950/25 border-l-2 border-l-sky-500" : "bg-sky-50/70 border-l-2 border-l-sky-500";
  const tTdText = isDark ? "text-zinc-300" : "text-zinc-800";
  const tTdTextMuted = isDark ? "text-zinc-500" : "text-zinc-500";
  const tTdSubtext = isDark ? "text-zinc-550" : "text-zinc-500";
  const tTdBorder = isDark ? "border-r border-zinc-850" : "border-r border-zinc-250";
  const tTdBorderBot = isDark ? "border-b border-zinc-805" : "border-b border-zinc-200";
  
  // Highlights
  const tScoreSumBg = isDark ? "bg-zinc-950/40 text-amber-400" : "bg-amber-50/80 text-amber-700 font-extrabold border-r border-zinc-205";
  const tAverageBg = isDark ? "bg-sky-950/10 text-sky-400" : "bg-sky-50/80 text-sky-700 font-extrabold border-r border-zinc-205";
  const tRankBg = isDark ? "bg-emerald-950/10 text-emerald-450" : "bg-emerald-50/80 text-emerald-700 font-extrabold border-r border-zinc-205";

  // 1. Fetch and compile complete rapor data for each student
  const compiledData = useMemo(() => {
    return studentList.map(student => {
      const sData = getStudentRaporData(student.key);
      const grades = sData.grades || [];
      const scoreSum = grades.reduce((acc, curr) => acc + (curr.score || 0), 0);
      const average = grades.length > 0 ? Number((scoreSum / grades.length).toFixed(1)) : 0;
      
      // Determine if there are failed subjects (under KKTP)
      const kktpLimit = sData.kktp || 70;
      const failedSubjectsCount = grades.filter(g => g.score < kktpLimit).length;

      const studentClass = sData.student?.studentClass || 'VIII-A';
      const calc = calculatePromotionDecision(grades, studentClass, schoolName);

      return {
        key: student.key,
        name: sData.student?.name || student.name,
        nis: sData.student?.nis || student.nis || '-',
        nisn: sData.student?.nisn || '-',
        studentClass,
        academicYear: sData.student?.academicYear || '2025/2026',
        semester: sData.student?.semester || '2 (Dua)',
        grades,
        scoreSum,
        average,
        promotion: calc.decision,
        kktp: kktpLimit,
        failedSubjectsCount,
        teacherNotes: sData.teacherNotes || '',
        signatures: sData.signatures || {}
      };
    });
  }, [studentList, getStudentRaporData, schoolName]);

  // 2. Compute live rankings based on total score (scoreSum) descending.
  // Students with the same scoreSum receive the same rank (dense ranking).
  const rankedData = useMemo(() => {
    const sorted = [...compiledData].sort((a, b) => b.scoreSum - a.scoreSum);
    return compiledData.map(item => {
      const rankIndex = sorted.findIndex(s => s.scoreSum === item.scoreSum);
      return {
        ...item,
        rank: rankIndex + 1
      };
    });
  }, [compiledData]);

  // 3. Extract distinct classes for the Class Filter
  const distinctClasses = useMemo(() => {
    const classes = new Set<string>();
    rankedData.forEach(item => {
      if (item.studentClass) {
        classes.add(item.studentClass);
      }
    });
    return Array.from(classes).sort();
  }, [rankedData]);

  // 4. Identify all unique subjects across all students safely
  const availableSubjects = useMemo(() => {
    const subjectMap = new Map<string, string>(); // code -> name
    rankedData.forEach(student => {
      student.grades.forEach(g => {
        if (g.code && g.name) {
          subjectMap.set(g.code, g.name);
        }
      });
    });

    if (subjectMap.size === 0) {
      // Fallback if no subjects loaded yet
      defaultSubjectTemplates.forEach(t => {
        subjectMap.set(t.code, t.name);
      });
    }

    // Convert map to sorted/structured array
    return Array.from(subjectMap.entries()).map(([code, name]) => ({ code, name }));
  }, [rankedData]);

  // 5. Calculate global statistics for the top dashboard cards
  const stats = useMemo(() => {
    const activeData = classFilter === 'Semua' 
      ? rankedData 
      : rankedData.filter(item => item.studentClass === classFilter);

    const total = activeData.length;
    if (total === 0) {
      return { total: 0, averageClass: 0, tuntas: 0, bimbingan: 0, topPerformer: '-', naikKelas: 0, tinggalKelas: 0 };
    }

    const sumAverages = activeData.reduce((acc, curr) => acc + curr.average, 0);
    const averageClass = Number((sumAverages / total).toFixed(1));

    // A student is "tuntas" if they have 0 subjects below their set KKTP
    const tuntas = activeData.filter(item => item.failedSubjectsCount === 0).length;
    const bimbingan = total - tuntas;

    // A student is promoted if they don't have 4 or more 'D' predicates
    const naikKelas = activeData.filter(item => {
      const isPromo = item.promotion.toLowerCase().includes('naik') || item.promotion.toLowerCase().includes('lulus');
      return isPromo;
    }).length;

    const tinggalKelas = total - naikKelas;

    // Find top student(s) by scoreSum
    let topStudent = activeData[0];
    activeData.forEach(student => {
      if (student.scoreSum > (topStudent?.scoreSum || 0)) {
        topStudent = student;
      }
    });

    return {
      total,
      averageClass,
      tuntas,
      bimbingan,
      topPerformer: topStudent ? `${topStudent.name} (${topStudent.scoreSum} Poin)` : '-',
      naikKelas,
      tinggalKelas
    };
  }, [rankedData, classFilter]);

  // 6. Filter & sort rows dynamically
  const filteredAndSortedRows = useMemo(() => {
    let result = rankedData.filter(student => {
      // Search Box Filter
      const term = searchQuery.toLowerCase();
      const matchesSearch = student.name.toLowerCase().includes(term) || student.nis.includes(term) || student.nisn.includes(term);
      
      // Class Filter
      const matchesClass = classFilter === 'Semua' || student.studentClass === classFilter;
      
      return matchesSearch && matchesClass;
    });

    // Custom Column Sorting
    result.sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Handle strings
      if (typeof valA === 'string') {
        const strA = valA.toLowerCase();
        const strB = valB.toLowerCase();
        return sortAsc ? strA.localeCompare(strB) : strB.localeCompare(strA);
      }

      // Handle numbers
      if (sortAsc) {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });

    return result;
  }, [rankedData, searchQuery, classFilter, sortField, sortAsc]);

  // 7. Toggle sorting handler
  const handleSort = (field: 'name' | 'scoreSum' | 'average' | 'rank' | 'nis') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(field === 'rank' || field === 'name' ? true : false); // rank maps to lowest first, score/averages maps to highest first
    }
  };

  // 8. CSV download handler specifically for this ledger representation
  const downloadLegerCsv = () => {
    try {
      const activeClassLabel = classFilter === 'Semua' ? 'SEMUA_KELAS' : classFilter.replace(/\s+/g, '_');
      const csvHeaders = [
        'No',
        'Nama Siswa',
        'NIS',
        'NISN',
        'Kelas',
        ...availableSubjects.map(sub => `Nilai - ${sub.code}`),
        'Jumlah Nilai',
        'Rata-rata',
        'Peringkat (Leger)',
        'Keterangan (Kenaikan/Kelulusan)'
      ];

      const csvRows = [csvHeaders];

      filteredAndSortedRows.forEach((row, idx) => {
        const studentGradesMap = row.grades.reduce((acc, curr) => {
          acc[curr.code] = curr.score;
          return acc;
        }, {} as Record<string, number>);

        const studentRow = [
          (idx + 1).toString(),
          row.name,
          row.nis,
          row.nisn,
          row.studentClass,
          ...availableSubjects.map(sub => studentGradesMap[sub.code]?.toString() || '0'),
          row.scoreSum.toString(),
          row.average.toString(),
          row.rank.toString(),
          row.promotion
        ];

        // Format CSV fields cleanly
        const escaped = studentRow.map(val => {
          const formatted = val.replace(/"/g, '""');
          return formatted.includes(',') || formatted.includes('"') || formatted.includes('\n') 
            ? `"${formatted}"` 
            : formatted;
        });

        csvRows.push(escaped);
      });

      const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + csvRows.map(e => e.join(",")).join("\n");
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", encodeURI(csvContent));
      downloadAnchor.setAttribute("download", `LEGER_NILAI_${activeClassLabel}_${schoolName.replace(/\s+/g, '_')}.csv`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Csv ledger build failed", e);
      alert("Gagal mengunduh file CSV.");
    }
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  // 9. High-Fidelity PDF download of the landscape leger evaluation table
  const handleDownloadLegerPdf = async () => {
    if (filteredAndSortedRows.length === 0) return;
    setIsGeneratingPdf(true);
    
    try {
      const container = document.getElementById('leger-nilai-print-container');
      if (!container) {
        alert("Sistem gagal mendeteksi kerangka render Leger.");
        setIsGeneratingPdf(false);
        return;
      }

      const isA4 = paperSize === 'A4';
      const pdfWidth = isA4 ? 297 : 330;
      const pdfHeight = isA4 ? 210 : 215;

      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: isA4 ? 'a4' : [215, 330]
      });

      const canvas = await html2canvas(container, {
        scale: 2.2, // Premium sharp quality resolution
        useCORS: true,
        allowTaint: false,
        logging: false,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          const bodyEl = clonedDoc.body;
          if (bodyEl) {
            bodyEl.style.backgroundColor = '#ffffff';
            bodyEl.style.color = '#000000';
          }

          const clonedContainer = clonedDoc.getElementById('leger-nilai-print-container');
          if (clonedContainer) {
            clonedContainer.style.backgroundColor = '#ffffff';
            clonedContainer.style.color = '#000000';
            clonedContainer.style.padding = '12mm 15mm';
            clonedContainer.style.maxWidth = 'none';
            clonedContainer.style.width = '1450px';
            clonedContainer.style.overflow = 'visible';
            clonedContainer.className = 'text-black font-sans bg-white p-6 border-none';

            // Force visibility of print block elements
            const printOnlys = clonedContainer.querySelectorAll('.print\\:block, .hidden.print\\:block');
            printOnlys.forEach((el: any) => {
              el.style.setProperty('display', 'block', 'important');
            });

            // Hide screen-only items
            const screenHiddens = clonedContainer.querySelectorAll('.no-print');
            screenHiddens.forEach((el: any) => {
              el.style.setProperty('display', 'none', 'important');
            });

            // Convert background colors and textures for readable high-contrast print styles
            const allElements = clonedContainer.querySelectorAll('*');
            allElements.forEach((el: any) => {
              const classes = el.className || '';
              if (classes.includes('text-zinc-') || classes.includes('text-rose-') || classes.includes('text-amber-') || classes.includes('text-emerald-')) {
                el.style.color = '#111827';
              } else {
                el.style.color = '#000000';
              }

              if (classes.includes('bg-') || classes.includes('bg-zinc-')) {
                el.style.backgroundColor = '#ffffff';
              }
              if (classes.includes('bg-zinc-950') || classes.includes('bg-zinc-900')) {
                el.style.backgroundColor = '#f3f4f6';
              }
              if (classes.includes('bg-amber-950') || classes.includes('bg-amber-900')) {
                el.style.backgroundColor = '#fef3c7';
              }
              if (classes.includes('bg-emerald-950') || classes.includes('bg-emerald-900')) {
                el.style.backgroundColor = '#d1fae5';
              }
              if (classes.includes('bg-rose-950') || classes.includes('bg-rose-900')) {
                el.style.backgroundColor = '#fee2e2';
              }

              el.style.borderColor = '#9ca3af';
            });
          }
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      
      const imgWidthMm = pdfWidth - 24; // 12mm left/right padding
      const imgHeightMm = (canvas.height * imgWidthMm) / canvas.width;
      const xMargin = 12;
      const yMargin = 12;

      let heightLeftMm = imgHeightMm;

      if (heightLeftMm <= (pdfHeight - yMargin * 2)) {
        pdf.addImage(imgData, 'JPEG', xMargin, yMargin, imgWidthMm, imgHeightMm);
      } else {
        const pageCanvasHeight = (canvas.width * (pdfHeight - yMargin * 2)) / imgWidthMm;
        let sourceY = 0;
        let isFirst = true;

        while (sourceY < canvas.height) {
          if (!isFirst) {
            pdf.addPage();
          }
          isFirst = false;

          const sliceCanvas = document.createElement('canvas');
          sliceCanvas.width = canvas.width;
          sliceCanvas.height = Math.min(pageCanvasHeight, canvas.height - sourceY);

          const sliceCtx = sliceCanvas.getContext('2d');
          if (sliceCtx) {
            sliceCtx.drawImage(
              canvas,
              0, sourceY, canvas.width, sliceCanvas.height,
              0, 0, canvas.width, sliceCanvas.height
            );
          }

          const sliceImgData = sliceCanvas.toDataURL('image/jpeg', 0.95);
          const sliceHeightMm = (sliceCanvas.height * imgWidthMm) / canvas.width;
          pdf.addImage(sliceImgData, 'JPEG', xMargin, yMargin, imgWidthMm, sliceHeightMm);

          sourceY += pageCanvasHeight;
        }
      }

      const activeClassLabel = classFilter === 'Semua' ? 'SEMUA_KELAS' : classFilter.replace(/\s+/g, '_');
      pdf.save(`LEGER_NILAI_${activeClassLabel}_${schoolName.replace(/\s+/g, '_')}.pdf`);
    } catch (err) {
      console.error("Gagal cetak leger ke PDF", err);
      alert("Terjadi kesalahan saat mengekspor PDF.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // 10. Simple Print trigger
  const handlePrint = () => {
    window.print();
  };

  // Extract metadata from the first student in filtered rows for ledger headers
  const ledgerMetadata = useMemo(() => {
    if (filteredAndSortedRows.length > 0) {
      return {
        class: classFilter === 'Semua' ? distinctClasses.join(', ') : classFilter,
        academicYear: filteredAndSortedRows[0].academicYear,
        semester: filteredAndSortedRows[0].semester,
        signatures: filteredAndSortedRows[0].signatures
      };
    }
    return {
      class: classFilter,
      academicYear: '2025/2026',
      semester: '2 (Dua)',
      signatures: {} as any
    };
  }, [filteredAndSortedRows, classFilter, distinctClasses]);

  return (
    <div className={`${tBgOuter} p-4 rounded-none space-y-6 transition-colors duration-200`}>
      
      {/* Upper Control Bar - Suppressed on print */}
      <div className={`no-print flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b ${tBorderBottom} pb-4`}>
        <div>
          <h2 className="text-sm md:text-base font-extrabold uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-500" />
            <span className={tTitle}>LEGER NILAI (Dashboard Rapat Evaluasi)</span>
          </h2>
          <p className={`text-[10.5px] ${tDesc} mt-1`}>
            Menganalisis hasil belajar, total nilai, rata-rata, peringkat, dan status kenaikan kelas seluruh siswa.
          </p>
        </div>
 
        {/* Toolbar items */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Latar Menu Theme Toggle */}
          <div className={`flex items-center p-1 border rounded-sm text-xs gap-1 ${tFilterBg}`}>
            <span className={`${tFilterLabel} font-bold uppercase text-[9px] font-mono px-1.5 shrink-0`}>Latar Menu:</span>
            <button
              onClick={() => setLegerTheme('gelap')}
              className={`px-2 py-0.5 text-[10.5px] font-bold transition-all rounded-xs focus:outline-none cursor-pointer flex items-center gap-1 ${
                isDark 
                  ? 'bg-zinc-800 text-white shadow-inner border border-zinc-700/50' 
                  : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200/50'
              }`}
              title="Latar Gelap (Nyaman di Ruangan Rapat)"
            >
              <Moon className="w-3 h-3 text-amber-400" />
              <span>Gelap</span>
            </button>
            <button
              onClick={() => setLegerTheme('terang')}
              className={`px-2 py-0.5 text-[10.5px] font-bold transition-all rounded-xs focus:outline-none cursor-pointer flex items-center gap-1 ${
                !isDark 
                  ? 'bg-white text-zinc-905 shadow-xs border border-zinc-300 font-extrabold' 
                  : 'text-zinc-450 hover:text-white hover:bg-zinc-900/50'
              }`}
              title="Latar Terang (Sesuai Cetak Fisik)"
            >
              <Sun className="w-3 h-3 text-amber-500" />
              <span>Terang</span>
            </button>
          </div>

          {/* Class Filter */}
          <div className={`flex items-center px-2 py-1 border rounded-sm text-xs gap-2 ${tFilterBg}`}>
            <Filter className="w-3.5 h-3.5 text-zinc-400" />
            <span className={`${tFilterLabel} font-bold uppercase text-[9px] font-mono shrink-0`}>Saring Kelas:</span>
            <select
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              className={`${tSelect} font-bold py-0.5 px-2 border rounded focus:outline-none focus:border-amber-550 select-none cursor-pointer text-[11px]`}
            >
              <option value="Semua font-sans">Semua Kelas</option>
              {distinctClasses.map(c => (
                <option key={c} value={c} className="font-sans font-medium text-black">Kelas {c}</option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <button
            onClick={downloadLegerCsv}
            disabled={filteredAndSortedRows.length === 0}
            className="flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 disabled:bg-zinc-800 disabled:text-zinc-650 disabled:border-transparent text-white font-extrabold tracking-tight text-[11.5px] py-1.5 px-3 border border-amber-500 hover:border-amber-400 transition cursor-pointer uppercase font-sans shrink-0"
            title="Ekspor Leger Nilai ke Microsoft Excel (CSV)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Ekspor Leger</span>
          </button>

          <button
            id="download-leger-pdf-btn"
            onClick={handleDownloadLegerPdf}
            disabled={filteredAndSortedRows.length === 0 || isGeneratingPdf}
            className="flex items-center gap-1.5 bg-sky-700 hover:bg-sky-600 disabled:bg-zinc-800 disabled:text-zinc-650 disabled:border-transparent text-white font-extrabold tracking-tight text-[11.5px] py-1.5 px-3 border border-sky-500 hover:border-sky-400 transition cursor-pointer uppercase font-sans shrink-0"
            title="Unduh Leger PDF (Rekapitulasi Nilai Satu Kelas)"
          >
            {isGeneratingPdf ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Download className="w-3.5 h-3.5 text-sky-350" />
            )}
            <span>{isGeneratingPdf ? "Menyiapkan PDF..." : "Unduh Leger PDF"}</span>
          </button>

          <button
            onClick={handlePrint}
            disabled={filteredAndSortedRows.length === 0}
            className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 disabled:bg-zinc-800 disabled:text-zinc-650 disabled:border-transparent text-white font-extrabold tracking-tight text-[11.5px] py-1.5 px-3 border border-emerald-500 hover:border-emerald-400 transition cursor-pointer uppercase font-sans shrink-0"
            title="Cetak Leger Nilai format Landscape (Ctrl+P)"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak Leger</span>
          </button>
        </div>
      </div>

      {/* Grid Dashboard Statistika Evaluasi - Suppressed on print */}
      <div className="no-print grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Total Siswa */}
        <div className={`${tCardBg} p-3 flex items-center justify-between`}>
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 font-mono block mb-1">Total Siswa</span>
            <span className={`text-xl ${tCardVal}`}>{stats.total} <span className={`text-xs ${tCardUnit} font-bold`}>Siswa</span></span>
          </div>
          <div className={`w-9 h-9 ${tCardIconWrap} flex items-center justify-center`}>
            <Users className="w-4 h-4 text-sky-400" />
          </div>
        </div>

        {/* Rata-rata Kelas */}
        <div className={`${tCardBg} p-3 flex items-center justify-between`}>
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 font-mono block mb-1">Rata-rata Kelas</span>
            <span className={`text-xl ${tCardVal}`}>{stats.averageClass} <span className={`text-xs ${tCardUnit} font-bold`}>Poin</span></span>
          </div>
          <div className={`w-9 h-9 ${tCardIconWrap} flex items-center justify-center`}>
            <Percent className="w-4 h-4 text-emerald-400" />
          </div>
        </div>

        {/* Siswa Tuntas */}
        <div className={`${isDark ? 'bg-zinc-950 border border-zinc-800/80' : 'bg-emerald-50/50 border border-emerald-250/60 shadow-2xs'} p-3 flex items-center justify-between`}>
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 font-mono block mb-1">Siswa Lulus KKTP</span>
            <span className="text-xl font-black text-emerald-600">{stats.tuntas} <span className="text-xs text-emerald-600 font-bold">Siswa</span></span>
            <span className={`text-[9px] ${isDark ? 'text-zinc-400' : 'text-zinc-650 font-medium'} block mt-1 font-sans`}>🎉 {stats.naikKelas} Siswa Naik/Lulus</span>
          </div>
          <div className="w-9 h-9 bg-emerald-950/20 border border-emerald-900/30 flex items-center justify-center">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
        </div>

        {/* Perlu Bimbingan */}
        <div className={`${isDark ? 'bg-zinc-950 border border-zinc-800/80' : 'bg-rose-50/50 border border-rose-250/60 shadow-2xs'} p-3 flex items-center justify-between`}>
          <div>
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 font-mono block mb-1">Perlu Pembahasan</span>
            <span className="text-xl font-black text-rose-600">{stats.bimbingan} <span className="text-xs text-rose-600 font-bold">Siswa</span></span>
            <span className={`text-[9px] ${isDark ? 'text-rose-400/90' : 'text-rose-650 font-medium'} block mt-1 font-sans`}>⚠️ {stats.tinggalKelas} Tahan (≥4 D)</span>
          </div>
          <div className="w-9 h-9 bg-rose-950/20 border border-rose-900/30 flex items-center justify-center">
            <AlertTriangle className="w-4 h-4 text-rose-500 animate-pulse" />
          </div>
        </div>

        {/* Siswa Berprestasi */}
        <div className={`${tCardBg} p-3 col-span-1 sm:col-span-2 lg:col-span-1 flex items-center justify-between`}>
          <div className="truncate pr-1">
            <span className="text-[9px] uppercase font-bold tracking-wider text-zinc-500 font-mono block mb-1">Peringkat 1 Kelas</span>
            <span className="text-xs font-black text-amber-500 truncate block uppercase leading-snug" title={stats.topPerformer}>
              {stats.topPerformer.split(' (')[0]}
            </span>
            <span className={`text-[9px] font-mono ${isDark ? 'text-zinc-450' : 'text-zinc-500'} leading-none`}>
              {stats.topPerformer.includes('(') ? `Skor: ${stats.topPerformer.split('(')[1].replace(')', '')}` : 'Nilai -'}
            </span>
          </div>
          <div className={`w-9 h-9 ${tCardIconWrap} flex items-center justify-center shrink-0`}>
            <Award className="w-4 h-4 text-amber-500" />
          </div>
        </div>
      </div>

      {/* Search Input Filter - Suppressed on print */}
      <div className={`no-print relative flex items-center ${isDark ? 'bg-zinc-950/30' : 'bg-zinc-50/50'} border ${tTableContainer} px-3 py-1.5 gap-2.5`}>
        <Search className="w-4 h-4 text-zinc-500" />
        <span className={`text-[10px] uppercase font-bold ${isDark ? 'text-zinc-500' : 'text-zinc-650'} font-mono shrink-0`}>Cari Cepat Siswa:</span>
        <input
          type="text"
          placeholder="Cari berdasarkan Nama Siswa, NIS, atau NISN..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className={`flex-1 ${tInput} text-xs py-1 px-3 border rounded focus:outline-none focus:border-amber-500 font-semibold select-text cursor-text`}
        />
        {searchQuery && (
          <button 
            onClick={() => setSearchQuery('')}
            className={`text-[10px] font-bold py-1 px-2.5 rounded transition cursor-pointer ${isDark ? 'hover:bg-zinc-850 text-zinc-450 hover:text-white' : 'hover:bg-zinc-150 text-zinc-600 hover:text-zinc-900 border border-zinc-200 bg-white'}`}
          >
            Bersihkan
          </button>
        )}
      </div>

      {/* Main Table Area (Polished for both Screen and Pristine Print) */}
      <div id="leger-nilai-print-container" className={`overflow-x-auto border ${tTableContainer} print:border-zinc-900 print:overflow-visible pr-0.5`}>
        
        {/* Printable/Corporate Document Header - shown ONLY during print */}
        <div className="hidden print:block font-sans text-black mb-4 w-full border-b-2 border-zinc-900 pb-3">
          <div className="text-center">
            <h1 className="text-[14px] font-black tracking-wider uppercase leading-none text-black">
              LEGER NILAI HASIL BELAJAR SISWA
            </h1>
            <p className="text-[12px] font-black uppercase text-zinc-950 tracking-wide mt-1">
              {schoolName} • KABUPATEN JAYAPURA
            </p>
            <div className="grid grid-cols-4 gap-y-1.5 text-[12px] mt-4 max-w-2xl mx-auto border-2 border-zinc-900 p-2.5 bg-zinc-50 font-semibold text-left text-black">
              <span className="font-extrabold">Kelas</span>
              <span className="font-black">: {ledgerMetadata.class}</span>
              <span className="font-extrabold">Tahun Pelajaran</span>
              <span className="font-black">: {ledgerMetadata.academicYear}</span>
              <span className="font-extrabold">Semester</span>
              <span className="font-black">: {ledgerMetadata.semester.toUpperCase()}</span>
              <span className="font-extrabold">Sistem Kurikulum</span>
              <span className="font-black">: KURIKULUM MERDEKA</span>
            </div>
          </div>
        </div>
 
        <table className={`w-full text-left border-collapse ${tTableText} print:text-black`}>
          <thead>
            {/* Subject Group header */}
            <tr className={`${tTrHead1} font-sans text-[12.5px] print:bg-zinc-100 print:border-zinc-900 print:text-black font-black`}>
              <th colSpan={3} className={`py-2.5 px-3 font-black border-r ${tThBorder} print:border-zinc-400 text-center`}>BIODATA SISWA</th>
              <th colSpan={availableSubjects.length} className={`py-2 px-2.5 font-black border-r ${tThBorder} print:border-zinc-400 text-center uppercase tracking-wider text-zinc-950 bg-amber-950/15 print:bg-transparent`}>
                NILAI MATA PELAJARAN (10 MAPEL UTAMA DAN PILIHAN)
              </th>
              <th colSpan={4} className="py-2.5 px-3 font-black text-center">STATISTIK KELULUSAN & RANKS</th>
            </tr>
            
            {/* Actual columns header */}
            <tr className={`${tTrHead2} border-b font-mono text-[12px] print:bg-zinc-50 print:border-zinc-900 print:text-black font-bold`}>
              {/* Bio headers */}
              <th className={`py-2 px-2 text-center w-10 border-r ${tThBorder} print:border-zinc-400 font-extrabold`}>NO</th>
              <th 
                onClick={() => !window.print && handleSort('name')}
                className={`py-2 px-3 w-56 sm:w-64 print:w-72 border-r ${tThBorder} print:border-zinc-400 text-left select-none cursor-pointer ${isDark ? 'hover:bg-zinc-900' : 'hover:bg-zinc-200'} print:hover:bg-transparent`}
              >
                <div className="flex items-center gap-1">
                  <span>NAMA LENGKAP SISWA</span>
                  {sortField === 'name' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-amber-550" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-550" />)}
                </div>
              </th>
              <th 
                onClick={() => !window.print && handleSort('nis')}
                className={`py-2 px-2.5 text-center w-36 border-r ${tThBorder} print:border-zinc-400 select-none cursor-pointer ${isDark ? 'hover:bg-zinc-900' : 'hover:bg-zinc-200'} print:hover:bg-transparent`}
              >
                <div className="flex items-center justify-center gap-1">
                  <span>NIS / NISN</span>
                  {sortField === 'nis' && (sortAsc ? <ChevronUp className="w-3.5 h-3.5 text-amber-550" /> : <ChevronDown className="w-3.5 h-3.5 text-amber-550" />)}
                </div>
              </th>

              {/* Dynamic Subject headers */}
              {availableSubjects.map((sub, sIdx) => (
                <th 
                  key={sub.code} 
                  className={`py-2 px-1.5 text-center w-14 text-[11px] font-black border-r ${tThBorder} print:border-zinc-400 uppercase tracking-tighter`}
                  title={sub.name}
                >
                  <div className="flex flex-col items-center">
                    <span className={`${isDark ? 'text-zinc-100' : 'text-zinc-950'} print:text-black font-extrabold`}>{sub.code}</span>
                  </div>
                </th>
              ))}

              {/* Statistics headers */}
              <th 
                onClick={() => !window.print && handleSort('scoreSum')}
                className={`py-2 px-2 text-center w-16 border-r ${tThBorder} print:border-zinc-400 select-none cursor-pointer ${isDark ? 'hover:bg-zinc-900/40 text-amber-400' : 'hover:bg-zinc-200/50 text-amber-700 font-extrabold'} print:text-black print:hover:bg-transparent`}
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>JUMLAH</span>
                  {sortField === 'scoreSum' && (sortAsc ? <ChevronUp className="w-3.5" /> : <ChevronDown className="w-3.5" />)}
                </div>
              </th>
              <th 
                onClick={() => !window.print && handleSort('average')}
                className={`py-1.5 px-1.5 text-center w-14 border-r ${tThBorder} print:border-zinc-400 select-none cursor-pointer ${isDark ? 'hover:bg-zinc-900/40 text-sky-400' : 'hover:bg-zinc-200/50 text-sky-750 font-extrabold'} print:text-black print:hover:bg-transparent`}
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>RATA2</span>
                  {sortField === 'average' && (sortAsc ? <ChevronUp className="w-3" /> : <ChevronDown className="w-3" />)}
                </div>
              </th>
              <th 
                onClick={() => !window.print && handleSort('rank')}
                className={`py-1.5 px-1 w-14 border-r ${tThBorder} print:border-zinc-400 select-none cursor-pointer ${isDark ? 'hover:bg-zinc-900/40 text-emerald-450' : 'hover:bg-zinc-200/50 text-emerald-700 font-extrabold'} print:text-black print:hover:bg-transparent text-center`}
              >
                <div className="flex items-center justify-center gap-0.5">
                  <span>RENGKIN</span>
                  {sortField === 'rank' && (sortAsc ? <ChevronUp className="w-3" /> : <ChevronDown className="w-3" />)}
                </div>
              </th>
              <th className={`py-1.5 px-2 text-center w-40 ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>KETERANGAN KEPUTUSAN</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedRows.map((row, index) => {
              const activeStudent = row.key === activeStudentKey;
              
              // Map student grades by subject code
              const studentGradesMap = row.grades.reduce((acc, curr) => {
                acc[curr.code] = { score: curr.score, predicate: curr.predicate };
                return acc;
              }, {} as Record<string, { score: number; predicate: string }>);

              // Determine styling for promotion
              const isPromoted = row.promotion.toLowerCase().includes('naik') || row.promotion.toLowerCase().includes('lulus');
              const isTahanKelas = row.promotion.toLowerCase().includes('tinggal') || row.promotion.toLowerCase().includes('tahan') || row.promotion.toLowerCase().includes('tidak naik');

              return (
                <tr 
                  key={row.key} 
                  className={`${tTdBorderBot} text-[12.5px] font-sans transition-all print:border-zinc-350 print:bg-white ${tTableText} print:text-black ${
                    activeStudent 
                      ? tRowBgActive + ' font-bold' 
                      : tTrHover
                  }`}
                  id={`leger-row-${row.key}`}
                >
                  {/* NO */}
                  <td className={`py-2.5 px-2 text-center border-r ${tTdBorder} print:border-zinc-300 font-mono font-bold ${tTdTextMuted} print:text-black`}>{index + 1}</td>
                  
                  {/* NAME */}
                  <td className={`py-2.5 px-3 w-56 sm:w-64 print:w-72 border-r ${tTdBorder} print:border-zinc-300`}>
                    <div className="flex items-center justify-between">
                      <span className="font-extrabold print:text-black">{row.name}</span>
                      
                      {/* Active student indicator badge (suppressed in print) */}
                      {activeStudent && (
                        <span className="no-print ml-2 text-[8px] bg-sky-900 border border-sky-600 px-1 py-0.2 rounded-xs font-mono font-black text-sky-350 tracking-wider">AKTIF</span>
                      )}
                      
                      {/* Alert if they have subjects below KKTP */}
                      {!activeStudent && row.failedSubjectsCount > 0 && (
                        <span className="no-print hidden sm:inline-flex items-center gap-0.5 text-[8.5px] bg-red-950/50 border border-red-900/50 text-red-405 px-1 py-0.2 font-mono" title={`${row.failedSubjectsCount} Mata Pelajaran di bawah limit KKTP (${row.kktp} Poin)`}>
                          <AlertTriangle className="w-2.5 h-2.5 leading-none" />
                          <span>{row.failedSubjectsCount} MAPEL</span>
                        </span>
                      )}
                    </div>
                  </td>
 
                  {/* NIS / NISN */}
                  <td className={`py-2.5 px-2.5 text-center border-r ${tTdBorder} print:border-zinc-300 font-mono text-[12px] ${tTdText} print:text-zinc-950 print:font-semibold`}>
                    <div>{row.nis}</div>
                    <div className={`text-[11px] ${tTdSubtext} print:text-zinc-700 print:font-bold`}>{row.nisn}</div>
                  </td>

                  {/* Scores across subject columns */}
                  {availableSubjects.map((sub, sIdx) => {
                    const studentGrade = studentGradesMap[sub.code];
                    const val = studentGrade?.score;
                    const isBelowKktp = val !== undefined && val < row.kktp;
                    
                    return (
                      <td 
                        key={sub.code} 
                        className={`py-2.5 px-1.5 text-center border-r ${tTdBorder} print:border-zinc-300 font-mono font-black text-[12px] ${
                          val === undefined 
                            ? (isDark ? 'text-zinc-700' : 'text-zinc-400') 
                            : isBelowKktp 
                              ? (isDark ? 'text-rose-450 bg-rose-950/20' : 'text-rose-700 bg-rose-50/50') + ' print:bg-zinc-100 print:text-red-700' 
                              : (isDark ? 'text-zinc-300' : 'text-zinc-950') + ' print:text-black font-black'
                        }`}
                        title={`${sub.name}: ${val || '0'} (Predikat ${studentGrade?.predicate || '-'})`}
                      >
                        {val === undefined ? '-' : val}
                      </td>
                    );
                  })}
 
                  {/* JUMLAH */}
                  <td className={`py-2.5 px-1.5 text-center border-r ${tTdBorder} print:border-zinc-300 font-mono font-black text-[12px] ${tScoreSumBg} print:bg-transparent print:text-black`}>{row.scoreSum}</td>
                  
                  {/* RATA-RATA */}
                  <td className={`py-2.5 px-1.5 text-center border-r ${tTdBorder} print:border-zinc-300 font-mono font-black text-[12px] ${tAverageBg} print:bg-transparent print:text-black`}>{row.average}</td>
 
                  {/* RENGKIN (RANK) */}
                  <td className={`py-2.5 px-1.5 text-center border-r ${tTdBorder} print:border-zinc-300 font-mono font-black text-[12.5px] ${tRankBg} print:bg-transparent print:text-black`}>
                    <span className={row.rank <= 3 ? `border-b border-dashed ${isDark ? 'border-amber-505 text-amber-400' : 'border-amber-600 text-amber-800'} pb-0.5 print:text-black font-black` : ""}>
                      {row.rank}
                    </span>
                  </td>

                  {/* KETERANGAN DECISION */}
                  <td className="py-2.5 px-3 text-left font-mono font-bold leading-normal text-[12px]">
                    <div className="flex flex-col justify-center">
                      <span className={`inline-block px-2 py-1 text-[11px] font-black leading-none uppercase text-center border-2 ${
                        isPromoted 
                          ? 'bg-emerald-950/50 text-emerald-400 border-emerald-900/60 print:bg-emerald-50 print:text-emerald-900 print:border-emerald-500' 
                          : isTahanKelas
                            ? 'bg-rose-950/50 text-rose-400 border-rose-900/60 print:bg-rose-50 print:text-rose-900 print:border-rose-500'
                            : 'bg-zinc-950/50 text-zinc-400 border-zinc-800'
                      }`}>
                        {isPromoted ? 'NAIK KELAS' : isTahanKelas ? 'TAHAN KELAS' : 'DITANGGUHKAN'}
                      </span>
                      <span className="no-print text-[7.5px] text-zinc-550 leading-tight block mt-0.5 truncate text-center font-sans tracking-tight" title={row.promotion}>
                        {row.promotion}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredAndSortedRows.length === 0 && (
              <tr>
                <td colSpan={7 + availableSubjects.length} className={`text-center py-8 ${isDark ? 'text-zinc-500 bg-zinc-950/20 border-zinc-805' : 'text-zinc-500 bg-zinc-50/50 border-zinc-200'} italic border-b text-[12px]`}>
                  Tidak ada data siswa yang memenuhi kriteria penyaringan
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Printable Footer Stamp - Shown during print only */}
        <div className="hidden print:block font-sans text-black mt-8 break-inside-avoid">
          <div className="text-right text-[12px] mr-12 font-black mb-2 text-black">
            {ledgerMetadata.signatures.locationAndDate || "Sentani, 19 Juni 2026"}
          </div>
          <div className="flex flex-row justify-between text-center text-[12px] text-black gap-6 leading-normal w-full mt-2">
            <div className="flex-1">
              <p className="font-extrabold text-black">Mengetahui,</p>
              <p className="font-black text-zinc-950 uppercase text-[12px]">Ketua Komite</p>
              <div className="h-16 flex items-end justify-center">
                {/* Space for signature */}
              </div>
              <p className="font-black uppercase mt-2 text-black leading-none text-[12px]">
                ( ___________________________ )
              </p>
            </div>
            
            <div className="flex-1">
              <p className="font-extrabold text-black">Menyetujui,</p>
              <p className="font-black text-zinc-950 uppercase text-[12px]">Kepala Sekolah</p>
              <div className="h-16 flex items-end justify-center">
                {/* Space for stamp/signature */}
              </div>
              <p className="font-black uppercase mt-2 underline text-black leading-none text-[12px]">
                {ledgerMetadata.signatures.principalName || 'MAIKEL PAUL WALLY, S.Pd'}
              </p>
              <p className="text-[11px] font-mono text-zinc-950 font-bold mt-1 leading-none">NIP {ledgerMetadata.signatures.principalNip || '19781223 200312 1 006'}</p>
            </div>
 
            <div className="flex-1">
              <p className="font-extrabold text-black">Diverifikasi,</p>
              <p className="font-black text-zinc-950 uppercase text-[12px]">Wali Kelas</p>
              <div className="h-16 flex items-end justify-center">
                {/* Space for teacher signature */}
              </div>
              <p className="font-black mt-2 underline text-black leading-none text-[12px]">
                {ledgerMetadata.signatures.classTeacherName || 'Retno Wahyuni, S.Pd.'}
              </p>
              <p className="text-[11px] font-mono text-zinc-950 font-bold mt-1 leading-none">NIP {ledgerMetadata.signatures.classTeacherNip || '19840512 201012 2 003'}</p>
            </div>
          </div>
        </div>

      </div>

      {/* Instructional footer banner - Suppressed on print */}
      <div className="no-print bg-zinc-950 border border-zinc-800 p-3 flex gap-3 text-xs leading-relaxed text-zinc-400">
        <HelpCircle className="w-4 h-4 text-sky-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-extrabold text-zinc-300 uppercase text-[9px] tracking-wide block mb-0.5">Petunjuk Rapat Dewan Guru:</span>
          {`Untuk mendaftar siswa baru atau menyesuaikan nilai rapor, kembali ke tab `}
          <strong className="text-zinc-200">"Lembar Rapor Siswa"</strong>
          {` di atas dan gunakan panel form editor di kiri. Data leger ini akan diperbarui dan di-re-ranking secara instan (`}
          <strong className="text-zinc-250">Real-time Auto-Sync</strong>
          {`) tanpa membutuhkan pemuatan halaman ulang.`}
        </div>
      </div>

    </div>
  );
}
