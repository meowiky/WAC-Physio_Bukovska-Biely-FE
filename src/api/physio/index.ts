export type Sex = 'male' | 'female';
export type HealthInsurance = 'UNION' | 'VSZP' | 'Dovera';
export type RehabilitationPlanStatus = 'draft' | 'active' | 'completed' | 'canceled';
export type AttendanceStatus = 'planned' | 'attended' | 'canceled';
export type SessionConfirmationStatus = 'tentative' | 'confirmed';

export interface Patient {
  id: string;
  firstName: string;
  surname: string;
  birthNumber: string;
  dateOfBirth: string;
  sex: Sex;
  healthInsurance: HealthInsurance;
  email: string;
  phone: string;
  firstVisitDate: string;
}

export interface Therapist {
  id: string;
  firstName: string;
  surname: string;
  title?: string;
  specialization?: string;
  email: string;
  phone: string;
}

export interface Ambulance {
  id: string;
  name: string;
  roomNumber: string;
  location?: string;
  notes?: string;
}

export interface RehabilitationPlan {
  id: string;
  patientId: string;
  status: RehabilitationPlanStatus;
  notes?: string;
}

export interface RehabilitationSession {
  id: string;
  planId: string;
  ambulanceId: string;
  therapistId: string;
  startDateTime?: string;
  endDateTime?: string;
  attendanceStatus: AttendanceStatus;
  confirmationStatus: SessionConfirmationStatus;
  sessionNotes?: string;
}

export interface AvailabilityCheckItem {
  resourceId?: string;
  isAvailable: boolean;
  conflictingSessionId?: string | null;
}

export interface AvailabilityResult {
  startDateTime: string;
  endDateTime: string;
  ambulance?: AvailabilityCheckItem;
  therapist?: AvailabilityCheckItem;
}

export type PhysioRecord = Patient | Therapist | Ambulance | RehabilitationPlan | RehabilitationSession;
export type PhysioResource = 'patients' | 'therapists' | 'ambulances' | 'rehabilitation-plans' | 'rehabilitation-sessions';

export interface FieldOption {
  value: string;
  label: string;
}

export interface FieldDefinition {
  key: string;
  label: string;
  type?: 'text' | 'email' | 'tel' | 'date' | 'datetime-local' | 'textarea' | 'select';
  required?: boolean;
  options?: FieldOption[];
  reference?: PhysioResource;
}

export interface ResourceDefinition {
  resource: PhysioResource;
  endpoint: string;
  title: string;
  singular: string;
  icon: string;
  idPrefix: string;
  fields: FieldDefinition[];
}

