export type ResponseType = 'hit' | 'miss' | 'commission' | 'correct_rejection';

export interface TelemetryEvent {
  stimulusType: 'go' | 'nogo';
  stimulusOnset: number;
  responseTimestamp: number | null;
  responseType: ResponseType;
  reactionTime: number | null;
}

export class TelemetryLogger {
  private events: TelemetryEvent[] = [];

  logEvent(event: TelemetryEvent) {
    this.events.push(event);
  }

  getMetrics() {
    const noGoTrials = this.events.filter(e => e.stimulusType === 'nogo');
    const goTrials = this.events.filter(e => e.stimulusType === 'go');

    const commissions = noGoTrials.filter(e => e.responseType === 'commission').length;
    const omissions = goTrials.filter(e => e.responseType === 'miss').length;
    
    const hits = goTrials.filter(e => e.responseType === 'hit');
    const avgReactionTime = hits.length > 0 
      ? hits.reduce((acc, curr) => acc + (curr.reactionTime || 0), 0) / hits.length 
      : 0;

    const tec = noGoTrials.length > 0 ? (commissions / noGoTrials.length) * 100 : 0;
    const to = goTrials.length > 0 ? (omissions / goTrials.length) * 100 : 0;

    return {
      totalTrials: this.events.length,
      tec: tec.toFixed(1), // Taxa de Erros de Comissão (%) - PRINCIPAL
      to: to.toFixed(1),   // Taxa de Omissões (%)
      avgReactionTime: avgReactionTime.toFixed(0), // ms
      commissions,
      omissions,
    };
  }
  
  clear() {
    this.events = [];
  }
}
