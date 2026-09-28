import { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { AppState } from '@/lib/state';
import { easeOut } from '@/lib/motion';
import { Calendar, Users, Trophy } from 'lucide-react';

interface HeroProps {
  onNavigate: (view: AppState['view']) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <section ref={ref} className="relative overflow-hidden" style={{ background: 'var(--color-primary)' }}>
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1551958219-acbc608c6377?w=1400&h=800&fit=crop&crop=center" alt="Football match" className="w-full h-full object-cover" style={{ opacity: 0.35 }} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, oklch(15% 0.005 0 / 0.5), oklch(15% 0.005 0 / 0.85))' }} />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-24 md:py-32 lg:py-40">
        <motion.div initial={{ opacity: 0, y: 30 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, ease: easeOut }} className="max-w-3xl">
          <motion.p initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.1, ease: easeOut }}
            className="text-sm font-medium tracking-widest uppercase mb-4" style={{ color: 'oklch(75% 0.14 145)' }}>
            Komunitas Sepak Bola Yogyakarta
          </motion.p>

          <h1 className="font-display leading-[0.95] tracking-tight mb-6" style={{ color: 'var(--color-bg)', fontSize: 'clamp(3rem, 8vw, 6rem)' }}>
            WE RUN FC
          </h1>

          <motion.p initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.3, ease: easeOut }}
            className="text-lg md:text-xl max-w-lg mb-8 font-body" style={{ color: 'oklch(80% 0.005 0)', lineHeight: 1.6 }}>
            Booking match mini soccer & full pitch dengan mudah. Pilih jadwal, daftar, dan langsung main.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.4, delay: 0.4, ease: easeOut }} className="flex flex-wrap gap-3">
            <Button size="lg" className="rounded-full px-8 text-base font-medium" style={{ background: 'var(--color-bg)', color: 'var(--color-primary)' }} onClick={() => onNavigate('matches')}>
              Lihat Jadwal Match
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8 text-base font-medium border-2" style={{ borderColor: 'oklch(80% 0.005 0)', color: 'oklch(90% 0.005 0)', background: 'transparent' }} onClick={() => onNavigate('matches')}>
              Booking Sekarang
            </Button>
          </motion.div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.6, ease: easeOut }} className="mt-16 grid grid-cols-3 gap-4 max-w-lg">
          {[
            { icon: Calendar, label: 'Jadwal Aktif', value: 'Setiap Minggu' },
            { icon: Users, label: 'Tipe Match', value: '2-6 Tim' },
            { icon: Trophy, label: 'Format', value: 'Mini & Full' },
          ].map((stat, i) => (
            <div key={i} className="text-center md:text-left">
              <stat.icon className="w-5 h-5 mb-2 mx-auto md:mx-0" style={{ color: 'oklch(75% 0.14 145)' }} />
              <p className="font-display text-xl md:text-2xl" style={{ color: 'var(--color-bg)' }}>{stat.value}</p>
              <p className="text-xs" style={{ color: 'oklch(65% 0.005 0)' }}>{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
