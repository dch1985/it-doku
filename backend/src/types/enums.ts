// backend/src/types/enums.ts
// Type-safe enums für SQL Server (da keine nativen Enums)

export const UserRole = {
  ADMIN: 'ADMIN',
  USER: 'USER',
  VIEWER: 'VIEWER',
} as const;

export type UserRole = typeof UserRole[keyof typeof UserRole];

export const DocumentCategory = {
  DOCUMENTATION: 'DOCUMENTATION',
  CODE_ANALYSIS: 'CODE_ANALYSIS',
  TEMPLATE: 'TEMPLATE',
  KNOWLEDGE_BASE: 'KNOWLEDGE_BASE',
  MEETING_NOTES: 'MEETING_NOTES',
  TUTORIAL: 'TUTORIAL',
  API_SPEC: 'API_SPEC',
} as const;

export type DocumentCategory = typeof DocumentCategory[keyof typeof DocumentCategory];

export const DocumentStatus = {
  DRAFT: 'DRAFT',
  REVIEW: 'REVIEW',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type DocumentStatus = typeof DocumentStatus[keyof typeof DocumentStatus];

export const Visibility = {
  PRIVATE: 'PRIVATE',
  TEAM: 'TEAM',
  PUBLIC: 'PUBLIC',
} as const;

export type Visibility = typeof Visibility[keyof typeof Visibility];

export const MessageRole = {
  USER: 'USER',
  ASSISTANT: 'ASSISTANT',
  SYSTEM: 'SYSTEM',
} as const;

export type MessageRole = typeof MessageRole[keyof typeof MessageRole];

export const NodeType = {
  CONCEPT: 'CONCEPT',
  CODE: 'CODE',
  PERSON: 'PERSON',
  TECHNOLOGY: 'TECHNOLOGY',
  PROCESS: 'PROCESS',
  ENTITY: 'ENTITY',
} as const;

export type NodeType = typeof NodeType[keyof typeof NodeType];

// Validation Helpers
export function isValidUserRole(value: string): value is UserRole {
  return Object.values(UserRole).includes(value as UserRole);
}

export function isValidDocumentCategory(value: string): value is DocumentCategory {
  return Object.values(DocumentCategory).includes(value as DocumentCategory);
}

export function isValidDocumentStatus(value: string): value is DocumentStatus {
  return Object.values(DocumentStatus).includes(value as DocumentStatus);
}

export function isValidVisibility(value: string): value is Visibility {
  return Object.values(Visibility).includes(value as Visibility);
}

export function isValidMessageRole(value: string): value is MessageRole {
  return Object.values(MessageRole).includes(value as MessageRole);
}

export function isValidNodeType(value: string): value is NodeType {
  return Object.values(NodeType).includes(value as NodeType);
}