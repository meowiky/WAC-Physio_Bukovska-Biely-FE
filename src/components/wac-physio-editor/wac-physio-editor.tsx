import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import {
  Ambulance,
  FieldDefinition,
  Patient,
  PhysioApi,
  PhysioRecord,
  PhysioResource,
  RehabilitationPlan,
  RehabilitationSession,
  Therapist,
  createEmptyRecord,
  formatDateTime,
  fromDatetimeInput,
  getResourceDefinition,
  recordTitle,
  toDatetimeInput,
} from '../../api/physio';

@Component({
  tag: 'wac-physio-editor',
  styleUrl: 'wac-physio-editor.css',
  shadow: true,
})
export class WacPhysioEditor {
  @Prop() apiBase: string = '/api';
  @Prop() resource: PhysioResource;
  @Prop() recordId: string;

  @Event({ eventName: 'editor-closed' }) editorClosed: EventEmitter<string>;

  @State() private record: PhysioRecord;
  @State() private references: Record<string, PhysioRecord[]> = {};
  @State() private errorMessage = '';
  @State() private availabilityMessage = '';
  @State() private isLoading = false;
  @State() private isSaving = false;

  private formElement: HTMLFormElement;

  async componentWillLoad() {
    await this.load();
  }

  @Watch('recordId')
  @Watch('resource')
  async routeChanged() {
    await this.load();
  }

  render() {
    const definition = getResourceDefinition(this.resource);

    return (
      <Host>
        <div class="scrim" onClick={() => this.editorClosed.emit('cancel')}></div>
        <aside>
          <header>
            <div>
              <span class="eyebrow">{definition.singular}</span>
              <h2>{this.recordId === '@new' ? `New ${definition.singular}` : this.displayTitle(this.resource, this.record)}</h2>
            </div>
            <md-filled-icon-button aria-label="Close editor" onClick={() => this.editorClosed.emit('cancel')}>
              <md-icon>close</md-icon>
            </md-filled-icon-button>
          </header>

          {this.errorMessage ? <div class="error">{this.errorMessage}</div> : undefined}

          {this.isLoading ? (
            <div class="loading">
              <md-circular-progress indeterminate></md-circular-progress>
            </div>
          ) : (
            <form ref={el => (this.formElement = el)}>
              {definition.fields.map(field => this.renderField(field))}
              {this.resource === 'rehabilitation-sessions' ? this.renderAvailability() : undefined}
            </form>
          )}

          <md-divider></md-divider>
          <div class="actions">
            <md-filled-tonal-button disabled={this.recordId === '@new' || this.isSaving} onClick={() => this.delete()}>
              <md-icon slot="icon">delete</md-icon>
              Delete
            </md-filled-tonal-button>
            <span></span>
            <md-outlined-button disabled={this.isSaving} onClick={() => this.editorClosed.emit('cancel')}>Cancel</md-outlined-button>
            <md-filled-button disabled={this.isSaving || this.isLoading} onClick={() => this.save()}>
              <md-icon slot="icon">save</md-icon>
              Save
            </md-filled-button>
          </div>
        </aside>
      </Host>
    );
  }

  private renderField(field: FieldDefinition) {
    const value = this.valueForField(field);

    if (field.type === 'date') {
      return this.renderDateField(field, value);
    }

    if (field.type === 'datetime-local') {
      return this.renderDateTimeField(field, value);
    }

    if (field.type === 'select') {
      return (
        <md-filled-select label={field.label} required={field.required} value={value} oninput={(ev: InputEvent) => this.updateField(field, (ev.target as HTMLInputElement).value)}>
          <md-icon slot="leading-icon">{field.reference ? 'link' : 'tune'}</md-icon>
          {this.optionsForField(field).map(option => (
            <md-select-option value={option.value} selected={option.value === value}>
              <div slot="headline">{option.label}</div>
            </md-select-option>
          ))}
        </md-filled-select>
      );
    }

    return (
      <md-filled-text-field
        label={field.label}
        required={field.required}
        type={field.type || 'text'}
        value={value}
        rows={field.type === 'textarea' ? 4 : undefined}
        oninput={(ev: InputEvent) => this.updateField(field, (ev.target as HTMLInputElement).value)}
      >
        <md-icon slot="leading-icon">{this.iconForField(field)}</md-icon>
      </md-filled-text-field>
    );
  }

  private renderDateField(field: FieldDefinition, value: string) {
    return (
      <label class="native-field">
        <span>{field.label}</span>
        <input type="date" required={field.required} value={value} onInput={(ev: InputEvent) => this.updateField(field, (ev.target as HTMLInputElement).value)} />
      </label>
    );
  }

