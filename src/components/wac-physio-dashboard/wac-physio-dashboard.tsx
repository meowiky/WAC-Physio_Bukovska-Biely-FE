import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import {
  Ambulance,
  Patient,
  PhysioApi,
  PhysioRecord,
  PhysioResource,
  RehabilitationPlan,
  RehabilitationSession,
  Therapist,
  formatDateTime,
  recordSubtitle,
  recordTitle,
  resourceDefinitions,
} from '../../api/physio';

@Component({
  tag: 'wac-physio-dashboard',
  styleUrl: 'wac-physio-dashboard.css',
  shadow: true,
})
export class WacPhysioDashboard {
  @Prop() apiBase: string = '/api';
  @Prop() selectedResource: PhysioResource = 'patients';
  @Prop() refreshToken: number = 0;

  @Event({ eventName: 'resource-selected' }) resourceSelected: EventEmitter<PhysioResource>;
  @Event({ eventName: 'record-opened' }) recordOpened: EventEmitter<{ resource: PhysioResource; id: string }>;

  @State() private records: PhysioRecord[] = [];
  @State() private referenceRecords: Partial<Record<PhysioResource, PhysioRecord[]>> = {};
  @State() private counts: Partial<Record<PhysioResource, number>> = {};
  @State() private errorMessage = '';
  @State() private isLoading = false;

  async componentWillLoad() {
    await this.loadSummary();
    await this.loadSelectedResource();
  }

  @Watch('selectedResource')
  async selectedResourceChanged() {
    await this.loadSelectedResource();
  }

  @Watch('apiBase')
  async apiBaseChanged() {
    await this.loadSummary();
    await this.loadSelectedResource();
  }

  @Watch('refreshToken')
  async refreshTokenChanged() {
    await this.refresh();
  }

  render() {
    const definition = resourceDefinitions.find(item => item.resource === this.selectedResource) || resourceDefinitions[0];

    return (
      <Host>
        <header>
          <div>
            <span class="eyebrow">Physio rehabilitation management</span>
            <h1>{definition.title}</h1>
          </div>
          <md-filled-button onClick={() => this.recordOpened.emit({ resource: this.selectedResource, id: '@new' })}>
            <md-icon slot="icon">add</md-icon>
            New {definition.singular}
          </md-filled-button>
        </header>

        <nav aria-label="Physio resources">
          {resourceDefinitions.map(item => (
            <button class={{ active: item.resource === this.selectedResource }} onClick={() => this.resourceSelected.emit(item.resource)}>
              <md-icon>{item.icon}</md-icon>
              <span>{item.title}</span>
              <strong>{this.counts[item.resource] ?? '-'}</strong>
            </button>
          ))}
        </nav>

        {this.errorMessage ? <div class="error">{this.errorMessage}</div> : undefined}

        <section>
          <div class="section-heading">
            <h2>{definition.title}</h2>
            <md-outlined-button onClick={() => this.refresh()}>
              <md-icon slot="icon">refresh</md-icon>
              Refresh
            </md-outlined-button>
          </div>

          {this.isLoading ? (
            <div class="loading">
              <md-circular-progress indeterminate></md-circular-progress>
            </div>
          ) : this.records.length ? (
            <md-list>
              {this.records.map(record => (
                <md-list-item onClick={() => this.recordOpened.emit({ resource: this.selectedResource, id: record.id })}>
                  <md-icon slot="start">{definition.icon}</md-icon>
                  <div slot="headline">{this.displayTitle(this.selectedResource, record)}</div>
                  <div slot="supporting-text">{this.displaySubtitle(this.selectedResource, record)}</div>
                  <md-icon slot="end">chevron_right</md-icon>
                </md-list-item>
              ))}
            </md-list>
          ) : (
            <div class="empty">
              <md-icon>{definition.icon}</md-icon>
              <span>No records found</span>
            </div>
          )}
        </section>
      </Host>
    );
  }

  private async refresh() {
    await this.loadSummary();
    await this.loadSelectedResource();
  }

