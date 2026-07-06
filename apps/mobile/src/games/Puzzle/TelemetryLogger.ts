export interface LevelMetrics {
  levelIndex: number;
  maxIdleTime: number; // in milliseconds
  maxHandlingTime: number; // in milliseconds
  invalidAttempts: number;
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
}

