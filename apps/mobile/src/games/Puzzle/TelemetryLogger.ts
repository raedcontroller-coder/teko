export interface PuzzleAttempt {
  pieceId: string;
  isCorrect: boolean;
  isFirstAttempt: boolean;
  distance: number;
}

export class TelemetryLogger {
  private attempts: PuzzleAttempt[] = [];
  private startTime: number = 0;
  private totalPieces: number = 0;

  startSession(pieces: number) {
    this.startTime = performance.now();
    this.totalPieces = pieces;
    this.attempts = [];
  }

  logAttempt(attempt: PuzzleAttempt) {
    this.attempts.push(attempt);
  }

  getMetrics() {
    const totalTimeMs = performance.now() - this.startTime;
    
    // Quantas peças foram acertadas de primeira?
    const correctFirstAttempts = this.attempts.filter(a => a.isCorrect && a.isFirstAttempt).length;
    
    // IEP = Índice de Encaixe de Primeira
    const iep = this.totalPieces > 0 ? (correctFirstAttempts / this.totalPieces) * 100 : 0;
    
    // MTP = Média de Tentativas por Peça
    const mtp = this.totalPieces > 0 ? this.attempts.length / this.totalPieces : 0;

    return {
      iep: iep.toFixed(1), 
      totalTimeSec: (totalTimeMs / 1000).toFixed(1),
      mtp: mtp.toFixed(1),
      totalAttempts: this.attempts.length,
      correctFirstAttempts,
      totalPieces: this.totalPieces
    };
  }
}
