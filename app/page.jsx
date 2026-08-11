'use client'

import { useEffect, useMemo, useState } from 'react'

const CONFETTI_COLORS = ['#22d3ee', '#818cf8', '#a78bfa', '#e879f9', '#67e8f9', '#e0e7ff']

function Confetti() {
  const pieces = useMemo(
    () =>
      Array.from({ length: 46 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        duration: 1.6 + Math.random() * 1.3,
        color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
        rotate: Math.round(Math.random() * 360),
        size: 5 + Math.random() * 6,
      })),
    []
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.id}
          className="animate-confetti absolute top-0 rounded-sm"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.45,
            backgroundColor: p.color,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            transform: `rotate(${p.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}

function playTone(freqs, { type = 'sine', gain = 0.2, noteDuration = 0.14, gap = 0.02 } = {}) {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    const ctx = new AudioCtx()
    let t = ctx.currentTime
    freqs.forEach((freq) => {
      const osc = ctx.createOscillator()
      const g = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, t)
      g.gain.setValueAtTime(0, t)
      g.gain.linearRampToValueAtTime(gain, t + 0.01)
      g.gain.exponentialRampToValueAtTime(0.001, t + noteDuration)
      osc.connect(g)
      g.connect(ctx.destination)
      osc.start(t)
      osc.stop(t + noteDuration + 0.02)
      t += noteDuration + gap
    })
    setTimeout(() => ctx.close(), (t + 0.3) * 1000)
  } catch {
    // Autoplay restrictions atau browser tidak dukung — abaikan saja.
  }
}

function playSuccessSound() {
  playTone([523.25, 659.25, 783.99, 1046.5], { type: 'triangle', gain: 0.18, noteDuration: 0.13, gap: 0.015 })
}
function playFailSound() {
  playTone([392.0, 329.63, 261.63], { type: 'sine', gain: 0.15, noteDuration: 0.22, gap: 0.03 })
}

const RAIN_DROP_COUNT = 30

function Rain() {
  const drops = useMemo(
    () =>
      Array.from({ length: RAIN_DROP_COUNT }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 1.6,
        duration: 1.8 + Math.random() * 1.6,
        height: 9 + Math.random() * 9,
      })),
    []
  )
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {drops.map((d) => (
        <span
          key={d.id}
          className="animate-rain absolute top-0 rounded-full bg-cyan-300/40"
          style={{ left: `${d.left}%`, width: 2, height: d.height, animationDelay: `${d.delay}s`, animationDuration: `${d.duration}s` }}
        />
      ))}
    </div>
  )
}

// Kode tiket deterministik dari nama+kelas — bukan buat keamanan, cuma biar
// tiap hasil kelihatan kayak nomor boarding pass yang unik.
function ticketCode(seed) {
  let h = 0
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) >>> 0
  }
  return String(h % 1000000).padStart(6, '0')
}

function Barcode({ seed }) {
  const bars = useMemo(() => {
    let h = 0
    for (let i = 0; i < seed.length; i++) h = (h * 131 + seed.charCodeAt(i)) >>> 0
    return Array.from({ length: 28 }, (_, i) => {
      h = (h * 1103515245 + 12345) >>> 0
      return 1 + (h % 4)
    })
  }, [seed])
  return (
    <div className="flex h-8 items-end gap-[2px]" aria-hidden="true">
      {bars.map((w, i) => (
        <span key={i} className="barcode-bar bg-slate-900" style={{ width: w, height: `${40 + ((w * 17) % 60)}%` }} />
      ))}
    </div>
  )
}

function TicketStub({ status, student }) {
  const isFull = status === 'full'
  const isPartial = status === 'partial'
  const code = ticketCode(`${student.nama}-${student.kelas}`)

  return (
    <div className="ticket-shell relative">
      <span className="ticket-glow cyan" />
      <span className="ticket-glow violet" />
      {status !== 'rejected' && <Confetti />}
      {status === 'rejected' && <Rain />}

      {/* === Bagian atas: pemegang tiket === */}
      <div className="relative px-6 pb-7 pt-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-slate-400">
          {status === 'rejected' ? 'Boarding Ditolak' : 'Tiket Masuk Klub'}
        </p>
        <p className="mx-auto mt-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-2xl shadow-lg shadow-black/20">{status === 'rejected' ? '×' : '✓'}</p>
        <p className="mt-4 text-2xl font-extrabold tracking-tight text-white">{student.nama}</p>
        <p className="font-mono text-xs text-slate-400">{student.kelas || '—'}</p>
      </div>

      {/* === Garis sobekan tiket === */}
      <div className="relative border-t border-dashed border-slate-700">
        <span className="ticket-notch -left-[13px]" />
        <span className="ticket-notch -right-[13px]" />
      </div>

      {/* === Bagian bawah: klub / status === */}
      <div className="relative px-6 pb-7 pt-5">
        {status !== 'rejected' ? (
          <>
            <p className="text-center font-mono text-[11px] uppercase tracking-[0.3em] text-slate-500">Diterima di</p>
            <p className="mt-1 text-center font-display text-3xl font-extrabold tracking-tight text-white">{student.assigned}</p>

            {isFull && (
              <p className="mt-3 text-center text-xs font-medium text-cyan-300">Diterima langsung lewat Pilihan 1 🎯</p>
            )}
            {isPartial && student.choiceIndex === 1 && (
              <div className="mt-3 rounded-lg border border-dashed border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs text-slate-400">
                <span className="font-medium text-cyan-200">Pilihan 1 ({student.pilihan1}) penuh duluan</span>
                {' — '}lolos lewat <span className="font-semibold text-cyan-300">Pilihan 2</span>
              </div>
            )}
            {isPartial && student.choiceIndex === 2 && (
              <div className="mt-3 rounded-lg border border-dashed border-white/10 bg-white/[0.04] px-3 py-2 text-center text-xs text-slate-400">
                <span className="font-medium text-cyan-200">Pilihan 1 & 2 penuh duluan</span>
                {' — '}lolos lewat <span className="font-semibold text-cyan-300">Pilihan 3</span>
              </div>
            )}
          </>
        ) : (
          <div className="text-center">
            <p className="text-sm text-slate-400">Belum keterima di 3 pilihan:</p>
            <p className="mt-1 text-sm font-medium text-slate-200">
              {[student.pilihan1, student.pilihan2, student.pilihan3].filter(Boolean).join(' · ')}
            </p>
          </div>
        )}

        <div className="mt-5 flex items-end justify-between border-t border-white/10 pt-4">
          <Barcode seed={`${student.nama}-${student.kelas}-${code}`} />
          <span className="font-mono text-xs tabular-nums text-slate-500">NO. {code}</span>
        </div>
      </div>
    </div>
  )
}

function CheckModal({ result, onClose, onSelectMatch, openClubs }) {
  if (!result) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-pop relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/10 bg-[#0b1220] shadow-2xl shadow-black/60"
      >
        <button
          onClick={onClose}
          className="absolute right-3 top-3 z-10 rounded-full p-1 text-slate-400 transition hover:bg-white/10 hover:text-white"
          aria-label="Tutup"
        >
          ✕
        </button>

        {(result.type === 'success' || result.type === 'rejected') && (
          <TicketStub
            status={result.type === 'rejected' ? 'rejected' : result.student.choiceIndex === 0 ? 'full' : 'partial'}
            student={result.student}
          />
        )}

        {result.type === 'rejected' && (
          <div className="border-t border-white/10 px-6 py-5">
            {openClubs.length > 0 ? (
              <>
                <p className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500">Kuota masih kosong</p>
                <ul className="mt-2 space-y-1.5">
                  {openClubs.map((c) => (
                    <li key={c.club} className="flex items-center justify-between rounded-md bg-white/[0.04] px-2.5 py-1.5 text-xs ring-1 ring-white/10">
                      <span className="text-slate-200">{c.club}</span>
                      <span className="font-mono text-slate-400">{c.remaining} slot ({c.filled}/{c.capacity})</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-500">Silakan hubungi panitia untuk daftar ke klub yang masih kosong.</p>
              </>
            ) : (
              <p className="text-center text-xs text-slate-500">Saat ini semua klub sudah penuh kuotanya.</p>
            )}
          </div>
        )}

        {result.type === 'notfound' && (
          <div className="px-6 py-12 text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-4 text-xl font-bold text-white">Nama tidak ditemukan</p>
            <p className="mt-2 text-sm text-slate-500">Cek ejaan nama, atau tambahkan kelas.</p>
          </div>
        )}

        {result.type === 'multiple' && (
          <div className="px-6 py-6">
            <p className="text-center text-lg font-semibold text-white">Ada {result.matches.length} nama yang cocok</p>
            <p className="mt-1 text-center text-sm text-slate-500">Pilih salah satu:</p>
            <ul className="mt-3 max-h-64 divide-y divide-white/10 overflow-y-auto">
              {result.matches.map((m) => (
                <li key={`${m.nama}-${m.idx}`}>
                  <button onClick={() => onSelectMatch(m)} className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition hover:bg-white/[0.05]">
                    <span className="text-slate-700">{m.nama}</span>
                    <span className="font-mono text-xs text-slate-400">{m.kelas}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

function DepartureStat({ label, value }) {
  return (
    <div className="stat-card min-w-[145px] flex-1 px-5 py-5 first:rounded-l-2xl last:rounded-r-2xl">
      <p className="relative z-10 font-mono text-[9px] font-medium uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="relative z-10 mt-2 font-display text-3xl font-bold tabular-nums text-white">{String(value).padStart(2, '0')}</p>
    </div>
  )
}

function ClubCard({ club }) {
  const pct = club.capacity > 0 ? Math.min(100, Math.round((club.final / club.capacity) * 100)) : 0
  const eliminated = Math.max(club.requested1 - club.accepted1, 0)
  return (
    <div className="club-card rounded-2xl p-5">
      <div className="relative z-10 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-slate-500">Club / Status</p>
          <h3 className="mt-1 truncate font-display text-lg font-bold text-white">{club.club}</h3>
        </div>
        <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 font-mono text-[10px] text-slate-400">CAP {club.capacity}</span>
      </div>

      <div className="relative z-10 mt-5">
        <div className="progress-track h-2 w-full overflow-hidden rounded-full">
          <div className="progress-fill h-full rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-[10px]">
          <span className="text-slate-500">Occupancy</span>
          <span className="text-cyan-300">{club.final}/{club.capacity} · {pct}%</span>
        </div>
      </div>

      <div className="relative z-10 mt-5 grid grid-cols-3 gap-2 border-t border-white/10 pt-4 text-center">
        <div className="rounded-xl bg-white/[0.025] px-2 py-2.5">
          <p className="font-mono text-lg font-semibold text-white">{club.requested1}</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">Peminat</p>
        </div>
        <div className="rounded-xl bg-white/[0.025] px-2 py-2.5">
          <p className="font-mono text-lg font-semibold text-cyan-300">{club.accepted1}</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">Lolos P1</p>
        </div>
        <div className="rounded-xl bg-white/[0.025] px-2 py-2.5">
          <p className="font-mono text-lg font-semibold text-slate-300">{eliminated}</p>
          <p className="mt-1 text-[9px] font-semibold uppercase tracking-[0.12em] text-slate-500">Tergeser</p>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [checkName, setCheckName] = useState('')
  const [checkKelas, setCheckKelas] = useState('')
  const [checkModal, setCheckModal] = useState(null)

  useEffect(() => {
    fetch('/api/public')
      .then((r) => r.json())
      .then((json) => {
        if (json.error) setError(json.error)
        else setData(json)
      })
      .catch(() => setError('Gagal memuat data. Coba muat ulang halaman.'))
  }, [])

  const capacityByClub = useMemo(() => Object.fromEntries((data?.clubs ?? []).map((c) => [c.name, c.capacity])), [data])

  const clubSummary = useMemo(() => {
    if (!data) return []
    const clubs = new Map()
    ;(data.clubs ?? []).forEach((c) => clubs.set(c.name, { club: c.name, capacity: c.capacity, requested1: 0, accepted1: 0, final: 0 }))
    data.results.forEach((r) => {
      if (r.pilihan1) {
        const c = clubs.get(r.pilihan1) ?? { club: r.pilihan1, capacity: capacityByClub[r.pilihan1] ?? 0, requested1: 0, accepted1: 0, final: 0 }
        c.requested1 += 1
        if (r.choiceIndex === 0) c.accepted1 += 1
        clubs.set(r.pilihan1, c)
      }
    })
    data.results.forEach((r) => {
      if (r.assigned) {
        const c = clubs.get(r.assigned) ?? { club: r.assigned, capacity: capacityByClub[r.assigned] ?? 0, requested1: 0, accepted1: 0, final: 0 }
        c.final += 1
        clubs.set(r.assigned, c)
      }
    })
    return Array.from(clubs.values()).sort((a, b) => b.final - a.final)
  }, [data, capacityByClub])

  const tergeserCount = data ? data.results.filter((r) => r.choiceIndex !== 0).length : 0
  const noClubCount = data ? data.results.filter((r) => r.choiceIndex === -1).length : 0

  const openClubs = useMemo(() => {
    if (!data) return []
    return (data.clubs ?? [])
      .map((c) => ({ club: c.name, capacity: c.capacity, filled: data.counts[c.name] ?? 0, remaining: c.capacity - (data.counts[c.name] ?? 0) }))
      .filter((c) => c.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining)
  }, [data])

  const resolveStudentResult = (student) => {
    if (student.assigned) playSuccessSound()
    else playFailSound()
    return { type: student.assigned ? 'success' : 'rejected', student }
  }

  const handleCheck = () => {
    if (!data) return
    const nameQ = checkName.trim().toLowerCase()
    if (!nameQ) return
    const kelasQ = checkKelas.trim().toLowerCase()
    const matches = data.results.filter((r) => {
      const nameMatch = r.nama.toLowerCase().includes(nameQ)
      const kelasMatch = !kelasQ || r.kelas.toLowerCase().includes(kelasQ)
      return nameMatch && kelasMatch
    })

    if (matches.length === 0) setCheckModal({ type: 'notfound' })
    else if (matches.length > 1) setCheckModal({ type: 'multiple', matches })
    else setCheckModal(resolveStudentResult(matches[0]))
  }

  const handleCheckKeyDown = (e) => { if (e.key === 'Enter') handleCheck() }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#050816] text-slate-200">
      {/* ===== HERO — dark departure-board panel ===== */}
      <div className="hero-glow relative overflow-hidden bg-[#070b18]">
        <div className="bg-dot-grid pointer-events-none absolute inset-0" />
        <div className="relative mx-auto max-w-6xl px-4 pb-10 pt-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="font-mono text-[11px] font-medium uppercase tracking-[0.3em] text-cyan-300/80">Team XI RPL <span className="text-slate-600">//</span> Sistem Seleksi</p>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-[-0.04em] text-white sm:text-6xl">Seleksi Klub</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-400 sm:text-[15px]">
                Siapa yang tereliminasi dari <span className="font-medium text-cyan-200">Pilihan 1</span> ditentukan berdasarkan urutan timestamp. Semua Pilihan&nbsp;1 diproses & diprioritaskan dulu di tiap klub, baru sisa kuota dibagikan ke yang kepental lewat Pilihan&nbsp;2, lalu Pilihan&nbsp;3.
              </p>
            </div>
            <a
              href="/api/export"
              className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl border border-cyan-300/20 bg-cyan-300/[0.06] px-4 py-2.5 font-mono text-xs font-medium text-cyan-100 shadow-lg shadow-cyan-950/20 transition hover:border-cyan-300/40 hover:bg-cyan-300/[0.1]"
            >
              ↓ Unduh CSV
            </a>
          </div>

          {/* Cek hasil — dark search bar */}
          <div className="search-glow mt-9 rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-xl">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-slate-500">Cek hasil kamu</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <input
                type="text"
                value={checkName}
                onChange={(e) => setCheckName(e.target.value)}
                onKeyDown={handleCheckKeyDown}
                placeholder="Nama kamu"
                autoFocus
                className="min-w-[180px] flex-1 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:bg-white/[0.06]"
              />
              <input
                type="text"
                value={checkKelas}
                onChange={(e) => setCheckKelas(e.target.value)}
                onKeyDown={handleCheckKeyDown}
                placeholder="Kelas (opsional)"
                className="w-40 rounded-xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:bg-white/[0.06]"
              />
              <button
                onClick={handleCheck}
                disabled={!checkName.trim()}
                className="rounded-xl bg-gradient-to-r from-cyan-300 to-indigo-300 px-5 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-cyan-950/20 transition hover:-translate-y-0.5 hover:shadow-cyan-900/30 disabled:cursor-not-allowed disabled:opacity-30"
              >
                Cek tiket →
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-9 sm:px-6 lg:px-8">
        {error && (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/[0.07] p-4 text-sm text-rose-100">{error}</div>
        )}

        {!error && !data && (
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-10 text-center text-sm text-slate-500">Memuat data…</div>
        )}

        {data && (
          <>
            {/* Departure-board style stat strip */}
            <div className="grid overflow-hidden rounded-2xl border border-white/10 sm:grid-cols-4">
              <DepartureStat label="Total Siswa" value={data.results.length} />
              <DepartureStat label="Lolos P1" value={data.results.length - tergeserCount} />
              <DepartureStat label="Tergeser" value={tergeserCount} />
              <DepartureStat label="Gagal" value={noClubCount} />
            </div>

            <div className="mt-10 flex items-end justify-between gap-4">
              <h2 className="font-display text-xl font-bold tracking-tight text-white">Ringkasan per klub</h2>
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-slate-600">{clubSummary.length} klub aktif</p>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {clubSummary.map((c) => (
                <ClubCard key={c.club} club={c} />
              ))}
            </div>
          </>
        )}
      </div>

      <CheckModal result={checkModal} onClose={() => setCheckModal(null)} onSelectMatch={(student) => setCheckModal(resolveStudentResult(student))} openClubs={openClubs} />
    </div>
  )
}