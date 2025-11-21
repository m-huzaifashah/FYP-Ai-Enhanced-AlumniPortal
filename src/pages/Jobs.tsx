import React from 'react'
import { IconCard } from '../ui'

type Job = { id: number; title: string; company: string; location: string; link: string }

export default function Jobs({ jobs }: { jobs: Job[] }) {
  const ICON = 'https://jrcrs.riphah.edu.pk/wp-content/uploads/2017/05/RIU-logo.png'
  return (
    <section>
      <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {jobs.map(j => (
          <li key={j.id}>
            <IconCard title={j.title} src={ICON} />
          </li>
        ))}
      </ul>
    </section>
  )
}
