'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Save, Eye, EyeOff, Trash2, CheckCircle } from 'lucide-react'

interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  golfer_level: string | null
  handicap: number | null
  dominant_hand: string | null
  home_course: string | null
  years_playing: number | null
  primary_goal: string | null
}

interface ProfileClientProps {
  profile: Profile | null
  userEmail: string
  userId: string
}

const LEVELS = ['Beginner', 'Casual', 'Intermediate', 'Advanced', 'Scratch', 'Professional']
const HANDS = ['Right', 'Left']
const GOALS = ['Lower my handicap', 'Improve consistency', 'Add distance', 'Learn the basics']

export default function ProfileClient({ profile, userEmail, userId }: ProfileClientProps) {
  const router = useRouter()

  // Golfer profile form
  const [firstName, setFirstName] = useState(profile?.first_name ?? '')
  const [lastName, setLastName] = useState(profile?.last_name ?? '')
  const [golferLevel, setGolferLevel] = useState(profile?.golfer_level ?? '')
  const [handicap, setHandicap] = useState(profile?.handicap?.toString() ?? '')
  const [dominantHand, setDominantHand] = useState(profile?.dominant_hand ?? '')
  const [homeCourse, setHomeCourse] = useState(profile?.home_course ?? '')
  const [yearsPlaying, setYearsPlaying] = useState(profile?.years_playing?.toString() ?? '')
  const [primaryGoal, setPrimaryGoal] = useState(profile?.primary_goal ?? '')
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Change password
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  // Delete account
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setProfileLoading(true)
    setProfileError(null)
    setProfileSuccess(false)

    const supabase = createClient()
    const { error } = await supabase.from('profiles').upsert({
      id: userId,
      first_name: firstName.trim() || null,
      last_name: lastName.trim() || null,
      golfer_level: golferLevel || null,
      handicap: handicap !== '' ? parseFloat(handicap) : null,
      dominant_hand: dominantHand || null,
      home_course: homeCourse.trim() || null,
      years_playing: yearsPlaying !== '' ? parseInt(yearsPlaying) : null,
      primary_goal: primaryGoal || null,
      updated_at: new Date().toISOString(),
    })

    setProfileLoading(false)

    if (error) {
      setProfileError(error.message)
      return
    }

    setProfileSuccess(true)
    setTimeout(() => setProfileSuccess(false), 3000)
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError(null)
    setPasswordSuccess(false)

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters.')
      return
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.')
      return
    }

    setPasswordLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setPasswordLoading(false)

    if (error) {
      setPasswordError(error.message)
      return
    }

    setPasswordSuccess(true)
    setNewPassword('')
    setConfirmPassword('')
    setTimeout(() => setPasswordSuccess(false), 3000)
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    setDeleteLoading(true)
    setDeleteError(null)

    const res = await fetch('/api/account', { method: 'DELETE' })

    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      setDeleteError(body.error ?? 'Failed to delete account. Please try again.')
      setDeleteLoading(false)
      return
    }

    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <div className="space-y-8">
      {/* Section 1: Golfer Profile */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-6">Golfer Profile</h2>
        <form onSubmit={handleProfileSave} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">First name</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Last name</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Smith"
                className="input"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Level of golfer</label>
              <select
                value={golferLevel}
                onChange={(e) => setGolferLevel(e.target.value)}
                className="input"
              >
                <option value="">Select level</option>
                {LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Dominant hand</label>
              <select
                value={dominantHand}
                onChange={(e) => setDominantHand(e.target.value)}
                className="input"
              >
                <option value="">Select hand</option>
                {HANDS.map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Handicap index
                <span className="text-slate-500 font-normal ml-1">(0–54)</span>
              </label>
              <input
                type="number"
                value={handicap}
                onChange={(e) => setHandicap(e.target.value)}
                placeholder="e.g. 12.4"
                min={0}
                max={54}
                step={0.1}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Years playing</label>
              <input
                type="number"
                value={yearsPlaying}
                onChange={(e) => setYearsPlaying(e.target.value)}
                placeholder="e.g. 5"
                min={0}
                className="input"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Home course
              <span className="text-slate-500 font-normal ml-1">(optional)</span>
            </label>
            <input
              type="text"
              value={homeCourse}
              onChange={(e) => setHomeCourse(e.target.value)}
              placeholder="e.g. Augusta National"
              className="input"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Primary goal</label>
            <select
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              className="input"
            >
              <option value="">Select a goal</option>
              {GOALS.map((g) => <option key={g} value={g}>{g}</option>)}
            </select>
          </div>

          {profileError && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
              {profileError}
            </div>
          )}

          {profileSuccess && (
            <div className="bg-flag/10 border border-flag/30 text-flag text-sm rounded-lg px-4 py-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              Profile saved!
            </div>
          )}

          <button type="submit" disabled={profileLoading} className="btn-primary flex items-center gap-2">
            {profileLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Profile
              </>
            )}
          </button>
        </form>
      </div>

      {/* Section 2: Account */}
      <div className="card space-y-6">
        <h2 className="text-lg font-semibold text-white">Account</h2>

        <div>
          <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
          <input type="email" value={userEmail} readOnly disabled className="input opacity-60 cursor-not-allowed" />
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-300 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                New password
                <span className="text-slate-500 font-normal ml-1">(min. 8 characters)</span>
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Confirm new password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="input pr-11"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {passwordError && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
                {passwordError}
              </div>
            )}

            {passwordSuccess && (
              <div className="bg-flag/10 border border-flag/30 text-flag text-sm rounded-lg px-4 py-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Password updated!
              </div>
            )}

            <button type="submit" disabled={passwordLoading} className="btn-primary flex items-center gap-2">
              {passwordLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Updating...
                </>
              ) : (
                'Change Password'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Section 3: Danger Zone */}
      <div className="card border-red-900/40">
        <h2 className="text-lg font-semibold text-white mb-2">Danger Zone</h2>
        <p className="text-slate-400 text-sm mb-5">
          Permanently delete your account and all swing analyses. This cannot be undone.
        </p>
        <button
          onClick={() => setShowDeleteModal(true)}
          className="btn-danger flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Delete Account
        </button>
      </div>

      {/* Delete confirmation modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
          <div className="bg-turf-900 border border-turf-600 rounded-2xl p-8 max-w-sm w-full space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-red-900/40 rounded-full flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h2 className="text-white text-lg font-semibold">Delete account?</h2>
                <p className="text-slate-400 text-sm mt-1">
                  This will permanently delete your account and all swing analyses. Type{' '}
                  <span className="text-white font-mono font-bold">DELETE</span> to confirm.
                </p>
              </div>
            </div>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="input font-mono"
            />

            {deleteError && (
              <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-lg px-4 py-3">
                {deleteError}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false)
                  setDeleteConfirmText('')
                  setDeleteError(null)
                }}
                className="btn-ghost flex-1 text-sm py-2"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                className="flex-1 bg-red-800 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Deleting...
                  </>
                ) : (
                  'Delete Account'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
