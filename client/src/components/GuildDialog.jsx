import { useState, useEffect, useCallback } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Shield, Crown, Plus, LogOut, Trash2, Pencil, Globe, Lock, Users, Trophy, UserPlus, UserMinus, UsersRound, ShieldCheck, ShieldOff, ArrowRightLeft, Info } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ─── Confirmation Dialog ─────────────────────────────
function ConfirmDialog({ open, onClose, title, message, confirmLabel, variant, onConfirm }) {
  if (!open) return null
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg">{title}</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">{message}</p>
        <div className="flex gap-2 pt-2">
          <Button variant="outline" onClick={onClose} className="flex-1">Cancelar</Button>
          <Button variant={variant || 'destructive'} onClick={() => { onConfirm(); onClose() }} className="flex-1">
            {confirmLabel || 'Confirmar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function GuildDialog({ open, onOpenChange, auth }) {
  const [activeTab, setActiveTab] = useState('my')
  const [guild, setGuild] = useState(null)
  const [members, setMembers] = useState([])
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [myRole, setMyRole] = useState('member') // 'member' | 'admin'
  const [friendIds, setFriendIds] = useState(new Set()) // IDs of current friends
  const [showInfo, setShowInfo] = useState(false)

  // Create form
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createPublic, setCreatePublic] = useState(true)
  const [createError, setCreateError] = useState('')

  // Edit form
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPublic, setEditPublic] = useState(true)

  // Confirmation dialog
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmLabel: '', variant: 'destructive', onConfirm: () => {} })

  // Toast-style feedback
  const [toast, setToast] = useState('')

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(''), 2500)
  }

  const showConfirm = (title, message, onConfirm, confirmLabel = 'Confirmar', variant = 'destructive') => {
    setConfirm({ open: true, title, message, confirmLabel, variant, onConfirm })
  }

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${auth?.token}`,
    'Content-Type': 'application/json'
  }), [auth?.token])

  useEffect(() => {
    if (open && auth?.token) {
      fetchMyGuild()
      fetchRanking()
      fetchFriendIds()
    }
  }, [open])

  const fetchFriendIds = async () => {
    try {
      const res = await fetch(`${API}/api/friends`, { headers: { Authorization: `Bearer ${auth.token}` } })
      if (res.ok) {
        const list = await res.json()
        setFriendIds(new Set(list.map(f => f.userId)))
      }
    } catch (e) { console.error(e) }
  }

  const fetchMyGuild = async () => {
    setLoading(true)
    try {
      const profileRes = await fetch(`${API}/api/profile/${auth.user.id}`)
      const profileData = await profileRes.json()

      if (profileData.user?.guildId) {
        const guildRes = await fetch(`${API}/api/guilds/${profileData.user.guildId}`, {
          headers: authHeaders()
        })
        if (guildRes.ok) {
          const data = await guildRes.json()
          setGuild(data.guild)
          setMembers(data.members)
          setIsOwner(data.guild.ownerId === auth.user.id)
          const me = data.members.find(m => m.id === auth.user.id)
          setMyRole(me?.guildRole || 'member')
        }
      } else {
        setGuild(null)
        setMembers([])
        setIsOwner(false)
        setMyRole('member')
      }
    } catch (e) {
      console.error('[GuildDialog]', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchRanking = async () => {
    try {
      const res = await fetch(`${API}/api/guilds/ranking`)
      if (res.ok) setRanking(await res.json())
    } catch (e) { console.error(e) }
  }

  // ─── Actions ────────────────────────────────────────

  const handleCreate = async () => {
    setCreateError('')
    if (!createName.trim()) { setCreateError('El nombre es obligatorio'); return }
    try {
      const res = await fetch(`${API}/api/guilds`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ name: createName, description: createDesc, isPublic: createPublic })
      })
      const data = await res.json()
      if (res.ok) { setShowCreate(false); setCreateName(''); setCreateDesc(''); fetchMyGuild(); fetchRanking() }
      else setCreateError(data.error || 'Error al crear gremio')
    } catch (e) { setCreateError('Error de conexión') }
  }

  const handleJoin = async (guildId) => {
    try {
      const res = await fetch(`${API}/api/guilds/${guildId}/join`, { method: 'POST', headers: authHeaders() })
      const data = await res.json()
      if (res.ok) { fetchMyGuild(); fetchRanking(); setActiveTab('my') }
      else showToast(data.error || 'No se pudo unir')
    } catch (e) { console.error(e) }
  }

  const handleLeave = () => {
    showConfirm('Salir del Gremio', '¿Seguro que quieres salir del gremio?', async () => {
      try {
        const res = await fetch(`${API}/api/guilds/${guild.id}/leave`, { method: 'POST', headers: authHeaders() })
        if (res.ok) { fetchMyGuild(); fetchRanking() }
        else { const d = await res.json(); showToast(d.error || 'Error al salir') }
      } catch (e) { console.error(e) }
    }, 'Salir')
  }

  const handleDelete = () => {
    showConfirm('Eliminar Gremio', '¿Seguro que quieres ELIMINAR el gremio? Se expulsarán todos los miembros y no se puede deshacer.', async () => {
      try {
        const res = await fetch(`${API}/api/guilds/${guild.id}`, { method: 'DELETE', headers: authHeaders() })
        if (res.ok) { fetchMyGuild(); fetchRanking() }
      } catch (e) { console.error(e) }
    }, 'Eliminar')
  }

  const handleEdit = async () => {
    try {
      const res = await fetch(`${API}/api/guilds/${guild.id}`, {
        method: 'PATCH', headers: authHeaders(),
        body: JSON.stringify({ name: editName, description: editDesc, isPublic: editPublic })
      })
      if (res.ok) { setEditing(false); fetchMyGuild(); fetchRanking() }
    } catch (e) { console.error(e) }
  }

  const startEdit = () => {
    setEditName(guild.name); setEditDesc(guild.description || ''); setEditPublic(!!guild.isPublic); setEditing(true)
  }

  const handleKick = (member) => {
    showConfirm('Expulsar Miembro', `¿Seguro que quieres expulsar a ${member.displayName} del gremio?`, async () => {
      try {
        const res = await fetch(`${API}/api/guilds/${guild.id}/kick/${member.id}`, { method: 'POST', headers: authHeaders() })
        if (res.ok) fetchMyGuild()
        else { const d = await res.json(); showToast(d.error || 'Error al expulsar') }
      } catch (e) { console.error(e) }
    }, 'Expulsar')
  }

  const handlePromote = (member) => {
    showConfirm('Hacer Admin', `¿Hacer admin a ${member.displayName}? Podrá expulsar miembros y editar el gremio.`, async () => {
      try {
        const res = await fetch(`${API}/api/guilds/${guild.id}/promote/${member.id}`, { method: 'POST', headers: authHeaders() })
        if (res.ok) fetchMyGuild()
      } catch (e) { console.error(e) }
    }, 'Promover', 'default')
  }

  const handleDemote = (member) => {
    showConfirm('Quitar Admin', `¿Quitar el rol de admin a ${member.displayName}?`, async () => {
      try {
        const res = await fetch(`${API}/api/guilds/${guild.id}/demote/${member.id}`, { method: 'POST', headers: authHeaders() })
        if (res.ok) fetchMyGuild()
      } catch (e) { console.error(e) }
    }, 'Quitar Admin')
  }

  const handleTransfer = (member) => {
    showConfirm('Transferir Propiedad', `¿Transferir la propiedad del gremio a ${member.displayName}? Tú dejarás de ser el dueño.`, async () => {
      try {
        const res = await fetch(`${API}/api/guilds/${guild.id}/transfer/${member.id}`, { method: 'POST', headers: authHeaders() })
        if (res.ok) fetchMyGuild()
      } catch (e) { console.error(e) }
    }, 'Transferir')
  }

  const handleAddFriend = async (member) => {
    try {
      const res = await fetch(`${API}/api/friends/request`, {
        method: 'POST', headers: authHeaders(),
        body: JSON.stringify({ tag: member.tag })
      })
      const data = await res.json()
      if (res.ok) showToast(`Solicitud enviada a ${member.displayName}`)
      else showToast(data.error || 'Error al enviar solicitud')
    } catch (e) { showToast('Error de conexión') }
  }

  // ─── Render helpers ─────────────────────────────────

  const canManage = isOwner || myRole === 'admin'

  const renderNoGuild = () => (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <Shield className="h-16 w-16 text-muted-foreground/30" />
      <p className="text-muted-foreground text-center">No estás en ningún gremio</p>
      <Button onClick={() => setShowCreate(true)} className="gap-2">
        <Plus className="h-4 w-4" /> Crear Gremio
      </Button>
    </div>
  )

  const renderCreateForm = () => (
    <div className="space-y-4 py-4">
      <div>
        <label className="text-sm font-medium mb-1 block">Nombre del Gremio</label>
        <Input value={createName} onChange={e => setCreateName(e.target.value)} placeholder="Los Invencibles" maxLength={30} />
      </div>
      <div>
        <label className="text-sm font-medium mb-1 block">Descripción (opcional)</label>
        <Input value={createDesc} onChange={e => setCreateDesc(e.target.value)} placeholder="Somos los mejores..." maxLength={100} />
      </div>
      <div className="flex items-center gap-3">
        <Button variant={createPublic ? "default" : "outline"} size="sm" onClick={() => setCreatePublic(true)} className="gap-1">
          <Globe className="h-3 w-3" /> Público
        </Button>
        <Button variant={!createPublic ? "default" : "outline"} size="sm" onClick={() => setCreatePublic(false)} className="gap-1">
          <Lock className="h-3 w-3" /> Privado
        </Button>
      </div>
      <p className="text-[10px] text-muted-foreground">
        {createPublic ? 'Cualquiera puede unirse' : 'Solo tus amigos pueden unirse'}
      </p>
      {createError && <p className="text-sm text-red-500">{createError}</p>}
      <div className="flex gap-2">
        <Button onClick={handleCreate} className="flex-1">Crear</Button>
        <Button variant="outline" onClick={() => setShowCreate(false)} className="flex-1">Cancelar</Button>
      </div>
    </div>
  )

  const renderMemberActions = (m) => {
    if (m.id === auth.user.id) return null // Can't act on yourself
    const memberIsOwner = guild.ownerId === m.id
    const memberIsAdmin = m.guildRole === 'admin'
    const isFriend = friendIds.has(m.id)

    return (
      <div className="flex gap-0.5">
        {/* Send friend request (anyone, but hide if already friends) */}
        {!isFriend && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-blue-500 hover:text-blue-600" title="Enviar solicitud de amistad"
            onClick={() => handleAddFriend(m)}>
            <UsersRound className="h-3 w-3" />
          </Button>
        )}

        {/* Owner actions (not on the owner themselves) */}
        {isOwner && !memberIsOwner && (
          <>
            {memberIsAdmin ? (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-orange-500 hover:text-orange-600" title="Quitar admin"
                onClick={() => handleDemote(m)}>
                <ShieldOff className="h-3 w-3" />
              </Button>
            ) : (
              <Button variant="ghost" size="icon" className="h-7 w-7 text-green-500 hover:text-green-600" title="Hacer admin"
                onClick={() => handlePromote(m)}>
                <ShieldCheck className="h-3 w-3" />
              </Button>
            )}
            <Button variant="ghost" size="icon" className="h-7 w-7 text-purple-500 hover:text-purple-600" title="Transferir propiedad"
              onClick={() => handleTransfer(m)}>
              <ArrowRightLeft className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" title="Expulsar"
              onClick={() => handleKick(m)}>
              <UserMinus className="h-3 w-3" />
            </Button>
          </>
        )}

        {/* Admin actions (can only kick non-admins, not the owner) */}
        {!isOwner && myRole === 'admin' && !memberIsAdmin && !memberIsOwner && (
          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-600" title="Expulsar"
            onClick={() => handleKick(m)}>
            <UserMinus className="h-3 w-3" />
          </Button>
        )}
      </div>
    )
  }

  const renderGuildInfo = () => (
    <div className="space-y-4">
      {/* Guild header */}
      <div className="rounded-xl bg-gradient-to-r from-primary/10 to-primary/5 p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {guild.name}
            </h3>
            {guild.description && <p className="text-sm text-muted-foreground mt-1">{guild.description}</p>}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">
                {guild.isPublic ? <><Globe className="h-3 w-3 mr-1" />Público</> : <><Lock className="h-3 w-3 mr-1" />Privado</>}
              </Badge>
              <Badge variant="outline"><Users className="h-3 w-3 mr-1" />{members.length}/15</Badge>
              {isOwner && <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300"><Crown className="h-3 w-3 mr-1" />Dueño</Badge>}
              {!isOwner && myRole === 'admin' && <Badge className="bg-blue-100 text-blue-800 border-blue-300"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>}
            </div>
          </div>
          {canManage && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={startEdit} className="h-8 w-8"><Pencil className="h-3.5 w-3.5" /></Button>
              {isOwner && <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-red-500 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /></Button>}
            </div>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div className="space-y-3 p-4 rounded-xl border bg-card">
          <Input value={editName} onChange={e => setEditName(e.target.value)} placeholder="Nombre" />
          <Input value={editDesc} onChange={e => setEditDesc(e.target.value)} placeholder="Descripción" />
          <div className="flex gap-2">
            <Button size="sm" variant={editPublic ? "default" : "outline"} onClick={() => setEditPublic(true)}><Globe className="h-3 w-3 mr-1" />Público</Button>
            <Button size="sm" variant={!editPublic ? "default" : "outline"} onClick={() => setEditPublic(false)}><Lock className="h-3 w-3 mr-1" />Privado</Button>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleEdit} className="flex-1">Guardar</Button>
            <Button size="sm" variant="outline" onClick={() => setEditing(false)} className="flex-1">Cancelar</Button>
          </div>
        </div>
      )}

      {/* Members list */}
      <div>
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Miembros ({members.length})</h4>
        <div className="space-y-2">
          {members.map((m, i) => (
            <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg bg-card border shadow-sm">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-muted-foreground w-5 text-right">{i + 1}</span>
                <Avatar className="h-8 w-8">
                  {m.avatarUrl && m.avatarUrl.length <= 4 ? (
                    <AvatarFallback className="text-lg bg-primary/10">{m.avatarUrl}</AvatarFallback>
                  ) : (
                    <AvatarFallback className="text-xs">{m.displayName?.[0]}</AvatarFallback>
                  )}
                </Avatar>
                <div className="leading-tight">
                  <div className="text-sm font-bold flex items-center gap-1">
                    {m.displayName}
                    {guild.ownerId === m.id && <Crown className="h-3 w-3 text-yellow-500" />}
                    {m.guildRole === 'admin' && guild.ownerId !== m.id && <ShieldCheck className="h-3 w-3 text-blue-500" />}
                  </div>
                  <div className="text-[10px] text-muted-foreground">{m.tag} · ELO {m.elo} · {m.totalPoints} pts</div>
                </div>
              </div>
              {renderMemberActions(m)}
            </div>
          ))}
        </div>
      </div>

      {/* Leave button (non-owner only) */}
      {!isOwner && (
        <Button variant="destructive" onClick={handleLeave} className="w-full gap-2">
          <LogOut className="h-4 w-4" /> Salir del Gremio
        </Button>
      )}
    </div>
  )

  const renderRanking = () => (
    <div className="space-y-2">
      {ranking.length === 0 ? (
        <div className="text-center text-muted-foreground py-8">
          <Trophy className="h-12 w-12 mx-auto mb-2 opacity-20" />
          <p>No hay gremios aún</p>
        </div>
      ) : (
        ranking.map((g, i) => (
          <div key={g.id} className="flex items-center justify-between p-3 rounded-xl bg-card border shadow-sm">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-black w-6 text-center ${i === 0 ? 'text-yellow-500' : i === 1 ? 'text-gray-400' : i === 2 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                {i + 1}
              </span>
              <div>
                <div className="font-bold text-sm flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-primary" />
                  {g.name}
                  {g.isPublic ? <Globe className="h-2.5 w-2.5 text-muted-foreground" /> : <Lock className="h-2.5 w-2.5 text-muted-foreground" />}
                </div>
                <div className="text-[10px] text-muted-foreground">{g.memberCount} miembros</div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-primary">{g.totalPoints} pts</span>
              {!guild && (g.isPublic ? (
                <Button size="sm" variant="outline" onClick={() => handleJoin(g.id)} className="h-7 text-xs">Unirse</Button>
              ) : null)}
            </div>
          </div>
        ))
      )}
    </div>
  )

  const renderInfoPanel = () => (
    <div className="mx-6 mb-3 p-4 rounded-xl border bg-card/50 text-xs space-y-3 animate-in fade-in slide-in-from-top-2">
      <div>
        <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Todos los miembros</p>
        <div className="flex items-center gap-2"><UsersRound className="h-3.5 w-3.5 text-blue-500 shrink-0" /><span>Enviar solicitud de amistad</span></div>
      </div>
      <hr />
      <div>
        <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Administradores</p>
        <div className="flex items-center gap-2"><UserMinus className="h-3.5 w-3.5 text-red-500 shrink-0" /><span>Expulsar a un miembro (no a otros admins)</span></div>
      </div>
      <hr />
      <div>
        <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Propietario</p>
        <div className="flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-green-500 shrink-0" /><span>Hacer administrador a un miembro</span></div>
        <div className="flex items-center gap-2 mt-1"><ShieldOff className="h-3.5 w-3.5 text-orange-500 shrink-0" /><span>Quitar el rol de administrador</span></div>
        <div className="flex items-center gap-2 mt-1"><ArrowRightLeft className="h-3.5 w-3.5 text-purple-500 shrink-0" /><span>Transferir la propiedad del gremio</span></div>
        <div className="flex items-center gap-2 mt-1"><UserMinus className="h-3.5 w-3.5 text-red-500 shrink-0" /><span>Expulsar a cualquier miembro</span></div>
      </div>
    </div>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" /> Gremio
              </DialogTitle>
              {guild && (
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowInfo(v => !v)} title="Info de iconos">
                  <Info className={`h-4 w-4 ${showInfo ? 'text-primary' : 'text-muted-foreground'}`} />
                </Button>
              )}
            </div>
          </DialogHeader>

          {showInfo && guild && renderInfoPanel()}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6">
              <TabsList className="w-full">
                <TabsTrigger value="my" className="flex-1">Mi Gremio</TabsTrigger>
                <TabsTrigger value="ranking" className="flex-1">Ranking</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[300px]">
              <TabsContent value="my" className="m-0">
                {loading ? (
                  <div className="text-center text-muted-foreground py-8">Cargando...</div>
                ) : showCreate ? renderCreateForm() : guild ? renderGuildInfo() : renderNoGuild()}
              </TabsContent>
              <TabsContent value="ranking" className="m-0">{renderRanking()}</TabsContent>
            </div>
          </Tabs>

          {/* Toast feedback */}
          {toast && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-foreground text-background px-4 py-2 rounded-lg text-sm font-medium shadow-lg animate-in fade-in slide-in-from-bottom-2 z-50">
              {toast}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation overlay */}
      <ConfirmDialog
        open={confirm.open}
        onClose={() => setConfirm(c => ({ ...c, open: false }))}
        title={confirm.title}
        message={confirm.message}
        confirmLabel={confirm.confirmLabel}
        variant={confirm.variant}
        onConfirm={confirm.onConfirm}
      />
    </>
  )
}
