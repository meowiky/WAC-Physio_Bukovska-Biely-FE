import { newE2EPage } from '@stencil/core/testing';

describe('wac-physio-app', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<wac-physio-app></wac-physio-app>');

    const element = await page.find('wac-physio-app');
    expect(element).toHaveClass('hydrated');
  });
});
