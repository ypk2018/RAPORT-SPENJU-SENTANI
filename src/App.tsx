/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { initialDataTemplates } from './initialData';
import { RaporData, SubjectGrade } from './types';
import RaporEditor from './components/RaporEditor';
import RaporPreview from './components/RaporPreview';
import LegerNilai from './components/LegerNilai';
import { Printer, BookOpen, Layers, Users, Sparkles, CheckCircle2, RotateCcw, AlertCircle, Upload, Download, FileDown, Loader2, Search, Cloud, LogOut, ExternalLink } from 'lucide-react';
import { initAuth as initGDriveAuth, googleSignIn, logout as googleSignOut, uploadPdfToDrive, searchFolder, createFolder } from './lib/googleDrive';

export default function App() {
  // Synchronise state with localStorage for multi-device support
  const [userRole, setUserRole] = useState<'admin' | 'user'>(() => {
    const saved = localStorage.getItem('rapor_user_role');
    return (saved as 'admin' | 'user') || 'admin';
  });

  const [selectedTemplateKey, setSelectedTemplateKey] = useState<string>(() => {
    return localStorage.getItem('rapor_current_student_key') || 'template_budi';
  });

  const [paperSize, setPaperSize] = useState<'A4' | 'F4'>(() => {
    const saved = localStorage.getItem('rapor_paper_size');
    return (saved as 'A4' | 'F4') || 'F4';
  });

  // Dynamically persist and apply paper size
  const handlePaperSizeChange = (size: 'A4' | 'F4') => {
    setPaperSize(size);
    localStorage.setItem('rapor_paper_size', size);
  };

  const [headerSearchQuery, setHeaderSearchQuery] = useState('');
  const [isHeaderSearchFocused, setIsHeaderSearchFocused] = useState(false);

  const [studentList, setStudentList] = useState<{ key: string; name: string; nis: string }[]>(() => {
    const savedList = localStorage.getItem('rapor_student_list_v2');
    if (savedList) {
      try {
        return JSON.parse(savedList);
      } catch (e) {
        console.error("Error parsing student list:", e);
      }
    }
    return [
      { key: 'template_budi', name: 'Budi Santoso', nis: '240822' },
      { key: 'template_siti', name: 'Siti Rahma Aminah', nis: '240835' }
    ];
  });

  const [raporData, setRaporData] = useState<RaporData>(() => {
    const activeKey = localStorage.getItem('rapor_current_student_key') || 'template_budi';
    const savedData = localStorage.getItem(`rapor_data_${activeKey}`);
    if (savedData) {
      try {
        return JSON.parse(savedData);
      } catch (e) {
        console.error("Error parsing local state:", e);
      }
    }
    return initialDataTemplates[activeKey] || initialDataTemplates['template_budi'];
  });
  
  // Mobile UI toggle ('editor' or 'preview')
  const [mobileView, setMobileView] = useState<'editor' | 'preview'>('editor');

  // Multi-view mode toggler ('rapor' sheet editor/preview vs 'leger' evaluation dashboard)
  const [activeView, setActiveView] = useState<'rapor' | 'leger'>('rapor');

  // Backup Import & Export handlers & messages state
  const [importMessage, setImportMessage] = useState<{ text: string; type: 'success' | 'error'; link?: string } | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        
        if (parsed && typeof parsed === 'object' && parsed.student && parsed.grades && parsed.school) {
          const name = parsed.student.name || 'Siswa Import';
          const nis = parsed.student.nis || '';
          
          let importKey = selectedTemplateKey;
          if (window.confirm(`Apakah Anda ingin mengimpor ini sebagai SISWA BARU? \n\n(Klik 'OK' untuk menambah siswa baru, atau 'Batal' untuk menimpa data siswa aktif saat ini: ${raporData.student.name})`)) {
            importKey = `student_imported_${Date.now()}`;
            const newList = [
              ...studentList,
              { key: importKey, name, nis }
            ];
            setStudentList(newList);
            localStorage.setItem('rapor_student_list_v2', JSON.stringify(newList));
            setSelectedTemplateKey(importKey);
            localStorage.setItem('rapor_current_student_key', importKey);
          } else {
            setStudentList(prev => {
              const updated = prev.map(item => {
                if (item.key === selectedTemplateKey) {
                  return { ...item, name, nis };
                }
                return item;
              });
              localStorage.setItem('rapor_student_list_v2', JSON.stringify(updated));
              return updated;
            });
          }

          setRaporData(parsed);
          localStorage.setItem(`rapor_data_${importKey}`, JSON.stringify(parsed));

          setImportMessage({
            text: `Berhasil mengimpor data rapor untuk siswa: ${name}.`,
            type: 'success'
          });
          
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          
          setTimeout(() => {
            setImportMessage(null);
          }, 6000);
        } else {
          setImportMessage({
            text: 'Format file backup tidak valid. File harus memiliki data student, grades, dan school.',
            type: 'error'
          });
        }
      } catch (err) {
        setImportMessage({
          text: 'Gagal menguraikan file JSON. Pastikan file dalam format JSON yang valid.',
          type: 'error'
        });
      }
    };
    reader.readAsText(file);
  };

  const handleExportBackup = () => {
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(raporData, null, 2));
      const downloadAnchor = document.createElement('a');
      const studentNameClean = (raporData.student.name || "siswa").toLowerCase().replace(/\s+/g, "_");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `rapor_${studentNameClean}_backup.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } catch (e) {
      console.error("Export backup failed", e);
      setImportMessage({
        text: 'Gagal mengekspor data backup.',
        type: 'error'
      });
    }
  };

  const handleExportAllStudentsCsv = () => {
    try {
      const allData: RaporData[] = studentList.map(s => {
        const saved = localStorage.getItem(`rapor_data_${s.key}`);
        if (saved) {
          try {
            return JSON.parse(saved);
          } catch (e) {
            // Fallback
          }
        }
        return initialDataTemplates[s.key] || initialDataTemplates['template_budi'];
      });

      // Collect all unique subjects across all students
      const subjectNamesSet = new Set<string>();
      allData.forEach(d => {
        if (d && d.grades) {
          d.grades.forEach(g => {
            if (g && g.name) {
              subjectNamesSet.add(g.name);
            }
          });
        }
      });
      const subjectNames = Array.from(subjectNamesSet);

      // Construct headers
      const csvHeaders = [
        'No',
        'Nama Siswa',
        'NIS',
        'NISN',
        'Kelas',
        'Semester',
        'Tahun Ajaran',
        ...subjectNames.map(name => `Nilai Akhir - ${name}`),
        ...subjectNames.map(name => `Nilai Pengetahuan - ${name}`),
        ...subjectNames.map(name => `Nilai Keterampilan - ${name}`),
        ...subjectNames.map(name => `Predikat - ${name}`),
        'Sakit (Hari)',
        'Izin (Hari)',
        'Tanpa Keterangan (Hari)',
        'Catatan Wali Kelas',
        'Keputusan Kenaikan'
      ];

      const csvRows = [csvHeaders];

      allData.forEach((d, index) => {
        // Generate a mapping from subject name to grade
        const gradeMap: Record<string, SubjectGrade> = {};
        if (d && d.grades) {
          d.grades.forEach(g => {
            if (g && g.name) {
              gradeMap[g.name] = g;
            }
          });
        }

        const studentRow = [
          (index + 1).toString(),
          d.student?.name || '',
          d.student?.nis || '',
          d.student?.nisn || '',
          d.student?.studentClass || '',
          d.student?.semester || '',
          d.student?.academicYear || '',
          ...subjectNames.map(name => gradeMap[name]?.score !== undefined ? gradeMap[name].score.toString() : ''),
          ...subjectNames.map(name => gradeMap[name]?.knowledgeScore !== undefined ? gradeMap[name].knowledgeScore.toString() : ''),
          ...subjectNames.map(name => gradeMap[name]?.skillsScore !== undefined ? gradeMap[name].skillsScore.toString() : ''),
          ...subjectNames.map(name => gradeMap[name]?.predicate || ''),
          d.attendance?.sick !== undefined ? d.attendance.sick.toString() : '0',
          d.attendance?.permit !== undefined ? d.attendance.permit.toString() : '0',
          d.attendance?.alpha !== undefined ? d.attendance.alpha.toString() : '0',
          d.teacherNotes || '',
          d.promotionDecision || ''
        ];

        // Escape CSV characters
        const escapedRow = studentRow.map(val => {
          let cell = val.replace(/"/g, '""');
          if (cell.includes(',') || cell.includes('\n') || cell.includes('"') || cell.includes(';')) {
            cell = `"${cell}"`;
          }
          return cell;
        });

        csvRows.push(escapedRow);
      });

      const csvContent = "\uFEFF" + csvRows.map(e => e.join(",")).join("\n"); // prepending BOM for proper Excel rendering (especially UTF-8 chars)
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.setAttribute("href", url);
      const acYear = raporData.student?.academicYear || "ALL";
      link.setAttribute("download", `REKAP_NILAI_RAPOR_SISWA_${acYear.replace(/\//g, '_')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setImportMessage({
        text: 'Sukses mengekspor rekapitulasi nilai seluruh siswa ke format CSV!',
        type: 'success'
      });
      setTimeout(() => setImportMessage(null), 5000);
    } catch (error) {
      console.error("Export CSV failed:", error);
      setImportMessage({
        text: 'Gagal mengekspor rekapitulasi nilai siswa.',
        type: 'error'
      });
    }
  };

  const updateRaporData = (newData: RaporData) => {
    setRaporData(newData);
    localStorage.setItem(`rapor_data_${selectedTemplateKey}`, JSON.stringify(newData));

    setStudentList(prev => {
      const updated = prev.map(item => {
        if (item.key === selectedTemplateKey) {
          return {
            ...item,
            name: newData.student.name || "Siswa",
            nis: newData.student.nis || ""
          };
        }
        return item;
      });
      localStorage.setItem('rapor_student_list_v2', JSON.stringify(updated));
      return updated;
    });
  };

  const handleAddStudent = (newInfo: { name: string; nis: string; nisn: string; studentClass?: string }) => {
    const newKey = `student_${Date.now()}`;
    const baseData = { ...raporData };
    
    const newRaporData: RaporData = {
      ...baseData,
      student: {
        name: newInfo.name,
        nis: newInfo.nis,
        nisn: newInfo.nisn,
        birthPlace: "Sentani",
        birthDate: "12 Maret 2012",
        studentClass: newInfo.studentClass || baseData.student.studentClass || "VIII-A",
        semester: baseData.student.semester || "2 (Dua)",
        academicYear: baseData.student.academicYear || "2025/2026",
        fatherName: "",
        motherName: "",
        parentOccupation: ""
      },
      grades: baseData.grades.map(g => ({
        ...g,
        score: 75,
        knowledgeScore: 75,
        skillsScore: 75,
        predicate: 'C',
        description: `Menunjukkan penguasaan kompetensi yang cukup dalam materi dasar ${g.name}.`
      })),
      attendance: {
        sick: 0,
        permit: 0,
        alpha: 0
      },
      teacherNotes: `${newInfo.name} menunjukkan perilaku dan sikap belajar yang baik secara konsisten selama semester ini.`
    };

    localStorage.setItem(`rapor_data_${newKey}`, JSON.stringify(newRaporData));

    const newList = [
      ...studentList,
      { key: newKey, name: newInfo.name, nis: newInfo.nis }
    ];
    setStudentList(newList);
    localStorage.setItem('rapor_student_list_v2', JSON.stringify(newList));

    setSelectedTemplateKey(newKey);
    localStorage.setItem('rapor_current_student_key', newKey);
    setRaporData(newRaporData);

    setImportMessage({
      text: `Siswa baru "${newInfo.name}" berhasil terdaftar & otomatis dipilih untuk di-edit.`,
      type: 'success'
    });
  };

  const handleDeleteStudent = (keyToDelete: string) => {
    if (studentList.length <= 1) {
      alert("Tidak dapat menghapus siswa terakhir. Harus tersisa minimal satu siswa untuk menghindari kekosongan aplikasi.");
      return;
    }

    if (window.confirm("Apakah Anda yakin ingin menghapus siswa ini secara permanen? Seluruh isian nilai, data diri, catatan kesiswaan, dan absensi akan dilenyapkan secara permanen.")) {
      localStorage.removeItem(`rapor_data_${keyToDelete}`);

      const newList = studentList.filter(item => item.key !== keyToDelete);
      setStudentList(newList);
      localStorage.setItem('rapor_student_list_v2', JSON.stringify(newList));

      if (selectedTemplateKey === keyToDelete) {
        const fallback = newList[0];
        setSelectedTemplateKey(fallback.key);
        localStorage.setItem('rapor_current_student_key', fallback.key);
        
        const savedData = localStorage.getItem(`rapor_data_${fallback.key}`);
        if (savedData) {
          try {
            setRaporData(JSON.parse(savedData));
          } catch (e) {
            setRaporData(initialDataTemplates[fallback.key] || initialDataTemplates['template_budi']);
          }
        } else {
          setRaporData(initialDataTemplates[fallback.key] || initialDataTemplates['template_budi']);
        }
      }

      setImportMessage({
        text: "Siswa berhasil dihapus dari daftar.",
        type: 'success'
      });
    }
  };

  // Load selected student template
  const handleTemplateSelection = (key: string) => {
    setSelectedTemplateKey(key);
    localStorage.setItem('rapor_current_student_key', key);
    const savedData = localStorage.getItem(`rapor_data_${key}`);
    if (savedData) {
      try {
        setRaporData(JSON.parse(savedData));
      } catch (e) {
        setRaporData(initialDataTemplates[key] || initialDataTemplates['template_budi']);
      }
    } else {
      if (initialDataTemplates[key]) {
        setRaporData(initialDataTemplates[key]);
      } else {
        alert("Terjadi kesalahan memuat data siswa.");
      }
    }
  };

  // Reset current student to their template value
  const handleReset = () => {
    if (window.confirm("Apakah Anda yakin ingin menyetel ulang data siswa ini kembali ke data bawaan? Semua perubahan lokal akan terhapus.")) {
      setRaporData(initialDataTemplates[selectedTemplateKey] || initialDataTemplates['template_budi']);
      localStorage.removeItem(`rapor_data_${selectedTemplateKey}`);
    }
  };

  // Admin Login Overlay States
  const [isAdminLoginOpen, setIsAdminLoginOpen] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  const handleToggleRole = (role: 'admin' | 'user') => {
    if (role === 'admin') {
      if (userRole === 'admin') return; // Already logged in as Admin
      setAdminUsername('');
      setAdminPassword('');
      setLoginError('');
      setIsAdminLoginOpen(true);
    } else {
      setUserRole('user');
      localStorage.setItem('rapor_user_role', 'user');
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminUsername.trim().toLowerCase() === 'admin' && adminPassword === 'admin123') {
      setUserRole('admin');
      localStorage.setItem('rapor_user_role', 'admin');
      setIsAdminLoginOpen(false);
      setLoginError('');
    } else {
      setLoginError('Nama pengguna atau kata sandi admin salah! Gunakan petunjuk masuk di bawah modal.');
    }
  };

  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [bulkData, setBulkData] = useState<RaporData | null>(null);
  const [isGeneratingBulkZip, setIsGeneratingBulkZip] = useState(false);

  const getStudentRaporData = (studentKey: string): RaporData => {
    const saved = localStorage.getItem(`rapor_data_${studentKey}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed) return parsed;
      } catch (e) {
        console.error("Error parsing student data for key", studentKey, e);
      }
    }
    const baseData = initialDataTemplates[studentKey] || initialDataTemplates['template_budi'];
    const sInfo = studentList.find(s => s.key === studentKey);
    if (sInfo) {
      return {
        ...baseData,
        student: {
          ...baseData.student,
          name: sInfo.name,
          nis: sInfo.nis
        }
      };
    }
    return baseData;
  };

  // Google Drive Integration States
  const [gdriveUser, setGdriveUser] = useState<any>(null);
  const [gdriveToken, setGdriveToken] = useState<string | null>(null);
  const [isUploadingDrive, setIsUploadingDrive] = useState(false);
  const [driveUploadError, setDriveUploadError] = useState<string | null>(null);

  // Listen to Google authentication status
  React.useEffect(() => {
    const unsubscribe = initGDriveAuth(
      (user, token) => {
        setGdriveUser(user);
        setGdriveToken(token);
      },
      () => {
        setGdriveUser(null);
        setGdriveToken(null);
      }
    );
    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  const handleGDriveLogin = async () => {
    try {
      setDriveUploadError(null);
      const res = await googleSignIn();
      if (res) {
        setGdriveUser(res.user);
        setGdriveToken(res.accessToken);
        setImportMessage({
          text: `Berhasil menghubungkan Google Drive (${res.user.email}).`,
          type: 'success'
        });
        setTimeout(() => setImportMessage(null), 5000);
      }
    } catch (err: any) {
      console.error("Gdrive Auth Error:", err);
      setDriveUploadError(err.message || "Gagal menghubungkan Google Drive");
      setImportMessage({
        text: `Gagal masuk: ${err.message || 'pengguna membatalkan login'}`,
        type: 'error'
      });
    }
  };

  const handleGDriveLogout = async () => {
    try {
      await googleSignOut();
      setGdriveUser(null);
      setGdriveToken(null);
      setImportMessage({
        text: "Koneksi Google Drive berhasil diputuskan.",
        type: 'success'
      });
      setTimeout(() => setImportMessage(null), 4000);
    } catch (err: any) {
      console.error("Gdrive Logout Error:", err);
    }
  };

  const handleUploadRaporToDrive = async () => {
    if (isUploadingDrive) return;
    
    // Fallback if not authenticated
    if (!gdriveToken) {
      await handleGDriveLogin();
      return;
    }

    setIsUploadingDrive(true);
    setDriveUploadError(null);

    setImportMessage({
      text: "Sedang me-render dokumen PDF untuk diarsipkan... Mohon tunggu.",
      type: "success"
    });

    try {
      const container = document.getElementById('pdf-offscreen-container');
      if (!container) {
        alert("Sistem gagal mendeteksi kerangka render PDF.");
        setIsUploadingDrive(false);
        return;
      }

      const page1 = container.querySelector('#pdf-rapor-page-1') as HTMLElement;
      const page2 = container.querySelector('#pdf-rapor-page-2') as HTMLElement;
      const page3 = container.querySelector('#pdf-rapor-page-3') as HTMLElement;

      if (!page1 || !page2 || !page3) {
        alert("Halaman rapor nomor 1, 2, atau 3 tidak ditemukan!");
        setIsUploadingDrive(false);
        return;
      }

      const pages = [page1, page2, page3];

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [215, 330]
      });

      let isFirstPage = true;

      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        
        const canvas = await html2canvas(pageEl, {
          scale: 2.2,
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff',
          onclone: (clonedDoc) => {
            const htmlEl = clonedDoc.documentElement;
            if (htmlEl) {
              htmlEl.style.backgroundColor = '#ffffff';
              htmlEl.style.color = '#000000';
              htmlEl.className = 'bg-white text-black';
            }
            const bodyEl = clonedDoc.body;
            if (bodyEl) {
              bodyEl.style.backgroundColor = '#ffffff';
              bodyEl.style.color = '#000000';
              bodyEl.className = 'bg-white text-black';
            }

            const pageId = pageEl.id;
            const clonedEl = clonedDoc.getElementById(pageId);
            if (clonedEl) {
              clonedEl.style.opacity = '1';
              clonedEl.style.visibility = 'visible';
              clonedEl.style.display = 'flex';
              clonedEl.style.flexDirection = 'column';
              clonedEl.style.justifyContent = 'start';
              clonedEl.style.backgroundColor = '#ffffff';
              clonedEl.style.color = '#000000';
              clonedEl.style.position = 'relative';
              clonedEl.style.top = '0';
              clonedEl.style.left = '0';

              let parent = clonedEl.parentElement;
              while (parent) {
                parent.style.backgroundColor = '#ffffff';
                parent.style.color = '#000000';
                parent.style.display = 'block';
                parent.style.opacity = '1';
                parent.style.visibility = 'visible';
                parent.style.transform = 'none';
                parent = parent.parentElement;
              }
            }
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;
        
        pdf.addImage(imgData, 'JPEG', 0, 0, 215, 330, undefined, 'FAST');
      }

      const pdfBlob = pdf.output('blob');
      
      const cleanName = (raporData.student.name || "siswa").toUpperCase().replace(/\s+/g, "_");
      const cleanNis = raporData.student.nis || "--------";
      const filename = `RAPOR_MERDEKA_${cleanName}_${cleanNis}.pdf`;

      setImportMessage({
        text: "Mengecek kesiapan folder sekolah di Google Drive...",
        type: "success"
      });

      const schoolName = raporData.school.schoolName || "SMP NEGERI 7 SENTANI";
      const targetFolderName = `Arsip Rapor Digital - ${schoolName}`;
      
      let folderId = await searchFolder(gdriveToken, targetFolderName);
      if (!folderId) {
        setImportMessage({
          text: `Membuat folder sekolah baru: "${targetFolderName}"...`,
          type: "success"
        });
        folderId = await createFolder(gdriveToken, targetFolderName);
      }

      setImportMessage({
        text: `Sedang mengunggah "${filename}" ke folder Google Drive...`,
        type: "success"
      });

      const fileId = await uploadPdfToDrive(gdriveToken, pdfBlob, filename, folderId);
      const url = `https://drive.google.com/file/d/${fileId}/view`;

      setImportMessage({
        text: `Berhasil mengarsipkan Rapor PDF "${raporData.student.name}" di Google Drive!`,
        type: "success",
        link: url
      });

    } catch (error: any) {
      console.error("Gdrive upload runtime error:", error);
      setDriveUploadError(error.message || "Gagal mengunggah");
      setImportMessage({
        text: `Eror saat mengarsipkan ke Drive: ${error.message || "terjadi kendala jembatan API"}`,
        type: "error"
      });
    } finally {
      setIsUploadingDrive(false);
    }
  };

  // Bulk PDF Download function
  const handleBulkDownloadPdfZip = async () => {
    if (isGeneratingBulkZip) return;
    setIsGeneratingBulkZip(true);

    setImportMessage({
      text: "Menyiapkan sistem render massal kurikulum merdeka... Harap tunggu sebentar.",
      type: "success"
    });

    try {
      const zip = new JSZip();
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

      // Wait 100ms
      await delay(100);

      for (let index = 0; index < studentList.length; index++) {
        const student = studentList[index];
        const studentData = getStudentRaporData(student.key);

        setImportMessage({
          text: `[${index + 1}/${studentList.length}] Menyiapkan data & me-render untuk: ${student.name}...`,
          type: "success"
        });

        // Set bulkData state for this single student to trigger render in the high-fidelity offscreen slot
        setBulkData(studentData);

        // Wait for React to apply state update and mount the RaporPreview with safe settle time
        await delay(250);

        const bulkContainer = document.getElementById('pdf-bulk-single-offscreen-container');
        if (!bulkContainer) {
          throw new Error("Sistem gagal mendeteksi kerangka render massal aktif.");
        }

        // Fetch pre-rendered pages via prefix id 'bulk-temp-'
        const page1 = bulkContainer.querySelector('#bulk-temp-pdf-rapor-page-1') as HTMLElement;
        const page2 = bulkContainer.querySelector('#bulk-temp-pdf-rapor-page-2') as HTMLElement;
        const page3 = bulkContainer.querySelector('#bulk-temp-pdf-rapor-page-3') as HTMLElement;

        if (!page1 || !page2 || !page3) {
          throw new Error(`Templat halaman rapor untuk siswa "${student.name}" gagal ter-render.`);
        }

        setImportMessage({
          text: `[${index + 1}/${studentList.length}] Mengambil snapshot grafis halaman 1, 2 & 3 untuk: ${student.name}...`,
          type: "success"
        });

        const pages = [page1, page2, page3];
        const isA4 = paperSize === 'A4';
        const pdfWidth = isA4 ? 210 : 215;
        const pdfHeight = isA4 ? 297 : 330;

        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: [pdfWidth, pdfHeight]
        });

        let isFirstPage = true;

        for (let i = 0; i < pages.length; i++) {
          const pageEl = pages[i];
          const canvas = await html2canvas(pageEl, {
            scale: 2.15,
            useCORS: true,
            allowTaint: false,
            logging: false,
            backgroundColor: '#ffffff',
            onclone: (clonedDoc) => {
              const htmlEl = clonedDoc.documentElement;
              if (htmlEl) {
                htmlEl.style.backgroundColor = '#ffffff';
                htmlEl.style.color = '#000000';
                htmlEl.className = 'bg-white text-black';
              }
              const bodyEl = clonedDoc.body;
              if (bodyEl) {
                bodyEl.style.backgroundColor = '#ffffff';
                bodyEl.style.color = '#000000';
                bodyEl.className = 'bg-white text-black';
              }

              const pageId = pageEl.id;
              const clonedEl = clonedDoc.getElementById(pageId);
              if (clonedEl) {
                clonedEl.style.opacity = '1';
                clonedEl.style.visibility = 'visible';
                clonedEl.style.display = 'flex';
                clonedEl.style.flexDirection = 'column';
                clonedEl.style.justifyContent = 'start';
                clonedEl.style.backgroundColor = '#ffffff';
                clonedEl.style.color = '#000000';
                clonedEl.style.position = 'relative';
                clonedEl.style.top = '0';
                clonedEl.style.left = '0';

                let parent = clonedEl.parentElement;
                while (parent) {
                  parent.style.backgroundColor = '#ffffff';
                  parent.style.color = '#000000';
                  parent.style.display = 'block';
                  parent.style.opacity = '1';
                  parent.style.visibility = 'visible';
                  parent.style.transform = 'none';
                  parent = parent.parentElement;
                }
              }
            }
          });

          // Compressing slightly to balance memory usage for zip export
          const imgData = canvas.toDataURL('image/jpeg', 0.88);
          
          if (!isFirstPage) {
            pdf.addPage();
          }
          isFirstPage = false;
          pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
        }

        const pdfBlob = pdf.output('blob');
        const cleanName = (studentData.student.name || "siswa").toUpperCase().replace(/\s+/g, "_");
        const cleanNis = studentData.student.nis || "--------";
        zip.file(`RAPOR_MERDEKA_${cleanName}_${cleanNis}.pdf`, pdfBlob);
      }

      setImportMessage({
        text: "Sedang mengompres berkas ZIP seluruh siswa... Harap tunggu sebentar.",
        type: "success"
      });

      const zipContent = await zip.generateAsync({ type: 'blob' });

      const url = URL.createObjectURL(zipContent);
      const link = document.createElement('a');
      link.href = url;
      const acYear = raporData.student?.academicYear || "ALL";
      link.download = `RAPOR_MASAL_SISWA_${acYear.replace(/\//g, '_')}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setImportMessage({
        text: `Sukses cetak massal! Berhasil mengunduh ZIP berisi ${studentList.length} rapor siswa secara aman tanpa kendala rendering.`,
        type: "success"
      });
      setTimeout(() => setImportMessage(null), 5000);
    } catch (error: any) {
      console.error("Bulk PDF Render Error:", error);
      setImportMessage({
        text: `Gagal memproses cetak massal karena kendala rendering: ${error.message || "kesalahan internal"}`,
        type: "error"
      });
    } finally {
      setIsGeneratingBulkZip(false);
      setBulkData(null); // safely clear dynamic state
    }
  };

  // PDF Download function using high-fidelity rendering
  const handleDownloadPdf = async () => {
    if (isGeneratingPdf) return;
    setIsGeneratingPdf(true);
    
    // Quick notification starting PDF generation
    setImportMessage({
      text: "Sedang menyiapkan berkas PDF rapor... Harap tunggu sebentar.",
      type: "success"
    });

    try {
      const container = document.getElementById('pdf-offscreen-container');
      if (!container) {
        alert("Sistem gagal mendeteksi kerangka render PDF.");
        setIsGeneratingPdf(false);
        return;
      }

      // Query available pages in the container
      const page1 = container.querySelector('#pdf-rapor-page-1') as HTMLElement;
      const page2 = container.querySelector('#pdf-rapor-page-2') as HTMLElement;
      const page3 = container.querySelector('#pdf-rapor-page-3') as HTMLElement;

      if (!page1 || !page2 || !page3) {
        alert("Halaman rapor nomor 1, 2, atau 3 tidak ditemukan!");
        setIsGeneratingPdf(false);
        return;
      }

      const pages = [page1, page2, page3];
      const isA4 = paperSize === 'A4';
      const pdfWidth = isA4 ? 210 : 215;
      const pdfHeight = isA4 ? 297 : 330;

      // Initialize portrait dynamic paper size standard
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });

      let isFirstPage = true;

      // Render each page directly as a single high-fidelity image on its own PDF page (no vertical slicing)
      for (let i = 0; i < pages.length; i++) {
        const pageEl = pages[i];
        
        // Render the element using html2canvas with upscale and custom cloned styles
        const canvas = await html2canvas(pageEl, {
          scale: 2.2, // Balance premium crisp quality & reasonable file size
          useCORS: true,
          allowTaint: false,
          logging: false,
          backgroundColor: '#ffffff', // Guarantee solid white background
          onclone: (clonedDoc) => {
            // 1. Force absolute white background and black text on html and body elements
            const htmlEl = clonedDoc.documentElement;
            if (htmlEl) {
              htmlEl.style.backgroundColor = '#ffffff';
              htmlEl.style.color = '#000000';
              htmlEl.className = 'bg-white text-black';
            }
            const bodyEl = clonedDoc.body;
            if (bodyEl) {
              bodyEl.style.backgroundColor = '#ffffff';
              bodyEl.style.color = '#000000';
              bodyEl.className = 'bg-white text-black';
            }

            // 2. Traversal up ancestor tree of the targeted item for absolute render safety
            const pageId = pageEl.id;
            const clonedEl = clonedDoc.getElementById(pageId);
            if (clonedEl) {
              clonedEl.style.opacity = '1';
              clonedEl.style.visibility = 'visible';
              clonedEl.style.display = 'flex';
              clonedEl.style.flexDirection = 'column';
              clonedEl.style.justifyContent = 'start';
              clonedEl.style.backgroundColor = '#ffffff';
              clonedEl.style.color = '#000000';
              clonedEl.style.position = 'relative';
              clonedEl.style.top = '0';
              clonedEl.style.left = '0';

              let parent = clonedEl.parentElement;
              while (parent) {
                parent.style.backgroundColor = '#ffffff';
                parent.style.color = '#000000';
                parent.style.display = 'block';
                parent.style.opacity = '1';
                parent.style.visibility = 'visible';
                parent.style.transform = 'none';
                parent = parent.parentElement;
              }
            }
          }
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        
        if (!isFirstPage) {
          pdf.addPage();
        }
        isFirstPage = false;
        
        // Draw image to fill full portrait container size
        pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }

      // Save formatted PDF document
      const cleanName = (raporData.student.name || "siswa").toUpperCase().replace(/\s+/g, "_");
      const cleanNis = raporData.student.nis || "--------";
      pdf.save(`RAPOR_MERDEKA_${cleanName}_${cleanNis}.pdf`);

      setImportMessage({
        text: `Sukses mengunduh Dokumen Rapor PDF Kurikulum Merdeka untuk "${raporData.student.name}"!`,
        type: "success"
      });
      setTimeout(() => setImportMessage(null), 5000);
    } catch (error) {
      console.error("PDF Render Error:", error);
      setImportMessage({
        text: "Gagal memproses dokumen PDF karena kendala rendering. Gunakan tombol 'Cetak Rapor' untuk alternatif cetak.",
        type: "error"
      });
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  // Print function
  const handlePrint = () => {
    window.print();
  };

  // Keyboard shortcut listener (Ctrl+P / Cmd+P) for quick print trigger
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Detect Ctrl+P or Cmd+P
      if ((e.ctrlKey || e.metaKey) && (e.key === 'p' || e.key === 'P')) {
        e.preventDefault();
        handlePrint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans select-none antialiased">
      {/* Dynamic @page style override based on chosen paper format and view */}
      <style>{`
        @media print {
          /* Force page margins to 0 to completely hide browser headers, footers, print dates, and webpage URLs */
          @page {
            size: ${activeView === 'leger' ? `${paperSize === 'A4' ? '297mm 210mm' : '330mm 215mm'} landscape` : `${paperSize === 'A4' ? '210mm 297mm' : '215mm 330mm'} portrait`} !important;
            margin: 0 !important;
          }

          html, body {
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            color: black !important;
            width: 100% !important;
            height: auto !important;
          }

          /* Hide everything that is marked as no-print */
          .no-print,
          #btn-cetak-rapor,
          header,
          footer,
          aside,
          button,
          input,
          select,
          textarea {
            display: none !important;
          }

          ${activeView === 'leger' ? `
            /* Leger Nilai Landscape fitting perfectly on A4 or F4 at 100% scale */
            #leger-nilai-print-container {
              width: ${paperSize === 'A4' ? '297mm' : '330mm'} !important;
              height: ${paperSize === 'A4' ? '210mm' : '215mm'} !important;
              min-height: ${paperSize === 'A4' ? '210mm' : '215mm'} !important;
              max-height: ${paperSize === 'A4' ? '210mm' : '215mm'} !important;
              padding: 12mm 15mm !important;
              box-sizing: border-box !important;
              border: none !important;
              box-shadow: none !important;
              overflow: visible !important;
              background-color: white !important;
              background: white !important;
              color: black !important;
            }
            table {
              font-size: 11px !important; /* Premium readable and clear font size on paper matrix */
              width: 100% !important;
              border-collapse: collapse !important;
            }
            th, td {
              padding-top: 5px !important;
              padding-bottom: 5px !important;
              font-size: 10px !important;
            }
          ` : `
            /* Rapor Portrait fitting perfectly at 100% scale on A4 or F4 */
            .print-area {
              /* Exact physical dimensions of the paper dynamically bound */
              width: ${paperSize === 'A4' ? '210mm' : '215mm'} !important;
              height: ${paperSize === 'A4' ? '297mm' : '330mm'} !important;
              min-height: ${paperSize === 'A4' ? '297mm' : '330mm'} !important;
              max-height: ${paperSize === 'A4' ? '297mm' : '330mm'} !important;
              
              /* Physical page margins implemented as secure inner padding so browser doesn't crop or scale-down */
              padding: ${paperSize === 'A4' ? '12mm 15mm' : '15mm 18mm'} !important;
              box-sizing: border-box !important;
              
              /* Absolute rendering at true 1:1 scale, preventing browser shrinking */
              margin: 0 auto !important;
              page-break-inside: avoid !important;
              page-break-after: always !important;
              break-after: page !important;
              position: relative !important;
              overflow: hidden !important;
              background-color: white !important;
              background: white !important;
              border: none !important;
              box-shadow: none !important;
            }

            /* Absolute positioning of footer within padded page dimension safely above mechanical margin bounds */
            [data-rapor-footer] {
              position: absolute !important;
              bottom: ${paperSize === 'A4' ? '12mm' : '15mm'} !important;
              left: ${paperSize === 'A4' ? '15mm' : '18mm'} !important;
              width: calc(100% - ${paperSize === 'A4' ? '30mm' : '36mm'}) !important;
              z-index: 50 !important;
            }
          `}
        }
      `}</style>
      {/* Top Application Bar - suppressed during print */}
      <header className="no-print bg-zinc-900 w-full backdrop-blur border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          
          {/* Logo & Brand title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-zinc-800 border border-zinc-650 flex items-center justify-center shadow-lg">
              <BookOpen className="w-4 h-4 text-sky-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 leading-none mb-0.5">
                <span className="text-[9px] font-extrabold uppercase bg-sky-950 text-sky-400 px-1.5 py-0.2 border border-sky-800 font-mono">
                  Kurikulum Merdeka
                </span>
                <span className="text-[9.5px] font-mono font-bold text-sky-400 uppercase tracking-wide">
                  {raporData.school.schoolName || "SMP NEGERI 7 SENTANI"}
                </span>
              </div>
              <h1 className="text-xs md:text-sm font-extrabold tracking-tight text-white uppercase font-sans">
                Aplikasi Pengisian & Cetak Rapor Digital
              </h1>
            </div>
          </div>

          {/* Controls & Quick selectors */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Hak Akses Selector */}
            <div className="flex items-center bg-zinc-950 p-1 border border-zinc-800 gap-1 text-[11px] rounded-sm">
              <span className="text-[9px] uppercase font-bold text-zinc-500 px-1 font-mono">Hak Akses:</span>
              <button
                onClick={() => handleToggleRole('admin')}
                className={`py-0.5 px-2 rounded-xs font-extrabold transition-all text-[10px] uppercase flex items-center gap-1 cursor-pointer ${
                  userRole === 'admin'
                    ? 'bg-sky-950 text-sky-400 border border-sky-800/80 font-black'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${userRole === 'admin' ? 'bg-sky-400 animate-pulse' : 'bg-zinc-650'}`}></span>
                <span>Admin</span>
              </button>
              <button
                onClick={() => handleToggleRole('user')}
                className={`py-0.5 px-2 rounded-xs font-extrabold transition-all text-[10px] uppercase flex items-center gap-1 cursor-pointer ${
                  userRole === 'user'
                    ? 'bg-amber-950 text-amber-500 border border-amber-900/80 font-black'
                    : 'text-zinc-500 hover:text-zinc-300 border border-transparent'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${userRole === 'user' ? 'bg-amber-500 animate-pulse' : 'bg-zinc-650'}`}></span>
                <span>Pengguna</span>
              </button>
            </div>

            {/* Search Student Navigation Bar */}
            <div className="relative flex items-center bg-zinc-950 p-1 border border-zinc-800 gap-1 text-[11px] rounded-sm no-print select-none">
              <span className="text-[9px] uppercase font-bold text-zinc-500 px-1 font-mono shrink-0">Cari Siswa:</span>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik Nama atau NIS..."
                  value={headerSearchQuery}
                  onChange={(e) => {
                    setHeaderSearchQuery(e.target.value);
                    setIsHeaderSearchFocused(true);
                  }}
                  onFocus={() => setIsHeaderSearchFocused(true)}
                  className="bg-zinc-900 text-zinc-100 text-[10.5px] font-sans font-bold py-0.5 px-2 pl-6 pr-5 border border-zinc-750 rounded focus:outline-none focus:border-sky-500 w-32 sm:w-44 select-text cursor-text"
                />
                <Search className="absolute left-1.5 top-1 w-3 h-3 text-zinc-500" />
                {headerSearchQuery && (
                  <button 
                    onClick={() => setHeaderSearchQuery('')}
                    className="absolute right-1 top-0.5 text-zinc-400 hover:text-white font-bold text-[8px] cursor-pointer"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Floating selection dashboard */}
              {isHeaderSearchFocused && (
                <>
                  <div className="fixed inset-0 z-30" onClick={() => setIsHeaderSearchFocused(false)} />
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-zinc-900 border border-zinc-800 rounded shadow-2xl z-40 overflow-hidden py-1 max-h-60 overflow-y-auto">
                    <div className="text-[9px] uppercase font-bold text-zinc-500 px-2.5 py-1 font-mono border-b border-zinc-850">
                      {headerSearchQuery ? 'Hasil Pencarian Siswa' : 'Daftar Semua Siswa'}
                    </div>
                    {studentList
                      .filter(item => {
                        if (!headerSearchQuery) return true;
                        const query = headerSearchQuery.toLowerCase();
                        return item.name.toLowerCase().includes(query) || item.nis.includes(query);
                      })
                      .map(item => {
                        const isActive = item.key === selectedTemplateKey;
                        return (
                          <button
                            key={item.key}
                            onClick={() => {
                              handleTemplateSelection(item.key);
                              setIsHeaderSearchFocused(false);
                              setHeaderSearchQuery('');
                            }}
                            className={`w-full text-left px-2.5 py-1.5 text-[11px] transition flex flex-col gap-0.5 cursor-pointer ${
                              isActive 
                                ? 'bg-sky-950/45 text-sky-400 border-l-2 border-sky-500 font-bold' 
                                : 'hover:bg-zinc-800 text-zinc-350 hover:text-white'
                            }`}
                          >
                            <span className="truncate">{item.name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">NIS: {item.nis || '-'}</span>
                          </button>
                        );
                      })
                    }
                    {studentList.filter(item => {
                      const query = headerSearchQuery.toLowerCase();
                      return item.name.toLowerCase().includes(query) || item.nis.includes(query);
                    }).length === 0 && (
                      <div className="text-center text-[10px] text-zinc-500 py-3 font-mono">
                        Siswa tidak ditemukan
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Quick Students Selection */}
            <div className="flex items-center bg-zinc-950 p-1 border border-zinc-800 gap-1.5 text-[11px] rounded-sm select-none">
              <span className="text-[9px] uppercase font-bold text-zinc-500 px-1 font-mono shrink-0">Siswa Aktif:</span>
              <select
                value={selectedTemplateKey}
                onChange={(e) => handleTemplateSelection(e.target.value)}
                className="bg-zinc-900 text-zinc-100 text-[10.5px] font-sans font-bold py-0.5 px-2 border border-zinc-750 rounded focus:outline-none focus:border-zinc-550 select-none cursor-pointer"
              >
                {studentList.map(item => (
                  <option key={item.key} value={item.key}>
                    {item.name} {item.nis ? `(NIS: ${item.nis})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Hidden Backup File Input */}
            <input 
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />

            {/* Backup Operations (Import/Export JSON) */}
            <div className="flex items-center bg-zinc-950 p-1 border border-zinc-800 gap-1 text-[11px] rounded-sm no-print">
              <span className="text-[9px] uppercase font-bold text-zinc-500 px-1 font-mono">Backup:</span>
              <button
                onClick={triggerFileInput}
                className="py-0.5 px-2 rounded-sm font-bold text-zinc-400 hover:text-zinc-200 border border-transparent transition cursor-pointer flex items-center gap-1 text-[10.5px]"
                title="Unggah (Import) File Cadangan JSON Rapor"
              >
                <Upload className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Impor</span>
              </button>
              <button
                onClick={handleExportBackup}
                className="py-0.5 px-2 rounded-sm font-bold text-zinc-400 hover:text-zinc-200 border border-transparent transition cursor-pointer flex items-center gap-1 text-[10.5px]"
                title="Unduh (Export) File Cadangan JSON Rapor"
              >
                <Download className="w-3.5 h-3.5 text-sky-450" />
                <span className="hidden sm:inline">Ekspor</span>
              </button>
            </div>

            {/* Recalculate / Export CSV Rekap Nilai */}
            <div className="flex items-center bg-zinc-950 p-1 border border-zinc-800 gap-1 text-[11px] rounded-sm no-print">
              <span className="text-[9px] uppercase font-bold text-zinc-500 px-1 font-mono">Rekap:</span>
              <button
                onClick={handleExportAllStudentsCsv}
                className="py-0.5 px-2 rounded-sm font-bold text-zinc-400 hover:text-amber-400 border border-transparent transition cursor-pointer flex items-center gap-1 text-[10.5px]"
                title="Unduh Rekap Nilai Siswa format CSV untuk Microsoft Excel"
              >
                <FileDown className="w-3.5 h-3.5 text-amber-500" />
                <span>Unduh CSV</span>
              </button>
            </div>

            {/* Cetak Massal (Admin Premium Tool) */}
            {userRole === 'admin' && (
              <div className="flex items-center bg-zinc-950 p-1 border border-zinc-800 gap-1 text-[11px] rounded-sm no-print">
                <span className="text-[9px] uppercase font-bold text-sky-450 px-1 font-mono">Massal:</span>
                <button
                  onClick={handleBulkDownloadPdfZip}
                  disabled={isGeneratingBulkZip}
                  className="py-0.5 px-2 rounded-sm font-bold text-zinc-400 hover:text-sky-450 disabled:text-zinc-650 disabled:cursor-not-allowed border border-transparent transition cursor-pointer flex items-center gap-1 text-[10.5px]"
                  title="Unduh Berkas PDF Rapor Seluruh Siswa ke file ZIP (Cetak Massal)"
                >
                  {isGeneratingBulkZip ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                  ) : (
                    <Layers className="w-3.5 h-3.5 text-sky-450" />
                  )}
                  <span>{isGeneratingBulkZip ? "Memproses..." : "ZIP Massal"}</span>
                </button>
              </div>
            )}

            {/* Google Drive Integration */}
            <div className="flex items-center bg-zinc-950 p-1 border border-zinc-850 gap-1 text-[11px] rounded-sm no-print">
              <span className="text-[9px] uppercase font-bold text-zinc-500 px-1 font-mono flex items-center gap-1 shrink-0">
                <Cloud className="w-3 h-3 text-sky-400 shrink-0" />
                <span>Drive:</span>
              </span>
              {gdriveUser ? (
                <div className="flex items-center gap-1.5 pl-0.5">
                  <span className="text-[9.5px] font-bold text-zinc-400 truncate max-w-[80px]" title={gdriveUser.email || ''}>
                    {gdriveUser.displayName || gdriveUser.email?.split('@')[0] || 'Tersambung'}
                  </span>
                  <button
                    onClick={handleUploadRaporToDrive}
                    disabled={isUploadingDrive}
                    className="py-0.5 px-2 bg-sky-950/40 hover:bg-sky-900 border border-sky-800 hover:border-sky-700 text-sky-400 hover:text-sky-350 disabled:text-sky-850 disabled:border-zinc-900 disabled:bg-transparent disabled:cursor-not-allowed font-extrabold rounded-xs transition text-[10.5px] flex items-center gap-1 cursor-pointer"
                    title="Simpan salinan PDF rapor siswa aktif ini ke folder sekolah di Google Drive"
                  >
                    {isUploadingDrive ? (
                      <Loader2 className="w-3 h-3 animate-spin text-sky-450" />
                    ) : (
                      <Cloud className="w-3 h-3 text-sky-450" />
                    )}
                    <span>{isUploadingDrive ? "Mengunggah..." : "Arsip PDF"}</span>
                  </button>
                  <button
                    onClick={handleGDriveLogout}
                    className="p-1 hover:bg-zinc-850 rounded text-zinc-550 hover:text-rose-400 transition cursor-pointer"
                    title="Putuskan koneksi Google Drive"
                  >
                    <LogOut className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleGDriveLogin}
                  className="py-0.5 px-2 text-zinc-400 hover:text-sky-400 border border-transparent transition flex items-center gap-1 text-[10.5px] cursor-pointer font-bold"
                  title="Hubungkan ke Akun Google untuk Pengarsipan Drive"
                >
                  <Cloud className="w-3 h-3 text-zinc-550" />
                  <span>Hubungkan</span>
                </button>
              )}
            </div>

            {/* Paper Size Selector (A4 vs F4) for presisi layout */}
            <div className="flex items-center gap-0.5 bg-zinc-855 border border-zinc-750 p-0.5 rounded-sm select-none shrink-0" id="paper-size-switch">
              <button
                onClick={() => handlePaperSizeChange('A4')}
                className={`py-0.8 px-2 text-[10px] font-sans font-black tracking-tight rounded-xs cursor-pointer transition ${
                  paperSize === 'A4'
                    ? 'bg-sky-600 text-white font-extrabold border border-sky-450'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
                title="Atur format cetak & PDF ke A4 (210mm x 297mm)"
              >
                A4
              </button>
              <button
                onClick={() => handlePaperSizeChange('F4')}
                className={`py-0.8 px-2 text-[10px] font-sans font-black tracking-tight rounded-xs cursor-pointer transition ${
                  paperSize === 'F4'
                    ? 'bg-sky-600 text-white font-extrabold border border-sky-450'
                    : 'text-zinc-400 hover:text-zinc-200 border border-transparent'
                }`}
                title="Atur format cetak & PDF ke F4 / Folio (215mm x 330mm)"
              >
                F4
              </button>
            </div>

            {/* Download PDF Button (CTA) */}
            <button
              id="btn-unduh-pdf"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className="flex items-center gap-1.5 bg-sky-700 hover:bg-sky-600 disabled:bg-sky-900 disabled:cursor-not-allowed text-white font-extrabold tracking-tight text-[11px] py-1.5 px-3 rounded-sm border border-sky-500 hover:border-sky-400 disabled:border-sky-800 transition-all cursor-pointer uppercase font-sans shrink-0"
              title="Unduh Berkas PDF Rapor"
            >
              {isGeneratingPdf ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5" />
              )}
              <span>{isGeneratingPdf ? "Menyiapkan PDF..." : "Unduh PDF"}</span>
            </button>

            {/* Print Button (CTA) */}
            <button
              id="btn-cetak-rapor"
              onClick={handlePrint}
              className="flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white font-extrabold tracking-tight text-[11px] py-1.5 px-3 rounded-sm border border-emerald-500 hover:border-emerald-400 transition-all cursor-pointer uppercase font-sans"
              title="Cetak Rapor (Ctrl+P)"
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="flex items-center gap-1">
                <span>Cetak Rapor</span>
                <kbd className="hidden md:inline-flex items-center justify-center font-mono text-[8px] font-black bg-emerald-800/80 border border-emerald-550/45 text-emerald-100 rounded-sm px-1.5 py-0.5 ml-0.5 tracking-wider uppercase select-none">Ctrl+P</kbd>
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 flex flex-col gap-4 selection:bg-zinc-700 selection:text-white">
        
        {/* Import Backup Status Notification Overlay/Banner */}
        {importMessage && (
          <div className={`no-print p-3 flex items-center justify-between border text-xs rounded-sm transition-all duration-300 animate-fadeIn ${
            importMessage.type === 'success' 
              ? 'bg-emerald-950/40 border-emerald-850 text-emerald-300 shadow-sm' 
              : 'bg-rose-950/40 border-rose-900 text-rose-300 shadow-sm'
          }`}>
            <div className="flex items-center gap-2">
              {importMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{importMessage.text}</span>
              {importMessage.link && (
                <a
                  href={importMessage.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-3 inline-flex items-center gap-1 text-[10px] bg-sky-900 hover:bg-sky-850 text-sky-250 border border-sky-750 hover:border-sky-650 font-extrabold uppercase py-1 px-2.5 rounded-sm cursor-pointer transition shadow-sm"
                >
                  <span>Buka di Google Drive</span>
                  <ExternalLink className="w-3 h-3 text-sky-400" />
                </a>
              )}
            </div>
            <button 
              onClick={() => setImportMessage(null)} 
              className="text-[10px] font-bold uppercase py-0.5 px-1.5 rounded-sm bg-zinc-900/50 hover:bg-zinc-850 border border-zinc-800 hover:text-white cursor-pointer transition active:scale-95 shrink-0"
            >
              Tutup
            </button>
          </div>
        )}        {/* Toggle Tampilan Rapor vs Leger Nilai */}
        <div className="no-print flex items-center border border-zinc-850 bg-zinc-950 p-1.5 rounded-sm select-none gap-1.5 self-start shrink-0">
          <button
            onClick={() => setActiveView('rapor')}
            className={`py-1.5 px-3.5 rounded text-[11px] font-sans font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeView === 'rapor'
                ? 'bg-sky-600 text-white font-extrabold border-sky-400 shadow-md animate-pulse-once'
                : 'text-zinc-450 hover:text-zinc-200 border-transparent hover:bg-zinc-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Form & Rapor Siswa</span>
          </button>
          
          <button
            onClick={() => setActiveView('leger')}
            className={`py-1.5 px-3.5 rounded text-[11px] font-sans font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer border ${
              activeView === 'leger'
                ? 'bg-amber-600 text-white font-black border-amber-500 shadow-md'
                : 'text-zinc-450 hover:text-zinc-200 border-transparent hover:bg-zinc-900'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Leger Nilai (Evaluasi Rapat)</span>
          </button>
        </div>

        {activeView === 'rapor' ? (
          <>
            {/* Mobile View Toggle Buttons - suppressed during print */}
            <div className="no-print lg:hidden grid grid-cols-2 bg-zinc-900 rounded-none p-1 border border-zinc-800 text-xs">
              <button
                onClick={() => setMobileView('editor')}
                className={`py-2 rounded-none font-bold flex items-center justify-center gap-2 transition ${
                  mobileView === 'editor' 
                    ? 'bg-zinc-800 text-white border border-zinc-700' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Layers className="w-4 h-4 text-sky-400" />
                <span>Form Editor</span>
              </button>
              <button
                onClick={() => setMobileView('preview')}
                className={`py-2 rounded-none font-bold flex items-center justify-center gap-2 transition ${
                  mobileView === 'preview' 
                    ? 'bg-zinc-800 text-white border border-zinc-700' 
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                <Printer className="w-4 h-4 text-emerald-400" />
                <span>Kertas Rapor</span>
              </button>
            </div>

            {/* Dynamic Desktop Workspace layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* Column Left: Input Form Editor (Visible on desktop or when toggled in mobile) */}
              <div className={`no-print lg:col-span-5 space-y-4 ${mobileView === 'editor' ? 'block' : 'hidden lg:block'}`}>
                <RaporEditor 
                  data={raporData} 
                  onChange={updateRaporData} 
                  onReset={handleReset} 
                  userRole={userRole}
                  studentList={studentList}
                  selectedStudentKey={selectedTemplateKey}
                  onSelectStudent={handleTemplateSelection}
                  onAddStudent={handleAddStudent}
                  onDeleteStudent={handleDeleteStudent}
                />

                {/* Supportive instructional banner */}
                <div className="no-print bg-zinc-900 border border-zinc-800 p-3.5 rounded-none flex gap-3 text-xs leading-relaxed text-zinc-300">
                  <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-extrabold text-zinc-100 uppercase text-[10px] tracking-wide block mb-0.5">Panduan Sinkronisasi Guru:</span> 
                    {` Mengedit nilai atau absensi pada panel di atas akan memperbarui tampilan lembar rapor F4 / Folio di samping secara instan. Silakan periksa kembali ketepatan data NIP, NISN, serta nama lengkap sebelum melakukan pencetakan PDF.`}
                  </div>
                </div>
              </div>

              {/* Column Right: Live Paper Sheet Preview (Visible on desktop or when toggled in mobile) */}
              <div className={`lg:col-span-7 ${mobileView === 'preview' ? 'block' : 'hidden lg:block'} print:block print:w-full print:col-span-12 print:p-0 print:m-0`}>
                <RaporPreview data={raporData} paperSize={paperSize} />
              </div>

            </div>
          </>
        ) : (
          <div className="w-full print:block animate-fadeIn">
            <LegerNilai 
              studentList={studentList}
              getStudentRaporData={getStudentRaporData}
              activeStudentKey={selectedTemplateKey}
              onSelectStudent={handleTemplateSelection}
              paperSize={paperSize}
              schoolName={raporData.school.schoolName || 'SMP NEGERI 7 SENTANI'}
            />
          </div>
        )}
      </main>

      {/* Floating Action Button for PDF Download on Mobile */}
      <button
        onClick={handleDownloadPdf}
        disabled={isGeneratingPdf}
        className="no-print fixed bottom-22 right-6 md:hidden bg-sky-700 disabled:bg-sky-900 text-white p-3 shadow-2xl rounded-sm flex items-center justify-center border border-sky-500 disabled:border-sky-800 active:scale-95 transition-all z-40"
        title="Unduh PDF Berkas Rapor"
      >
        {isGeneratingPdf ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <FileDown className="w-5 h-5" />
        )}
      </button>

      {/* Floating Action Button for print - absolute convenience on mobile */}
      <button
        onClick={handlePrint}
        className="no-print fixed bottom-6 right-6 md:hidden bg-emerald-700 text-white p-3 shadow-2xl rounded-sm flex items-center justify-center border border-emerald-500 active:scale-95 transition-all z-40"
        title="Cetak Rapor (Ctrl+P)"
      >
        <Printer className="w-5 h-5" />
      </button>

      {/* Standardized Bottom Information Stamp */}
      <footer className="no-print py-4 border-t border-zinc-900 text-center text-zinc-650 text-[9px] font-mono bg-zinc-950 uppercase tracking-widest">
        <p>Aplikasi Rapor Kurikulum Merdeka Terintegrasi • Merujuk Buku Saku Kemdikbudristek RI</p>
        <p className="mt-0.5 text-zinc-700">Copyright © 2026. All rights preserved.</p>
      </footer>

      {/* Offscreen container for single student PDF high-fidelity rendering, located in normal coordinate bounds but hidden on the lowest z-index layer to prevent browser viewport culling / blank layers */}
      <div 
        id="pdf-offscreen-container" 
        className="absolute left-0 top-0 w-[215mm] opacity-100 overflow-visible no-print bg-white" 
        style={{ zIndex: -9999, pointerEvents: 'none', userSelect: 'none' }}
      >
        <RaporPreview data={raporData} isPdfMode={true} paperSize={paperSize} />
      </div>

      {/* High-fidelity sequential offscreen container for pristine and memory-safe bulk PDF rendering of registered students, avoiding DOM overload and browser canvas limit issues */}
      {bulkData && (
        <div 
          id="pdf-bulk-single-offscreen-container" 
          className="absolute left-0 top-0 w-[215mm] opacity-100 overflow-visible no-print bg-white" 
          style={{ zIndex: -9999, pointerEvents: 'none', userSelect: 'none' }}
        >
          <RaporPreview data={bulkData} isPdfMode={true} idPrefix="bulk-temp-" paperSize={paperSize} />
        </div>
      )}

      {/* Admin Login Modal Overlay */}
      {isAdminLoginOpen && (
        <div className="no-print fixed inset-0 bg-black/85 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn select-none">
          <div className="bg-zinc-900 border border-zinc-750 p-6 rounded-sm w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-sky-400">
              <span className="p-1.5 bg-sky-950 border border-sky-850 rounded-sm">
                <Users className="w-5 h-5 text-sky-450" />
              </span>
              <div>
                <h3 className="text-xs font-black text-white uppercase tracking-wider">Login Administrator</h3>
                <p className="text-[10px] text-zinc-400 leading-none mt-0.5 font-medium">Ubah pengaturan kurikulum & profil sekolah</p>
              </div>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-3.5 pt-1">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wide">Nama Pengguna (Username)</label>
                <input
                  type="text"
                  required
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full h-9 bg-zinc-950 text-white p-2.5 rounded border border-zinc-800 text-xs focus:outline-none focus:border-zinc-650 font-medium"
                  placeholder="Masukkan username admin..."
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 block uppercase tracking-wide">Kata Sandi (Password)</label>
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full h-9 bg-zinc-950 text-white p-2.5 rounded border border-zinc-800 text-xs focus:outline-none focus:border-zinc-650 font-mono"
                  placeholder="Masukkan password admin..."
                />
              </div>

              {loginError && (
                <div className="text-[10px] sm:text-[10.5px] font-bold text-red-400 bg-red-950/20 border border-red-900/40 p-2.5 rounded-sm leading-relaxed">
                  ⚠️ {loginError}
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAdminLoginOpen(false)}
                  className="text-xs font-bold text-zinc-400 hover:text-zinc-200 px-3.5 py-1.5 rounded cursor-pointer transition select-none uppercase font-sans"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="bg-sky-700 hover:bg-sky-600 text-white font-extrabold text-[11px] py-1.5 px-4 rounded border border-sky-600 hover:border-sky-500 transition-all cursor-pointer uppercase shadow font-sans"
                >
                  Masuk Admin
                </button>
              </div>
            </form>

            <div className="bg-zinc-950 p-2.5 rounded border border-zinc-850 flex flex-col gap-1 mt-2">
              <span className="text-[9px] font-extrabold text-sky-400 uppercase tracking-widest block">💡 Petunjuk Masuk (Credentials):</span>
              <p className="text-[10px] leading-relaxed text-zinc-550 font-mono">
                Pengguna: <strong className="font-bold text-sky-350">admin</strong><br />
                Sandi: <strong className="font-bold text-sky-350">admin123</strong>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
