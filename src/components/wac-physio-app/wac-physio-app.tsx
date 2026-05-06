import { Component, Host, Prop, State, h } from '@stencil/core';
import { PhysioResource, resourceDefinitions } from '../../api/physio';

declare global {
  interface Window {
    navigation?: any;
  }
}

@Component({
  tag: 'wac-physio-app',
  styleUrl: 'wac-physio-app.css',
  shadow: true,
})
export class WacPhysioApp {
  @Prop() basePath: string = '';
  @Prop() apiBase: string = '/api';

  @State() private relativePath = '';
  @State() private refreshToken = 0;

  componentWillLoad() {
    const baseUri = new URL(this.basePath || '/', document.baseURI || '/').pathname;

    const toRelative = (path: string) => {
      this.relativePath = path.startsWith(baseUri) ? path.slice(baseUri.length).replace(/^\/+/, '') : '';
    };

    window.navigation?.addEventListener('navigate', (ev: Event) => {
      if ((ev as any).canIntercept) {
        (ev as any).intercept();
      }
      toRelative(new URL((ev as any).destination.url).pathname);
    });

    window.addEventListener('popstate', () => toRelative(location.pathname));
    toRelative(location.pathname);
  }

  render() {
    const { resource, recordId } = this.route();

    return (
      <Host>
        <wac-physio-dashboard
          api-base={this.apiBase}
          selected-resource={resource}
          refresh-token={this.refreshToken}
          onresource-selected={(ev: CustomEvent<PhysioResource>) => this.navigate(ev.detail)}
          onrecord-opened={(ev: CustomEvent<{ resource: PhysioResource; id: string }>) => this.navigate(ev.detail.resource, ev.detail.id)}
        ></wac-physio-dashboard>

        {recordId ? (
          <wac-physio-editor
            api-base={this.apiBase}
            resource={resource}
            record-id={recordId}
            oneditor-closed={(ev: CustomEvent<string>) => this.closeEditor(resource, ev.detail)}
          ></wac-physio-editor>
        ) : undefined}
      </Host>
    );
  }

  private route(): { resource: PhysioResource; recordId?: string } {
    const parts = this.relativePath.split('/').filter(Boolean);
    const candidate = parts[0] as PhysioResource;
    const fallback = resourceDefinitions[0].resource;
    const resource = resourceDefinitions.some(definition => definition.resource === candidate) ? candidate : fallback;
    return { resource, recordId: parts[1] };
  }

  private navigate(resource: PhysioResource, recordId?: string) {
    const path = `${resource}${recordId ? `/${recordId}` : ''}`;
    const absolute = new URL(path, new URL(this.basePath || '/', document.baseURI)).pathname;

    if (window.navigation?.navigate) {
      window.navigation.navigate(absolute);
      return;
    }

    history.pushState({}, '', absolute);
    this.relativePath = path;
  }

  private closeEditor(resource: PhysioResource, action: string) {
    if (action === 'store' || action === 'delete') {
      this.refreshToken += 1;
    }
    this.navigate(resource);
  }
}
