export type Role = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'IDENTITY';

export interface User {
  uid: string;
  email: string;
  displayName: string | null;
  photoURL: string | null;
  role?: Role;
  organizationId?: string;
}

export interface Organization {
  organizationId: string;
  organizationName: string;
  admin: string; // User ID of the admin
  googleSpreadsheetId: string;
  googleDriveFolderId: string;
  maxUsers: number;
  activeUsers?: number;
  maxForms: number;
  maxTemplates: number;
  maxStorageGB: number;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}

export type FieldType = 'text' | 'number' | 'date' | 'dropdown' | 'phone' | 'photo' | 'email';

export interface FormField {
  fieldId: string;
  label: string;
  type: FieldType;
  required: boolean;
  options?: string[]; // Used for dropdowns
}

export interface Form {
  formId: string;
  name: string;
  responderUri: string;
  organizationId: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

export interface Registration {
  registrationId: string;
  formId: string;
  submittedData: Record<string, any>;
  photoReference: string | null;
  submittedAt: string;
  status?: string;
  idEmailSent?: boolean;
  validFrom?: string | null;
  validTill?: string | null;
}
