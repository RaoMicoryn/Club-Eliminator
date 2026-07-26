import { useState, useMemo } from 'react'
import { SEED_DATA } from './sampleData'

function parseTimestamp(raw) {
  const t = Date.parse(raw)
  return Number.isNaN(t) ? null : t
}

function parseData(text) {
  const lines = text.split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.trim() !== '')
  if (lines.length === 0) return []

  const delimiter = lines[0].includes('\t') ? '\t' : ','

  let rows = lines.map((l) => l.split(delimiter).map((c) => c.trim()))

  // Drop header row if it looks like one
  if (rows[0][0] && /timestamp/i.test(rows[0][0])) {
    rows = rows.slice(1)
  }

  const parsed = rows
    .map((cols, idx) => ({
      idx,
      timestampRaw: cols[0] ?? '',
      timestamp: parseTimestamp(cols[0] ?? ''),
      nama: cols[1] ?? '',
      kelas: cols[2] ?? '',
      pilihan1: (cols[3] ?? '').trim(),
      pilihan2: (cols[4] ?? '').trim(),
      pilihan3: (cols[5] ?? '').trim(),
    }))
    .filter((r) => r.nama !== '' && r.pilihan1 !== '')

  // Sort by timestamp ascending; fall back to original row order if a
  // timestamp fails to parse (keeps it stable rather than breaking).
  parsed.sort((a, b) => {
    if (a.timestamp === null && b.timestamp === null) return a.idx - b.idx
    if (a.timestamp === null) return 1
    if (b.timestamp === null) return -1
    return a.timestamp - b.timestamp || a.idx - b.idx
  })

  return parsed
}

function assignClubs(students, capacity) {
  const counts = {}
  const settled = new Map() // idx -> result

  // Students are already sorted by timestamp ascending. We process choice
  // rank by choice rank (round 1 = everyone's Pilihan 1, round 2 = Pilihan 2
  // for whoever didn't make it in round 1, round 3 = Pilihan 3) so a
  // fallback choice can never take a seat away from someone whose Pilihan 1
  // that club actually was, no matter whose timestamp is earlier.
  let pending = students
  const rankKeys = ['pilihan1', 'pilihan2', 'pilihan3']

  for (let round = 0; round < rankKeys.length; round++) {
    const key = rankKeys[round]
    const byClub = new Map()

    pending.forEach((s) => {
      const club = s[key]
      if (!club) return
      if (!byClub.has(club)) byClub.set(club, [])
      byClub.get(club).push(s)
    })

    const acceptedIdx = new Set()
    byClub.forEach((candidates, club) => {
      counts[club] = counts[club] ?? 0
      const freeSlots = capacity - counts[club]
      if (freeSlots <= 0) return
      // candidates are already in timestamp order (order preserved from `pending`)
      candidates.slice(0, freeSlots).forEach((s) => {
        settled.set(s.idx, { ...s, assigned: club, choiceIndex: round })
        acceptedIdx.add(s.idx)
      })
      counts[club] += Math.min(freeSlots, candidates.length)
    })

    pending = pending.filter((s) => !acceptedIdx.has(s.idx))
  }

  pending.forEach((s) => settled.set(s.idx, { ...s, assigned: null, choiceIndex: -1 }))

  const results = students.map((s) => settled.get(s.idx))
  return { results, counts }
}

const STATUS_STYLE = {
  0: { label: 'Diterima — Pilihan 1' },
  1: { label: 'Tergeser ke Pilihan 2' },
  2: { label: 'Tergeser ke Pilihan 3' },
  '-1': { label: 'Tidak dapat klub' },
}

function toCSV(rows) {
  const header = ['No', 'Nama', 'Kelas', 'Timestamp', 'Pilihan 1', 'Pilihan 2', 'Pilihan 3', 'Klub Final', 'Status']
  const lines = [header.join(',')]
  rows.forEach((r, i) => {
    const status = STATUS_STYLE[r.choiceIndex].label
    const cells = [
      i + 1,
      r.nama,
      r.kelas,
      r.timestampRaw,
      r.pilihan1,
      r.pilihan2,
      r.pilihan3,
      r.assigned ?? '-',
      status,
    ].map((c) => `"${String(c).replace(/"/g, '""')}"`)
    lines.push(cells.join(','))
  })
  return lines.join('\n')
}

