/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { RaporData } from './types';

export const initialDataTemplates: Record<string, RaporData> = {
  template_budi: {
    school: {
      schoolName: "SMP NEGERI 7 SENTANI",
      npsn: "60300165",
      address: "Jl. BTN Sosial BPD Gunung, Distrik Sentani Kab. Jayapura - Papua",
      phone: "(0967) 518394",
      email: "info@spenjusentani.sch.id",
      website: "www.spenjusentani.sch.id",
      logoType: "standard",
      accreditation: "B",
      schoolStatus: "Negeri"
    },
    student: {
      name: "Budi Santoso",
      nis: "240822",
      nisn: "0145893412",
      birthPlace: "Sentani",
      birthDate: "12 Maret 2012",
      studentClass: "VIII-A",
      semester: "2 (Dua)",
      academicYear: "2025/2026",
      fatherName: "Andi Santoso",
      motherName: "Sari Pertiwi",
      parentOccupation: "Karyawan Swasta"
    },
    grades: [
      {
        id: "mapel_1",
        code: "PABP",
        name: "Pendidikan Agama dan Budi Pekerti",
        score: 88,
        predicate: "A",
        description: "Menunjukkan pemahaman yang sangat baik dalam membaca Al-Qur'an dengan tartil, menghafal surat-surat pendek, serta meneladani toleransi antarumat beragama dalam kehidupan sehari-hari."
      },
      {
        id: "mapel_2",
        code: "PKN",
        name: "Pendidikan Kewarganegaraan",
        score: 85,
        predicate: "B",
        description: "Menunjukkan pemahaman baik dalam mengidentifikasi simbol-simbol Republik Indonesia, menghargai keberagaman suku dan budaya di lingkungan sekitar, serta menerapkan aturan kenegaraan harian."
      },
      {
        id: "mapel_3",
        code: "BINDO",
        name: "Bahasa Indonesia",
        score: 82,
        predicate: "B",
        description: "Sangat baik dalam memahami gagasan pokok teks instruksi dan narasi. Perlu bimbingan lebih dalam memperkaya kosakata baru pada penulisan laporan pengamatan formal."
      },
      {
        id: "mapel_4",
        code: "MAT",
        name: "Matematika",
        score: 92,
        predicate: "A",
        description: "Menunjukkan penguasaan luar biasa dalam mengalikan dan membagi bilangan cacah besar, menghitung luas & keliling bangun datar, serta menyajikan data dalam bentuk diagram batang."
      },
      {
        id: "mapel_5",
        code: "IPA",
        name: "Ilmu Pengetahuan Alam",
        score: 86,
        predicate: "B",
        description: "Menunjukkan pemahaman yang sangat baik tentang proses fotosintesis tumbuhan, siklus air, serta peninggalan kemajuan teknologi sains alam di Nusantara."
      },
      {
        id: "mapel_6",
        code: "IPS",
        name: "Ilmu Pengetahuan Sosial",
        score: 84,
        predicate: "B",
        description: "Menunjukkan pemahaman yang baik tentang interaksi manusia di masyarakat, kondisi geografis Indonesia, serta melestarikan peninggalan sejarah kerajaan Nusantara."
      },
      {
        id: "mapel_7",
        code: "BING",
        name: "Bahasa Inggris",
        score: 78,
        predicate: "C",
        description: "Cukup baik dalam memahami percakapan sehari-hari dan kosa kata tentang aktivitas di rumah (daily activities). Memerlukan latihan intensif dalam menulis kalimat interogatif sederhana."
      },
      {
        id: "mapel_8",
        code: "PJOK",
        name: "Pendidikan Jasmani, Olahraga dan Kesehatan",
        score: 80,
        predicate: "B",
        description: "Menunjukkan pemahaman dan keterampilan gerak dasar dalam olahraga cabang atletik, permainan bola besar, serta memahami pentingnya pola hidup bersih dan makanan bergizi seimbang."
      },
      {
        id: "mapel_9",
        code: "SENI",
        name: "Seni dan Prakarya",
        score: 83,
        predicate: "B",
        description: "Sangat baik dalam mengeksplorasi warna komplementer, merancang dekorasi kreatif dari bahan alam daur ulang, serta melakukan kegiatan prakarya mandiri yang fungsional."
      },
      {
        id: "mapel_10",
        code: "TIK",
        name: "Teknologi, Informasi dan Komunikasi (TIK)",
        score: 85,
        predicate: "B",
        description: "Menunjukkan pemahaman yang baik dalam mengoperasikan program pengolah dokumen dasar, mengenali perangkat keras komputer, serta mempraktikkan etika berselancar internet dasar."
      }
    ],
    p5: {
      theme: "Gaya Hidup Berkelanjutan",
      title: "Cerdik Mengolah Plastik di Lingkungan Sekolahku",
      durationJp: 72,
      dimensionsDetails: [
        {
          dimension: "Beriman, Bertakwa Kepada Tuhan YME, dan Berakhlak Mulia",
          target: "Membiasakan rasa bersyukur atas kelestarian alam sekitar dengan menjaga kebersihan lingkungan sekolah.",
          achievement: "Sangat Berkembang"
        },
        {
          dimension: "Gotong Royong",
          target: "Bekerja sama dalam kelompok untuk mengumpulkan, memilah, dan merancang kerajinan dari sampah botol plastik.",
          achievement: "Berkembang Sesuai Harapan"
        },
        {
          dimension: "Kreatif",
          target: "Menghasilkan karya seni fungsional (pot bunga hidroponik) yang orisinal dari limbah plastik botol bekas.",
          achievement: "Berkembang Sesuai Harapan"
        }
      ],
      summary: "Budi menunjukkan komitmen luar biasa selama projek. Ia secara mandiri memimpin teman-temannya dalam melakukan pemilahan sampah plastik di kelas dan berhasil membuat prototipe pot bunga gantung hidroponik dari limbah botol secara kreatif dan orisinal."
    },
    extracurriculars: [
      {
        id: "ext1",
        name: "Pramuka (Wajib)",
        grade: "Sangat Baik",
        description: "Aktif dalam setiap kegiatan perkemahan sabtu-minggu, menguasai teknik sandi morse dasar, serta menunjukkan kedisiplinan dan jiwa kepemimpinan dasadharma yang unggul."
      },
      {
        id: "ext2",
        name: "Olahraga (Bulutangkis)",
        grade: "Baik",
        description: "Menunjukkan kemajuan pesat dalam teknik dasar servis pendek, penempatan bola, serta memiliki sportifitas bermain ganda yang baik."
      },
      {
        id: "ext3",
        name: "Seni (Paduan Suara)",
        grade: "Baik",
        description: "Mampu menyelaraskan intonasi suara dua dalam lagu nasional dan daerah dengan harmoni yang baik selama pementasan seni sekolah."
      }
    ],
    attendance: {
      sick: 1,
      permit: 2,
      alpha: 0
    },
    signatures: {
      className: "VIII-A",
      classTeacherName: "Retno Wahyuni, S.Pd.",
      classTeacherNip: "19840512 201012 2 003",
      principalName: "MAIKEL PAUL WALLY, S.Pd",
      principalNip: "19781223 200312 1 006",
      locationAndDate: "Sentani, 19 Juni 2026"
    },
    kktp: 70,
    promotionDecision: "Naik ke Kelas IX (Sembilan)",
    teacherNotes: "Budi adalah siswa yang bersahaja, rajin, dan memiliki minat luar biasa di bidang Matematika. Kami sarankan Budi terus mengasah kemampuannya dalam penalaran logika serta lebih aktif berkontribusi dalam diskusi interaktif kelompok di kelas.",
    parentNotesPlaceholder: "Terima kasih atas bimbingan Ibu Wali Kelas dan guru-guru sekalian. Kami akan terus memotivasi Budi di rumah agar lebih percaya diri untuk berbicara di depan publik."
  },
  template_siti: {
    school: {
      schoolName: "SMP NEGERI 7 SENTANI",
      npsn: "60300165",
      address: "Jl. BTN Sosial BPD Gunung, Distrik Sentani Kab. Jayapura - Papua",
      phone: "(0967) 518394",
      email: "info@spenjusentani.sch.id",
      website: "www.spenjusentani.sch.id",
      logoType: "standard",
      accreditation: "B",
      schoolStatus: "Negeri"
    },
    student: {
      name: "Siti Rahma Aminah",
      nis: "240835",
      nisn: "0132890145",
      birthPlace: "Sentani",
      birthDate: "21 Agustus 2012",
      studentClass: "VII-A",
      semester: "2 (Dua)",
      academicYear: "2025/2026",
      fatherName: "Hasan Aminah",
      motherName: "Siti Maryam",
      parentOccupation: "PNS / Guru"
    },
    grades: [
      {
        id: "mapel_1",
        code: "PABP",
        name: "Pendidikan Agama dan Budi Pekerti",
        score: 93,
        predicate: "A",
        description: "Menunjukkan penguasaan sangat menonjol dalam hafalan doa harian secara fasih, serta mengamalkan perilaku terpuji jujur dan berbakti pada orang tua."
      },
      {
        id: "mapel_2",
        code: "PKN",
        name: "Pendidikan Kewarganegaraan",
        score: 88,
        predicate: "A",
        description: "Sangat baik dalam memahami musyawarah untuk mufakat, mengenali identitas diri dalam kemajemukan, serta berkontribusi positif dalam tugas piket kebersihan kelas."
      },
      {
        id: "mapel_3",
        code: "BINDO",
        name: "Bahasa Indonesia",
        score: 90,
        predicate: "A",
        description: "Menunjukkan kosa kata yang kaya, sangat fasih menulis karangan deskripsi bertema liburan keluarga, serta terampil melakukan wawancara mandiri dengan tokoh masyarakat."
      },
      {
        id: "mapel_4",
        code: "MAT",
        name: "Matematika",
        score: 80,
        predicate: "B",
        description: "Baik dalam mengidentifikasi jenis-jenis sudut dan mengukur sudut dengan busur derajat. Memerlukan latihan tambahan dalam menyelesaikan soal cerita tentang pecahan campuran."
      },
      {
        id: "mapel_5",
        code: "IPA",
        name: "Ilmu Pengetahuan Alam",
        score: 91,
        predicate: "A",
        description: "Menunjukkan penguasaan luar biasa dalam membedakan wujud zat beserta perubahannya, serta mengidentifikasi beragam fungsi dan keunikan gaya magnet dalam kehidupan."
      },
      {
        id: "mapel_6",
        code: "IPS",
        name: "Ilmu Pengetahuan Sosial",
        score: 82,
        predicate: "B",
        description: "Memiliki kebugaran pemahaman yang baik tentang kegiatan ekonomi masyarakat, pelestarian sumber daya alam, serta letak geografis provinsi setempat."
      },
      {
        id: "mapel_7",
        code: "BING",
        name: "Bahasa Inggris",
        score: 87,
        predicate: "A",
        description: "Sangat terampil menggunakan ungkapan selamat, hobi (hobbies), serta arah mata angin sederhana (cardinal directions) dalam roleplay lisan."
      },
      {
        id: "mapel_8",
        code: "PJOK",
        name: "Pendidikan Jasmani, Olahraga dan Kesehatan",
        score: 89,
        predicate: "A",
        description: "Memiliki kebugaran jasmani yang baik, sangat bersemangat dalam latihan senam lantai, serta konsisten menerapkan kebiasaan memotong kuku secara teratur."
      },
      {
        id: "mapel_9",
        code: "SENI",
        name: "Seni dan Prakarya",
        score: 86,
        predicate: "B",
        description: "Menunjukkan kepekaan estetik yang sangat baik dalam menggambar perspektif satu titik hilang serta mengolah prakarya dekoratif bermotif batik flora secara mandiri."
      },
      {
        id: "mapel_10",
        code: "TIK",
        name: "Teknologi, Informasi dan Komunikasi (TIK)",
        score: 88,
        predicate: "A",
        description: "Menunjukkan kemandirian belajar yang tinggi dalam merancang presentasi multimedia sederhana serta mempraktikkan cara mengetik sepuluh jari dasar dengan lancar."
      }
    ],
    p5: {
      theme: "Kearifan Lokal",
      title: "Mengenal dan Melestarikan Batik Jumputan Tradisional",
      durationJp: 64,
      dimensionsDetails: [
        {
          dimension: "Berkebinekaan Global",
          target: "Mengenal produk lokal nusantara, melestarikan motif tradisional, dan berbangga memakainya di lingkungan sekolah.",
          achievement: "Sangat Berkembang"
        },
        {
          dimension: "Mandiri",
          target: "Berani merencanakan, menyiapkan alat, dan memproses pembuatan taplak meja dengan pewarna kain secara mandiri.",
          achievement: "Sangat Berkembang"
        },
        {
          dimension: "Gotong Royong",
          target: "Membangun komunikasi positif dengan anggota tim untuk menyukseskan gelar karya busana batik cilik sekolah.",
          achievement: "Berkembang Sesuai Harapan"
        }
      ],
      summary: "Siti berpartisipasi dengan luar biasa dalam seluruh proses pembuatan Batik Jumputan. Ia menunjukkan antusiasme tinggi untuk mendalami filosofi batik dan mandiri membuat motif jumputan yang indah di atas kain taplak meja kelompoknya."
    },
    extracurriculars: [
      {
        id: "ext1",
        name: "Pramuka (Wajib)",
        grade: "Sangat Baik",
        description: "Menunjukkan integritas akhlak pramuka harian yang terpuji, mahir dalam ikatan simpul tali-temali tandu darurat, serta tanggap dalam pertolongan pertama."
      },
      {
        id: "ext2",
        name: "Seni Tari Tradisional",
        grade: "Sangat Baik",
        description: "Memiliki kelenturan tubuh serta ekspresi wajah (wiraga dan wirasa) yang sangat memikat dalam membawakan tari Jaipong/Merak tradisional."
      },
      {
        id: "ext3",
        name: "Klub Sains Dokter Cilik",
        grade: "Baik",
        description: "Memahami prinsip dasar kebersihan sanitasi jajanan sekolah sehat, serta mampu merawat luka ringan darurat di pos UKS."
      }
    ],
    attendance: {
      sick: 0,
      permit: 0,
      alpha: 0
    },
    signatures: {
      className: "VII-A",
      classTeacherName: "Retno Wahyuni, S.Pd.",
      classTeacherNip: "19840512 201012 2 003",
      principalName: "MAIKEL PAUL WALLY, S.Pd",
      principalNip: "19781223 200312 1 006",
      locationAndDate: "Sentani, 19 Juni 2026"
    },
    kktp: 70,
    promotionDecision: "Naik ke Kelas VIII (Delapan)",
    teacherNotes: "Siti adalah siswi berprestasi, cerdas, ramah, dan sangat berdisiplin. Penampilan akademisnya sangat menonjol di hampir semua mata pelajaran. Harap Siti terus mempertahankan kepedulian sosialnya dan menjadi tutor sebaya bagi rekan-rekannya.",
    parentNotesPlaceholder: "Kami sangat bangga dengan hasil rapor Siti. Terima kasih banyak kepada Ibu Wali Kelas atas segenap perhatian, bimbingan, dan cinta yang tulus selama membimbing Siti di kelas IV ini."
  }
};