  private async loadSummary() {
    const api = new PhysioApi(this.apiBase);
    const entries = await Promise.allSettled(resourceDefinitions.map(async item => [item.resource, await api.list(item.resource)] as const));
    const counts: Partial<Record<PhysioResource, number>> = {};
    const referenceRecords: Partial<Record<PhysioResource, PhysioRecord[]>> = {};
    entries.forEach(entry => {
      if (entry.status === 'fulfilled') {
        counts[entry.value[0]] = entry.value[1].length;
        referenceRecords[entry.value[0]] = entry.value[1];
      }
    });
    this.counts = counts;
    this.referenceRecords = referenceRecords;
  }

  private async loadSelectedResource() {
    this.isLoading = true;
    this.errorMessage = '';
    try {
      this.records = await new PhysioApi(this.apiBase).list(this.selectedResource);
      this.referenceRecords = {
        ...this.referenceRecords,
        [this.selectedResource]: this.records,
      };
    } catch (err: any) {
      this.records = [];
      this.errorMessage = `Cannot load ${this.selectedResource}: ${err.message || 'unknown error'}`;
    } finally {
      this.isLoading = false;
    }
  }

  private displayTitle(resource: PhysioResource, record: PhysioRecord): string {
    if (resource === 'rehabilitation-plans') {
      const plan = record as RehabilitationPlan;
      return `${this.patientName(plan.patientId)} rehabilitation plan`;
    }

    if (resource === 'rehabilitation-sessions') {
      const session = record as RehabilitationSession;
      const plan = this.findRecord('rehabilitation-plans', session.planId) as RehabilitationPlan;
      const patientName = plan ? this.patientName(plan.patientId) : 'Unassigned patient';
      return `${patientName} session`;
    }

    return recordTitle(resource, record);
  }

  private displaySubtitle(resource: PhysioResource, record: PhysioRecord): string {
    if (resource === 'rehabilitation-plans') {
      const plan = record as RehabilitationPlan;
      return [this.statusLabel(plan.status), plan.notes].filter(Boolean).join(' / ');
    }

    if (resource === 'rehabilitation-sessions') {
      const session = record as RehabilitationSession;
      const time = session.startDateTime ? formatDateTime(session.startDateTime) : 'Tentative time';
      return [time, this.roomName(session.ambulanceId), this.therapistName(session.therapistId), this.statusLabel(session.confirmationStatus)].filter(Boolean).join(' / ');
    }

    if (resource === 'ambulances') {
      const ambulance = record as Ambulance;
      return [ambulance.roomNumber, ambulance.location, ambulance.notes].filter(Boolean).join(' / ');
    }

    if (resource === 'therapists') {
      const therapist = record as Therapist;
      return [therapist.title, therapist.specialization, therapist.phone].filter(Boolean).join(' / ');
    }

    if (resource === 'patients') {
      const patient = record as Patient;
      return [patient.email, patient.phone, patient.healthInsurance].filter(Boolean).join(' / ');
    }

    return recordSubtitle(resource, record);
  }

  private patientName(patientId: string): string {
    const patient = this.findRecord('patients', patientId) as Patient;
    return patient ? recordTitle('patients', patient) : 'Unknown patient';
  }

  private therapistName(therapistId: string): string {
    const therapist = this.findRecord('therapists', therapistId) as Therapist;
    return therapist ? recordTitle('therapists', therapist) : 'Unknown therapist';
  }

  private roomName(ambulanceId: string): string {
    const ambulance = this.findRecord('ambulances', ambulanceId) as Ambulance;
    return ambulance ? `${ambulance.name}${ambulance.roomNumber ? ` (${ambulance.roomNumber})` : ''}` : 'Unknown room';
  }

  private findRecord(resource: PhysioResource, id: string): PhysioRecord | undefined {
    return (this.referenceRecords[resource] || []).find(record => record.id === id);
  }

  private statusLabel(status: string): string {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  }
}
