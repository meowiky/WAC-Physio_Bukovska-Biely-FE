import { newE2EPage } from '@stencil/core/testing';

describe('wac-physio-dashboard', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<wac-physio-dashboard></wac-physio-dashboard>');

    const element = await page.find('wac-physio-dashboard');
    expect(element).toHaveClass('hydrated');
  });
});
