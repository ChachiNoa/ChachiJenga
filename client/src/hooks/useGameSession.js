/**
 * Persists the active game route to sessionStorage so that
 * a page refresh can redirect back to the game screen.
 * 
 * Game routes: /tower, /drawing, /watch
 * When any of these are active, we save the path.
 * When game ends (/summary, /home, /login), we clear it.
 */

const GAME_ROUTES = ['/tower', '/drawing', '/watch']
const STORAGE_KEY = 'chachijenga-active-game-route'

export function saveGameRoute(path) {
  if (GAME_ROUTES.includes(path)) {
    sessionStorage.setItem(STORAGE_KEY, path)
  } else {
    sessionStorage.removeItem(STORAGE_KEY)
  }
}

export function getActiveGameRoute() {
  return sessionStorage.getItem(STORAGE_KEY)
}

export function clearGameRoute() {
  sessionStorage.removeItem(STORAGE_KEY)
}
