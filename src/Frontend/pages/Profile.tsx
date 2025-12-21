import React, { useState, useEffect } from 'react'
import { getProfile, updateProfile } from '../../api'

export default function Profile() {
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const email = localStorage.getItem('email')
    if (!email) {
      // If we have a token but no email, the session is invalid. Clear and reload.
      if (localStorage.getItem('token')) {
        localStorage.clear()
        window.location.reload()
      }
      setLoading(false)
      return
    }
    getProfile(email)
      .then(setProfile)
      .catch((err) => setMsg(err.message || 'Failed to load profile'))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)
    setMsg('')
    try {
      await updateProfile(profile)
      setMsg('Profile updated successfully')
    } catch (e) {
      setMsg('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Loading profile...</div>
  if (!profile && !loading) {
    const email = localStorage.getItem('email')
    return (
      <div className="p-8 text-center text-slate-500">
        <div className="mb-2 font-medium text-red-500">Error: {msg}</div>
        <div className="mb-4 text-xs text-slate-400 font-mono">Debug: {email || 'No Email'}</div>
        <div className="mb-2">Unable to load profile. Please try logging in again.</div>
        <button 
          onClick={() => { localStorage.clear(); window.location.reload() }} 
          className="text-blue-600 underline hover:text-blue-800"
        >
          Log Out & Retry
        </button>
      </div>
    )
  }

  const isAlumni = profile.role === 'alumni'

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200 p-6 shadow-sm backdrop-blur-sm">
        <div className="text-xl font-semibold">Profile ({profile.role})</div>
        <div className="mt-4 space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-500 ml-1">Full Name</label>
            <input 
              className="w-full rounded-full bg-white px-4 py-2 text-sm ring-1 ring-slate-200 focus:ring-blue-500 outline-none" 
              placeholder="Full Name" 
              value={profile.name || ''} 
              onChange={e => setProfile({...profile, name: e.target.value})} 
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-500 ml-1">Email</label>
            <input 
              className="w-full rounded-full bg-slate-100 px-4 py-2 text-sm ring-1 ring-slate-200 text-slate-500 cursor-not-allowed" 
              readOnly 
              value={profile.email || ''} 
            />
          </div>
          
          {isAlumni && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-xs font-semibold text-slate-500 ml-1">Batch (Year)</label>
                    <input 
                    className="w-full rounded-full bg-white px-4 py-2 text-sm ring-1 ring-slate-200 focus:ring-blue-500 outline-none" 
                    placeholder="2020" 
                    value={profile.batch || ''} 
                    onChange={e => setProfile({...profile, batch: e.target.value})} 
                    />
                </div>
                <div>
                    <label className="text-xs font-semibold text-slate-500 ml-1">Department</label>
                    <input 
                    className="w-full rounded-full bg-white px-4 py-2 text-sm ring-1 ring-slate-200 focus:ring-blue-500 outline-none" 
                    placeholder="Computer Science" 
                    value={profile.department || ''} 
                    onChange={e => setProfile({...profile, department: e.target.value})} 
                    />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 ml-1">Current Company</label>
                <input 
                  className="w-full rounded-full bg-white px-4 py-2 text-sm ring-1 ring-slate-200 focus:ring-blue-500 outline-none" 
                  placeholder="Company Name" 
                  value={profile.company || ''} 
                  onChange={e => setProfile({...profile, company: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 ml-1">Job Title / Role</label>
                <input 
                  className="w-full rounded-full bg-white px-4 py-2 text-sm ring-1 ring-slate-200 focus:ring-blue-500 outline-none" 
                  placeholder="Software Engineer" 
                  value={profile.jobTitle || ''} 
                  onChange={e => setProfile({...profile, jobTitle: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 ml-1">Location</label>
                <input 
                  className="w-full rounded-full bg-white px-4 py-2 text-sm ring-1 ring-slate-200 focus:ring-blue-500 outline-none" 
                  placeholder="City, Country" 
                  value={profile.location || ''} 
                  onChange={e => setProfile({...profile, location: e.target.value})} 
                />
              </div>
            </>
          )}

          {msg && <div className={`text-sm ${msg.includes('success') ? 'text-green-600' : 'text-red-500'}`}>{msg}</div>}

          <div className="flex items-center gap-2 pt-2">
            <button 
                onClick={() => window.history.back()}
                className="rounded-full bg-white ring-1 ring-slate-200 px-4 py-2 text-sm hover:bg-slate-50 transition-colors">
                Back
            </button>
            <button 
                onClick={handleSave}
                disabled={saving}
                className="rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 text-white px-6 py-2 text-sm font-semibold shadow-md hover:opacity-90 transition-opacity disabled:opacity-50">
                {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="rounded-2xl bg-white/70 ring-1 ring-slate-200 p-6 shadow-sm backdrop-blur-sm h-fit">
        <div className="text-xl font-semibold">Public Card Preview</div>
        <div className="mt-4 rounded-xl bg-white ring-1 ring-slate-200 p-4 shadow-sm">
          <div className="font-semibold text-lg">{profile.name || 'Your Name'}</div>
          {isAlumni ? (
             <>
                <div className="text-sm text-slate-600">{profile.jobTitle || 'Alumni Member'} at {profile.company || 'Company'}</div>
                <div className="text-xs text-slate-500 mt-1">{profile.location || 'Location'}</div>
             </>
          ) : (
             <div className="text-sm text-slate-600 capitalize">{profile.role}</div>
          )}
        </div>
        <div className="mt-4 text-xs text-slate-500">
            This is how your profile appears in the directory.
        </div>
      </div>
    </div>
  )
}