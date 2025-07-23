// novelsData.js

const novels = [
  {
    id: "1",
    title: 'ล่องไพร',
    coverUrl: 'https://blueservice2004.blob.core.windows.net/novelcovers/1_longphrai.jpg',
    author: 'น้อย อินทนนท์',
    description: 'เรื่องราวการผจญภัยในป่าลึกของกลุ่มนักสำรวจผู้กล้า',
    chapters: [
      { id: 1, title: 'ตอนที่1: อาคันตุกะยามวิกาล', url: 'https://blueservice2004.blob.core.windows.net/longphrai/text/chapter1.txt', audioUrl: 'https://blueservice2004.blob.core.windows.net/longphrai/audio/1_longpai.wav' },
      { id: 2, title: 'ตอนที่2: เจ้าป่าห้วยเสือโฮก', url: 'https://blueservice2004.blob.core.windows.net/longphrai/text/chapter2.txt', audioUrl: 'https://blueservice2004.blob.core.windows.net/longphrai/audio/2_longpai.wav' },
      { id: 3, title: 'ตอนที่3: หุบผีโป่ง', url: 'https://blueservice2004.blob.core.windows.net/longphrai/text/chapter3.txt', audioUrl: 'https://blueservice2004.blob.core.windows.net/longphrai/audio/3_longpai.wav' },
      { id: 4, title: 'ตอนที่4: รับท้าจากอ้ายเก', url: 'https://blueservice2004.blob.core.windows.net/longphrai/text/chapter4.txt', audioUrl: 'https://blueservice2004.blob.core.windows.net/longphrai/audio/4_longpai.wav' },
      { id: 5, title: 'ตอนที่5: กลางโขลงช้าง', url: 'https://blueservice2004.blob.core.windows.net/longphrai/text/chapter5.txt', audioUrl: 'https://blueservice2004.blob.core.windows.net/longphrai/audio/5_longpai.wav' },
      { id: 6, title: 'ตอนที่6: เรื่องจากพระธุดงค์', url: 'https://blueservice2004.blob.core.windows.net/longphrai/text/chapter6.txt', audioUrl: 'https://blueservice2004.blob.core.windows.net/longphrai/audio/6_longpai.wav' },
      { id: 7, title: 'ตอนที่7: เหยื่อล่อมฤตยู', url: 'https://blueservice2004.blob.core.windows.net/longphrai/text/chapter7.txt', audioUrl: 'https://blueservice2004.blob.core.windows.net/longphrai/audio/7_longpai.wav' },
      { id: 8, title: 'ตอนที่8: เหยื่อล่อมฤตยู', url: 'https://blueservice2004.blob.core.windows.net/longphrai/text/chapter8.txt', audioUrl: 'https://blueservice2004.blob.core.windows.net/longphrai/audio/8_longpai.wav' },
      { id: 9, title: 'ตอนที่9: นางในวนา', url: 'https://blueservice2004.blob.core.windows.net/longphrai/text/chapter9.txt', audioUrl: 'https://blueservice2004.blob.core.windows.net/longphrai/audio/9_longpai.wav' },
      { id: 10, title: 'ตอนที่10: อวสานของอ้ายเก', url: 'https://blueservice2004.blob.core.windows.net/longphrai/text/chapter10.txt', audioUrl: 'https://blueservice2004.blob.core.windows.net/longphrai/audio/10_longpai.wav' },
    ],
  },
  {
    id: "2",
    title: 'เสือดำผจญภัย',
    coverUrl: 'https://blueservice2004.blob.core.windows.net/novelcovers/2_longphrai.jpg',
    author: 'ทองดี สุขใจ',
    description: 'ตำนานเสือดำแห่งป่าเหนือ กับการผจญภัยในโลกอันลี้ลับ',
    chapters: [
      { id: 1, title: 'ตอนที่1: เงาในพงไพร', url: 'https://example.com/text/chapter1.txt', audioUrl: 'https://example.com/audio/1.wav' },
      { id: 2, title: 'ตอนที่2: ลายเสือ', url: 'https://example.com/text/chapter2.txt', audioUrl: 'https://example.com/audio/2.wav' },
      { id: 3, title: 'ตอนที่3: ป่าซ่อนเงา', url: 'https://example.com/text/chapter3.txt', audioUrl: 'https://example.com/audio/3.wav' },
    ],
  },
  {
    id: "3",
    title: "ที่หยด",
    coverUrl: "https://blueservice2004.blob.core.windows.net/novelcovers/3_teeyod.jpg",
  },
  {
    id: "4",
    title: "บ้านทรายทอง",
    coverUrl: "https://blueservice2004.blob.core.windows.net/novelcovers/4_saithong.jpg",
  },
  {
    id: "5",
    title: "ปลาบู่ทอง",
    coverUrl: "https://blueservice2004.blob.core.windows.net/novelcovers/5_phrabuthong.gif",
  },
  {
    id: "6",
    title: "บุพเพสันนิวาส",
    coverUrl: "https://blueservice2004.blob.core.windows.net/novelcovers/6_bubpe.jpg",
  },
  {
    id: "7",
    title: "พระไพ",
    coverUrl: "https://blueservice2004.blob.core.windows.net/novelcovers/7_phrapai.jpg",
  },
  {
    id: "8",
    title: "บัวแก้ว",
    coverUrl: "https://blueservice2004.blob.core.windows.net/novelcovers/8_buakaew.jpg",
  },
];

export default novels;
