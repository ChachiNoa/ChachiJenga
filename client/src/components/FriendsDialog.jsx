import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { getErrorMessage, getSuccessMessage } from '../lib/errorTranslations'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, UserPlus, Check, X, UserMinus, User, Shield, Users, Swords, Info } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

const API = import.meta.env.VITE_API_URL || 'http://localhost:3001'

// ─── Confirmation Dialog ─────────────────────────────
function ConfirmDialog({ open, onClose, title, message, confirmLabel, variant, onConfirm }) {
  if (!open) return null
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle className="text-lg">{title}</DialogTitle></DialogHeader>
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

export default function FriendsDialog({ open, onOpenChange, auth, onChallenge }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('friends')
  const [friends, setFriends] = useState([])
  const [pending, setPending] = useState([])
  const [searchTag, setSearchTag] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showInfo, setShowInfo] = useState(false)

  // Toast + confirm
  const [toast, setToast] = useState({ message: '', type: 'error' })
  const [confirm, setConfirm] = useState({ open: false, title: '', message: '', confirmLabel: '', variant: 'destructive', onConfirm: () => {} })
  const [myGuild, setMyGuild] = useState(null)
  const [myGuildRole, setMyGuildRole] = useState('member')

  const showToast = (msg, type = 'error') => {
    const finalMsg = type === 'error' ? getErrorMessage(msg) : getSuccessMessage(msg)
    setToast({ message: finalMsg, type })
    setTimeout(() => setToast({ message: '', type: 'error' }), 3000)
  }

  useEffect(() => {
    if (open && auth?.token) {
      fetchFriends()
      fetchPending()
      fetchMyGuild()
    }
  }, [open, activeTab])

  const fetchMyGuild = async () => {
    try {
      const profileRes = await fetch(`${API}/api/profile/${auth.user.id}`)
      const profileData = await profileRes.json()
      if (profileData.user?.guildId) {
        const guildRes = await fetch(`${API}/api/guilds/${profileData.user.guildId}`, {
          headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' }
        })
        if (guildRes.ok) {
          const data = await guildRes.json()
          setMyGuild(data.guild)
          const me = data.members.find(m => m.id === auth.user.id)
          setMyGuildRole(me?.guildRole || 'member')
        }
      } else {
        setMyGuild(null)
        setMyGuildRole('member')
      }
    } catch (e) { console.error(e) }
  }

  const fetchFriends = async () => {
    try {
      const res = await fetch(`${API}/api/friends`, { headers: { Authorization: `Bearer ${auth.token}` } })
      if (res.ok) setFriends(await res.json())
    } catch (e) { console.error(e) }
  }

  const fetchPending = async () => {
    try {
      const res = await fetch(`${API}/api/friends/pending`, { headers: { Authorization: `Bearer ${auth.token}` } })
      if (res.ok) setPending(await res.json())
    } catch (e) { console.error(e) }
  }

  const handleSearch = async () => {
    if (!searchTag) return
    setIsLoading(true); setSearchError(''); setSearchResult(null)
    try {
      const res = await fetch(`${API}/api/users/search?tag=${encodeURIComponent(searchTag)}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      const data = await res.json()
      if (res.ok) setSearchResult(data)
      else setSearchError(data.error || 'Usuario no encontrado')
    } catch (e) { setSearchError('Error de conexión') }
    finally { setIsLoading(false) }
  }

  const sendRequest = async () => {
    if (!searchResult) return
    try {
      const res = await fetch(`${API}/api/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${auth.token}` },
        body: JSON.stringify({ tag: searchResult.tag })
      })
      const data = await res.json()
      if (res.ok) { setSearchResult(null); setSearchTag(''); fetchPending(); fetchFriends(); showToast('Friend request sent', 'success') }
      else showToast(data.error || 'Error al añadir')
    } catch (e) { console.error(e) }
  }

  const respondRequest = async (id, accept) => {
    try {
      const res = await fetch(`${API}/api/friends/${id}/${accept ? 'accept' : 'reject'}`, {
        method: 'POST', headers: { Authorization: `Bearer ${auth.token}` }
      })
      if (res.ok) { 
        fetchPending(); 
        if (accept) fetchFriends();
        showToast(accept ? 'Friend request accepted' : 'Friend request rejected', accept ? 'success' : 'error')
      }
    } catch (e) { console.error(e) }
  }

  const removeFriend = (id, name) => {
    setConfirm({
      open: true,
      title: 'Eliminar Amigo',
      message: `¿Seguro que quieres eliminar a ${name} de tu lista de amigos?`,
      confirmLabel: 'Eliminar',
      onConfirm: async () => {
        try {
          const res = await fetch(`${API}/api/friends/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${auth.token}` } })
          if (res.ok) fetchFriends()
        } catch (e) { console.error(e) }
      }
    })
  }

  const inviteToGuild = async (friendId, friendName) => {
    if (!myGuild) { showToast('No estás en ningún gremio'); return }
    
    try {
      // First check if user is already in this guild to avoid unnecessary confirmation
      const res = await fetch(`${API}/api/profile/${friendId}`)
      const data = await res.json()
      
      if (data.user?.guildId === myGuild.id) {
        showToast('User is already in this guild')
        return
      }

      setConfirm({
        open: true,
        title: 'Invitar al Gremio',
        message: `¿Estás seguro de que quieres invitar a ${friendName} al gremio ${myGuild.name}?`,
        confirmLabel: 'Invitar',
        variant: 'default',
        onConfirm: async () => {
          try {
            const resInvite = await fetch(`${API}/api/guilds/${myGuild.id}/invite/${friendId}`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${auth.token}`, 'Content-Type': 'application/json' }
            })
            const dataInvite = await resInvite.json()
            if (resInvite.ok) {
              showToast('Invitation sent', 'success')
            } else {
              showToast(dataInvite.error || 'Error al invitar')
            }
          } catch (e) { showToast('Error de conexión') }
        }
      })
    } catch (e) { console.error(e) }
  }

  // Can invite if: in a guild AND (guild is public OR user is admin/owner)
  const canInvite = myGuild && (myGuild.isPublic || myGuildRole === 'admin' || myGuild.ownerId === auth?.user?.id)

  const renderInfoPanel = () => (
    <div className="mx-6 mb-3 p-4 rounded-xl border bg-card/50 text-xs space-y-3 animate-in fade-in slide-in-from-top-2">
      <div>
        <p className="font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Acciones de amigos</p>
        <div className="flex items-center gap-2"><Swords className="h-3.5 w-3.5 text-orange-500 shrink-0" /><span>Desafiar a jugar una partida amistosa</span></div>
        <div className="flex items-center gap-2 mt-1"><UserPlus className="h-3.5 w-3.5 text-primary shrink-0" /><span>Invitar a tu gremio actual</span></div>
        <div className="flex items-center gap-2 mt-1"><UserMinus className="h-3.5 w-3.5 text-red-500 shrink-0" /><span>Eliminar amigo</span></div>
      </div>
    </div>
  )

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
          <DialogHeader className="px-6 py-4 pb-2">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl">Amigos</DialogTitle>
              <Button variant="ghost" size="icon" className="h-8 w-8 mr-6" onClick={() => setShowInfo(v => !v)} title="Info de botones">
                <Info className={`h-4 w-4 ${showInfo ? 'text-primary' : 'text-muted-foreground'}`} />
              </Button>
            </div>
          </DialogHeader>

          {showInfo && renderInfoPanel()}

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
            <div className="px-6">
              <TabsList className="w-full">
                <TabsTrigger value="friends" className="flex-1">Amigos ({friends.length})</TabsTrigger>
                <TabsTrigger value="pending" className="flex-1 relative">
                  Solicitudes
                  {pending.length > 0 && <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                </TabsTrigger>
                <TabsTrigger value="add" className="flex-1">Añadir</TabsTrigger>
              </TabsList>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-[300px]">
              <TabsContent value="friends" className="m-0 h-full">
                {friends.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <User className="h-12 w-12 mb-2 opacity-20" />
                    <p>No tienes amigos agregados aún</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {friends.map(f => (
                      <div key={f.friendshipId} className="flex items-center justify-between p-3 rounded-xl bg-card border shadow-sm">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {f.avatarUrl && f.avatarUrl.length <= 4 ? (
                              <AvatarFallback className="text-xl bg-primary/10">{f.avatarUrl}</AvatarFallback>
                            ) : f.avatarUrl ? (
                              <AvatarImage src={f.avatarUrl} alt={f.displayName} />
                            ) : (
                              <AvatarFallback>{f.displayName?.[0]}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-bold leading-tight flex items-center gap-2">
                              {f.displayName}
                              <span 
                                className={`w-2.5 h-2.5 rounded-full ${f.online ? 'bg-green-500 shadow-[0_0_5px_rgba(34,197,94,0.5)]' : 'bg-slate-300'}`} 
                                title={f.online ? 'En línea' : 'Desconectado'}
                              />
                            </div>
                            <div className="text-[10px] text-muted-foreground flex gap-2">
                              <span>{f.tag}</span>
                              <span>ELO {f.elo}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => {
                              if (onChallenge) onChallenge(f.userId, f.displayName)
                              onOpenChange(false)
                            }} 
                            className="text-orange-500 hover:text-orange-600 hover:bg-orange-50" 
                            title={`Desafiar a ${f.displayName}`}
                          >
                            <Swords className="h-4 w-4" />
                          </Button>
                          {canInvite && (
                            <Button variant="ghost" size="icon" onClick={() => inviteToGuild(f.userId, f.displayName)} className="text-primary hover:text-primary/80" title={`Invitar a ${myGuild?.name}`}>
                              <UserPlus className="h-4 w-4" />
                            </Button>
                          )}
                          <Button variant="ghost" size="icon" onClick={() => removeFriend(f.friendshipId, f.displayName)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                            <UserMinus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="pending" className="m-0 h-full">
                {pending.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <p>No tienes solicitudes pendientes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pending.map(p => (
                      <div key={p.friendshipId} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl bg-card border shadow-sm gap-3">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            {p.avatarUrl && p.avatarUrl.length <= 4 ? (
                              <AvatarFallback className="text-xl bg-primary/10">{p.avatarUrl}</AvatarFallback>
                            ) : p.avatarUrl ? (
                              <AvatarImage src={p.avatarUrl} alt={p.displayName} />
                            ) : (
                              <AvatarFallback>{p.displayName?.[0]}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <div className="font-bold leading-tight">{p.displayName}</div>
                            <div className="text-[10px] text-muted-foreground">{p.tag}</div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" onClick={() => respondRequest(p.friendshipId, true)} className="h-9 w-9 shrink-0">
                            <Check className="h-5 w-5" />
                          </Button>
                          <Button size="icon" variant="outline" onClick={() => respondRequest(p.friendshipId, false)} className="h-9 w-9 shrink-0">
                            <X className="h-5 w-5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="add" className="m-0 h-full flex flex-col">
                <div className="flex gap-2 mb-6">
                  <Input
                    placeholder="Ej: #00001"
                    value={searchTag}
                    onChange={e => setSearchTag(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch} disabled={isLoading}>
                    <Search className="h-4 w-4" />
                  </Button>
                </div>

                {searchError && (
                  <div className="text-center text-red-500 mt-4 p-4 rounded-xl bg-red-50">{searchError}</div>
                )}

                {searchResult && (
                  <div className="flex items-center justify-between p-4 rounded-xl bg-card border shadow-sm mt-4">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-12 w-12">
                        {searchResult.avatarUrl && searchResult.avatarUrl.length <= 4 ? (
                          <AvatarFallback className="text-2xl bg-primary/10">{searchResult.avatarUrl}</AvatarFallback>
                        ) : searchResult.avatarUrl ? (
                          <AvatarImage src={searchResult.avatarUrl} alt={searchResult.displayName} />
                        ) : (
                          <AvatarFallback>{searchResult.displayName?.[0]}</AvatarFallback>
                        )}
                      </Avatar>
                      <div>
                        <div className="font-bold">{searchResult.displayName}</div>
                        <div className="text-xs text-muted-foreground">{searchResult.tag}</div>
                      </div>
                    </div>
                    <Button size="icon" onClick={sendRequest} className="h-10 w-10 shrink-0">
                      <Users className="h-5 w-5" />
                    </Button>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>

          {/* Toast feedback */}
          {toast.message && (
            <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-2xl text-sm font-bold shadow-2xl border backdrop-blur-md animate-in fade-in slide-in-from-bottom-4 z-[100] flex items-center gap-3 ${
              toast.type === 'error' 
                ? 'bg-red-50/90 text-red-900 border-red-200' 
                : 'bg-green-50/90 text-green-900 border-green-200'
            }`}>
              <span className="text-xl">{toast.type === 'error' ? '⚠️' : '✅'}</span>
              <span>{toast.message}</span>
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
