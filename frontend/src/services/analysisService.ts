import { supabase, isSupabaseConfigured } from '../lib/supabase';
import type { Tables, InsertTables } from '../types/database';

export const analysisService = {
  async saveTechniqueAnalysis(
    analysisData: InsertTables<'technique_analysis'>
  ): Promise<Tables<'technique_analysis'> | null> {
    if (!isSupabaseConfigured()) return null;

    const { data, error } = await supabase
      .from('technique_analysis')
      .insert(analysisData)
      .select()
      .single();

    if (error) {
      console.error('Error saving technique analysis:', error.message);
      return null;
    }
    return data;
  },

  async saveTechniqueIssues(
    issues: InsertTables<'technique_issues'>[]
  ): Promise<Tables<'technique_issues'>[]> {
    if (!isSupabaseConfigured() || issues.length === 0) return [];

    const { data, error } = await supabase
      .from('technique_issues')
      .insert(issues)
      .select();

    if (error) {
      console.error('Error saving technique issues:', error.message);
      return [];
    }
    return data || [];
  },

  async saveTechniqueScores(
    scores: InsertTables<'technique_scores'>[]
  ): Promise<Tables<'technique_scores'>[]> {
    if (!isSupabaseConfigured() || scores.length === 0) return [];

    const { data, error } = await supabase
      .from('technique_scores')
      .insert(scores)
      .select();

    if (error) {
      console.error('Error saving technique scores:', error.message);
      return [];
    }
    return data || [];
  },

  async getSessionAnalysis(sessionId: string) {
    if (!isSupabaseConfigured() || !sessionId) return null;

    const [analysisRes, issuesRes, scoresRes] = await Promise.all([
      supabase.from('technique_analysis').select('*').eq('session_id', sessionId),
      supabase.from('technique_issues').select('*').eq('session_id', sessionId),
      supabase.from('technique_scores').select('*').eq('session_id', sessionId),
    ]);

    return {
      analyses: analysisRes.data || [],
      issues: issuesRes.data || [],
      scores: scoresRes.data || [],
    };
  },
};
