/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SchoolInfo } from '../types';

interface SchoolHeaderProps {
  school: SchoolInfo;
}

export default function SchoolHeader({ school }: SchoolHeaderProps) {
  const hasPemdaLogo = school.pemdaLogoUrl && school.pemdaLogoUrl.trim() !== '';
  const hasSchoolLogo = school.schoolLogoUrl && school.schoolLogoUrl.trim() !== '';

  return (
    <div className="w-full text-black mb-2">
      {/* Top row containing logos and central school administration typography */}
      <div className="flex items-center gap-3 pb-2 w-full">
        {/* Ministry Logo / School Logo Seal (No circle / border frame) */}
        <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center p-1 bg-transparent">
          {hasPemdaLogo ? (
            <img
              src={school.pemdaLogoUrl}
              alt="Logo Pemda"
              className="max-w-full max-h-full object-contain"
              referrerPolicy="no-referrer"
            />
          ) : school.logoType === 'standard' ? (
            // SVG representation of Tut Wuri Handayani / Ministry of Education symbol (stylized)
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-zinc-900"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {/* Outer circle */}
              <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="2" />
              <circle cx="50" cy="50" r="42" stroke="currentColor" strokeWidth="1" strokeDasharray="3 2" />
              
              {/* Stylized flame / light of education */}
              <path
                d="M50,22 C43,35 34,45 34,58 C34,68 41,74 50,74 C59,74 66,68 66,58 C66,45 57,35 50,22 Z"
                fill="none"
                stroke="rgb(39, 39, 42)"
                strokeWidth="2"
              />
              
              {/* Book symbol */}
              <path
                d="M26,62 C38,58 50,62 50,62 C50,62 62,58 74,62 M26,68 C38,64 50,68 50,68 C50,68 62,64 74,68"
                stroke="rgb(9, 9, 11)"
                strokeWidth="2.5"
              />
              {/* Center spine */}
              <line x1="50" y1="62" x2="50" y2="74" stroke="rgb(9, 9, 11)" strokeWidth="2.5" />
              
              {/* Tiny stars or decoration */}
              <polygon points="50,14 52,18 48,18" fill="rgb(39, 39, 42)" stroke="none" />
              
              {/* Inner Ring Text - stylized lines */}
              <path d="M 22 50 A 28 28 0 0 1 78 50" stroke="#a1a1aa" strokeWidth="1" />
            </svg>
          ) : school.logoType === 'modern' ? (
            // Modern minimal shield emblem
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-zinc-900"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
            >
              <path d="M50,10 L85,25 L85,55 C85,75 70,90 50,95 C30,90 15,75 15,55 L15,25 Z" fill="none" stroke="currentColor" strokeWidth="4" />
              <path d="M50,22 L73,34 L73,53 C73,66 63,77 50,82 C37,77 27,66 27,53 L27,34 Z" fill="#e4e4e7" stroke="currentColor" strokeWidth="1.5" />
              <text x="50" y="55" textAnchor="middle" fill="currentColor" fontWeight="bold" fontSize="16" fontFamily="sans-serif">SMP</text>
              <path d="M35,65 Q50,70 65,65" fill="none" stroke="currentColor" strokeWidth="3" />
            </svg>
          ) : (
            // Custom generic school badge
            <svg
              viewBox="0 0 100 100"
              className="w-full h-full text-zinc-900"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
            >
              <polygon points="50,10 90,35 90,75 50,95 10,75 10,35" stroke="currentColor" fill="none" />
              <circle cx="50" cy="50" r="22" stroke="currentColor" strokeDasharray="3 3" />
              <path d="M40,43 L50,33 L60,43 M35,50 H65 M40,57 L50,67 L60,57" stroke="currentColor" />
            </svg>
          )}
        </div>
   
        {/* School Name & Contact Header info */}
        <div className="flex-1 text-center font-sans">
          <h3 className="text-[14.5px] font-bold tracking-wide text-zinc-850 leading-tight uppercase">
            PEMERINTAH KABUPATEN JAYAPURA
          </h3>
          <h2 className="text-[15.5px] font-extrabold tracking-wide text-zinc-950 leading-tight uppercase mt-0.5">
            DINAS PENDIDIKAN
          </h2>
          <h1 className="text-[21px] font-black tracking-tight text-zinc-950 leading-tight uppercase mt-1.5">
            {school.schoolName}
          </h1>
          <p className="text-[12.5px] font-mono text-zinc-850 font-bold tracking-wider mt-1">
            NPSN: {school.npsn || 'N/A'} {' • '} STATUS: {(school.schoolStatus || (school.schoolName.toUpperCase().includes('NEGERI') ? 'Negeri' : 'Swasta')).toUpperCase()} {' • '} AKREDITASI: {school.accreditation || 'A'}
          </p>
          <p className="text-[12.5px] text-zinc-950 mt-1 font-bold leading-tight">
            {school.address}
          </p>
          <p className="text-[10.5px] text-zinc-800 font-bold leading-tight mt-0.5 whitespace-nowrap overflow-hidden text-ellipsis">
            Telp: {school.phone || '-'} {' • '} Email: {school.email || '-'} {' • '} Website: {school.website || '-'}
          </p>
        </div>
   
        {/* Right side logo (dynamic custom or standard placeholder, no circle frame) */}
        <div className="flex-shrink-0 w-20 h-20 flex items-center justify-center">
          {hasSchoolLogo ? (
            <div className="w-full h-full flex items-center justify-center p-1 bg-transparent">
              <img
                src={school.schoolLogoUrl}
                alt="Logo Sekolah"
                className="max-w-full max-h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="text-center border border-zinc-400 p-1 font-mono text-[8.5px] uppercase leading-none text-zinc-500 bg-zinc-50">
              <div>Rapor</div>
              <div className="font-extrabold text-zinc-800 mt-0.5 text-[9.5px]">SMP</div>
              <hr className="my-0.5 border-zinc-300" />
              <div>Kurikulum</div>
              <div className="font-extrabold text-zinc-800 text-[8.5px]">Merdeka</div>
            </div>
          )}
        </div>
      </div>

      {/* Pristine authentic Kop Surat double borders - fully compatible with browser print & jsPDF */}
      <div className="border-t-[2.5px] border-zinc-950 w-full mb-[2px]"></div>
      <div className="border-t-[1px] border-zinc-950 w-full"></div>
    </div>
  );
}