export const defaultSubjectTemplates = [
  { code: 'PABP', name: 'Pendidikan Agama dan Budi Pekerti' },
  { code: 'PKN', name: 'Pendidikan Kewarganegaraan' },
  { code: 'BINDO', name: 'Bahasa Indonesia' },
  { code: 'MAT', name: 'Matematika' },
  { code: 'IPA', name: 'Ilmu Pengetahuan Alam' },
  { code: 'IPS', name: 'Ilmu Pengetahuan Sosial' },
  { code: 'BING', name: 'Bahasa Inggris' },
  { code: 'PJOK', name: 'Pendidikan Jasmani, Olahraga dan Kesehatan' },
  { code: 'SENI', name: 'Seni dan Prakarya' },
  { code: 'TIK', name: 'Teknologi, Informasi dan Komunikasi (TIK)' }
];

export function getPredicateRanges(kktp: number, customLimitB?: number, customLimitA?: number) {
  const interval = (100 - kktp) / 3;
  const autoLimitB = kktp + Math.round(interval);
  const autoLimitA = kktp + Math.round(2 * interval);

  const limitB = (customLimitB !== undefined && customLimitB > kktp) ? customLimitB : autoLimitB;
  const limitA = (customLimitA !== undefined && customLimitA > limitB) ? customLimitA : autoLimitA;

  return {
    limitC: kktp,
    limitB,
    limitA
  };
}

export function calculatePredicate(
  score: number, 
  kktp: number = 70, 
  customLimitB?: number, 
  customLimitA?: number
): 'A' | 'B' | 'C' | 'D' {
  const { limitB, limitA } = getPredicateRanges(kktp, customLimitB, customLimitA);
  
  if (score < kktp) return 'D';
  if (score >= limitA) return 'A';
  if (score >= limitB) return 'B';
  return 'C';
}
