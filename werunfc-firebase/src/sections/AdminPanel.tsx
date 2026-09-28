import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import type { AppState, Action, Match, MatchType } from '@/lib/state';
import { getMatchConfig, getAvailableSlots, generateId } from '@/lib/state';
import {
  isFirebaseConnected,
  createMatch as fbCreateMatch,
  updateMatch as fbUpdateMatch,
  deleteMatch as fbDeleteMatch,
  removePlayer as fbRemovePlayer,
  assignTeams as fbAssignTeams,
  shuffleTeamsFirebase,
  revealTeams as fbRevealTeams,
  closeMatch as fbCloseMatch,
  reopenMatch as fbReopenMatch,
} from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { fadeUp } from '@/lib/motion';
import { Plus, Trash2, Shuffle, Eye, Lock, Unlock, Users, Edit2, Save, UserMinus, Calendar } from 'lucide-react';

const fb = isFirebaseConnected();

interface AdminPanelProps {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  onNavigate: (view: AppState['view'], matchId?: string) => void;
}

export default function AdminPanel({ state, dispatch, onNavigate }: AdminPanelProps) {
  const [createOpen, setCreateOpen] = useState(false);
  const [editMatch, setEditMatch] = useState<Match | null>(null);
  const [manageMatch, setManageMatch] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newType, setNewType] = useState<MatchType>('mini_soccer');
  const [newTeamCount, setNewTeamCount] = useState('2');
  const [newPrice, setNewPrice] = useState('');

  if (!state.isAdmin) {
    return (
      <div className="py-20 text-center max-w-7xl mx-auto px-4">
        <Lock className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
        <h2 className="font-display text-2xl mb-2" style={{ color: 'var(--color-text-primary)' }}>AKSES DITOLAK</h2>
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Login sebagai admin untuk mengakses panel ini.</p>
        <Button variant="outline" className="rounded-full" onClick={() => onNavigate('home')}>Kembali ke Home</Button>
      </div>
    );
  }

  const resetForm = () => { setNewTitle(''); setNewDate(''); setNewTime(''); setNewLocation(''); setNewType('mini_soccer'); setNewTeamCount('2'); setNewPrice(''); };

  const handleCreate = async () => {
    if (!newTitle.trim() || !newDate || !newTime || !newLocation.trim() || !newPrice) { toast.error('Semua field harus diisi'); return; }
    const match: Match = { id: generateId(), title: newTitle.trim(), date: newDate, time: newTime, location: newLocation.trim(), type: newType, teamCount: parseInt(newTeamCount), pricePerPerson: parseInt(newPrice), status: 'open', players: [], teamsRevealed: false };
    if (fb) {
      try { await fbCreateMatch(match); toast.success('Match berhasil dibuat!'); } catch { toast.error('Gagal membuat match'); return; }
    } else {
      dispatch({ type: 'CREATE_MATCH', match });
      toast.success('Match berhasil dibuat!');
    }
    setCreateOpen(false);
    resetForm();
  };

  const handleUpdate = async () => {
    if (!editMatch) return;
    if (fb) {
      try { await fbUpdateMatch(editMatch); toast.success('Match berhasil diupdate!'); } catch { toast.error('Gagal update match'); return; }
    } else {
      dispatch({ type: 'UPDATE_MATCH', match: editMatch });
      toast.success('Match berhasil diupdate!');
    }
    setEditMatch(null);
  };

  const handleDelete = async (matchId: string) => {
    if (fb) {
      try { await fbDeleteMatch(matchId); toast.success('Match dihapus'); } catch { toast.error('Gagal hapus match'); }
    } else {
      dispatch({ type: 'DELETE_MATCH', matchId });
      toast.success('Match dihapus');
    }
  };

  const handleShuffle = async (matchId: string) => {
    if (fb) {
      try { await shuffleTeamsFirebase(matchId); toast.success('Tim diacak ulang!'); } catch { toast.error('Gagal acak tim'); }
    } else {
      dispatch({ type: 'SHUFFLE_TEAMS', matchId });
      toast.success('Tim diacak ulang!');
    }
  };

  const handleReveal = async (matchId: string) => {
    if (fb) {
      try { await fbRevealTeams(matchId); toast.success('Pembagian tim dipublikasikan!'); } catch { toast.error('Gagal publish tim'); }
    } else {
      dispatch({ type: 'REVEAL_TEAMS', matchId });
      toast.success('Pembagian tim dipublikasikan!');
    }
  };

  const handleClose = async (matchId: string) => {
    if (fb) {
      try { await fbCloseMatch(matchId); } catch { toast.error('Gagal tutup match'); }
    } else {
      dispatch({ type: 'CLOSE_MATCH', matchId });
    }
  };

  const handleReopen = async (matchId: string) => {
    if (fb) {
      try { await fbReopenMatch(matchId); } catch { toast.error('Gagal buka match'); }
    } else {
      dispatch({ type: 'REOPEN_MATCH', matchId });
    }
  };

  const handleRemovePlayer = async (matchId: string, playerId: string) => {
    if (fb) {
      try { await fbRemovePlayer(matchId, playerId); toast.success('Pemain dihapus'); } catch { toast.error('Gagal hapus pemain'); }
    } else {
      dispatch({ type: 'REMOVE_PLAYER', matchId, playerId });
      toast.success('Pemain dihapus');
    }
  };

  const handleMovePlayer = async (matchId: string, playerId: string, newTeam: number) => {
    if (fb) {
      try { await fbAssignTeams(matchId, { [playerId]: newTeam }); toast.success(`Pemain dipindahkan ke Tim ${newTeam}`); } catch { toast.error('Gagal pindah pemain'); }
    } else {
      dispatch({ type: 'ASSIGN_TEAMS', matchId, assignments: { [playerId]: newTeam } });
      toast.success(`Pemain dipindahkan ke Tim ${newTeam}`);
    }
  };

  const managedMatch = state.matches.find(m => m.id === manageMatch);

  return (
    <section className="py-12 md:py-20" style={{ background: 'var(--color-surface)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <motion.div variants={fadeUp} initial="hidden" animate="show">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h2 className="font-display text-[clamp(2rem,4vw,3rem)] tracking-tight" style={{ color: 'var(--color-text-primary)' }}>ADMIN PANEL</h2>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Kelola jadwal match, pemain, dan pembagian tim</p>
            </div>
            <Button className="rounded-full gap-2" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4" /> Buat Match Baru</Button>
          </div>

          {state.matches.length === 0 ? (
            <div className="text-center py-20 rounded-lg" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-hairline)' }}>
              <Calendar className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--color-text-muted)' }} />
              <h3 className="font-display text-xl mb-2" style={{ color: 'var(--color-text-primary)' }}>BELUM ADA MATCH</h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-muted)' }}>Buat match pertama kamu sekarang!</p>
              <Button className="rounded-full" onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" /> Buat Match</Button>
            </div>
          ) : (
            <div className="space-y-3">
              {state.matches.map(match => {
                const config = getMatchConfig(match.type, match.teamCount);
                const slots = getAvailableSlots(match);
                return (
                  <div key={match.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4" style={{ background: 'var(--color-bg)', border: '1px solid var(--color-hairline)' }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <h3 className="font-display text-lg" style={{ color: 'var(--color-text-primary)' }}>{match.title}</h3>
                        <Badge className="rounded-full text-[10px]" style={{ background: match.type === 'mini_soccer' ? 'oklch(55% 0.16 145 / 0.12)' : 'oklch(48% 0.18 265 / 0.12)', color: match.type === 'mini_soccer' ? 'oklch(40% 0.14 145)' : 'oklch(38% 0.16 265)' }}>
                          {match.type === 'mini_soccer' ? 'Mini Soccer' : 'Full Pitch'}
                        </Badge>
                        <Badge className="rounded-full text-[10px]" style={{ background: match.status === 'closed' ? 'oklch(55% 0.003 0 / 0.1)' : match.status === 'full' ? 'oklch(52% 0.22 25 / 0.12)' : 'oklch(52% 0.14 155 / 0.12)', color: match.status === 'closed' ? 'oklch(55% 0.003 0)' : match.status === 'full' ? 'oklch(45% 0.2 25)' : 'oklch(42% 0.12 155)' }}>
                          {match.status === 'closed' ? 'Ditutup' : match.status === 'full' ? 'Penuh' : 'Buka'}
                        </Badge>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{match.date} • {match.time} • {match.location}</p>
                      <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>{match.teamCount} tim • {config.totalSlots - slots.totalRemaining}/{config.totalSlots} pemain • Rp {match.pricePerPerson.toLocaleString('id-ID')}/org</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs" onClick={() => setManageMatch(match.id)}><Users className="w-3.5 h-3.5" /> Kelola</Button>
                      <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs" onClick={() => handleShuffle(match.id)}><Shuffle className="w-3.5 h-3.5" /> Acak Tim</Button>
                      {!match.teamsRevealed ? (
                        <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs" onClick={() => handleReveal(match.id)}><Eye className="w-3.5 h-3.5" /> Publish Tim</Button>
                      ) : (
                        <Badge className="rounded-full text-xs" style={{ background: 'oklch(52% 0.14 155 / 0.12)', color: 'oklch(42% 0.12 155)' }}>✓ Published</Badge>
                      )}
                      <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs" onClick={() => setEditMatch({ ...match })}><Edit2 className="w-3.5 h-3.5" /> Edit</Button>
                      {match.status === 'closed' ? (
                        <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs" onClick={() => handleReopen(match.id)}><Unlock className="w-3.5 h-3.5" /> Buka</Button>
                      ) : (
                        <Button size="sm" variant="outline" className="rounded-full gap-1.5 text-xs" onClick={() => handleClose(match.id)}><Lock className="w-3.5 h-3.5" /> Tutup</Button>
                      )}
                      <Button size="sm" variant="ghost" className="rounded-full text-xs" style={{ color: 'var(--color-error)' }} onClick={() => handleDelete(match.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">BUAT MATCH BARU</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Judul Match</label><Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g. Sunday Kickoff" className="rounded-lg" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Tanggal</label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="rounded-lg" /></div>
              <div><label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Waktu</label><Input type="time" value={newTime} onChange={e => setNewTime(e.target.value)} className="rounded-lg" /></div>
            </div>
            <div><label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Lokasi</label><Input value={newLocation} onChange={e => setNewLocation(e.target.value)} placeholder="Nama lapangan..." className="rounded-lg" /></div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Tipe Match</label>
              <Select value={newType} onValueChange={(v) => setNewType(v as MatchType)}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="mini_soccer">Mini Soccer (GK 1 + Player 7)</SelectItem><SelectItem value="full_pitch">Full Pitch (GK 1 + Player 10)</SelectItem></SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Jumlah Tim</label>
              <Select value={newTeamCount} onValueChange={setNewTeamCount}>
                <SelectTrigger className="rounded-lg"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="2">2 Tim</SelectItem><SelectItem value="4">4 Tim</SelectItem><SelectItem value="5">5 Tim</SelectItem><SelectItem value="6">6 Tim</SelectItem></SelectContent>
              </Select>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>Total: {parseInt(newTeamCount) * (newType === 'mini_soccer' ? 8 : 11)} pemain</p>
            </div>
            <div><label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Harga per Orang (Rp)</label><Input type="number" value={newPrice} onChange={e => setNewPrice(e.target.value)} placeholder="50000" className="rounded-lg" /></div>
            <Button onClick={handleCreate} className="w-full rounded-full font-medium"><Plus className="w-4 h-4 mr-2" /> Buat Match</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editMatch} onOpenChange={() => setEditMatch(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">EDIT MATCH</DialogTitle></DialogHeader>
          {editMatch && (
            <div className="space-y-4 pt-2">
              <div><label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Judul Match</label><Input value={editMatch.title} onChange={e => setEditMatch({ ...editMatch, title: e.target.value })} className="rounded-lg" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Tanggal</label><Input type="date" value={editMatch.date} onChange={e => setEditMatch({ ...editMatch, date: e.target.value })} className="rounded-lg" /></div>
                <div><label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Waktu</label><Input type="time" value={editMatch.time} onChange={e => setEditMatch({ ...editMatch, time: e.target.value })} className="rounded-lg" /></div>
              </div>
              <div><label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Lokasi</label><Input value={editMatch.location} onChange={e => setEditMatch({ ...editMatch, location: e.target.value })} className="rounded-lg" /></div>
              <div><label className="text-sm font-medium mb-1.5 block" style={{ color: 'var(--color-text-secondary)' }}>Harga per Orang (Rp)</label><Input type="number" value={editMatch.pricePerPerson} onChange={e => setEditMatch({ ...editMatch, pricePerPerson: parseInt(e.target.value) || 0 })} className="rounded-lg" /></div>
              <Button onClick={handleUpdate} className="w-full rounded-full font-medium"><Save className="w-4 h-4 mr-2" /> Simpan Perubahan</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!manageMatch} onOpenChange={() => setManageMatch(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display text-2xl">KELOLA PEMAIN</DialogTitle></DialogHeader>
          {managedMatch && <ManagePlayersContent match={managedMatch} onRemove={handleRemovePlayer} onMove={handleMovePlayer} />}
        </DialogContent>
      </Dialog>
    </section>
  );
}

function ManagePlayersContent({ match, onRemove, onMove }: { match: Match; onRemove: (mId: string, pId: string) => void; onMove: (mId: string, pId: string, t: number) => void }) {
  const config = getMatchConfig(match.type, match.teamCount);
  const teamGroups = useMemo(() => {
    const groups: Record<number, typeof match.players> = {};
    for (let i = 1; i <= match.teamCount; i++) groups[i] = [];
    match.players.forEach(p => { if (p.team && groups[p.team]) groups[p.team].push(p); });
    return groups;
  }, [match]);
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        <span>{match.players.length} / {config.totalSlots} pemain</span><span>{match.title}</span>
      </div>
      <Tabs defaultValue="all">
        <TabsList className="w-full rounded-full">
          <TabsTrigger value="all" className="rounded-full flex-1 text-xs">Semua ({match.players.length})</TabsTrigger>
          {Array.from({ length: match.teamCount }, (_, i) => (
            <TabsTrigger key={i} value={`team-${i + 1}`} className="rounded-full flex-1 text-xs">Tim {i + 1} ({teamGroups[i + 1]?.length || 0})</TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="all" className="mt-4 space-y-1.5">
          {match.players.length === 0 ? <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada pemain</p> : match.players.map(p => <PlayerRow key={p.id} player={p} match={match} onRemove={onRemove} onMove={onMove} />)}
        </TabsContent>
        {Array.from({ length: match.teamCount }, (_, i) => (
          <TabsContent key={i} value={`team-${i + 1}`} className="mt-4 space-y-1.5">
            {(teamGroups[i + 1] || []).length === 0 ? <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-muted)' }}>Belum ada pemain di tim ini</p> : (teamGroups[i + 1] || []).map(p => <PlayerRow key={p.id} player={p} match={match} onRemove={onRemove} onMove={onMove} />)}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function PlayerRow({ player, match, onRemove, onMove }: { player: AppState['matches'][0]['players'][0]; match: Match; onRemove: (mId: string, pId: string) => void; onMove: (mId: string, pId: string, t: number) => void }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 rounded text-sm" style={{ background: 'var(--color-surface)' }}>
      <div className="flex items-center gap-2 min-w-0">
        <Badge variant="outline" className="rounded-full text-[10px] px-1.5 shrink-0">{player.position}</Badge>
        <span className="font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{player.name}</span>
        {player.team && <Badge className="rounded-full text-[10px]" style={{ background: 'var(--color-primary)', color: 'var(--color-bg)' }}>Tim {player.team}</Badge>}
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <Select value={player.team?.toString() || ''} onValueChange={(v) => onMove(match.id, player.id, parseInt(v))}>
          <SelectTrigger className="h-7 w-20 text-xs rounded-full border-none" style={{ background: 'var(--color-bg)' }}><SelectValue placeholder="Tim" /></SelectTrigger>
          <SelectContent>{Array.from({ length: match.teamCount }, (_, i) => <SelectItem key={i} value={(i + 1).toString()} className="text-xs">Tim {i + 1}</SelectItem>)}</SelectContent>
        </Select>
        <Button size="icon" variant="ghost" className="h-7 w-7 rounded-full" style={{ color: 'var(--color-error)' }} onClick={() => onRemove(match.id, player.id)}>
          <UserMinus className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}
