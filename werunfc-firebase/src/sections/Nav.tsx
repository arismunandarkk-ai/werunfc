import { useState } from 'react';
import type { AppState, Action } from '@/lib/state';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Menu, X, Shield, LogOut } from 'lucide-react';

interface NavProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onNavigate: (view: AppState['view']) => void;
}

export default function Nav({ state, dispatch, onNavigate }: NavProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [adminDialog, setAdminDialog] = useState(false);
  const [pin, setPin] = useState('');

  const navItems: { label: string; view: AppState['view'] }[] = [
    { label: 'Home', view: 'home' },
    { label: 'Jadwal Match', view: 'matches' },
  ];

  const handleNav = (view: AppState['view']) => {
    onNavigate(view);
    setMobileOpen(false);
  };

  const handleAdminLogin = () => {
    dispatch({ type: 'TOGGLE_ADMIN', pin });
    if (pin === '1234') {
      toast.success('Login admin berhasil');
      setAdminDialog(false);
      setPin('');
      onNavigate('admin');
    } else {
      toast.error('PIN salah');
    }
  };

  const handleAdminLogout = () => {
    dispatch({ type: 'TOGGLE_ADMIN' });
    toast.success('Logout admin berhasil');
    onNavigate('home');
  };

  return (
    <>
      <header
        className="sticky top-0 z-50 border-b"
        style={{ background: 'var(--color-bg)', borderColor: 'var(--color-hairline)' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-16">
          <button onClick={() => handleNav('home')} className="flex items-center gap-2 cursor-pointer">
            <div className="w-10 h-10 rounded-full flex items-center justify-center font-display text-lg" style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}>
              WR
            </div>
            <span className="font-display text-2xl tracking-wide" style={{ color: 'var(--color-text-primary)' }}>
              WE RUN FC
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            {navItems.map(item => (
              <button key={item.view} onClick={() => handleNav(item.view)} className="text-sm font-medium transition-colors cursor-pointer"
                style={{ color: state.view === item.view ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', borderBottom: state.view === item.view ? '2px solid var(--color-text-primary)' : '2px solid transparent', paddingBottom: '2px' }}>
                {item.label}
              </button>
            ))}
            {state.isAdmin && (
              <button onClick={() => handleNav('admin')} className="text-sm font-medium transition-colors cursor-pointer"
                style={{ color: state.view === 'admin' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', borderBottom: state.view === 'admin' ? '2px solid var(--color-text-primary)' : '2px solid transparent', paddingBottom: '2px' }}>
                Admin Panel
              </button>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {state.isAdmin ? (
              <Button variant="ghost" size="sm" onClick={handleAdminLogout} className="gap-1.5 rounded-full">
                <LogOut className="w-4 h-4" /> Logout
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={() => setAdminDialog(true)} className="gap-1.5 rounded-full">
                <Shield className="w-4 h-4" /> Admin
              </Button>
            )}
          </div>

          <button className="md:hidden p-2 cursor-pointer" onClick={() => setMobileOpen(!mobileOpen)} style={{ color: 'var(--color-text-primary)' }}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden border-t px-4 py-4 space-y-3" style={{ borderColor: 'var(--color-hairline)', background: 'var(--color-bg)' }}>
            {navItems.map(item => (
              <button key={item.view} onClick={() => handleNav(item.view)} className="block w-full text-left text-base font-medium py-2 cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                {item.label}
              </button>
            ))}
            {state.isAdmin && (
              <button onClick={() => handleNav('admin')} className="block w-full text-left text-base font-medium py-2 cursor-pointer" style={{ color: 'var(--color-text-primary)' }}>
                Admin Panel
              </button>
            )}
            <div className="pt-2 border-t" style={{ borderColor: 'var(--color-hairline)' }}>
              {state.isAdmin ? (
                <Button variant="ghost" size="sm" onClick={handleAdminLogout} className="gap-1.5 w-full rounded-full"><LogOut className="w-4 h-4" /> Logout Admin</Button>
              ) : (
                <Button variant="outline" size="sm" onClick={() => { setAdminDialog(true); setMobileOpen(false); }} className="gap-1.5 w-full rounded-full"><Shield className="w-4 h-4" /> Admin Login</Button>
              )}
            </div>
          </div>
        )}
      </header>

      <Dialog open={adminDialog} onOpenChange={setAdminDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Admin Login</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Masukkan PIN Admin</label>
              <Input type="password" value={pin} onChange={e => setPin(e.target.value)} placeholder="****" maxLength={4} onKeyDown={e => e.key === 'Enter' && handleAdminLogin()} className="text-center text-lg tracking-widest" />
            </div>
            <Button onClick={handleAdminLogin} className="w-full rounded-full">Masuk</Button>
            <p className="text-xs text-center" style={{ color: 'var(--color-text-muted)' }}>Demo PIN: 1234</p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
