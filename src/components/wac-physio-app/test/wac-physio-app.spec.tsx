import { newSpecPage } from '@stencil/core/testing';
import { WacPhysioApp } from '../wac-physio-app';
import { WacPhysioDashboard } from '../../wac-physio-dashboard/wac-physio-dashboard';
import { WacPhysioEditor } from '../../wac-physio-editor/wac-physio-editor';

describe('wac-physio-app', () => {
  it('renders dashboard on resource route', async () => {
    const page = await newSpecPage({
      url: 'http://localhost/physio/patients',
      components: [WacPhysioApp, WacPhysioDashboard],
      html: '<wac-physio-app base-path="/physio/"></wac-physio-app>',
    });

    const dashboard = page.root.shadowRoot.querySelector('wac-physio-dashboard');
    expect(dashboard).not.toBeNull();
    expect(dashboard.getAttribute('selected-resource')).toEqual('patients');
  });

  it('renders editor on record route', async () => {
    const page = await newSpecPage({
      url: 'http://localhost/physio/therapists/therapist-001',
      components: [WacPhysioApp, WacPhysioDashboard, WacPhysioEditor],
      html: '<wac-physio-app base-path="/physio/"></wac-physio-app>',
    });

    const editor = page.root.shadowRoot.querySelector('wac-physio-editor');
    expect(editor).not.toBeNull();
    expect(page.root.shadowRoot.querySelector('wac-physio-dashboard')).not.toBeNull();
  });
});
