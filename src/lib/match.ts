import { supabase } from '@/lib/supabase';

export type MatchCard = {
  id: string;
  nickname: string;
  avatar_url: string | null;
  bio: string;
  interests: string[];
  school: string | null;
  grade: string | null;
  common_interests: number;
  recommended_reason: string[];
  match_percent: number;
};

export type MatchRecord = {
  matched: boolean;
  match_id: string | null;
};

export type MyMatch = {
  match_id: string;
  matched_at: string;
  id: string;
  nickname: string;
  avatar_url: string | null;
  bio: string;
  interests: string[];
  common_interests: number;
};

export async function getMatchCards(limit = 10): Promise<MatchCard[]> {
  const { data, error } = await supabase.rpc('get_match_cards', { limit_count: limit });
  if (error) throw error;
  return (data ?? []) as MatchCard[];
}

export async function recordSwipe(targetId: string, action: 'like' | 'skip'): Promise<MatchRecord> {
  const { data, error } = await supabase.rpc('record_swipe', {
    p_target_id: targetId,
    p_action: action,
  });
  if (error) throw error;
  return (data ?? { matched: false, match_id: null }) as MatchRecord;
}

export async function listMyMatches(): Promise<MyMatch[]> {
  const { data, error } = await supabase.rpc('list_my_matches');
  if (error) throw error;
  return (data ?? []) as MyMatch[];
}
