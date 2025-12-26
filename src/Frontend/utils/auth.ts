export function getIsAdmin(authed: boolean): boolean {
  try { return authed && localStorage.getItem('role') === 'admin' } catch { return false }
}

export function initAuthed(setAuthed: (v: boolean) => void, setRole?: (r: any) => void) {
  try {
    const t = localStorage.getItem('token')
    if (t) setAuthed(true)
    const r = localStorage.getItem('role')
    if (r && setRole) setRole(r)
  } catch {}
}

export function signOut(onAfter?: () => void) {
  try { localStorage.removeItem('token'); localStorage.removeItem('role') } catch {}
  onAfter && onAfter()
}