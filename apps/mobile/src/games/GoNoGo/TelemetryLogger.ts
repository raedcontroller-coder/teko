export type ResponseType = 'hit' | 'miss' | 'commission' | 'correct_rejection';

export interface TelemetryEvent {
  stimulusType: 'go' | 'nogo';
  stimulusOnset: number;
  responseTimestamp: number | null;
  responseType: ResponseType;
  reactionTime: number | null;
}

export interface GoNoGoRawMetrics {
  totalGoStimuli: number;
  totalNoGoStimuli: number;
  hits: number;
  misses: number;
  falseAlarms: number;
  correctRejections: number;
  reactionTimesHits: number[];
  reactionTimesCommissions: number[];
}

export class TelemetryLogger {
  private events: TelemetryEvent[] = [];

  logEvent(event: TelemetryEvent) {
    this.events.push(event);
  }

  getRawMetrics(): GoNoGoRawMetrics {
    const noGoTrials = this.events.filter(e => e.stimulusType === 'nogo');
    const goTrials = this.events.filter(e => e.stimulusType === 'go');

    const rawHits = goTrials.filter(e => e.responseType === 'hit').length;
    const rawMisses = goTrials.filter(e => e.responseType === 'miss').length;
    const rawCommissions = noGoTrials.filter(e => e.responseType === 'commission').length;
    const rawCorrectRejections = noGoTrials.filter(e => e.responseType === 'correct_rejection').length;
    
    // Extraindo e arredondando os tempos de reação
    const reactionTimesHits = goTrials
      .filter(e => e.responseType === 'hit' && e.reactionTime !== null)
      .map(e => Math.round(e.reactionTime as number));
      
    const reactionTimesCommissions = noGoTrials
      .filter(e => e.responseType === 'commission' && e.reactionTime !== null)
      .map(e => Math.round(e.reactionTime as number));

    return {
      totalGoStimuli: goTrials.length,
      totalNoGoStimuli: noGoTrials.length,
      hits: rawHits,
      misses: rawMisses,
      falseAlarms: rawCommissions,
      correctRejections: rawCorrectRejections,
      reactionTimesHits,
      reactionTimesCommissions
    };
  }
  
  clear() {
    this.events = [];
  }
}
