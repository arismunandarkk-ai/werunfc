import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import type { AppState, Action } from '@/lib/state';
import { getMatchConfig, getAvailableSlots } from '@/lib/state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { staggerContainer, scaleIn } from '@/lib/motion';
import { Calendar, Clock, MapPin, Users, Banknote } from 'lucide-react';

interface MatchListProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onNavigate: (view: AppState['view'], matchId?: string) => void;
}

export default function MatchList({ state, onNavigate }: MatchListProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });
  const openMatches = state.matches.filter(m => m.status !== 'closed');

  return (
    <section ref={ref} className="py-16 md:py-24" style={{ background: 'var(--color-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="mb-10">
          <h2 className="font-display text-[clamp(2rem,4vw,3rem)] tracking-tight" style={{ color: 'var(--color-text-primary)' }}>
            JADWAL MATCH
          </h2>
          <p className="mt-2 text-base max-w-xl" style={{ color: 'var(--color-text-secondary)', lineHeight: 1.6 }}>
            Pilih match yang tersedia dan segera booking slot kamu. Tersedia format mini soccer dan full pitch.
          </p>
        </div>

        {openMatches.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-20 rounded-lg" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-hairline)' }}>
            <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
            <h3 className="font-display text-2xl mb-2" style={{ color: 'var(--color-text-primary)' }}>BELUM ADA MATCH</h3>
            <p className="text-sm" style={{ color: 'var(--color-text-muted)' }}>Admin belum membuat jadwal match. Nantikan update selanjutnya!</p>
          </motion.div>
        ) : (
          <motion.div variants={staggerContainer} initial="hidden" animate={inView ? 'show' : 'hidden'} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {openMatches.map(match => {
              const config = getMatchConfig(match.type, match.teamCount);
              const slots = getAvailableSlots(match);
              const fillPercent = ((config.totalSlots - slots.totalRemaining) / config.totalSlots) * 100;
              return (
                <motion.div key={match.id} variants={scaleIn} className="group" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-hairline)' }}>
                  <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-hairline)' }}>
                    <div>
                      <Badge variant="secondary" className="rounded-full text-xs font-medium mb-2" style={{
                        background: match.type === 'mini_soccer' ? 'oklch(55% 0.16 145 / 0.12)' : 'oklch(48% 0.18 265 / 0.12)',
                        color: match.type === 'mini_soccer' ? 'oklch(40% 0.14 145)' : 'oklch(38% 0.16 265)',
                      }}>
                        {match.type === 'mini_soccer' ? 'Mini Soccer' : 'Full Pitch'}
                      </Badge>
                      <h3 className="font-display text-xl tracking-tight" style={{ color: 'var(--color-text-primary)' }}>{match.title}</h3>
                    </div>
                    <Badge className="rounded-full text-xs" style={{
                      background: match.status === 'full' ? 'oklch(52% 0.22 25 / 0.12)' : 'oklch(52% 0.14 155 / 0.12)',
                      color: match.status === 'full' ? 'oklch(45% 0.2 25)' : 'oklch(42% 0.12 155)',
                    }}>
                      {match.status === 'full' ? 'Penuh' : 'Tersedia'}
                    </Badge>
                  </div>
                  <div className="px-5 py-4 space-y-2.5">
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}><Calendar className="w-4 h-4 flex-shrink-0" /><span>{match.date}</span></div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}><Clock className="w-4 h-4 flex-shrink-0" /><span>{match.time}</span></div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}><MapPin className="w-4 h-4 flex-shrink-0" /><span>{match.location}</span></div>
                    <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}><Users className="w-4 h-4 flex-shrink-0" /><span>{match.teamCount} Tim × {config.perTeam} pemain</span></div>
                    <div className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}><Banknote className="w-4 h-4 flex-shrink-0" /><span>Rp {match.pricePerPerson.toLocaleString('id-ID')} / orang</span></div>
                  </div>
                  <div className="px-5 pb-3">
                    <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--color-text-muted)' }}>
                      <span>{config.totalSlots - slots.totalRemaining} / {config.totalSlots} pemain</span>
                      <span>GK: {slots.gkSlots} sisa | Player: {slots.playerSlots} sisa</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--color-hairline)' }}>
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${fillPercent}%`, background: fillPercent >= 100 ? 'oklch(52% 0.22 25)' : 'oklch(52% 0.14 155)' }} />
                    </div>
                  </div>
                  <div className="px-5 pb-5 pt-2">
                    <Button className="w-full rounded-full font-medium" disabled={match.status === 'full'} onClick={() => onNavigate('booking', match.id)}>
                      {match.status === 'full' ? 'Match Penuh' : 'Booking Sekarang'}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        )}
      </div>
    </section>
  );
}
