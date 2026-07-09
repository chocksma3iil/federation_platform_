// ═══════════════════════════════════════════════════════════════════════════
// User & Auth Models
// ═══════════════════════════════════════════════════════════════════════════

export enum UserRole {
  ADMIN           = 'ROLE_ADMIN',
  FEDERATION_STAFF = 'ROLE_FEDERATION_STAFF',
  CLUB_MANAGER    = 'ROLE_CLUB_MANAGER',
  ATHLETE         = 'ROLE_ATHLETE',
  PUBLIC          = 'ROLE_PUBLIC',
}

export enum UserStatus {
  ACTIVE              = 'ACTIVE',
  INACTIVE            = 'INACTIVE',
  SUSPENDED           = 'SUSPENDED',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
}

export interface User {
  id:         string;
  email:      string;
  username:   string;
  firstName:  string;
  lastName:   string;
  fullName?:  string;
  role:       UserRole;
  status:     UserStatus;
  phone?:     string;
  avatarUrl?: string;
  lastLogin?: string;
  createdAt:  string;
}

export interface LoginRequest {
  usernameOrEmail: string;
  password:        string;
}

export interface RegisterRequest {
  email:      string;
  username:   string;
  password:   string;
  firstName:  string;
  lastName:   string;
}

export interface AuthResponse {
  accessToken:  string;
  refreshToken: string;
  tokenType:    string;
  expiresIn:    number;     // seconds
  userId:       string;
  email:        string;
  username:     string;
  role:         UserRole;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword:     string;
  confirmPassword: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// Generic API Response Wrapper
// ═══════════════════════════════════════════════════════════════════════════

export interface ApiResponse<T = any> {
  success:   boolean;
  data:      T;
  message?:  string;
  status?:   number;
  path?:     string;
  timestamp: string;
}

export interface ValidationError {
  field:         string;
  rejectedValue: any;
  message:       string;
}

export interface ValidationErrorResponse {
  status:  number;
  message: string;
  errors:  ValidationError[];
  path:    string;
}

export interface PagedResponse<T> {
  content:       T[];
  page:          number;
  size:          number;
  totalElements: number;
  totalPages:    number;
  last:          boolean;
  first:         boolean;
}

// ═══════════════════════════════════════════════════════════════════════════
// Utility Types
// ═══════════════════════════════════════════════════════════════════════════

export interface SelectOption<T = string> {
  value: T;
  label: string;
}

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface NavItem {
  label:    string;
  path:     string;
  icon:     string;
  roles?:   UserRole[];
  children?: NavItem[];
}

// ═══════════════════════════════════════════════════════════════════════════
// Club & Athlete Models
// ═══════════════════════════════════════════════════════════════════════════


export enum ClubStatus {
  ACTIVE    = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  DISSOLVED = 'DISSOLVED',
}

export interface Club {
  id:             string;
  name:           string;
  shortName?:     string;
  slug:           string;
  licenseNumber:  string;
  city?:          string;
  region?:        string;
  country?:       string;
  address?:       string;
  foundedYear?:   number;
  description?:   string;
  logoUrl?:       string;
  website?:       string;
  email?:         string;
  phone?:         string;
  status:         ClubStatus;
  managerId?:     string;
  managerName?:   string;
  activeAthletes: number;
  createdAt:      string;
  updatedAt:      string;
}

export interface ClubRequest {
  name:          string;
  shortName?:    string;
  licenseNumber: string;
  city?:         string;
  region?:       string;
  country?:      string;
  address?:      string;
  foundedYear?:  number;
  description?:  string;
  logoUrl?:      string;
  website?:      string;
  email?:        string;
  phone?:        string;
  status?:       ClubStatus;
  managerId?:    string;
}

export interface Athlete {
  id:            string;
  licenseNumber: string;
  firstName:     string;
  lastName:      string;
  fullName?:     string;
  gender:        string;
  category:      string;
  status:        string;
  clubName?:     string;
  clubId?:       string;
  nationality:   string;
  dateOfBirth:   string;
  photoUrl?:     string;
  createdAt:     string;
}

// ═══════════════════════════════════════════════════════════════════════════
// AI Feature Models (Club Assistant + Growth Prediction)
// ═══════════════════════════════════════════════════════════════════════════

export interface Prediction {
  forecast: number;
  confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  trend: 'GROWING' | 'STABLE' | 'DECLINING';
  forecastRangeLow: number;
  forecastRangeHigh: number;
  historicalEstimates: [number, number, number]; // 3,2,1 years ago
  riskFactors: string[];
  recommendations: string[];
  summary: string;
}

// ── Chat / AI ─────────────────────────────────────────────────────
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatAction {
  action: 'createClub' | 'updateClub' | 'deleteClub' | 'searchClubs';
  data?: any;
  query?: string;
}

export interface AiChatResponse {
  reply:   string;
  action?: ChatAction;
}