import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, UserPlus, Check, X, UserMinus, User } from 'lucide-react'
import { loadAuth } from '@/network/authApi'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function FriendsDialog({ open, onOpenChange }) {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('friends') // 'friends', 'pending', 'add'
  const [friends, setFriends] = useState([])
  const [pending, setPending] = useState([])
  const [searchTag, setSearchTag] = useState('')
  const [searchResult, setSearchResult] = useState(null)
  const [searchError, setSearchError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const auth = loadAuth()

  useEffect(() => {
    if (open && auth?.token) {
      fetchFriends()
      fetchPending()
    }
  }, [open, activeTab])

  const fetchFriends = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/friends`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      if (res.ok) setFriends(await res.json())
    } catch (e) { console.error(e) }
  }

  const fetchPending = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/friends/pending`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      if (res.ok) setPending(await res.json())
    } catch (e) { console.error(e) }
  }

  const handleSearch = async () => {
    if (!searchTag) return
    setIsLoading(true)
    setSearchError('')
    setSearchResult(null)
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/users/search?tag=${encodeURIComponent(searchTag)}`, {
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      const data = await res.json()
      if (res.ok) {
        setSearchResult(data)
      } else {
        setSearchError(data.error || 'Usuario no encontrado')
      }
    } catch (e) {
      setSearchError('Error de conexión')
    } finally {
      setIsLoading(false)
    }
  }

  const sendRequest = async () => {
    if (!searchResult) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/friends/request`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${auth.token}` 
        },
        body: JSON.stringify({ tag: searchResult.tag })
      })
      const data = await res.json()
      if (res.ok) {
        setSearchResult(null)
        setSearchTag('')
        alert('Solicitud enviada')
      } else {
        alert(data.error || 'Error al enviar solicitud')
      }
    } catch (e) {
      console.error(e)
    }
  }

  const respondRequest = async (id, accept) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/friends/${id}/${accept ? 'accept' : 'reject'}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      if (res.ok) {
        fetchPending()
        if (accept) fetchFriends()
      }
    } catch (e) { console.error(e) }
  }

  const removeFriend = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar a este amigo?')) return
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/friends/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${auth.token}` }
      })
      if (res.ok) fetchFriends()
    } catch (e) { console.error(e) }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col p-0">
        <DialogHeader className="px-6 py-4 pb-2">
          <DialogTitle className="text-2xl">Amigos</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
          <div className="px-6">
            <TabsList className="w-full">
              <TabsTrigger value="friends" className="flex-1">Amigos ({friends.length})</TabsTrigger>
              <TabsTrigger value="pending" className="flex-1 relative">
                Solicitudes
                {pending.length > 0 && (
                  <span className="absolute top-1 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
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
                          ) : (
                            <AvatarFallback>{f.displayName[0]}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-bold leading-tight">{f.displayName}</div>
                          <div className="text-[10px] text-muted-foreground flex gap-2">
                            <span>{f.tag}</span>
                            <span>ELO {f.elo}</span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" onClick={() => removeFriend(f.friendshipId)} className="text-red-500 hover:text-red-600 hover:bg-red-50">
                        <UserMinus className="h-4 w-4" />
                      </Button>
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
                          ) : (
                            <AvatarFallback>{p.displayName[0]}</AvatarFallback>
                          )}
                        </Avatar>
                        <div>
                          <div className="font-bold leading-tight">{p.displayName}</div>
                          <div className="text-[10px] text-muted-foreground">{p.tag}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => respondRequest(p.friendshipId, true)} className="flex-1">
                          <Check className="h-4 w-4 mr-1" /> Aceptar
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => respondRequest(p.friendshipId, false)} className="flex-1">
                          <X className="h-4 w-4 mr-1" /> Rechazar
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
                <div className="text-center text-red-500 mt-4 p-4 rounded-xl bg-red-50">
                  {searchError}
                </div>
              )}

              {searchResult && (
                <div className="flex items-center justify-between p-4 rounded-xl bg-card border shadow-sm mt-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12">
                      {searchResult.avatarUrl && searchResult.avatarUrl.length <= 4 ? (
                        <AvatarFallback className="text-2xl bg-primary/10">{searchResult.avatarUrl}</AvatarFallback>
                      ) : (
                        <AvatarFallback>{searchResult.displayName[0]}</AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <div className="font-bold">{searchResult.displayName}</div>
                      <div className="text-xs text-muted-foreground">{searchResult.tag}</div>
                    </div>
                  </div>
                  <Button onClick={sendRequest}>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Añadir
                  </Button>
                </div>
              )}
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