function downloadCSV(rows) {
  const csv = toCSV(rows)
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'hasil-seleksi-klub.csv'
  a.click()
  URL.revokeObjectURL(url)
}

// Data pendaftaran sudah final, jadi hasil seleksi cukup dihitung sekali saat
// aplikasi dimuat — tidak perlu lagi tempel data atau proses ulang.
const CAPACITY = 28
const PROCESSED = (() => {
  const students = parseData(SEED_DATA)
  return students.length > 0 ? assignClubs(students, CAPACITY) : { results: [], counts: {} }
})()

const CONFETTI_COLORS = ['#f43f5e', '#fbbf24', '#34d399', '#60a5fa', '#a78bfa', '#f472b6']

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
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
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
    // Autoplay restrictions or unsupported browser — fail silently.
  }
}

function playSuccessSound() {
  // Cheerful ascending chime: C5 - E5 - G5 - C6
  playTone([523.25, 659.25, 783.99, 1046.5], { type: 'triangle', gain: 0.18, noteDuration: 0.13, gap: 0.015 })
}

function playFailSound() {
  // Gentle descending tone
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
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl">
      {drops.map((d) => (
        <span
          key={d.id}
          className="animate-rain absolute top-0 rounded-full bg-sky-300"
          style={{
            left: `${d.left}%`,
            width: 2,
            height: d.height,
            animationDelay: `${d.delay}s`,
            animationDuration: `${d.duration}s`,
          }}
        />
      ))}
    </div>
  )
}

