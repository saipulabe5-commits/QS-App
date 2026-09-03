export interface AILogEntry {
  id: string;
  timestamp: number;
  agentName: string;
  targetId: string;
  status: 'success' | 'error' | 'skipped';
  message: string;
  durationMs: number;
  details?: any;
}

export const AILogger = {
  log: (entry: Omit<AILogEntry, 'id' | 'timestamp'>) => {
    try {
      const logs = AILogger.getLogs();
      const newLog: AILogEntry = {
        ...entry,
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
      };
      logs.unshift(newLog);
      // Keep only last 100 logs
      if (logs.length > 100) logs.length = 100;
      localStorage.setItem('rabpro_ai_logs', JSON.stringify(logs));
      
      // Dispatch custom event for real-time UI updates
      window.dispatchEvent(new CustomEvent('ai-log-updated', { detail: newLog }));
      
      console.log(`[AGENT:${entry.agentName}] target=${entry.targetId} status=${entry.status} durationMs=${entry.durationMs}ms`);
      return newLog;
    } catch (e) {
      console.error('Failed to save AI log', e);
    }
  },
  
  getLogs: (): AILogEntry[] => {
    try {
      const saved = localStorage.getItem('rabpro_ai_logs');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  },
  
  clear: () => {
    localStorage.removeItem('rabpro_ai_logs');
    window.dispatchEvent(new CustomEvent('ai-log-updated', { detail: null }));
  }
};
