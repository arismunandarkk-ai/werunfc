export type MatchType = 'mini_soccer' | 'full_pitch';
export type Position = 'GK' | 'Player';
export type MatchStatus = 'open' | 'full' | 'closed';
export type View = 'home' | 'matches' | 'booking' | 'admin';

export interface Player {
  id: string;
  name: string;
  position: Position;
  team: number | null;
  bookingTime: number;
}

export interface Match {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  type: MatchType;
  teamCount: number;
  pricePerPerson: number;
  status: MatchStatus;
  players: Player[];
  teamsRevealed: boolean;
}

export interface AppState {
  view: View;
  matches: Match[];
  selectedMatchId: string | null;
  isAdmin: boolean;
  adminPin: string;
}

export type Action =
  | { type: 'SET_VIEW'; view: View }
  | { type: 'SELECT_MATCH'; matchId: string | null }
  | { type: 'CREATE_MATCH'; match: Match }
  | { type: 'UPDATE_MATCH'; match: Match }
  | { type: 'DELETE_MATCH'; matchId: string }
  | { type: 'ADD_PLAYER'; matchId: string; player: Player }
  | { type: 'REMOVE_PLAYER'; matchId: string; playerId: string }
  | { type: 'ASSIGN_TEAMS'; matchId: string; assignments: Record<string, number> }
  | { type: 'SHUFFLE_TEAMS'; matchId: string }
  | { type: 'REVEAL_TEAMS'; matchId: string }
  | { type: 'TOGGLE_ADMIN'; pin?: string }
  | { type: 'CLOSE_MATCH'; matchId: string }
  | { type: 'REOPEN_MATCH'; matchId: string }
  | { type: 'LOAD_STATE'; state: AppState };

const ADMIN_PIN = '1234';

export const initialState: AppState = {
  view: 'home',
  matches: [],
  selectedMatchId: null,
  isAdmin: false,
  adminPin: ADMIN_PIN,
};

export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, view: action.view };

    case 'SELECT_MATCH':
      return { ...state, selectedMatchId: action.matchId };

    case 'CREATE_MATCH':
      return { ...state, matches: [...state.matches, action.match] };

    case 'UPDATE_MATCH':
      return {
        ...state,
        matches: state.matches.map(m => m.id === action.match.id ? action.match : m),
      };

    case 'DELETE_MATCH':
      return {
        ...state,
        matches: state.matches.filter(m => m.id !== action.matchId),
        selectedMatchId: state.selectedMatchId === action.matchId ? null : state.selectedMatchId,
      };

    case 'ADD_PLAYER': {
      return {
        ...state,
        matches: state.matches.map(m => {
          if (m.id !== action.matchId) return m;
          const updated = { ...m, players: [...m.players, action.player] };
          return { ...updated, status: isMatchFull(updated) ? 'full' : 'open' };
        }),
      };
    }

    case 'REMOVE_PLAYER':
      return {
        ...state,
        matches: state.matches.map(m => {
          if (m.id !== action.matchId) return m;
          const updated = { ...m, players: m.players.filter(p => p.id !== action.playerId) };
          return { ...updated, status: m.status === 'closed' ? 'closed' : 'open' };
        }),
      };

    case 'ASSIGN_TEAMS':
      return {
        ...state,
        matches: state.matches.map(m => {
          if (m.id !== action.matchId) return m;
          return {
            ...m,
            players: m.players.map(p => ({
              ...p,
              team: action.assignments[p.id] ?? p.team,
            })),
          };
        }),
      };

    case 'SHUFFLE_TEAMS': {
      return {
        ...state,
        matches: state.matches.map(m => {
          if (m.id !== action.matchId) return m;
          return { ...m, players: shuffleTeams(m) };
        }),
      };
    }

    case 'REVEAL_TEAMS':
      return {
        ...state,
        matches: state.matches.map(m =>
          m.id === action.matchId ? { ...m, teamsRevealed: true } : m
        ),
      };

    case 'TOGGLE_ADMIN':
      if (state.isAdmin) return { ...state, isAdmin: false };
      if (action.pin === ADMIN_PIN) return { ...state, isAdmin: true };
      return state;

    case 'CLOSE_MATCH':
      return {
        ...state,
        matches: state.matches.map(m =>
          m.id === action.matchId ? { ...m, status: 'closed' } : m
        ),
      };

    case 'REOPEN_MATCH':
      return {
        ...state,
        matches: state.matches.map(m => {
          if (m.id !== action.matchId) return m;
          return { ...m, status: isMatchFull(m) ? 'full' : 'open', teamsRevealed: false };
        }),
      };

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}

function isMatchFull(match: Match): boolean {
  const config = getMatchConfig(match.type, match.teamCount);
  return match.players.length >= config.totalSlots;
}

function shuffleTeams(match: Match): Player[] {
  const config = getMatchConfig(match.type, match.teamCount);
  const gks = match.players.filter(p => p.position === 'GK');
  const players = match.players.filter(p => p.position === 'Player');

  const shuffledGks = [...gks].sort(() => Math.random() - 0.5);
  const shuffledPlayers = [...players].sort(() => Math.random() - 0.5);

  const result: Player[] = [];

  for (let t = 0; t < match.teamCount; t++) {
    const teamNum = t + 1;
    if (shuffledGks[t]) {
      result.push({ ...shuffledGks[t], team: teamNum });
    }
  }

  let teamIndex = 0;
  for (const p of shuffledPlayers) {
    const teamNum = (teamIndex % match.teamCount) + 1;
    result.push({ ...p, team: teamNum });
    teamIndex++;
  }

  const remainingGks = shuffledGks.slice(match.teamCount);
  for (const g of remainingGks) {
    result.push({ ...g, team: null });
  }

  return result;
}

export function getMatchConfig(type: MatchType, teamCount: number) {
  const gkPerTeam = 1;
  const playersPerTeam = type === 'mini_soccer' ? 7 : 10;
  const perTeam = gkPerTeam + playersPerTeam;
  return {
    gkPerTeam,
    playersPerTeam,
    perTeam,
    totalGk: gkPerTeam * teamCount,
    totalPlayers: playersPerTeam * teamCount,
    totalSlots: perTeam * teamCount,
  };
}

export function getAvailableSlots(match: Match) {
  const config = getMatchConfig(match.type, match.teamCount);
  const currentGks = match.players.filter(p => p.position === 'GK').length;
  const currentPlayers = match.players.filter(p => p.position === 'Player').length;
  return {
    gkSlots: config.totalGk - currentGks,
    playerSlots: config.totalPlayers - currentPlayers,
    totalRemaining: config.totalSlots - match.players.length,
  };
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
