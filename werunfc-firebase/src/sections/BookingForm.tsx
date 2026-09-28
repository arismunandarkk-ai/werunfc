import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AppState, Action, Position } from '@/lib/state';
import { getMatchConfig, getAvailableSlots, generateId } from '@/lib/state';
import { isFirebaseConnected, addPlayer as fbAddPlayer } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { fadeUp, easeOut } from '@/lib/motion';
import { ArrowLeft, UserPlus, Check, Users, Shield as ShieldIcon } from 'lucide-react';

const fb = isFirebaseConnected();

interface BookingFormProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onNavigate: (view: AppState['view'], matchId?: string) => void;
}

export default function BookingForm({ state, dispatch, onNavigate }: BookingFormProps) {
  const match = state.matches.find(m => m.id === state.selectedMatchId);
  const [name, setName] = useState('');
  const [position, setPosition] = useState<Position>('Player');
  const [bookingCount, setBookingCount] = useState(1);
  const [loading, setLoading] = useState(false);

  const slots = useMemo(() => match ? getAvailableSlots(match) : null, [match]);
  const config = useMemo(() => match ? getMatchConfig(match.type, match.teamCount) : null, [match]);

  if (!match || !slots || !config) {
    return (
      <div className="py-20 text-center max-w-7xl mx-auto px-4">
        <p style={{ color: 'var(--color-text-muted)' }}>Match tidak ditemukan.</p>
        <Button variant="ghost" onClick={() => onNavigate('matches')} className="mt-4 rounded-full">
          <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  const positionAvailable = position === 'GK' ? slots.gkSlots : slots.playerSlots;

  const handleBooking = async () => {
    if (!name.trim()) { toast.error('Nama harus diisi'); return; }
    const actualCount = Math.min(bookingCount, positionAvailable);
    if (actualCount <= 0) { toast.error(`Slot ${position} sudah penuh`); return; }

    setLoading(true);
    try {
      for (let i = 0; i < actualCount; i++) {
        const playerName = actualCount > 1 ? `${name.trim()} (${i + 1})` : name.trim();
        const player = { id: generateId(), name: playerName, position, team: null, bookingTime: Date.now() };
        if (fb) {
          await fbAddPlayer(match.id, player);
        } else {
          dispatch({ type: 'ADD_PLAYER', matchId: match.id, player });
        }
      }
      toast.success(`${actualCount} pemain berhasil didaftarkan!`);
      setName(''); setBookingCount(1);
    } catch {
      toast.error('Gagal mendaftarkan pemain');
    } finally {
      setLoading(false);
    }
  };

  const teamGroups = useMemo(() => {
    if (!match.teamsRevealed) return null;
    const groups: Record<number, typeof match.players> = {};
    for (let i = 1; i <= match.teamCount; i++) groups[i] = [];
    const unassigned: typeof match.players = [];
    match.players.forEach(p => { if (p.team && groups[p.team]) groups[p.team].push(p); else unassigned.push(p); });
    return { groups, unassigned };
  }, [match]);

  return (
    <section className="py-12 md:py-20" style={{ background: 'var(--color-surface)' }}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <button onClick={() => onNavigate('matches')} className="flex items-center gap-1.5 text-sm font-medium mb-6 cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
          <ArrowLeft className="w-4 h-4" /> Kembali ke Jadwal
        </button>

        <motion.div variants={fadeUp} initial="hidden" animate="show" className="p-6 mb-8" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-hairline)' }}>
          <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
            <div>
              <Badge className="rounded-full text-xs font-medium mb-2" style={{ background: match.type === 'mini_soccer' ? 'oklch(55% 0.16 145 / 0.12)' : 'oklch(48% 0.18 265 / 0.12)', color: match.type === 'mini_soccer' ? 'oklch(40% 0.14 145)' : 'oklch(38% 0.16 265)' }}>
                {match.type === 'mini_soccer' ? 'Mini Soccer' : 'Full Pitch'}
              </Badge>
              <h2 className="font-display text-[clamp(1.75rem,3vw,2.5rem)] tracking-tight" style={{ color: 'var(--color-text-primary)' }}>{match.title}</h2>
            </div>
            <div className="text-right">
              <p className="font-display text-2xl" style={{ color: 'var(--color-text-primary)' }}>Rp {match.pricePerPerson.toLocaleString('id-ID')}</p>
              <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>per orang</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <span>📅 {match.date}</span><span>🕐 {match.time}</span><span>📍 {match.location}</span><span>👥 {match.teamCount} Tim × {config.perTeam} pemain</span>
          </div>
          <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--color-hairline)' }}>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="font-display text-xl" style={{ color: 'var(--color-text-primary)' }}>{config.totalSlots - slots.totalRemaining}</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Terdaftar</p></div>
              <div><p className="font-display text-xl" style={{ color: slots.gkSlots > 0 ? 'oklch(52% 0.14 155)' : 'oklch(52% 0.22 25)' }}>{slots.gkSlots}</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sisa GK</p></div>
              <div><p className="font-display text-xl" style={{ color: slots.playerSlots > 0 ? 'oklch(52% 0.14 155)' : 'oklch(52% 0.22 25)' }}>{slots.playerSlots}</p><p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Sisa Player</p></div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.15, ease: easeOut }} className="lg:col-span-2 p-6" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-hairline)' }}>
            <h3 className="font-display text-xl mb-5 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}><UserPlus className="w-5 h-5" /> DAFTAR BERMAIN</h3>
            {match.status === 'full' ? (
              <div className="text-center py-8"><p className="font-medium" style={{ color: 'var(--color-error)' }}>Match sudah penuh!</p><p className="text-sm mt-1" style={{ color: 'var(--color-text-muted)' }}>Tunggu jadwal match berikutnya.</p></div>
            ) : (
              <div className="space-y-4">
                <div><label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Nama Pemain</label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Masukkan nama..." className="rounded-lg" onKeyDown={e => e.key === 'Enter' && handleBooking()} /></div>
                <div>
                  <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--color-text-secondary)' }}>Posisi</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setPosition('GK')} className="p-3 text-center cursor-pointer transition-all" style={{ background: position === 'GK' ? 'var(--color-primary)' : 'var(--color-surface)', color: position === 'GK' ? 'var(--color-bg)' : 'var(--color-text-primary)', border: `2px solid ${position === 'GK' ? 'var(--color-primary)' : 'var(--color-hairline)'}`, borderRadius: '9999px' }}>
                      <ShieldIcon className="w-5 h-5 mx-auto mb-1" /><span className="text-sm font-medium block">Goalkeeper</span><span className="text-xs opacity-70">{slots.gkSlots} slot sisa</span>
                    </button>
                    <button onClick={() => setPosition('Player')} className="p-3 text-center cursor-pointer transition-all" style={{ background: position === 'Player' ? 'var(--color-primary)' : 'var(--color-surface)', color: position === 'Player' ? 'var(--color-bg)' : 'var(--color-text-primary)', border: `2px solid ${position === 'Player' ? 'var(--color-primary)' : 'var(--color-hairline)'}`, borderRadius: '9999px' }}>
                      <Users className="w-5 h-5 mx-auto mb-1" /><span className="text-sm font-medium block">Player</span><span className="text-xs opacity-70">{slots.playerSlots} slot sisa</span>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Jumlah Booking ({positionAvailable} tersedia)</label>
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="rounded-full h-9 w-9" onClick={() => setBookingCount(Math.max(1, bookingCount - 1))} disabled={bookingCount <= 1}>−</Button>
                    <span className="font-display text-xl w-10 text-center" style={{ color: 'var(--color-text-primary)' }}>{bookingCount}</span>
                    <Button size="icon" variant="outline" className="rounded-full h-9 w-9" onClick={() => setBookingCount(Math.min(positionAvailable, bookingCount + 1))} disabled={bookingCount >= positionAvailable}>+</Button>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-sm mb-3 font-medium" style={{ color: 'var(--color-text-primary)' }}>Total: Rp {(match.pricePerPerson * bookingCount).toLocaleString('id-ID')}</p>
                  <Button className="w-full rounded-full font-medium" onClick={handleBooking} disabled={positionAvailable === 0 || loading}>
                    {loading ? 'Mendaftarkan...' : <><Check className="w-4 h-4 mr-2" /> Daftar {bookingCount} Pemain</>}
                  </Button>
                </div>
              </div>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.25, ease: easeOut }} className="lg:col-span-3 p-6" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-hairline)' }}>
            <h3 className="font-display text-xl mb-5" style={{ color: 'var(--color-text-primary)' }}>{match.teamsRevealed ? 'PEMBAGIAN TIM' : 'DAFTAR PEMAIN'}</h3>
            {match.players.length === 0 ? (
              <div className="text-center py-12"><Users className="w-10 h-10 mx-auto mb-3" style={{ color: 'var(--color-text-muted)' }} /><p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada pemain terdaftar. Jadilah yang pertama!</p></div>
            ) : match.teamsRevealed && teamGroups ? (
              <div className="space-y-4">
                {Object.entries(teamGroups.groups).map(([teamNum, players]) => (
                  <div key={teamNum} className="p-4 rounded-lg" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-hairline)' }}>
                    <h4 className="font-display text-lg mb-3 flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
                      <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}>{teamNum}</span>
                      Tim {teamNum} <span className="text-xs font-body" style={{ color: 'var(--color-text-muted)' }}>({players.length} pemain)</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {players.map(p => (
                        <div key={p.id} className="flex items-center gap-2 py-1.5 px-2 rounded text-sm" style={{ background: 'var(--color-bg)' }}>
                          <Badge variant="outline" className="rounded-full text-[10px] px-1.5 shrink-0">{p.position}</Badge>
                          <span className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{p.name}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {teamGroups.unassigned.length > 0 && (
                  <div className="p-3 rounded-lg" style={{ background: 'oklch(72% 0.16 85 / 0.08)', border: '1px solid oklch(72% 0.16 85 / 0.2)' }}>
                    <p className="text-xs font-medium mb-2" style={{ color: 'oklch(55% 0.14 85)' }}>Belum masuk tim:</p>
                    {teamGroups.unassigned.map(p => (<span key={p.id} className="text-xs mr-2">{p.name} ({p.position})</span>))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                {match.players.map((p, i) => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-3 rounded text-sm" style={{ background: i % 2 === 0 ? 'var(--color-surface)' : 'transparent' }}>
                    <div className="flex items-center gap-2">
                      <span className="w-6 text-center text-xs" style={{ color: 'var(--color-text-muted)' }}>{i + 1}</span>
                      <Badge variant="outline" className="rounded-full text-[10px] px-1.5">{p.position}</Badge>
                      <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>{p.name}</span>
                    </div>
                    <span className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Menunggu pembagian tim</span>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
