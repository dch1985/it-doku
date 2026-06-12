import { useState, useCallback } from 'react';
import { toast } from 'sonner';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';

export interface SkillField {
  key: string;
  label: string;
  type: 'text' | 'textarea' | 'select' | 'number';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
}

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  fields: SkillField[];
  outputType: string;
}

export interface AgentFinding {
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  section: string;
  message: string;
  recommendation: string;
}

export interface AgentRunResult {
  skillId: string;
  skillName: string;
  status: string;
  outputType: string;
  title: string;
  content: string;
  findings?: AgentFinding[];
  checklist?: { item: string; status: string; notes: string }[];
  metadata: {
    executedAt: string;
    durationMs: number;
    sectionsGenerated: number;
  };
}

export function useAgents() {
  const [skills, setSkills] = useState<AgentSkill[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [lastResult, setLastResult] = useState<AgentRunResult | null>(null);

  const fetchSkills = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/agents/skills`);
      if (!res.ok) throw new Error('Failed to load skills');
      const data = await res.json();
      setSkills(data.skills);
    } catch {
      toast.error('Could not load agent skills');
    } finally {
      setLoading(false);
    }
  }, []);

  const runSkill = useCallback(async (skillId: string, inputs: Record<string, string>) => {
    setRunning(true);
    try {
      const res = await fetch(`${API_BASE}/api/agents/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skillId, inputs }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Agent run failed');
      }
      const result: AgentRunResult = await res.json();
      setLastResult(result);
      toast.success(`Agent completed: ${result.title}`);
      return result;
    } catch (error: any) {
      toast.error(error.message || 'Agent execution failed');
      throw error;
    } finally {
      setRunning(false);
    }
  }, []);

  return { skills, loading, running, lastResult, fetchSkills, runSkill, setLastResult };
}
