import { newSpecPage } from '@stencil/core/testing';
import fetchMock from 'jest-fetch-mock';
import { WacPhysioDashboard } from '../wac-physio-dashboard';

describe('wac-physio-dashboard', () => {
  const patients = [
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
  ];

  beforeAll(() => {
    fetchMock.enableMocks();
  });

  afterEach(() => {
    fetchMock.resetMocks();
  });

  it('renders records returned by api', async () => {
    fetchMock.mockResponse(JSON.stringify(patients));

    const page = await newSpecPage({
      components: [WacPhysioDashboard],
      html: '<wac-physio-dashboard api-base="http://localhost:8080/api" selected-resource="patients"></wac-physio-dashboard>',
    });

    await page.waitForChanges();

    const items = page.root.shadowRoot.querySelectorAll('md-list-item');
    expect(items.length).toEqual(1);
    expect(page.root.shadowRoot.textContent).toContain('Anna Novakova');
  });

  it('renders error message when api fails', async () => {
    fetchMock.mockReject(new Error('Network Error'));

    const page = await newSpecPage({
      components: [WacPhysioDashboard],
      html: '<wac-physio-dashboard api-base="http://localhost:8080/api" selected-resource="patients"></wac-physio-dashboard>',
    });

    await page.waitForChanges();

    const error = page.root.shadowRoot.querySelector('.error');
    expect(error).not.toBeNull();
    expect(page.root.shadowRoot.querySelectorAll('md-list-item').length).toEqual(0);
  });
});
