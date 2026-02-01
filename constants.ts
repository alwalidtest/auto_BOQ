
import { AnalysisModule } from "./types";

export const MODULES: AnalysisModule[] = [
  { id: 1, title: 'Preliminary Works', arabicTitle: 'الأعمال التحضيرية', status: 'pending' },
  { id: 2, title: 'Substructure', arabicTitle: 'أعمال الحفر والخرسانة أسفل الأرض', status: 'pending' },
  { id: 3, title: 'Superstructure', arabicTitle: 'أعمال الخرسانة فوق الأرض', status: 'pending' },
  { id: 4, title: 'Masonry Works', arabicTitle: 'أعمال الطابوق', status: 'pending' },
  { id: 5, title: 'Waterproofing', arabicTitle: 'أعمال العزل', status: 'pending' },
  { id: 6, title: 'Finishes & Openings', arabicTitle: 'التشطيبات والفتحات', status: 'pending' },
];

export const SAMPLE_BOQ_DATA = [
  {
    id: 1,
    category: 'الأعمال التحضيرية',
    description: 'سياج مؤقت (Chain Link Fencing)',
    unit: 'm.l',
    count: 1,
    dimensions: { l: 120, w: 0, h: 0 },
    deduction: 0,
    total: 120,
    remarks: 'Perimeter calculation from PLOT LIMIT on A010.',
    confidence: { overall: 0.98, count_accuracy: 1.0, dimension_extraction: 0.96 },
    calculation_breakdown: 'Perimeter = (30m x 2) + (30m x 2)',
    source_file: 'A-01 Site Plan.pdf'
  },
  {
    id: 2,
    category: 'أعمال الحفر والخرسانة أسفل الأرض',
    description: 'حفر الموقع حتى منسوب -2.50م',
    unit: 'm³',
    count: 1,
    dimensions: { l: 0, w: 0, h: 0 },
    deduction: 0,
    total: 1450,
    remarks: 'Includes 1.0m working space offset around footings.',
    confidence: { overall: 0.88, count_accuracy: 1.0, dimension_extraction: 0.88 },
    calculation_breakdown: 'Area(580m2) * Depth(2.5m)',
    source_file: 'S-01 Excavation.pdf'
  },
  {
    id: 3,
    category: 'أعمال الحفر والخرسانة أسفل الأرض',
    description: 'أعمال نزح المياه (Dewatering)',
    unit: 'Item',
    count: 1,
    dimensions: { l: 0, w: 0, h: 0 },
    deduction: 0,
    total: 1,
    remarks: 'Required as Excavation depth > 1.5m and Water Table noted at -1.2m',
    confidence: { overall: 0.95, count_accuracy: 1.0, dimension_extraction: 0.95 },
    calculation_breakdown: 'Lump Sum based on Section A-A',
    source_file: 'Geotechnical Report'
  },
  {
    id: 4,
    category: 'أعمال الخرسانة فوق الأرض',
    description: 'بلاطة خرسانية مصمتة (Solid Slab S=150mm)',
    unit: 'm³',
    count: 1,
    dimensions: { l: 20, w: 15, h: 0.15 },
    deduction: 4.5,
    total: 40.5,
    remarks: 'Deducted Staircase void (3x1.5m).',
    confidence: { overall: 0.92, count_accuracy: 1.0, dimension_extraction: 0.92 },
    calculation_breakdown: '(20*15*0.15) - Void(3*1.5*0.15)',
    source_file: 'S-10 First Floor Slab.pdf'
  },
  {
    id: 5,
    category: 'أعمال الطابوق',
    description: 'جدران بلوك خارجي معزول سماكة 20 سم',
    unit: 'm²',
    count: 1,
    dimensions: { l: 150, w: 1, h: 3.5 },
    deduction: 45,
    total: 480,
    remarks: 'Deducted 12 Windows (1.5x2.0) and 2 Doors.',
    confidence: { overall: 0.75, count_accuracy: 0.9, dimension_extraction: 0.70 },
    calculation_breakdown: 'Gross(150*3.5) - Openings(45)',
    source_file: 'A-05 Floor Plan.pdf'
  },
  {
    id: 6,
    category: 'أعمال الطابوق',
    description: 'أعمدة تقوية رأسية (Stiffener Columns)',
    unit: 'm³',
    count: 8,
    dimensions: { l: 0.2, w: 0.2, h: 3.5 },
    deduction: 0,
    total: 1.12,
    remarks: 'Added for wall spans > 4.0m.',
    confidence: { overall: 0.60, count_accuracy: 0.6, dimension_extraction: 0.9 },
    calculation_breakdown: '8 No * (0.2*0.2*3.5)',
    source_file: 'S-General Notes.pdf'
  }
];
