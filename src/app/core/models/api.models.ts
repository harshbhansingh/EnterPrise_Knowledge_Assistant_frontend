/** Shapes returned by the Spring Boot API (see backend DTOs). */

export type Role = 'USER' | 'ADMIN';
export type DocumentStatus = 'UPLOADED' | 'PROCESSING' | 'INDEXED' | 'FAILED' | 'DELETED';
export type MessageRole = 'USER' | 'ASSISTANT';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: Role;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresIn: number;
  user: UserProfile;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiError {
  timestamp: string;
  status: number;
  error: string;
  message: string;
  path: string;
  details?: Record<string, string>;
}

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
}

export interface DocumentSummary {
  id: string;
  ownerId: string;
  filename: string;
  contentType: string;
  fileSize: number;
  checksum: string;
  status: DocumentStatus;
  errorMessage: string | null;
  chunkCount: number;
  characterCount: number;
  metadata: Record<string, unknown>;
  indexedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  charCount: number;
  metadata: Record<string, unknown>;
}

export interface SourceReference {
  label: number;
  documentId: string;
  documentName: string;
  chunkId: string;
  chunkIndex: number;
  similarity: number;
  section: string | null;
  excerpt: string;
  cited: boolean;
}

export interface RagQueryRequest {
  question: string;
  documentIds?: string[];
  metadataFilters?: Record<string, string>;
  topK?: number;
  similarityThreshold?: number;
}

export interface RagQueryResponse {
  answer: string;
  sources: SourceReference[];
  grounded: boolean;
  cached: boolean;
  model: string | null;
  latencyMs: number;
}

export interface Conversation {
  id: string;
  title: string;
  messageCount: number;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: MessageRole;
  content: string;
  sources: SourceReference[];
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface ConversationDetail {
  conversation: Conversation;
  messages: Message[];
}

export interface SendMessageResponse {
  conversation: Conversation;
  userMessage: Message;
  assistantMessage: Message;
}

export interface DashboardSummary {
  totalDocuments: number;
  uploadedDocuments: number;
  processingDocuments: number;
  indexedDocuments: number;
  failedDocuments: number;
  totalChunks: number;
  totalConversations: number;
  recentDocuments: DocumentSummary[];
  recentConversations: Conversation[];
}

export interface SystemInfo {
  chatModel: string;
  embeddingModel: string;
  similarityThreshold: number;
  topK: number;
  demoMode: boolean;
}
