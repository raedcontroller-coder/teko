export type BombaRawData = {
  level: number;
  reactionTime: number; // em ms
  errors: number;
}[];

interface LevelMetrics {
  levelIndex: number;
  firstReactionTime: number | null;
  errorCount: number;
}

export class TelemetryLogger {
  private levelData: Record<number, LevelMetrics> = {};
  private currentLevel: number = 0;
  private roundStartTime: number = 0;

  clear() {
    this.levelData = {};
    this.currentLevel = 0;
    this.roundStartTime = 0;
  }

  startRound(level: number) {
    this.currentLevel = level;
    this.roundStartTime = performance.now();
    
    // Inicializa a métrica se ainda não existir
    if (!this.levelData[level]) {
      this.levelData[level] = {
        levelIndex: level,
        firstReactionTime: null,
        errorCount: 0
      };
    }
  }

  logResponse(actionTime?: number) {
    const levelMetrics = this.levelData[this.currentLevel];
    if (levelMetrics && levelMetrics.firstReactionTime === null) {
      const rt = (actionTime || performance.now()) - this.roundStartTime;
      levelMetrics.firstReactionTime = Math.round(rt);
    }
  }

  logError() {
    const levelMetrics = this.levelData[this.currentLevel];
    if (levelMetrics) {
      levelMetrics.errorCount += 1;
    }
  }

  getExGaussianRawData(maxValidLevel?: number): BombaRawData {
    // Retorna os dados como um array cronológico contendo apenas os níveis válidos
    const levels = Object.values(this.levelData).sort((a, b) => a.levelIndex - b.levelIndex);
    
    // Filtra apenas as rodadas que tiveram de fato uma resposta
    let validLevels = levels.filter(l => l.firstReactionTime !== null);

    // Garante que não logaremos níveis incompletos além da pontuação final
    if (maxValidLevel !== undefined) {
      validLevels = validLevels.filter(l => l.levelIndex <= maxValidLevel);
    }

    return validLevels.map(l => ({
      level: l.levelIndex,
      reactionTime: l.firstReactionTime as number,
      errors: l.errorCount
    }));
  }
}
