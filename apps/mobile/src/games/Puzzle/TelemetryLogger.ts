export interface LevelMetrics {
  levelIndex: number;
  maxIdleTime: number; // in milliseconds
  maxHandlingTime: number; // in milliseconds
  invalidAttempts: number;
}

export interface BlockMetrics {
  blockIndex: number;
  levelsIncluded: number[];
  meanMaxIdleTime: number;
  meanMaxHandlingTime: number;
  meanInvalidAttempts: number;
}

export interface SlopeMetrics {
  betaIdleTime: number;
  betaHandlingTime: number;
  betaInvalidAttempts: number;
}

export class TelemetryLogger {
  private levelData: Record<number, LevelMetrics> = {};
  private currentLevel: number = 0;
  
  // Tracking timestamps
  private lastInteractionTime: number = 0; 
  private currentDragStartTime: number = 0;
  
  // Pause management
  private isPaused: boolean = false;
  private pauseTime: number = 0;
  
  startLevel(levelNumber: number) {
    this.currentLevel = levelNumber;
    if (!this.levelData[levelNumber]) {
      this.levelData[levelNumber] = {
        levelIndex: levelNumber,
        maxIdleTime: 0,
        maxHandlingTime: 0,
        invalidAttempts: 0
      };
    }
    this.lastInteractionTime = performance.now();
    this.isPaused = false;
  }

  pause() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.pauseTime = performance.now();
    }
  }

  resume() {
    if (this.isPaused) {
      const pausedDuration = performance.now() - this.pauseTime;
      // Shift timestamps forward so pause time isn't counted as idle/handling time
      this.lastInteractionTime += pausedDuration;
      if (this.currentDragStartTime > 0) {
        this.currentDragStartTime += pausedDuration;
      }
      this.isPaused = false;
    }
  }

  logDragStart() {
    if (this.currentLevel === 0 || this.isPaused) return;

    const now = performance.now();
    const currentIdleTime = now - this.lastInteractionTime;
    
    const level = this.levelData[this.currentLevel];
    if (currentIdleTime > level.maxIdleTime) {
      level.maxIdleTime = Math.round(currentIdleTime);
    }
    
    this.currentDragStartTime = now;
  }

  logDragDrop(isInvalid: boolean) {
    if (this.currentLevel === 0 || this.isPaused) return;

    const now = performance.now();
    const currentHandlingTime = now - this.currentDragStartTime;
    
    const level = this.levelData[this.currentLevel];
    if (currentHandlingTime > level.maxHandlingTime) {
      level.maxHandlingTime = Math.round(currentHandlingTime);
    }
    
    if (isInvalid) {
      level.invalidAttempts += 1;
    }
    
    this.lastInteractionTime = now; // Reset idle timer
    this.currentDragStartTime = 0;
  }

  getAllMetrics(): LevelMetrics[] {
    return Object.values(this.levelData);
  }

  getLevelMetrics(levelNumber: number): LevelMetrics | undefined {
    return this.levelData[levelNumber];
  }

  getSlopeBlocks(): BlockMetrics[] {
    const blocks: BlockMetrics[] = [];
    const maxLevels = 10;
    let blockIndex = 1;

    for (let i = 1; i <= maxLevels; i += 2) {
      const levelA = this.levelData[i] || { maxIdleTime: 0, maxHandlingTime: 0, invalidAttempts: 0 };
      const levelB = this.levelData[i + 1] || { maxIdleTime: 0, maxHandlingTime: 0, invalidAttempts: 0 };

      const meanIdle = (levelA.maxIdleTime + levelB.maxIdleTime) / 2;
      const meanHandling = (levelA.maxHandlingTime + levelB.maxHandlingTime) / 2;
      const meanInvalid = (levelA.invalidAttempts + levelB.invalidAttempts) / 2;

      blocks.push({
        blockIndex,
        levelsIncluded: [i, i + 1],
        meanMaxIdleTime: Number(meanIdle.toFixed(2)),
        meanMaxHandlingTime: Number(meanHandling.toFixed(2)),
        meanInvalidAttempts: Number(meanInvalid.toFixed(2))
      });

      blockIndex++;
    }

    return blocks;
  }

  calculateSlopeChange(blocks: BlockMetrics[]): SlopeMetrics {
    if (blocks.length !== 5) {
      return { betaIdleTime: 0, betaHandlingTime: 0, betaInvalidAttempts: 0 };
    }

    // O Eixo X é fixo: [1, 2, 3, 4, 5]
    // Média de X (1+2+3+4+5)/5 = 3
    const meanX = 3;
    
    // Denominador fixo: soma dos quadrados de (x_i - meanX)
    // (-2)^2 + (-1)^2 + 0^2 + 1^2 + 2^2 = 4 + 1 + 0 + 1 + 4 = 10
    const denominator = 10;

    // Calcular as médias de Y
    let sumIdle = 0;
    let sumHandling = 0;
    let sumInvalid = 0;

    for (const b of blocks) {
      sumIdle += b.meanMaxIdleTime;
      sumHandling += b.meanMaxHandlingTime;
      sumInvalid += b.meanInvalidAttempts;
    }

    const meanYIdle = sumIdle / 5;
    const meanYHandling = sumHandling / 5;
    const meanYInvalid = sumInvalid / 5;

    // Calcular os numeradores de Beta (Covariância)
    let numIdle = 0;
    let numHandling = 0;
    let numInvalid = 0;

    for (let i = 0; i < blocks.length; i++) {
      const x = i + 1; // 1 a 5
      const b = blocks[i];

      const xDiff = x - meanX;
      
      numIdle += xDiff * (b.meanMaxIdleTime - meanYIdle);
      numHandling += xDiff * (b.meanMaxHandlingTime - meanYHandling);
      numInvalid += xDiff * (b.meanInvalidAttempts - meanYInvalid);
    }

    const betaIdleTime = numIdle / denominator;
    const betaHandlingTime = numHandling / denominator;
    const betaInvalidAttempts = numInvalid / denominator;

    return {
      betaIdleTime: Number(betaIdleTime.toFixed(2)),
      betaHandlingTime: Number(betaHandlingTime.toFixed(2)),
      betaInvalidAttempts: Number(betaInvalidAttempts.toFixed(2))
    };
  }
}
