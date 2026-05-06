import { newSpecPage } from '@stencil/core/testing';
import fetchMock from 'jest-fetch-mock';
import { WacPhysioEditor } from '../wac-physio-editor';

describe('wac-physio-editor', () => {
  const therapist = {
    id: 'therapist-001',
    firstName: 'Maria',
    surname: 'Dubova',
    title: 'MUDr.',
    specialization: 'physiotherapy',
    email: 'maria@example.com',
    phone: '+421900111222',
  };

  const sessionReferences = {
    plans: [{ id: 'plan-001', patientId: 'patient-001', status: 'active', notes: 'ACL rehabilitation' }],
    ambulances: [{ id: 'ambulance-a12', name: 'Rehabilitation room A12', roomNumber: 'A12', location: '2nd floor' }],
    therapists: [therapist],
    patients: [
      {
        id: 'patient-001',
        firstName: 'Anna',
        surname: 'Novakova',
        birthNumber: '915101/1234',
        dateOfBirth: '1991-01-01',
        sex: 'female',
        healthInsurance: 'VSZP',
        email: 'anna@example.com',
        phone: '+421900111222',
        firstVisitDate: '2026-05-01',
      },
    ],
  };

  beforeAll(() => {
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  it('renders existing therapist fields', async () => {
    fetchMock.mockResponseOnce(JSON.stringify(therapist));

    const page = await newSpecPage({
      components: [WacPhysioEditor],
      html: '<wac-physio-editor api-base="http://localhost:8080/api" resource="therapists" record-id="therapist-001"></wac-physio-editor>',
    });

    await page.waitForChanges();

    const fields = page.root.shadowRoot.querySelectorAll('md-filled-text-field');
    expect(fields.length).toBeGreaterThanOrEqual(5);
    expect(fields[1].getAttribute('value')).toEqual('Maria');
    expect(page.root.shadowRoot.textContent).toContain('MUDr. Maria Dubova');
  });

  it('renders meaningful labels for session references', async () => {
    fetchMock.mockResponses(
      [JSON.stringify(sessionReferences.plans), { status: 200 }],
      [JSON.stringify(sessionReferences.ambulances), { status: 200 }],
      [JSON.stringify(sessionReferences.therapists), { status: 200 }],
      [JSON.stringify(sessionReferences.patients), { status: 200 }],
    );

    const page = await newSpecPage({
      components: [WacPhysioEditor],
      html: '<wac-physio-editor api-base="http://localhost:8080/api" resource="rehabilitation-sessions" record-id="@new"></wac-physio-editor>',
    });

    await page.waitForChanges();

    expect(page.root.shadowRoot.textContent).toContain('Anna Novakova - Active plan');
    expect(page.root.shadowRoot.textContent).toContain('Rehabilitation room A12');
    expect(page.root.shadowRoot.textContent).toContain('MUDr. Maria Dubova');
  });

  it('keeps unavailable session save error visible', async () => {
    fetchMock.mockResponses(
      [JSON.stringify(sessionReferences.plans), { status: 200 }],
      [JSON.stringify(sessionReferences.ambulances), { status: 200 }],
      [JSON.stringify(sessionReferences.therapists), { status: 200 }],
      [JSON.stringify(sessionReferences.patients), { status: 200 }],
      [
        JSON.stringify({
          startDateTime: '2026-05-05T08:30:00Z',
          endDateTime: '2026-05-05T09:15:00Z',
          ambulance: { resourceId: 'ambulance-a12', isAvailable: false, conflictingSessionId: 'session-001' },
          therapist: { resourceId: 'therapist-001', isAvailable: true },
        }),
        { status: 200 },
      ],
    );

    const page = await newSpecPage({
      components: [WacPhysioEditor],
      html: '<wac-physio-editor api-base="http://localhost:8080/api" resource="rehabilitation-sessions" record-id="@new"></wac-physio-editor>',
    });

    await page.waitForChanges();

    page.rootInstance['record'] = {
      id: 'session-new',
      planId: 'plan-001',
      ambulanceId: 'ambulance-a12',
      therapistId: 'therapist-001',
      startDateTime: '2026-05-05T08:30:00Z',
      endDateTime: '2026-05-05T09:15:00Z',
      attendanceStatus: 'planned',
      confirmationStatus: 'tentative',
    };

    await page.rootInstance['save']();
    await page.waitForChanges();

    const error = page.root.shadowRoot.querySelector('.error');
    expect(error).not.toBeNull();
    expect(error.textContent).toContain('not available');
  });
});
