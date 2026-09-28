import { useReducer, useEffect, useCallback, useRef } from 'react';
import { reducer, initialState } from '@/lib/state';
import type { AppState } from '@/lib/state';
import { subscribeMatches, isFirebaseConnected } from '@/lib/firebase';
import { Toaster } from '@/components/ui/sonner';
import Nav from '@/sections/Nav';
import Hero from '@/sections/Hero';
import MatchList from '@/sections/MatchList';
import BookingForm from '@/sections/BookingForm';
import AdminPanel from '@/sections/AdminPanel';
import Footer from '@/sections/Footer';

export default function App() {
  const [state, dispatch] = useReducer(reducer, initialState);
  const firebaseActive = useRef(isFirebaseConnected());

  // Firebase real-time sync
  useEffect(() => {
    if (!firebaseActive.current) return;
    const unsub = subscribeMatches((matches) => {
      dispatch({ type: 'LOAD_STATE', state: { ...initialState, matches, view: 'home' } });
    });
    return unsub;
  }, []);

  // Keep local view/admin state across firebase refreshes
  const stateRef = useRef(state);
  stateRef.current = state;

  // Re-subscribe when needed — maintain matches from Firebase while keeping local UI state
  useEffect(() => {
    if (!firebaseActive.current) return;
    const unsub = subscribeMatches((matches) => {
      dispatch({
        type: 'LOAD_STATE',
        state: {
          ...stateRef.current,
          matches,
        },
      });
    });
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNavigate = useCallback((view: AppState['view'], matchId?: string) => {
    dispatch({ type: 'SET_VIEW', view });
    if (matchId) dispatch({ type: 'SELECT_MATCH', matchId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen flex flex-col font-body" style={{ background: 'var(--color-bg)' }}>
      <Nav state={state} dispatch={dispatch} onNavigate={handleNavigate} />

      {!firebaseActive.current && (
        <div className="text-center py-2 text-xs font-medium" style={{ background: 'oklch(72% 0.16 85 / 0.15)', color: 'oklch(45% 0.14 85)' }}>
          ⚠️ Mode offline — data disimpan lokal. Konfigurasi Firebase untuk sinkronisasi real-time.
        </div>
      )}

      <main className="flex-1">
        {state.view === 'home' && (
          <>
            <Hero onNavigate={handleNavigate} />
            <MatchList state={state} dispatch={dispatch} onNavigate={handleNavigate} />
          </>
        )}

        {state.view === 'matches' && (
          <MatchList state={state} dispatch={dispatch} onNavigate={handleNavigate} />
        )}

        {state.view === 'booking' && (
          <BookingForm state={state} dispatch={dispatch} onNavigate={handleNavigate} />
        )}

        {state.view === 'admin' && (
          <AdminPanel state={state} dispatch={dispatch} onNavigate={handleNavigate} />
        )}
      </main>

      <Footer onNavigate={handleNavigate} />
      <Toaster position="bottom-center" />
    </div>
  );
}
