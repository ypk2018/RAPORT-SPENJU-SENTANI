/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RaporData, calculatePromotionDecision } from '../types';
import SchoolHeader from './SchoolHeader';

interface RaporPreviewProps {
  data: RaporData;
  isPdfMode?: boolean;
  idPrefix?: string;
  paperSize?: 'A4' | 'F4';
}

export default function RaporPreview({ data, isPdfMode = false, idPrefix = "", paperSize = "F4" }: RaporPreviewProps) {
  const { school, student, grades = [], p5, extracurriculars = [], attendance, signatures, kktp, teacherNotes } = data;
  const prefix = idPrefix ? `${idPrefix}-` : '';

  const gradesPage1 = grades;

  const isA4 = paperSize === 'A4';
  const widthClass = isA4 ? "w-[210mm]" : "w-[215mm]";
  const heightClass = isA4 ? "min-h-[297mm] max-h-[297mm]" : "min-h-[330mm] max-h-[330mm]";
  const paddingClass = isA4 ? "pt-[6mm] pb-[6mm] px-[12mm]" : "pt-[8mm] pb-[8mm] px-[12mm]";

  const pdfPageClass = `bg-white text-black overflow-hidden relative flex flex-col justify-start box-border ${widthClass} ${heightClass} ${paddingClass}`;
  const screenPageClass = `print-area bg-white text-black mx-auto shadow-2xl rounded-none border-none relative flex flex-col justify-start overflow-hidden box-border ${widthClass} ${heightClass} ${paddingClass}`;

  const getFaseAndClass = (studentClass: string) => {
    const cls = studentClass.toUpperCase();
    let fase = "Fase D";
    let kelas = "Kelas VII";
    
    if (cls.includes('VII') || cls.includes('VIII') || cls.includes('IX') || cls.includes('7') || cls.includes('8') || cls.includes('9')) {
      fase = "Fase D";
      if (cls.includes('VII') || cls.includes('7')) {
        kelas = "Kelas VII";
      } else if (cls.includes('VIII') || cls.includes('8')) {
        kelas = "Kelas VIII";
      } else if (cls.includes('IX') || cls.includes('9')) {
        kelas = "Kelas IX";
      } else {
        kelas = "Kelas Menengah";
      }
    } else {
      if (cls.includes('I') || cls.includes('1')) {
        fase = "Fase A";
        kelas = "Kelas I";
      } else if (cls.includes('II') || cls.includes('2')) {
        fase = "Fase A";
        kelas = "Kelas II";
      } else if (cls.includes('III') || cls.includes('3')) {
        fase = "Fase B";
        kelas = "Kelas III";
      } else if (cls.includes('IV') || cls.includes('4')) {
        fase = "Fase B";
        kelas = "Kelas IV";
      } else if (cls.includes('V') || cls.includes('5')) {
        fase = "Fase C";
        kelas = "Kelas V";
      } else if (cls.includes('VI') || cls.includes('6')) {
        fase = "Fase C";
        kelas = "Kelas VI";
      }
    }
    return { fase, kelas };
  };

  const { fase: currentFase, kelas: currentKelas } = getFaseAndClass(student.studentClass);

  const checkIsSemesterGenap = (semesterString: string) => {
    const sem = semesterString.toUpperCase();
    return sem.includes('2') || sem.includes('GENAP') || sem.includes('DUA') || sem.includes('II');
  };

  const isGenap = checkIsSemesterGenap(student.semester);

  return (
    <div className={isPdfMode ? "flex flex-col gap-0 w-full bg-white border-none text-black p-0 relative" : "flex flex-col gap-10 w-full mt-4 bg-slate-900 border-none print:bg-transparent print:mt-0 print:gap-0 print:p-0 print:block print:w-full"}>
      
      {/* ==================== LEMBAR 1: DATA SISWA & NILAI AKADEMIK ==================== */}
      <div 
        id={isPdfMode ? `${prefix}pdf-rapor-page-1` : `${prefix}rapor-page-1`} 
        data-page-number="1"
        className={isPdfMode ? pdfPageClass : screenPageClass}
      >
        <div className="flex flex-col gap-1 w-full h-full justify-between">
          <div className="flex flex-col gap-1 w-full">
            {/* Official School Header */}
            <SchoolHeader school={school} />

            {/* Heading */}
            <div className="text-center mt-1 mb-3.5">
              <h2 className="text-[12px] font-black tracking-wide uppercase font-sans text-black leading-tight">
                LAPORAN HASIL BELAJAR (RAPOR)
              </h2>
              <p className="text-[10px] font-mono font-bold text-zinc-900 mt-0.5 leading-none">
                SEMESTER {student.semester.toUpperCase()} - TAHUN PELAJARAN {student.academicYear}
              </p>
            </div>

            {/* Student details block */}
            <div className="grid grid-cols-2 gap-x-4 gap-y-[3px] text-[10px] border-2 border-zinc-950 p-1.5 py-1 bg-zinc-50/50 mb-1 leading-tight text-black">
              <div className="grid grid-cols-12 gap-x-1.5 gap-y-0.5">
                <div className="col-span-4 font-extrabold text-zinc-950">Nama Lengkap</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-7 font-black text-black uppercase">{student.name}</div>

                <div className="col-span-4 font-extrabold text-zinc-950">NIS (Induk)</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-7 font-mono font-bold">{student.nis}</div>

                <div className="col-span-4 font-extrabold text-zinc-950">NISN</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-7 font-mono font-bold">{student.nisn}</div>

                <div className="col-span-4 font-extrabold text-zinc-950">Lahir</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-7 font-semibold">{student.birthPlace}, {student.birthDate}</div>
              </div>

              <div className="grid grid-cols-12 gap-x-1.5 gap-y-0.5">
                <div className="col-span-4 font-extrabold text-zinc-950">Kelas / Fase</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-7 font-black text-black">{student.studentClass} / {currentFase}</div>

                <div className="col-span-4 font-extrabold text-zinc-950">Semester</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-7 font-semibold">{student.semester}</div>

                <div className="col-span-4 font-extrabold text-zinc-950">Orang Tua / Wali</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-7 font-black">{student.fatherName} & {student.motherName}</div>

                <div className="col-span-4 font-extrabold text-zinc-950">Pekerjaan Ot.</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-7 font-semibold">{student.parentOccupation}</div>
              </div>
            </div>

            {/* Table A: Academic Subject Grades */}
            <div className="mb-0.5">
              <h3 className="text-[12px] font-black uppercase text-black mb-1 flex items-center gap-2 pb-0.5 border-b border-zinc-300">
                <span>A. CAPAIAN INTELEKTUAL & MATA PELAJARAN</span>
                <span className="text-[10px] font-mono font-bold text-zinc-800 uppercase">(KKTP: {kktp})</span>
              </h3>
              
              <table className="w-full text-left border-collapse border-2 border-zinc-950 text-[10.5px] text-black table-fixed">
                <thead>
                  <tr className="bg-zinc-100/90 text-center text-[9.5px] font-black uppercase text-black border-b-2 border-zinc-950">
                    <th className="border-r border-zinc-950 py-1 px-0.5 w-[26px]">No</th>
                    <th className="border-r border-zinc-950 py-1 px-1.5 text-left w-[115px]">Mata Pelajaran</th>
                    <th className="border-r border-zinc-950 py-1 px-0.5 w-[58px] break-normal whitespace-pre-wrap leading-tight">Kognitif<br/>(K)</th>
                    <th className="border-r border-zinc-950 py-1 px-0.5 w-[68px] break-normal whitespace-pre-wrap leading-tight">Psikomotor<br/>(S)</th>
                    <th className="border-r border-zinc-950 py-1 px-0.5 text-center w-[60px] bg-zinc-200/50 leading-tight">Nilai Akhir<br/>(NA)</th>
                    <th className="border-r border-zinc-950 py-1 px-0.5 w-[52px] break-normal whitespace-pre-wrap leading-tight">Predikat</th>
                    <th className="py-1 px-2 text-left font-black">Deskripsi Kemajuan Belajar & Capaian Kompetensi</th>
                  </tr>
                </thead>
                <tbody>
                  {gradesPage1.map((g, index) => {
                    const isBelowKktp = g.score < kktp;
                    const knowledgeVal = g.knowledgeScore !== undefined ? g.knowledgeScore : g.score;
                    const skillsVal = g.skillsScore !== undefined ? g.skillsScore : g.score;
                    const isLast = index === gradesPage1.length - 1;
                    const cellBorderClass = isLast ? 'border-b-[2.5px] border-b-zinc-950 pb-0.5 pt-0.5' : 'border-b border-zinc-400 py-0.5';
                    return (
                      <tr key={g.id} className="hover:bg-zinc-50/50">
                        <td className={`border-r border-zinc-950 text-center font-mono font-bold text-black ${cellBorderClass} px-0.5`}>{index + 1}</td>
                        <td className={`border-r border-zinc-950 font-black text-black break-words whitespace-normal leading-tight text-[10px] ${cellBorderClass} px-1.5`}>{g.name}</td>
                        <td className={`border-r border-zinc-950 text-center font-mono font-semibold text-black ${cellBorderClass} px-0.5`}>{knowledgeVal}</td>
                        <td className={`border-r border-zinc-950 text-center font-mono font-semibold text-black ${cellBorderClass} px-0.5`}>{skillsVal}</td>
                        <td className={`border-r border-zinc-950 text-center font-black font-mono bg-zinc-50 ${cellBorderClass} px-0.5 ${isBelowKktp ? 'text-rose-700 bg-rose-50 font-black' : 'text-zinc-950'}`}>
                          {g.score}
                        </td>
                        <td className={`border-r border-zinc-950 text-center font-black ${cellBorderClass} px-0.5 ${
                          g.predicate === 'A' ? 'text-emerald-800' : 
                          g.predicate === 'B' ? 'text-indigo-805' : 
                          g.predicate === 'C' ? 'text-amber-805' : 'text-rose-800 font-black'
                        }`}>
                          {g.predicate}
                        </td>
                        <td className={`${cellBorderClass} px-2 text-[9.5px] leading-tight font-medium text-black break-words whitespace-normal`}>
                          {g.description}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footnote Page 1 */}
          <div data-rapor-footer="1" className="mt-auto text-center font-mono text-[10.5px] text-zinc-900 select-none border-t border-zinc-350 pt-1 w-full font-bold animate-pulse-subtle">
            Halaman 1 dari 3 • Rapor Kurikulum Merdeka {school.schoolName}
          </div>
        </div>
      </div>

      {/* ==================== LEMBAR 2: EKSKUL, ABSENSI, CATATAN & TTD ==================== */}
      <div 
        id={isPdfMode ? `${prefix}pdf-rapor-page-2` : `${prefix}rapor-page-2`} 
        data-page-number="2"
        className={`${isPdfMode ? pdfPageClass : screenPageClass} page-break`}
        style={{ breakBefore: 'page', pageBreakBefore: 'always' }}
      >
        <div className="flex flex-col gap-2.5 w-full h-full justify-between">
          <div className="flex flex-col gap-2 w-full">
            {/* Header minimal for sheet 2 branding */}
            <div className="flex justify-between items-center border-b-2 border-zinc-950 pb-1 mb-1 text-black text-[11px] font-sans font-bold">
              <div>
                <span className="font-black uppercase text-black">{school.schoolName}</span>
                <span className="text-zinc-400 mx-2">|</span>
                <span className="text-zinc-900 font-mono font-bold text-[10px]">NPSN: {school.npsn}</span>
              </div>
              <div className="text-right font-mono font-bold text-[10px] text-zinc-900">
                Lanjutan Rapor Hasil Belajar • {student.name.toUpperCase()} ({student.nis})
              </div>
            </div>



            {/* Table B & C Group */}
            <div className="mb-2 flex flex-row gap-4 w-full">
              {/* B: Extracurricular */}
              <div className="w-2/3">
                <h3 className="text-[12px] font-black uppercase text-black mb-1 pb-0.5 border-b border-zinc-300">
                  <span>B. KEGIATAN EKSTRAKURIKULER</span>
                </h3>
                <table className="w-full text-left border-collapse border-2 border-zinc-950 text-[11px] text-black">
                  <thead>
                    <tr className="bg-zinc-100/90 text-center text-[11px] font-black uppercase text-black border-b-2 border-zinc-950">
                      <th className="border-r border-zinc-950 py-1 px-1.5 w-8">No</th>
                      <th className="border-r border-zinc-950 py-1 px-2 text-left">Jenis Kegiatan</th>
                      <th className="border-r border-zinc-950 py-1 px-1.5 w-16">Predikat</th>
                      <th className="py-1 px-2 text-left">Deskripsi Keterampilan & Capaian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extracurriculars.map((e, index) => (
                      <tr key={e.id} className="border-t border-zinc-950">
                        <td className="border-r border-zinc-950 py-1 px-1 text-center font-mono font-bold text-black">{index + 1}</td>
                        <td className="border-r border-zinc-950 py-1 px-2 font-black text-black">{e.name}</td>
                        <td className="border-r border-zinc-950 py-1 px-1 text-center font-black text-black">{e.grade}</td>
                        <td className="py-1 px-2 text-zinc-900 font-medium leading-tight">{e.description}</td>
                      </tr>
                    ))}
                    {extracurriculars.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-2 px-2 text-center text-zinc-500 italic font-medium">Tidak ada ekstrakurikuler yang diikuti</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* C: Attendance */}
              <div className="w-1/3 flex flex-col justify-start">
                <h3 className="text-[12px] font-black uppercase text-black mb-1 pl-1 pb-0.5 border-b border-zinc-300">
                  <span>C. KETIDAKHADIRAN</span>
                </h3>
                <table className="w-full text-left border-collapse border-2 border-zinc-950 text-[11px] text-black">
                  <tbody>
                    <tr>
                      <td className="border-r border-zinc-950 py-1 px-2 font-bold text-zinc-909 bg-zinc-50/70">Sakit (S)</td>
                      <td className="border-r border-zinc-900 py-1 px-2 text-center w-10 font-mono font-black text-[12px] text-black">{attendance.sick}</td>
                      <td className="py-1 px-2 text-zinc-90-9 font-bold">Hari</td>
                    </tr>
                    <tr className="border-t border-zinc-950">
                      <td className="border-r border-zinc-950 py-1 px-2 font-bold text-zinc-909 bg-zinc-50/70">Izin (I)</td>
                      <td className="border-r border-zinc-900 py-1 px-2 text-center w-10 font-mono font-black text-[12px] text-black">{attendance.permit}</td>
                      <td className="py-1 px-2 text-zinc-90-9 font-bold">Hari</td>
                    </tr>
                    <tr className="border-t border-zinc-950">
                      <td className="border-r border-zinc-950 py-1 px-2 font-bold text-zinc-909 bg-zinc-50/70">Tanpa Keterangan (A)</td>
                      <td className="border-r border-zinc-900 py-1 px-2 text-center w-10 font-mono font-black text-[12px] text-rose-800 bg-rose-50/30">{attendance.alpha}</td>
                      <td className="py-1 px-2 text-zinc-90-9 font-bold">Hari</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* D: Class Teacher Notes */}
            <div className="mb-2">
              <h3 className="text-[12px] font-black uppercase text-black mb-1 pb-0.5 border-b border-zinc-300">
                <span>D. CATATAN PERKEMBANGAN & SARAN WALI KELAS</span>
              </h3>
              <div className="border-2 border-zinc-950 p-2 bg-zinc-50 text-[11.5px] leading-relaxed text-black italic font-bold">
                "{teacherNotes}"
              </div>
            </div>

            {/* E: KKTP & Promotion Decision Section */}
            <div className="mb-2 flex flex-row gap-4 w-full">
              <div className={`border-2 border-zinc-950 p-2 bg-zinc-50/50 ${isGenap ? 'w-1/2' : 'w-full'}`}>
                <h3 className="text-[11.5px] font-black uppercase text-black mb-0.5 border-b border-zinc-200 pb-0.5">
                  Kriteria Ketuntasan (KKTP)
                </h3>
                <p className="text-[10.5px] text-zinc-900 leading-tight mb-1 text-justify font-medium">
                  Kriteria Ketercapaian Tujuan Pembelajaran (KKTP) minimum kelulusan ({currentFase} {currentKelas}).
                </p>
                <div className="flex items-center justify-between font-mono bg-white p-1 border border-zinc-950 text-[11px]">
                  <span className="font-extrabold text-zinc-805">KKTP Sekolah:</span>
                  <span className="text-[11.5px] font-black text-blue-900 bg-blue-50/50 border px-1.5 border-blue-400">{kktp} Poin</span>
                </div>
              </div>

              {isGenap && (() => {
                const calc = calculatePromotionDecision(grades, student.studentClass, school.schoolName || 'SMP NEGERI 7 SENTANI');
                const displayDecision = calc.decision;
                const isPromoted = calc.isPromoted;

                return (
                  <div className="border-2 border-zinc-950 w-1/2 p-2 bg-zinc-50/50 relative">
                    <h3 className="text-[11.5px] font-black uppercase text-black mb-0.5 border-b border-zinc-200 pb-0.5">
                      KEPUTUSAN AKHIR (KENAIKAN KELAS)
                    </h3>
                    <p className="text-[10.5px] text-zinc-900 leading-tight mb-1 text-justify font-medium">
                      Berdasarkan pemenuhan kriteria hasil pembelajaran pada Semester 1 dan 2:
                    </p>
                    <div className={`border p-1 text-center ${isPromoted ? 'border-emerald-500 bg-emerald-50/30' : 'border-rose-500 bg-rose-50/30'}`}>
                      <span className={`text-[11.5px] font-black uppercase block ${isPromoted ? 'text-emerald-950' : 'text-rose-950'}`}>
                        {displayDecision}
                      </span>
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* F: Parent Comment Board */}
            <div className="border-2 border-zinc-950 p-2 bg-zinc-50/50 text-[11px] mb-1.5 leading-tight">
              <h3 className="text-[12px] font-black uppercase text-black mb-0.5 border-b border-zinc-200 pb-0.5">
                E. CATATAN & SARAN BALIK ORANG TUA / WALI
              </h3>
              <p className="text-[10px] text-zinc-800 italic mb-1 font-semibold">
                (Ditulis secara manual oleh orang tua/wali siswa sebagai jembatan komunikasi timbal balik sekolah)
              </p>
              <div className="border border-zinc-350 border-dashed h-12 bg-white select-none" />
            </div>

            {/* Signature Area */}
            <div className="mt-2 text-black pt-1.5 border-t border-zinc-350 w-full break-inside-avoid">
              <div className="text-right text-[11px] mb-1 mr-4 font-sans font-black text-black">
                {signatures.locationAndDate}
              </div>
              <div className="flex flex-row justify-between text-center text-[11px] text-black gap-4 leading-normal w-full">
                <div className="flex-1">
                  <p className="font-bold">Mengetahui,</p>
                  <p className="font-extrabold text-zinc-900 text-[11px]">Orang Tua / Wali Siswa</p>
                  <div className="h-12 flex items-end justify-center">
                    {/* Space for parent signature */}
                  </div>
                  <p className="font-black mt-1 text-[11px] text-black">
                    ( {student.fatherName || '__________'} )
                  </p>
                </div>

                <div className="flex-1">
                  <p className="font-bold">Menyetujui,</p>
                  <p className="font-extrabold text-zinc-900 text-[11px]">Kepala {school.schoolName}</p>
                  <div className="h-12 flex items-end justify-center">
                    {/* Space for stamp/signature */}
                  </div>
                  <p className="font-black mt-1 text-[11px] text-black underline">
                    {signatures.principalName}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-900 font-bold">NIP {signatures.principalNip}</p>
                </div>

                <div className="flex-1">
                  <p className="font-bold">&nbsp;</p>
                  <p className="font-extrabold text-zinc-900 text-[11px]">Wali Kelas {student.studentClass}</p>
                  <div className="h-12 flex items-end justify-center">
                    {/* Space for teacher signature */}
                  </div>
                  <p className="font-black mt-1 text-[11px] text-black underline">
                    {signatures.classTeacherName}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-900 font-bold">NIP {signatures.classTeacherNip}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footnote Page 2 */}
          <div data-rapor-footer="2" className="mt-auto text-center font-mono text-[10.5px] text-zinc-900 select-none border-t border-zinc-350 pt-1 w-full font-bold">
            Halaman 2 dari 3 • Rapor Kurikulum Merdeka {school.schoolName}
          </div>
        </div>
      </div>

      {/* ==================== LEMBAR 3: LAPORAN PROJEK P5 & TTD ==================== */}
      <div 
        id={isPdfMode ? `${prefix}pdf-rapor-page-3` : `${prefix}rapor-page-3`} 
        data-page-number="3"
        className={`${isPdfMode ? pdfPageClass : screenPageClass} page-break`}
        style={{ breakBefore: 'page', pageBreakBefore: 'always' }}
      >
        <div className="flex flex-col gap-2.5 w-full h-full justify-between">
          <div className="flex flex-col gap-2 w-full">
            {/* Header minimal for sheet 3 branding */}
            <div className="flex justify-between items-center border-b-2 border-zinc-950 pb-1 mb-1 text-black text-[11px] font-sans font-bold">
              <div>
                <span className="font-black uppercase text-black">{school.schoolName}</span>
                <span className="text-zinc-400 mx-2">|</span>
                <span className="text-zinc-900 font-mono font-bold text-[10px]">NPSN: {school.npsn}</span>
              </div>
              <div className="text-right font-mono font-bold text-[10px] text-zinc-900">
                P5 Project Report • {student.name.toUpperCase()} ({student.nis})
              </div>
            </div>

            {/* Heading */}
            <div className="text-center my-1 text-black">
              <h2 className="text-[12.5px] font-black tracking-wide uppercase font-sans leading-tight">
                LAPORAN PROJEK PENGUATAN PROFIL PELAJAR PANCASILA (P5)
              </h2>
              <p className="text-[10.5px] font-mono font-bold text-zinc-900 mt-0.5 leading-none">
                {currentFase.toUpperCase()} • SEMESTER {student.semester.toUpperCase()} • TAHUN PELAJARAN {student.academicYear}
              </p>
            </div>

            {/* Info P5 Project Area */}
            <div className="border-2 border-zinc-950 p-2 bg-zinc-50/50 mb-1.5 text-[11px] leading-normal text-black font-semibold">
              <div className="grid grid-cols-12 gap-y-0.5">
                <div className="col-span-3 font-extrabold text-zinc-950">Tema Projek</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-8 font-black text-black">{p5.theme}</div>

                <div className="col-span-3 font-extrabold text-zinc-950">Judul Projek</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-8 font-black text-zinc-900 italic">"{p5.title}"</div>

                <div className="col-span-3 font-extrabold text-zinc-950">Alokasi Waktu</div>
                <div className="col-span-1 text-center font-bold">:</div>
                <div className="col-span-8 font-mono font-black text-zinc-950">{p5.durationJp} Jam Pelajaran (JP)</div>
              </div>
            </div>

            {/* Dimension Tables */}
            <div className="mb-1.5">
              <h3 className="text-[11.5px] font-black uppercase text-black mb-1 flex items-center gap-1.5 font-sans border-b border-zinc-300 pb-0.5">
                <span>Dimensi & Target Capaian Profil Pelajar Pancasila</span>
              </h3>

              <table className="w-full text-left border-collapse border-2 border-zinc-950 text-[11px] text-black">
                <thead>
                  <tr className="bg-zinc-100/90 text-center text-[10.5px] font-black uppercase text-black border-b-2 border-zinc-950">
                    <th className="border-r border-zinc-950 py-1 px-1.5 w-8">No</th>
                    <th className="border-r border-zinc-950 py-1 px-2 text-left w-[28%]">Dimensi Profil</th>
                    <th className="border-r border-zinc-950 py-1 px-2 text-left">Sub-Elemen & Sasaran Target Kompetensi</th>
                    <th className="py-1 px-2 w-28">Ketercapaian</th>
                  </tr>
                </thead>
                <tbody>
                  {p5.dimensionsDetails.map((dim, idx) => (
                    <tr key={idx} className="border-t border-zinc-950 hover:bg-zinc-50/50">
                      <td className="border-r border-zinc-950 py-0.5 px-1 text-center font-mono font-bold text-black">{idx + 1}</td>
                      <td className="border-r border-zinc-950 py-0.5 px-2 font-black text-zinc-950 bg-zinc-50/30">{dim.dimension}</td>
                      <td className="border-r border-zinc-950 py-0.5 px-2 text-[10.5px] leading-tight font-medium text-black">{dim.target}</td>
                      <td className="py-0.5 px-2 text-center">
                        <span className={`inline-block px-1.5 py-0.5 text-[9.5px] font-black tracking-tight border-2 ${
                          dim.achievement === 'Sangat Berkembang' 
                            ? 'bg-emerald-50 text-emerald-900 border-emerald-400' 
                            : dim.achievement === 'Berkembang Sesuai Harapan'
                            ? 'bg-blue-50 text-blue-900 border-blue-400'
                            : dim.achievement === 'Mulai Berkembang'
                            ? 'bg-amber-50 text-amber-900 border-amber-400'
                            : 'bg-rose-50 text-rose-900 border-rose-400'
                        }`}>
                          {dim.achievement.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Project Summary Textbox */}
            <div className="mb-2">
              <h3 className="text-[12px] font-black uppercase text-black mb-0.5 pl-1 font-sans">
                Catatan Deskripsi Projek (P5)
              </h3>
              <div className="border-2 border-zinc-950 p-2 bg-zinc-50 text-[11.5px] leading-relaxed text-black italic font-bold">
                "{p5.summary}"
              </div>
              <div className="flex gap-2 text-[10px] text-zinc-900 font-bold font-mono mt-1 px-1">
                <span>*Keterangan Ketercapaian P5:</span>
                <span><strong>BB:</strong> Belum Berkembang</span> |
                <span><strong>MB:</strong> Mulai Berkembang</span> |
                <span><strong>BSH:</strong> Berkembang Sesuai Harapan</span> |
                <span><strong>SB:</strong> Sangat Berkembang</span>
              </div>
            </div>

            {/* Signature Area P5 */}
            <div className="mt-2 text-black pt-1.5 border-t border-zinc-350 w-full break-inside-avoid">
              <div className="text-right text-[11px] mb-1 mr-4 font-sans font-black text-black">
                {signatures.locationAndDate}
              </div>
              <div className="flex flex-row justify-between text-center text-[11px] text-black gap-4 leading-normal w-full">
                <div className="flex-1">
                  <p className="font-extrabold text-zinc-900 text-[11px]">Wali Kelas {student.studentClass}</p>
                  <div className="h-12 flex items-end justify-center">
                    {/* Space for teacher signature */}
                  </div>
                  <p className="font-black mt-1 text-[11px] text-black underline leading-none">
                    {signatures.classTeacherName}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-900 font-bold leading-none mt-1">NIP {signatures.classTeacherNip}</p>
                </div>

                <div className="flex-1">
                  <p className="font-extrabold text-zinc-900 text-[11px]">Kepala {school.schoolName}</p>
                  <div className="h-12 flex items-end justify-center">
                    {/* Space for principal signature */}
                  </div>
                  <p className="font-black text-[11px] text-black underline leading-none mt-1">
                    {signatures.principalName}
                  </p>
                  <p className="text-[10px] font-mono text-zinc-900 font-bold leading-none mt-1">NIP {signatures.principalNip}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footnote Page 3 */}
          <div data-rapor-footer="3" className="mt-auto text-center font-mono text-[10.5px] text-zinc-900 select-none border-t border-zinc-350 pt-1 w-full font-bold">
            Halaman 3 dari 3 • Rapor Kurikulum Merdeka {school.schoolName}
          </div>
        </div>
      </div>

    </div>
  );
}