  private renderDateTimeField(field: FieldDefinition, value: string) {
    const [dateValue, timeValue = ''] = value.split('T');

    return (
      <fieldset class="native-field datetime-field">
        <legend>{field.label}</legend>
        <label>
          <span>Date</span>
          <input type="date" value={dateValue} onInput={(ev: InputEvent) => this.updateDateTimePart(field, 'date', (ev.target as HTMLInputElement).value)} />
        </label>
        <label>
          <span>Time</span>
          <input type="time" value={timeValue} onInput={(ev: InputEvent) => this.updateDateTimePart(field, 'time', (ev.target as HTMLInputElement).value)} />
        </label>
      </fieldset>
    );
  }

  private renderAvailability() {
    return (
      <div class="availability">
        <md-outlined-button onClick={() => this.checkAvailability()}>
          <md-icon slot="icon">event_available</md-icon>
          Check Availability
        </md-outlined-button>
        {this.availabilityMessage ? <p>{this.availabilityMessage}</p> : undefined}
      </div>
    );
  }

  private async load() {
    this.isLoading = true;
    this.errorMessage = '';
    this.availabilityMessage = '';
    try {
      await this.loadReferences();
      this.record = this.recordId === '@new' ? createEmptyRecord(this.resource) : await new PhysioApi(this.apiBase).get(this.resource, this.recordId);
    } catch (err: any) {
      this.errorMessage = `Cannot load record: ${err.message || 'unknown error'}`;
    } finally {
      this.isLoading = false;
    }
  }

  private async loadReferences() {
    const references = Array.from(new Set(getResourceDefinition(this.resource).fields.map(field => field.reference).filter(Boolean))) as PhysioResource[];
    if ((this.resource === 'rehabilitation-sessions' || this.resource === 'rehabilitation-plans') && !references.includes('patients')) {
      references.push('patients');
    }
    const api = new PhysioApi(this.apiBase);
    const loaded: Record<string, PhysioRecord[]> = {};

    await Promise.all(
      references.map(async reference => {
        loaded[reference] = await api.list(reference);
      }),
    );
    this.references = loaded;
  }

  private async save() {
    if (!this.validateForm()) {
      return;
    }
    this.isSaving = true;
    this.errorMessage = '';
    try {
      if (this.resource === 'rehabilitation-sessions') {
        const isAvailable = await this.ensureSessionCanBeSaved();
        if (!isAvailable) {
          return;
        }
      }

      const api = new PhysioApi(this.apiBase);
      if (this.recordId === '@new') {
        await api.create(this.resource, this.record);
      } else {
        await api.update(this.resource, this.recordId, this.record);
      }
      this.editorClosed.emit('store');
    } catch (err: any) {
      this.errorMessage = `Cannot save record: ${err.message || 'unknown error'}`;
    } finally {
      this.isSaving = false;
    }
  }

  private async delete() {
    this.isSaving = true;
    this.errorMessage = '';
    try {
      await new PhysioApi(this.apiBase).delete(this.resource, this.recordId);
      this.editorClosed.emit('delete');
    } catch (err: any) {
      this.errorMessage = `Cannot delete record: ${err.message || 'unknown error'}`;
    } finally {
      this.isSaving = false;
    }
  }

  private async checkAvailability() {
    const session = this.record as any;
    const validationMessage = this.sessionTimeValidationMessage();
    if (validationMessage) {
      this.availabilityMessage = validationMessage;
      return false;
    }

    try {
      const result = await new PhysioApi(this.apiBase).checkAvailability({
        startDateTime: session.startDateTime,
        endDateTime: session.endDateTime,
        ambulanceId: session.ambulanceId,
        therapistId: session.therapistId,
        excludeSessionId: this.recordId === '@new' ? undefined : this.recordId,
      });
      const room = result.ambulance?.isAvailable !== false;
      const therapist = result.therapist?.isAvailable !== false;
      this.availabilityMessage = `${formatDateTime(result.startDateTime)} - ${formatDateTime(result.endDateTime)}: room ${room ? 'available' : 'busy'}, therapist ${
        therapist ? 'available' : 'busy'
      }.`;
      return room && therapist;
    } catch (err: any) {
      this.availabilityMessage = `Availability check failed: ${err.message || 'unknown error'}`;
      return false;
    }
  }

  private async ensureSessionCanBeSaved(): Promise<boolean> {
    const validationMessage = this.sessionTimeValidationMessage();
    if (validationMessage) {
      this.errorMessage = validationMessage;
      return false;
    }

    const session = this.record as any;
    if (!session.startDateTime && !session.endDateTime) {
      return true;
    }

    const isAvailable = await this.checkAvailability();
    if (!isAvailable) {
      this.errorMessage = 'Selected therapist or room is not available for the requested time interval.';
    }
    return isAvailable;
  }

