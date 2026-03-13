import { z } from 'zod';

// Auth
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Calls
export const getNextLeadSchema = z.object({
  industry: z.string().optional(),
  timezone: z.string().optional(),
});

export const logCallSchema = z.object({
  idBusiness: z.number().int().positive(),
  idDisposition: z.number().int().positive(),
  comments: z.string().max(2000).optional(),
  idCloser: z.number().int().positive().optional(),
  callBack: z.string().optional(),
  dmakerName: z.string().max(200).optional(),
  dmakerEmail: z.string().max(200).optional(),
  dmakerPhone: z.string().max(20).optional(),
  debtAmount: z.number().nonnegative().optional(),
  debtorName: z.string().max(200).optional(),
  agreementSent: z.boolean().optional(),
});

// Business search
export const businessSearchSchema = z.object({
  search: z.string().max(200).optional(),
  status: z.enum(['existing', 'available', 'all']).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

export const updateBusinessStatusSchema = z.object({
  status: z.number().int(),
});

// Clock
export const clockActionSchema = z.object({
  action: z.enum([
    'clockIn', 'clockOut',
    'firstBreakOut', 'firstBreakIn',
    'lunchOut', 'lunchIn',
    'secondBreakOut', 'secondBreakIn',
  ]),
});

export const clockWeekSchema = z.object({
  week: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD format')
    .refine((d) => !isNaN(new Date(d).getTime()), 'Invalid date')
    .optional(),
});

// Reports
export const reportFilterSchema = z.object({
  rep: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  disposition: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
});

// Users
export const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  lastname: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  roleId: z.number().int().min(1).max(3),
  timezone: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  sendEmail: z.boolean().default(false),
  isPartTime: z.boolean().default(false),
});

export const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).max(100).optional(),
});

export const userSearchSchema = z.object({
  search: z.string().max(200).optional(),
});

// Schedule
export const scheduleSchema = z.object({
  schedule: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
  })),
});

// Admin Time
export const timeEditSchema = z.object({
  userId: z.number().int().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).refine(
    (d) => !isNaN(new Date(d).getTime()),
    'Invalid date'
  ),
  field: z.enum([
    'clockIn', 'firstBreakOut', 'firstBreakIn',
    'lunchOut', 'lunchIn',
    'secondBreakOut', 'secondBreakIn', 'clockOut',
  ]),
  value: z.string().regex(/^\d{2}:\d{2}$/, 'Must be HH:mm format'),
  reason: z.string().min(1, 'Reason is required').max(500),
});

// Quotes
export const quoteSchema = z.object({
  quote: z.string().min(1).max(1000),
});

// Rebuttals
export const rebuttalSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(50000),
});

// SMS
export const sendSmsSchema = z.object({
  phoneNumber: z.string().min(10).max(15),
  messageBody: z.string().min(1).max(1600),
});

// Import
export const importValidateSchema = z.object({
  data: z.array(z.record(z.string(), z.string())),
});

// Settings
export const settingSchema = z.object({
  key: z.string().min(1).max(100),
  value: z.string().max(5000),
});

// Registration (self-service, no auth)
export const registerSchema = z.object({
  name: z.string().min(1, 'First name is required').max(100),
  lastname: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  confirmPassword: z.string(),
  timezone: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Forgot / Reset password
export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(6, 'Password must be at least 6 characters').max(100),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Profile (self-service update)
export const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  lastname: z.string().min(1).max(100).optional(),
  timezone: z.string().max(50).optional(),
  city: z.string().max(100).optional(),
  state: z.string().max(100).optional(),
  country: z.string().max(100).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).max(100).optional(),
}).refine((d) => {
  if (d.newPassword && !d.currentPassword) return false;
  return true;
}, {
  message: 'Current password is required to set a new password',
  path: ['currentPassword'],
});

// Type exports for use in components
export type LoginInput = z.infer<typeof loginSchema>;
export type LogCallInput = z.infer<typeof logCallSchema>;
export type BusinessSearchInput = z.infer<typeof businessSearchSchema>;
export type ClockActionInput = z.infer<typeof clockActionSchema>;
export type ReportFilterInput = z.infer<typeof reportFilterSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type TimeEditInput = z.infer<typeof timeEditSchema>;
export type QuoteInput = z.infer<typeof quoteSchema>;
export type RebuttalInput = z.infer<typeof rebuttalSchema>;
export type SendSmsInput = z.infer<typeof sendSmsSchema>;
export type SettingInput = z.infer<typeof settingSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
