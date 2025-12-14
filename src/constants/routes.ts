export type Route = 'dashboard' | 'services' | 'service' | 'directory' | 'events' | 'jobs' | 'contact' | 'career' | 'mentorship' | 'admin' | 'signup' | 'forgot' | 'profile' | 'settings'

export const ROUTE_TO_PATH: Record<Route, string> = {
  dashboard: '/',
  services: '/services',
  service: '/service',
  directory: '/directory',
  events: '/events',
  jobs: '/jobs',
  contact: '/contact',
  career: '/career',
  mentorship: '/mentorship',
  admin: '/admin',
  signup: '/signup',
  forgot: '/forgot',
  profile: '/profile',
  settings: '/settings',
}

export const PATH_TO_ROUTE: Record<string, Route> = Object.fromEntries(Object.entries(ROUTE_TO_PATH).map(([k, v]) => [v, k as Route]))

export const NAV_ITEMS: [Route, string][] = [
  ['dashboard','Dashboard'],
  ['services','Alumni Services'],
  ['directory','Directory'],
  ['events','Events'],
  ['jobs','Jobs'],
  ['career','Career Support'],
  ['mentorship','Mentorship'],
  ['admin','Admin'],
  ['contact','Contact']
]
