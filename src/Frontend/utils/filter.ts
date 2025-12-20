import { useMemo } from 'react'
import type { Service, Alumni } from '../hooks/useInitialData'

export function useFilterAlumni(query: string, alumni: Alumni[]) {
  return useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return alumni
    return alumni.filter(a =>
      a.name.toLowerCase().includes(q) ||
      String(a.batch).includes(q) ||
      a.department.toLowerCase().includes(q) ||
      a.location.toLowerCase().includes(q) ||
      a.company.toLowerCase().includes(q) ||
      a.role.toLowerCase().includes(q)
    )
  }, [query, alumni])
}

export function useFilterServices(svcQuery: string, svcCategory: 'All' | 'Career' | 'Community' | 'Benefits' | 'Support', services: Service[]) {
  return useMemo(() => {
    const q = svcQuery.trim().toLowerCase()
    return services.filter(s => {
      const matchesText = !q || s.title.toLowerCase().includes(q) || s.description.toLowerCase().includes(q)
      const matchesCat = svcCategory === 'All' || s.category === svcCategory
      return matchesText && matchesCat
    })
  }, [svcQuery, svcCategory, services])
}
