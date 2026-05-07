import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Shield, Crown, Plus, LogOut, Trash2, Pencil, Globe, Lock, Users, Trophy } from 'lucide-react'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export default function GuildDialog({ open, onOpenChange, auth }) {
  const [activeTab, setActiveTab] = useState('my')
  const [guild, setGuild] = useState(null)
  const [members, setMembers] = useState([])
  const [ranking, setRanking] = useState([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  // Create form state
  const [showCreate, setShowCreate] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createPublic, setCreatePublic] = useState(true)
  const [createError, setCreateError] = useState('')

  // Edit form state
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editPublic, setEditPublic] = useState(true)


  useEffect(() => {
    if (open) {
      fetchMyGuild()
      fetchRanking()
    }
  }, [open])

  const authHeaders = () => ({
    Authorization: `Bearer ${auth?.token}`,
    'Content-Type': 'application/json'
  })

  const fetchMyGuild = async () => {
    setLoading(true)
    try {
      // Get user profile to check guild_id
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
        }
      } else {
        setGuild(null)
        setMembers([])
        setIsOwner(false)
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

  const handleCreate = async () => {
    setCreateError('')
    if (!createName.trim()) { setCreateError('El nombre es obligatorio'); return }
    try {
      const res = await fetch(`${API}/api/guilds`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ name: createName, description: createDesc, isPublic: createPublic })
      })
      const data = await res.json()
      if (res.ok) {
        setShowCreate(false)
        setCreateName('')
        setCreateDesc('')
        fetchMyGuild()
        fetchRanking()
      } else {
        setCreateError(data.error || 'Error al crear gremio')
      }
    } catch (e) { setCreateError('Error de conexión') }
  }

  const handleJoin = async (guildId) => {
    try {
      const res = await fetch(`${API}/api/guilds/${guildId}/join`, {
        method: 'POST',
        headers: authHeaders()
      })
      const data = await res.json()
      if (res.ok) {
        fetchMyGuild()
        fetchRanking()
        setActiveTab('my')
      } else {
        alert(data.error || 'No se pudo unir al gremio')
      }
    } catch (e) { console.error(e) }
  }

  const handleLeave = async () => {
    if (!confirm('¿Seguro que quieres salir del gremio?')) return
    try {
      const res = await fetch(`${API}/api/guilds/${guild.id}/leave`, {
        method: 'POST',
        headers: authHeaders()
      })
      if (res.ok) {
        fetchMyGuild()
        fetchRanking()
      } else {
        const data = await res.json()
        alert(data.error || 'Error al salir')
      }
    } catch (e) { console.error(e) }
  }

  const handleDelete = async () => {
    if (!confirm('¿Seguro que quieres ELIMINAR el gremio? Se eliminarán todos los miembros.')) return
    try {
      const res = await fetch(`${API}/api/guilds/${guild.id}`, {
        method: 'DELETE',
        headers: authHeaders()
      })
      if (res.ok) {
        fetchMyGuild()
        fetchRanking()
      }
    } catch (e) { console.error(e) }
  }

  const handleEdit = async () => {
    try {
      const res = await fetch(`${API}/api/guilds/${guild.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ name: editName, description: editDesc, isPublic: editPublic })
      })
      if (res.ok) {
        setEditing(false)
        fetchMyGuild()
        fetchRanking()
      }
    } catch (e) { console.error(e) }
  }

  const startEdit = () => {
    setEditName(guild.name)
    setEditDesc(guild.description || '')
    setEditPublic(!!guild.isPublic)
    setEditing(true)
  }

  // ─── Render helpers ─────────────────────────────────

  const renderNoGuild = () => (
    <div className="flex flex-col items-center justify-center py-8 gap-4">
      <Shield className="h-16 w-16 text-muted-foreground/30" />
      <p className="text-muted-foreground text-center">No estás en ningún gremio</p>
      <Button onClick={() => setShowCreate(true)} className="gap-2">
        <Plus className="h-4 w-4" />
        Crear Gremio
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
        <Button
          variant={createPublic ? "default" : "outline"}
          size="sm"
          onClick={() => setCreatePublic(true)}
          className="gap-1"
        >
          <Globe className="h-3 w-3" /> Público
        </Button>
        <Button
          variant={!createPublic ? "default" : "outline"}
          size="sm"
          onClick={() => setCreatePublic(false)}
          className="gap-1"
        >
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
            {guild.description && (
              <p className="text-sm text-muted-foreground mt-1">{guild.description}</p>
            )}
            <div className="flex items-center gap-2 mt-2">
              <Badge variant="secondary">
                {guild.isPublic ? <><Globe className="h-3 w-3 mr-1" />Público</> : <><Lock className="h-3 w-3 mr-1" />Privado</>}
              </Badge>
              <Badge variant="outline">
                <Users className="h-3 w-3 mr-1" />{members.length}/15
              </Badge>
            </div>
          </div>
          {isOwner && (
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" onClick={startEdit} className="h-8 w-8">
                <Pencil className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleDelete} className="h-8 w-8 text-red-500 hover:text-red-600">
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
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
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          Miembros ({members.length})
        </h4>
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
                  </div>
                  <div className="text-[10px] text-muted-foreground">{m.tag} · ELO {m.elo} · {m.totalPoints} pts</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Leave button (non-owner only) */}
      {!isOwner && (
        <Button variant="destructive" onClick={handleLeave} className="w-full gap-2">
          <LogOut className="h-4 w-4" />
          Salir del Gremio
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
                <Button size="sm" variant="outline" onClick={() => handleJoin(g.id)} className="h-7 text-xs">
                  Unirse
                </Button>
              ) : null)}
            </div>
          </div>
        ))
      )}
    </div>
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 pb-2">
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Gremio
          </DialogTitle>
        </DialogHeader>

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
              ) : showCreate ? (
                renderCreateForm()
              ) : guild ? (
                renderGuildInfo()
              ) : (
                renderNoGuild()
              )}
            </TabsContent>

            <TabsContent value="ranking" className="m-0">
              {renderRanking()}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
