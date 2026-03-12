// User roles enum
export enum UserRole {
  Admin = 1,
  Manager = 2,
  Closer = 3,
  Rep = 4,
}

// API response types
export interface ApiResponse<T> {
  data: T;
}

export interface ApiError {
  error: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

// Entity types (matching Prisma models)
export interface UserSession {
  id: number;
  name: string;
  lastname: string;
  email: string;
  role: UserRole;
}

export interface Business {
  idBusiness: number;
  businessName: string;
  phone: string;
  address: string;
  location: string;
  industry: string;
  timezone: string;
  idStatus: number;
}

export interface CallRecord {
  idCall: number;
  idUser: number;
  idBusiness: number;
  idDisposition: number;
  callDate: string;
  idCloser?: number;
  dmakerName?: string;
  dmakerEmail?: string;
  dmakerPhone?: string;
  debtAmount?: number;
  debtorName?: string;
  agreementSent?: boolean;
  comments?: string;
  callBack?: string;
}

export interface TimeLogEntry {
  logDate: string;
  clockIn?: string;
  firstBreakOut?: string;
  firstBreakIn?: string;
  lunchOut?: string;
  lunchIn?: string;
  secondBreakOut?: string;
  secondBreakIn?: string;
  clockOut?: string;
  totalHours?: number;
}

export type ClockAction = 'clockIn' | 'clockOut' | 'firstBreakOut' | 'firstBreakIn' | 'lunchOut' | 'lunchIn' | 'secondBreakOut' | 'secondBreakIn';

export interface Disposition {
  idDisposition: number;
  disposition: string;
}

export interface Quote {
  idQuote: number;
  quote: string;
}

export interface Rebuttal {
  idRebuttal: number;
  title: string;
  content: string;
}

export interface VideoInfo {
  videoId: number;
  videoTitle: string;
  watched: boolean;
  viewedOn?: string;
}

export interface SmsConversation {
  phoneNumber: string;
  lastMessage: string;
  lastTime: string;
  direction: string;
}

export interface SmsMessage {
  phoneNumber: string;
  messageBody: string;
  direction: 'inbound' | 'outbound';
  sentTime: string;
}

// Clock status
export type ClockStatus = 'not_clocked_in' | 'working' | 'first_break' | 'lunch' | 'second_break' | 'clocked_out';

// Employee status for admin dashboard
export interface EmployeeStatus {
  userId: number;
  name: string;
  status: ClockStatus;
  clockIn?: string;
  currentBreakStart?: string;
  breakExceeded: boolean;
}
