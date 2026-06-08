import { Component, Input } from '@angular/core';

interface FunnelStep {
  status:        string;
  label:         string;
  description:   string;
  nextEvent:     string;
}

const FUNNEL_STEPS: FunnelStep[] = [
  { status: 'RECEIVED',       label: 'Recebida',          description: 'Sua necessidade foi recebida e está na fila.',               nextEvent: 'Retorno em até 5 dias úteis' },
  { status: 'UNDER_ANALYSIS', label: 'Em análise',         description: 'O time FracExec está avaliando sua necessidade.',            nextEvent: 'Shortlist de executivos em breve' },
  { status: 'SHORTLIST_SENT', label: 'Shortlist enviada',  description: 'Perfis de executivos foram selecionados para você.',        nextEvent: 'Revise os perfis e selecione' },
  { status: 'IN_MEDIATION',   label: 'Em mediação',        description: 'Executivos notificados, aguardando confirmação de interesse.', nextEvent: 'Contrato em preparação' },
  { status: 'CONTRACTED',     label: 'Contratado',         description: 'Engajamento formalizado com sucesso.',                      nextEvent: '—' },
];

@Component({
  selector: 'app-need-funnel',
  standalone: true,
  template: `
    <div class="funnel">
      @for (step of steps; track step.status; let i = $index) {
        <div class="funnel-step"
             [class.funnel-step--active]="step.status === currentStatus"
             [class.funnel-step--done]="isDone(i)">
          <div class="step-indicator">
            <div class="step-circle">{{ isDone(i) ? '✓' : (i + 1) }}</div>
            @if (!$last) { <div class="step-line"></div> }
          </div>
          <div class="step-body">
            <span class="step-label">{{ step.label }}</span>
            @if (step.status === currentStatus) {
              <p class="step-desc">{{ step.description }}</p>
              @if (step.nextEvent !== '—') {
                <p class="step-next">Próximo: {{ step.nextEvent }}</p>
              }
            }
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .funnel { display: flex; gap: 0; overflow-x: auto; padding-bottom: 8px; }
    .funnel-step { display: flex; flex-direction: column; align-items: center; flex: 1; min-width: 120px; }
    .step-indicator { display: flex; align-items: center; width: 100%; }
    .step-circle {
      width: 32px; height: 32px; border-radius: 50%; border: 2px solid var(--color-border);
      display: flex; align-items: center; justify-content: center;
      font-size: 0.75rem; font-weight: 700; background: var(--color-surface);
      color: var(--color-text-secondary); flex-shrink: 0;
    }
    .step-line { flex: 1; height: 2px; background: var(--color-border); }
    .step-body { padding: 8px 4px 0; text-align: center; width: 100%; }
    .step-label { font-size: 0.8125rem; font-weight: 600; color: var(--color-text-secondary); }
    .step-desc  { font-size: 0.75rem; color: var(--color-text-secondary); margin: 4px 0 0; }
    .step-next  { font-size: 0.75rem; color: var(--color-primary); margin: 2px 0 0; font-style: italic; }

    .funnel-step--active .step-circle {
      background: var(--color-primary); border-color: var(--color-primary); color: #fff;
    }
    .funnel-step--active .step-line { background: var(--color-primary); }
    .funnel-step--active .step-label { color: var(--color-primary); }

    .funnel-step--done .step-circle {
      background: var(--color-success, #2e7d32); border-color: var(--color-success, #2e7d32); color: #fff;
    }
    .funnel-step--done .step-line  { background: var(--color-success, #2e7d32); }
    .funnel-step--done .step-label { color: var(--color-success, #2e7d32); }
  `],
})
export class NeedFunnel {
  @Input() currentStatus = 'RECEIVED';

  readonly steps = FUNNEL_STEPS;

  isDone(index: number): boolean {
    const current = FUNNEL_STEPS.findIndex(s => s.status === this.currentStatus);
    return index < current;
  }
}
