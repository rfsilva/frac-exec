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
  templateUrl: './need-funnel.html',
  styleUrl: './need-funnel.scss',
})
export class NeedFunnel {
  @Input() currentStatus = 'RECEIVED';

  readonly steps = FUNNEL_STEPS;

  isDone(index: number): boolean {
    const current = FUNNEL_STEPS.findIndex(s => s.status === this.currentStatus);
    return index < current;
  }
}