function CheckModal({ result, onClose, onSelectMatch, openClubs, capacity }) {
  if (!result) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="animate-modal-pop relative w-full max-w-md overflow-hidden rounded-2xl bg-white p-6 shadow-2xl"
      >
        {result.type === 'success' && <Confetti />}
        {result.type === 'rejected' && <Rain />}

        <button
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label="Tutup"
        >
          ✕
        </button>

        {result.type === 'success' && (
          <div className="relative text-center">
            <p className="animate-bounce-in text-5xl">🎉</p>
            <p className="mt-3 text-sm font-bold uppercase tracking-wide text-emerald-600">Selamat!</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{result.student.nama}</p>
            <p className="text-sm text-slate-500">{result.student.kelas}</p>
            <p className="mt-4 text-sm text-slate-600">Kamu lolos di</p>
            <p className="mt-1 text-2xl font-bold text-emerald-700">{result.student.assigned}</p>

            {result.student.choiceIndex === 0 ? (
              <p className="mt-3 text-xs font-medium text-emerald-600">
                Diterima langsung lewat Pilihan 1 🎯
              </p>
            ) : result.student.choiceIndex === 1 ? (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
                <p className="font-medium">Pilihan 1 kamu ({result.student.pilihan1}) sudah penuh duluan,</p>
                <p className="mt-0.5">
                  tapi kamu tetap keterima lewat <span className="font-semibold">Pilihan 2 ({result.student.pilihan2})</span>!
                </p>
              </div>
            ) : (
              <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700 ring-1 ring-amber-200">
                <p className="font-medium">
                  Pilihan 1 ({result.student.pilihan1}) dan Pilihan 2 ({result.student.pilihan2}) kamu sudah penuh duluan,
                </p>
                <p className="mt-0.5">
                  tapi kamu tetap keterima lewat <span className="font-semibold">Pilihan 3 ({result.student.pilihan3})</span>!
                </p>
              </div>
            )}
          </div>
        )}

        {result.type === 'rejected' && (
          <div className="text-center">
            <p className="text-4xl">😔</p>
            <p className="mt-3 text-lg font-bold text-red-600">Belum rejeki kali ini...</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{result.student.nama}</p>
            <p className="text-sm text-slate-500">{result.student.kelas}</p>
            <p className="mt-3 text-sm text-slate-600">
              Belum keterima di 3 pilihan:{' '}
              <span className="font-medium text-slate-800">
                {[result.student.pilihan1, result.student.pilihan2, result.student.pilihan3].filter(Boolean).join(' · ')}
              </span>
            </p>

            {openClubs.length > 0 ? (
              <div className="mt-4 text-left">
                <p className="text-xs font-medium text-slate-700">Klub yang masih ada kuota kosong:</p>
                <ul className="mt-2 space-y-1.5">
                  {openClubs.map((c) => (
                    <li
                      key={c.club}
                      className="flex items-center justify-between rounded-md bg-slate-50 px-2.5 py-1.5 text-xs ring-1 ring-slate-200"
                    >
                      <span className="text-slate-700">{c.club}</span>
                      <span className="font-medium text-slate-500">
                        {c.remaining} slot ({c.filled}/{capacity})
                      </span>
                    </li>
                  ))}
                </ul>
                <p className="mt-2 text-xs text-slate-500">Silakan hubungi panitia untuk daftar ke klub yang masih kosong.</p>
              </div>
            ) : (
              <p className="mt-4 text-xs text-slate-500">Saat ini semua klub sudah penuh kuotanya.</p>
            )}
          </div>
        )}

        {result.type === 'notfound' && (
          <div className="text-center">
            <p className="text-4xl">🔍</p>
            <p className="mt-3 text-lg font-semibold text-slate-800">Nama tidak ditemukan</p>
            <p className="mt-1 text-sm text-slate-500">Cek ejaan nama, atau tambahkan kelas.</p>
          </div>
        )}

        {result.type === 'multiple' && (
          <div>
            <p className="text-center text-lg font-semibold text-slate-800">Ada {result.matches.length} nama yang cocok</p>
            <p className="mt-1 text-center text-sm text-slate-500">Pilih salah satu:</p>
            <ul className="mt-3 max-h-64 divide-y divide-slate-100 overflow-y-auto">
              {result.matches.map((m) => (
                <li key={`${m.nama}-${m.idx}`}>
                  <button
                    onClick={() => onSelectMatch(m)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm transition hover:bg-slate-50"
                  >
                    <span className="text-slate-700">{m.nama}</span>
                    <span className="text-xs text-slate-400">{m.kelas}</span>
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

export default function App() {
  const [checkName, setCheckName] = useState('')
  const [checkKelas, setCheckKelas] = useState('')
  const [checkModal, setCheckModal] = useState(null)

  const processed = PROCESSED
  const capacity = CAPACITY

  const clubSummary = useMemo(() => {
    if (!processed) return []
    const clubs = new Map()
    processed.results.forEach((r) => {
      const wanted1 = r.pilihan1
      if (wanted1) {
        const c = clubs.get(wanted1) ?? { club: wanted1, requested1: 0, accepted1: 0, final: 0 }
        c.requested1 += 1
        if (r.choiceIndex === 0) c.accepted1 += 1
        clubs.set(wanted1, c)
      }
    })
    processed.results.forEach((r) => {
      if (r.assigned) {
        const c = clubs.get(r.assigned) ?? { club: r.assigned, requested1: 0, accepted1: 0, final: 0 }
        c.final += 1
        clubs.set(r.assigned, c)
      }
    })
    return Array.from(clubs.values()).sort((a, b) => a.club.localeCompare(b.club))
  }, [processed])

  const tergeserCount = processed ? processed.results.filter((r) => r.choiceIndex !== 0).length : 0
  const noClubCount = processed ? processed.results.filter((r) => r.choiceIndex === -1).length : 0

  const allClubNames = useMemo(() => {
    if (!processed) return []
    const set = new Set()
    processed.results.forEach((r) => {
      ;[r.pilihan1, r.pilihan2, r.pilihan3].forEach((c) => c && set.add(c))
    })
    return Array.from(set).sort((a, b) => a.localeCompare(b))
  }, [processed])

  const openClubs = useMemo(() => {
    if (!processed) return []
    return allClubNames
      .map((club) => ({
        club,
        filled: processed.counts[club] ?? 0,
        remaining: (Number(capacity) || 0) - (processed.counts[club] ?? 0),
      }))
      .filter((c) => c.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining)
  }, [processed, allClubNames, capacity])

  const resolveStudentResult = (student) => {
    if (student.assigned) playSuccessSound()
    else playFailSound()
    return {
      type: student.assigned ? 'success' : 'rejected',
      student,
    }
  }

  const handleCheck = () => {
    if (!processed) return
    const nameQ = checkName.trim().toLowerCase()
    if (!nameQ) return
    const kelasQ = checkKelas.trim().toLowerCase()
    const matches = processed.results.filter((r) => {
      const nameMatch = r.nama.toLowerCase().includes(nameQ)
      const kelasMatch = !kelasQ || r.kelas.toLowerCase().includes(kelasQ)
      return nameMatch && kelasMatch
    })

    if (matches.length === 0) {
      setCheckModal({ type: 'notfound' })
    } else if (matches.length > 1) {
      setCheckModal({ type: 'multiple', matches })
    } else {
      setCheckModal(resolveStudentResult(matches[0]))
    }
  }

  const handleCheckKeyDown = (e) => {
    if (e.key === 'Enter') handleCheck()
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Seleksi Klub</h1>
            <p className="mt-1 text-sm text-slate-500">
              Menentukan siapa yang tereliminasi dari <span className="font-medium text-slate-700">Pilihan 1</span> berdasarkan urutan timestamp. Semua Pilihan 1 diproses & diprioritaskan dulu di tiap klub, baru sisa kuota dibagikan ke yang kepental lewat Pilihan 2, lalu Pilihan 3. <span className="font-medium text-slate-700">(Dibuat oleh Team XI RPL)</span>
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              onClick={() => downloadCSV(processed.results)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-600 transition hover:bg-slate-100"
            >
              Unduh CSV
            </button>
          </div>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Cek hasil kamu</h2>
          <p className="mt-1 text-xs text-slate-500">
            Masukkan nama (dan kelas kalau ada nama yang sama), lalu tekan Cek untuk lihat hasilnya.
          </p>
          <div className="mt-3 flex flex-wrap gap-3">
            <input
              type="text"
              value={checkName}
              onChange={(e) => setCheckName(e.target.value)}
              onKeyDown={handleCheckKeyDown}
              placeholder="Nama kamu"
              autoFocus
              className="min-w-[180px] flex-1 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <input
              type="text"
              value={checkKelas}
              onChange={(e) => setCheckKelas(e.target.value)}
              onKeyDown={handleCheckKeyDown}
              placeholder="Kelas (opsional)"
              className="w-40 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
            />
            <button
              onClick={handleCheck}
              disabled={!checkName.trim()}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Cek
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Total siswa" value={processed.results.length} />
          <StatCard label="Diterima Pilihan 1" value={processed.results.length - tergeserCount} accent="emerald" />
          <StatCard label="Tergeser (Pilihan 2/3)" value={tergeserCount} accent="amber" />
          <StatCard label="Tidak dapat klub" value={noClubCount} accent="red" />
        </div>

        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-slate-900">Ringkasan per klub</h2>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                  <th className="py-2 pr-4">Klub</th>
                  <th className="py-2 pr-4">Peminat Pilihan 1</th>
                  <th className="py-2 pr-4">Diterima dari Pilihan 1</th>
                  <th className="py-2 pr-4">Tereliminasi dari Pilihan 1</th>
                  <th className="py-2 pr-4">Total akhir</th>
                </tr>
              </thead>
              <tbody>
                {clubSummary.map((c) => (
                  <tr key={c.club} className="border-b border-slate-100 last:border-0">
                    <td className="py-2 pr-4 font-medium text-slate-800">{c.club}</td>
                    <td className="py-2 pr-4 text-slate-600">{c.requested1}</td>
                    <td className="py-2 pr-4 text-slate-600">{c.accepted1}</td>
                    <td className="py-2 pr-4 text-slate-600">{Math.max(c.requested1 - c.accepted1, 0)}</td>
                    <td className="py-2 pr-4 text-slate-600">
                      {c.final}
                      <span className="text-slate-400"> / {capacity}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <CheckModal
        result={checkModal}
        onClose={() => setCheckModal(null)}
        onSelectMatch={(student) => setCheckModal(resolveStudentResult(student))}
        openClubs={openClubs}
        capacity={capacity}
      />
    </div>
  )
}

function StatCard({ label, value, accent }) {
  const accentClass = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
  }[accent] ?? 'text-slate-900'

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${accentClass}`}>{value}</p>
    </div>
  )
}
