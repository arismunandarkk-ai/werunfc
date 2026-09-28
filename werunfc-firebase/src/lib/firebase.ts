import { initializeApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  onValue,
  set,
  push,
  remove,
  update,
  get,
} from 'firebase/database';
import type { Match, Player, MatchType, MatchStatus } from './state';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL || '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
};

const hasConfig = !!firebaseConfig.databaseURL;

let db: ReturnType<typeof getDatabase> | null = null;

if (hasConfig) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getDatabase(app);
  } catch (e) {
    console.warn('Firebase init failed:', e);
  }
}

export function isFirebaseConnected(): boolean {
  return db !== null;
}

// ──── Realtime listener ────
export function subscribeMatches(callback: (matches: Match[]) => void): () => void {
  if (!db) {
    callback([]);
    return () => {};
  }
  const matchesRef = ref(db, 'matches');
  const unsubscribe = onValue(matchesRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) {
      callback([]);
      return;
    }
    const matches: Match[] = Object.entries(data).map(([id, raw]: [string, any]) => ({
      id,
      title: raw.title || '',
      date: raw.date || '',
      time: raw.time || '',
      location: raw.location || '',
      type: (raw.type || 'mini_soccer') as MatchType,
      teamCount: raw.teamCount || 2,
      pricePerPerson: raw.pricePerPerson || 0,
      status: (raw.status || 'open') as MatchStatus,
      players: raw.players
        ? Object.entries(raw.players).map(([pid, p]: [string, any]) => ({
            id: pid,
            name: p.name || '',
            position: p.position || 'Player',
            team: p.team ?? null,
            bookingTime: p.bookingTime || 0,
          }))
        : [],
      teamsRevealed: raw.teamsRevealed || false,
    }));
    callback(matches);
  });
  return () => unsubscribe();
}

// ──── Write operations ────

export async function createMatch(match: Match): Promise<string> {
  if (!db) throw new Error('Firebase not connected');
  const matchesRef = ref(db, 'matches');
  const newRef = push(matchesRef);
  const { players, id, ...rest } = match;
  await set(newRef, { ...rest, teamsRevealed: false });
  return newRef.key!;
}

export async function updateMatch(match: Match): Promise<void> {
  if (!db) throw new Error('Firebase not connected');
  const matchRef = ref(db, `matches/${match.id}`);
  const { players, id, ...rest } = match;
  await update(matchRef, rest);
}

export async function deleteMatch(matchId: string): Promise<void> {
  if (!db) throw new Error('Firebase not connected');
  await remove(ref(db, `matches/${matchId}`));
}

export async function addPlayer(matchId: string, player: Player): Promise<void> {
  if (!db) throw new Error('Firebase not connected');
  const playersRef = ref(db, `matches/${matchId}/players`);
  const newRef = push(playersRef);
  const { id, ...rest } = player;
  await set(newRef, rest);

  // check if match is full and update status
  const matchSnap = await get(ref(db, `matches/${matchId}`));
  if (matchSnap.exists()) {
    const data = matchSnap.val();
    const playerCount = data.players ? Object.keys(data.players).length : 0;
    const gkPerTeam = 1;
    const playersPerTeam = data.type === 'mini_soccer' ? 7 : 10;
    const totalSlots = (gkPerTeam + playersPerTeam) * data.teamCount;
    if (playerCount >= totalSlots) {
      await update(ref(db, `matches/${matchId}`), { status: 'full' });
    }
  }
}

export async function removePlayer(matchId: string, playerId: string): Promise<void> {
  if (!db) throw new Error('Firebase not connected');
  await remove(ref(db, `matches/${matchId}/players/${playerId}`));

  // re-check status
  const matchSnap = await get(ref(db, `matches/${matchId}`));
  if (matchSnap.exists()) {
    const data = matchSnap.val();
    if (data.status !== 'closed') {
      await update(ref(db, `matches/${matchId}`), { status: 'open' });
    }
  }
}

export async function assignTeams(
  matchId: string,
  assignments: Record<string, number>
): Promise<void> {
  if (!db) throw new Error('Firebase not connected');
  const updates: Record<string, number> = {};
  for (const [playerId, team] of Object.entries(assignments)) {
    updates[`matches/${matchId}/players/${playerId}/team`] = team;
  }
  await update(ref(db, '/'), updates);
}

export async function shuffleTeamsFirebase(matchId: string): Promise<void> {
  if (!db) throw new Error('Firebase not connected');
  const matchSnap = await get(ref(db, `matches/${matchId}`));
  if (!matchSnap.exists()) return;
  const data = matchSnap.val();
  const teamCount = data.teamCount || 2;

  if (!data.players) return;
  const entries = Object.entries(data.players) as [string, any][];
  const gks = entries.filter(([, p]) => p.position === 'GK');
  const fieldPlayers = entries.filter(([, p]) => p.position === 'Player');

  // shuffle
  const shuffledGks = [...gks].sort(() => Math.random() - 0.5);
  const shuffledPlayers = [...fieldPlayers].sort(() => Math.random() - 0.5);

  const updates: Record<string, number | null> = {};

  // assign GKs to teams 1..teamCount
  shuffledGks.forEach(([id], i) => {
    updates[`matches/${matchId}/players/${id}/team`] = i < teamCount ? i + 1 : null;
  });

  // distribute field players round-robin
  shuffledPlayers.forEach(([id], i) => {
    updates[`matches/${matchId}/players/${id}/team`] = (i % teamCount) + 1;
  });

  await update(ref(db, '/'), updates);
}

export async function revealTeams(matchId: string): Promise<void> {
  if (!db) throw new Error('Firebase not connected');
  await update(ref(db, `matches/${matchId}`), { teamsRevealed: true });
}

export async function closeMatch(matchId: string): Promise<void> {
  if (!db) throw new Error('Firebase not connected');
  await update(ref(db, `matches/${matchId}`), { status: 'closed' });
}

export async function reopenMatch(matchId: string): Promise<void> {
  if (!db) throw new Error('Firebase not connected');
  const matchSnap = await get(ref(db, `matches/${matchId}`));
  if (!matchSnap.exists()) return;
  const data = matchSnap.val();
  const playerCount = data.players ? Object.keys(data.players).length : 0;
  const gkPerTeam = 1;
  const playersPerTeam = data.type === 'mini_soccer' ? 7 : 10;
  const totalSlots = (gkPerTeam + playersPerTeam) * data.teamCount;
  const newStatus = playerCount >= totalSlots ? 'full' : 'open';
  await update(ref(db, `matches/${matchId}`), { status: newStatus, teamsRevealed: false });
}
