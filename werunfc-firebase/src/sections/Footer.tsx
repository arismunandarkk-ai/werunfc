import type { AppState } from '@/lib/state';

interface FooterProps {
  onNavigate: (view: AppState['view']) => void;
}

export default function Footer({ onNavigate }: FooterProps) {
  return (
    <footer style={{ background: 'var(--color-bg)', borderTop: '1px solid var(--color-hairline)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center font-display text-sm" style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}>WR</div>
              <span className="font-display text-xl" style={{ color: 'var(--color-text-primary)' }}>WE RUN FC</span>
            </div>
            <p className="text-sm max-w-xs" style={{ color: 'var(--color-text-muted)', lineHeight: 1.6 }}>Komunitas sepak bola Yogyakarta. Booking match mini soccer & full pitch dengan mudah.</p>
          </div>
          <div>
            <h4 className="font-display text-sm tracking-wider mb-3" style={{ color: 'var(--color-text-primary)' }}>NAVIGASI</h4>
            <ul className="space-y-2">
              {([{ label: 'Home', view: 'home' as const }, { label: 'Jadwal Match', view: 'matches' as const }]).map(item => (
                <li key={item.view}><button onClick={() => onNavigate(item.view)} className="text-sm cursor-pointer transition-colors hover:underline" style={{ color: 'var(--color-text-secondary)' }}>{item.label}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-display text-sm tracking-wider mb-3" style={{ color: 'var(--color-text-primary)' }}>INFO</h4>
            <ul className="space-y-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              <li>Format: Mini Soccer & Full Pitch</li><li>Opsi Tim: 2, 4, 5, atau 6 tim</li><li>Pembagian tim otomatis & manual</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 text-center" style={{ borderTop: '1px solid var(--color-hairline)' }}>
          <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>© 2026 We Run FC. Semua hak dilindungi.</p>
        </div>
      </div>
    </footer>
  );
}