  private sessionTimeValidationMessage(): string {
    if (this.resource !== 'rehabilitation-sessions') {
      return '';
    }

    const session = this.record as any;
    if (!session.startDateTime && !session.endDateTime) {
      return '';
    }
    if (!session.startDateTime || !session.endDateTime) {
      return 'Start and end time must be filled together, or both left empty for a tentative session.';
    }
    const start = new Date(session.startDateTime).getTime();
    const end = new Date(session.endDateTime).getTime();
    if (Number.isNaN(start) || Number.isNaN(end)) {
      return 'Start and end time must include both date and time.';
    }
    if (start >= end) {
      return 'Start time must be before end time.';
    }
    return '';
  }

  private validateForm(): boolean {
    let isValid = true;
    Array.from(this.formElement?.querySelectorAll('md-filled-text-field, md-filled-select, input') || []).forEach(element => {
      const control = element as HTMLElement & { reportValidity?: () => boolean };
      if (control.reportValidity) {
        isValid &&= control.reportValidity();
      }
    });
    return isValid;
  }

  private optionsForField(field: FieldDefinition) {
    if (field.options) {
      return field.options;
    }

    if (!field.reference) {
      return [];
    }

    return (this.references[field.reference] || []).map(record => ({
      value: record.id,
      label: this.displayTitle(field.reference, record),
    }));
  }

  private valueForField(field: FieldDefinition): string {
    const rawValue = ((this.record || {}) as any)[field.key] || '';
    if (field.type === 'date') {
      return rawValue.slice(0, 10);
    }
    return field.type === 'datetime-local' ? toDatetimeInput(rawValue) : rawValue;
  }

  private updateField(field: FieldDefinition, value: string) {
    const next = { ...(this.record as any) };
    next[field.key] = field.type === 'datetime-local' ? fromDatetimeInput(value) : value;
    this.record = next;
    this.availabilityMessage = '';
  }

  private updateDateTimePart(field: FieldDefinition, part: 'date' | 'time', value: string) {
    const currentValue = this.valueForField(field);
    const [currentDate = '', currentTime = ''] = currentValue.split('T');
    const nextDate = part === 'date' ? value : currentDate;
    const nextTime = part === 'time' ? value : currentTime;

    if (!nextDate && !nextTime) {
      this.updateField(field, '');
      return;
    }

    this.updateField(field, `${nextDate}T${nextTime}`);
  }

  private iconForField(field: FieldDefinition): string {
    if (field.key.toLowerCase().includes('email')) return 'mail';
    if (field.key.toLowerCase().includes('phone')) return 'call';
    if (field.type === 'date' || field.type === 'datetime-local') return 'calendar_month';
    if (field.type === 'textarea') return 'notes';
    if (field.key.toLowerCase().includes('id')) return 'fingerprint';
    return 'edit';
  }

  private displayTitle(resource: PhysioResource, record?: Partial<PhysioRecord>): string {
    if (!record) {
      return '';
    }

    if (resource === 'rehabilitation-plans') {
      const plan = record as RehabilitationPlan;
      return `${this.patientName(plan.patientId)} - ${this.statusLabel(plan.status)} plan`;
    }

    if (resource === 'rehabilitation-sessions') {
      const session = record as RehabilitationSession;
      const plan = this.findReference('rehabilitation-plans', session.planId) as RehabilitationPlan;
      const patientName = plan ? this.patientName(plan.patientId) : 'Unassigned patient';
      const time = session.startDateTime ? formatDateTime(session.startDateTime) : 'tentative time';
      return `${patientName} session, ${time}`;
    }

    if (resource === 'ambulances') {
      const ambulance = record as Ambulance;
      return ambulance.name ? `${ambulance.name}${ambulance.roomNumber ? ` (${ambulance.roomNumber})` : ''}` : ambulance.id || '';
    }

    if (resource === 'therapists') {
      const therapist = record as Therapist;
      return [therapist.title, therapist.firstName, therapist.surname].filter(Boolean).join(' ') || therapist.id || '';
    }

    if (resource === 'patients') {
      const patient = record as Patient;
      return [patient.firstName, patient.surname].filter(Boolean).join(' ') || patient.id || '';
    }

    return recordTitle(resource, record);
  }

  private patientName(patientId: string): string {
    const patient = this.findReference('patients', patientId) as Patient;
    return patient ? this.displayTitle('patients', patient) : 'Unknown patient';
  }

  private findReference(resource: PhysioResource, id: string): PhysioRecord | undefined {
    return (this.references[resource] || []).find(record => record.id === id);
  }

  private statusLabel(status: string): string {
    return status ? status.charAt(0).toUpperCase() + status.slice(1) : '';
  }
}
