import { newE2EPage } from '@stencil/core/testing';

describe('wac-physio-editor', () => {
  it('renders', async () => {
    const page = await newE2EPage();
    await page.setContent('<wac-physio-editor resource="patients" record-id="@new"></wac-physio-editor>');

    const element = await page.find('wac-physio-editor');
    expect(element).toHaveClass('hydrated');
  });
});