export const resourceDefinitions: ResourceDefinition[] = [
  {
    resource: 'patients',
    endpoint: '/patients',
    title: 'Patients',
    singular: 'Patient',
    icon: 'person',
    idPrefix: 'patient',
    fields: [
      { key: 'id', label: 'Patient ID', required: true },
      { key: 'firstName', label: 'First name', required: true },
      { key: 'surname', label: 'Surname', required: true },
      { key: 'birthNumber', label: 'Birth number', required: true },
      { key: 'dateOfBirth', label: 'Date of birth', type: 'date', required: true },
      {
        key: 'sex',
        label: 'Sex',
        type: 'select',
        required: true,
        options: [
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
        ],
      },
      {
        key: 'healthInsurance',
        label: 'Health insurance',
        type: 'select',
        required: true,
        options: [
          { value: 'VSZP', label: 'VSZP' },
          { value: 'Dovera', label: 'Dovera' },
          { value: 'UNION', label: 'UNION' },
        ],
      },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone', type: 'tel', required: true },
      { key: 'firstVisitDate', label: 'First visit', type: 'date', required: true },
    ],
  },
  {
    resource: 'therapists',
    endpoint: '/therapists',
    title: 'Therapists',
    singular: 'Therapist',
    icon: 'medical_services',
    idPrefix: 'therapist',
    fields: [
      { key: 'id', label: 'Therapist ID', required: true },
      { key: 'firstName', label: 'First name', required: true },
      { key: 'surname', label: 'Surname', required: true },
      { key: 'title', label: 'Title' },
      { key: 'specialization', label: 'Specialization' },
      { key: 'email', label: 'Email', type: 'email', required: true },
      { key: 'phone', label: 'Phone', type: 'tel', required: true },
    ],
  },
  {
    resource: 'ambulances',
    endpoint: '/ambulances',
    title: 'Rooms',
    singular: 'Room',
    icon: 'meeting_room',
    idPrefix: 'ambulance',
    fields: [
      { key: 'id', label: 'Room ID', required: true },
      { key: 'name', label: 'Name', required: true },
      { key: 'roomNumber', label: 'Room number', required: true },
      { key: 'location', label: 'Location' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    resource: 'rehabilitation-plans',
    endpoint: '/rehabilitation-plans',
    title: 'Plans',
    singular: 'Plan',
    icon: 'assignment',
    idPrefix: 'plan',
    fields: [
      { key: 'id', label: 'Plan ID', required: true },
      { key: 'patientId', label: 'Patient', type: 'select', reference: 'patients', required: true },
      {
        key: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 'draft', label: 'Draft' },
          { value: 'active', label: 'Active' },
          { value: 'completed', label: 'Completed' },
          { value: 'canceled', label: 'Canceled' },
        ],
      },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  {
    resource: 'rehabilitation-sessions',
    endpoint: '/rehabilitation-sessions',
    title: 'Sessions',
    singular: 'Session',
    icon: 'event',
    idPrefix: 'session',
    fields: [
      { key: 'id', label: 'Session ID', required: true },
      { key: 'planId', label: 'Plan', type: 'select', reference: 'rehabilitation-plans', required: true },
      { key: 'ambulanceId', label: 'Room', type: 'select', reference: 'ambulances', required: true },
      { key: 'therapistId', label: 'Therapist', type: 'select', reference: 'therapists', required: true },
      { key: 'startDateTime', label: 'Starts', type: 'datetime-local' },
      { key: 'endDateTime', label: 'Ends', type: 'datetime-local' },
      {
        key: 'attendanceStatus',
        label: 'Attendance',
        type: 'select',
        required: true,
        options: [
          { value: 'planned', label: 'Planned' },
          { value: 'attended', label: 'Attended' },
          { value: 'canceled', label: 'Canceled' },
        ],
      },
      {
        key: 'confirmationStatus',
        label: 'Confirmation',
        type: 'select',
        required: true,
        options: [
          { value: 'tentative', label: 'Tentative' },
          { value: 'confirmed', label: 'Confirmed' },
        ],
      },
      { key: 'sessionNotes', label: 'Notes', type: 'textarea' },
    ],
  },
];

export const getResourceDefinition = (resource: PhysioResource): ResourceDefinition => {
  const definition = resourceDefinitions.find(item => item.resource === resource);
  if (!definition) {
    throw new Error(`Unknown resource: ${resource}`);
  }
  return definition;
};

export const createEmptyRecord = (resource: PhysioResource): PhysioRecord => {
  const id = `${getResourceDefinition(resource).idPrefix}-${Date.now()}`;

  switch (resource) {
    case 'patients':
      return {
        id,
        firstName: '',
        surname: '',
        birthNumber: '',
        dateOfBirth: '',
        sex: 'female',
        healthInsurance: 'VSZP',
        email: '',
        phone: '',
        firstVisitDate: new Date().toISOString().slice(0, 10),
      };
    case 'therapists':
      return { id, firstName: '', surname: '', title: '', specialization: '', email: '', phone: '' };
    case 'ambulances':
      return { id, name: '', roomNumber: '', location: '', notes: '' };
    case 'rehabilitation-plans':
      return { id, patientId: '', status: 'draft', notes: '' };
    case 'rehabilitation-sessions':
      return {
        id,
        planId: '',
        ambulanceId: '',
        therapistId: '',
        attendanceStatus: 'planned',
        confirmationStatus: 'tentative',
        sessionNotes: '',
      };
  }
};

const cleanBase = (basePath?: string): string => {
  if (!basePath) {
    return '';
  }
  return basePath.endsWith('/') ? basePath.slice(0, -1) : basePath;
};

export class PhysioApi {
  private readonly basePath: string;

  constructor(basePath?: string) {
    this.basePath = cleanBase(basePath);
  }

  async list<T extends PhysioRecord>(resource: PhysioResource): Promise<T[]> {
    const definition = getResourceDefinition(resource);
    return this.request<T[]>(definition.endpoint);
  }

  async get<T extends PhysioRecord>(resource: PhysioResource, id: string): Promise<T> {
    const definition = getResourceDefinition(resource);
    return this.request<T>(`${definition.endpoint}/${encodeURIComponent(id)}`);
  }

  async create<T extends PhysioRecord>(resource: PhysioResource, record: T): Promise<T> {
    const definition = getResourceDefinition(resource);
    return this.request<T>(definition.endpoint, {
      method: 'POST',
      body: JSON.stringify(stripEmptyOptionalValues(resource, record)),
    });
  }

  async update<T extends PhysioRecord>(resource: PhysioResource, id: string, record: T): Promise<T> {
    const definition = getResourceDefinition(resource);
    return this.request<T>(`${definition.endpoint}/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(stripEmptyOptionalValues(resource, record)),
    });
  }

  async delete(resource: PhysioResource, id: string): Promise<void> {
    const definition = getResourceDefinition(resource);
    await this.request<void>(`${definition.endpoint}/${encodeURIComponent(id)}`, { method: 'DELETE' });
  }

  async checkAvailability(params: {
    startDateTime: string;
    endDateTime: string;
    ambulanceId?: string;
    therapistId?: string;
    excludeSessionId?: string;
  }): Promise<AvailabilityResult> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        query.set(key, value);
      }
    });
    return this.request<AvailabilityResult>(`/availability?${query.toString()}`);
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const response = await fetch(`${this.basePath}${path}`, {
      ...init,
      headers: {
        Accept: 'application/json',
        ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
        ...init?.headers,
      },
    });

    if (!response.ok) {
      let message = response.statusText || `HTTP ${response.status}`;
      try {
        const payload = await response.json();
        message = payload.message || payload.error || message;
      } catch (_) {
      }
      throw new Error(message);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }
}

export const recordTitle = (resource: PhysioResource, record: Partial<PhysioRecord>): string => {
  if (!record) {
    return '';
  }
  switch (resource) {
    case 'patients':
    case 'therapists':
      return `${(record as Patient | Therapist).firstName || ''} ${(record as Patient | Therapist).surname || ''}`.trim() || record.id || '';
    case 'ambulances':
      return (record as Ambulance).name || record.id || '';
    case 'rehabilitation-plans':
      return `${record.id || ''} ${(record as RehabilitationPlan).status ? `(${(record as RehabilitationPlan).status})` : ''}`.trim();
    case 'rehabilitation-sessions':
      return `${record.id || ''} ${(record as RehabilitationSession).startDateTime ? formatDateTime((record as RehabilitationSession).startDateTime) : ''}`.trim();
  }
};

export const recordSubtitle = (resource: PhysioResource, record: Partial<PhysioRecord>): string => {
  switch (resource) {
    case 'patients':
      return `${(record as Patient).birthNumber || ''} ${(record as Patient).email || ''}`.trim();
    case 'therapists':
      return `${(record as Therapist).title || ''} ${(record as Therapist).specialization || ''}`.trim();
    case 'ambulances':
      return `${(record as Ambulance).roomNumber || ''} ${(record as Ambulance).location || ''}`.trim();
    case 'rehabilitation-plans':
      return `Patient: ${(record as RehabilitationPlan).patientId || ''}`;
    case 'rehabilitation-sessions':
      return `Plan: ${(record as RehabilitationSession).planId || ''} / Room: ${(record as RehabilitationSession).ambulanceId || ''}`;
  }
};

export const formatDateTime = (value?: string): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

export const toDatetimeInput = (value?: string): string => {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

export const fromDatetimeInput = (value: string): string | undefined => {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString();
};

const optionalFields: Record<PhysioResource, string[]> = {
  patients: [],
  therapists: ['title', 'specialization'],
  ambulances: ['location', 'notes'],
  'rehabilitation-plans': ['notes'],
  'rehabilitation-sessions': ['startDateTime', 'endDateTime', 'sessionNotes'],
};

const stripEmptyOptionalValues = <T extends PhysioRecord>(resource: PhysioResource, record: T): T => {
  const payload = { ...record } as Record<string, any>;
  optionalFields[resource].forEach(key => {
    if (payload[key] === '') {
      delete payload[key];
    }
  });
  return payload as T;
};
