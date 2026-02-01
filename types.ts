
export enum AnalysisStatus {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  PROCESSING = 'PROCESSING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}

export type GeminiModel = 
  | 'gemini-3-pro-preview'
  | 'gemini-3-flash-preview'
  | 'gemini-2.5-flash-thinking-latest'
  | 'gemini-flash-latest'
  | 'gemini-flash-lite-latest';

export interface Dimension {
  l: number;
  w: number;
  h: number;
}

export interface BOQItem {
  id: number;
  description: string;
  unit: string;
  count: number;
  dimensions: Dimension;
  deduction: number;
  total: number;
  remarks: string;
  category: string;
  // Updated Confidence to be granular
  confidence: {
    overall: number;
    count_accuracy: number;
    dimension_extraction: number;
  }; 
  calculation_breakdown?: string; // Step-by-step math explanation
  unitPrice?: number; // Added for pricing logic
  source_file?: string; // Track which PDF generated this
}

export interface LogEntry {
  type: 'thought' | 'process' | 'error' | 'success';
  message: string;
  timestamp: Date;
}

export interface SummaryItem {
  category: string;
  totalQuantity: number;
  unit: string;
}

export interface FinalBOQItem {
  description: string;
  quantity: number;
  unit: string;
  rate?: number;
  total?: number;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
  isAction?: boolean;
}

export interface AnalysisModule {
  id: number;
  title: string;
  arabicTitle: string;
  status: 'pending' | 'processing' | 'completed';
}
