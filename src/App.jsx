import { useState, useMemo } from 'react'
import { SEED_DATA } from './sampleData'

const SAMPLE = `Timestamp\tNama\tKelas\tPILIHAN 1\tPILIHAN 2\tPILIHAN 3
7/25/2026 15:00:18\tJasper Edrick Candra\tXI DKV 2\tPERFORMING ARTS (TE\tBROADCAST\tENGLISH CLUB
7/25/2026 15:00:19\tJessen Julius\tXI RPL\tSKETSA DAN ILUSTRAS\tENGLISH CLUB\tFOTOGRAFI
7/25/2026 15:00:20\tWilson Corneles\tXI RPL\tENGLISH CLUB\tPERFORMING ARTS (TE\tSKETSA DAN ILUSTRAS`

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
  const results = students.map((s) => {
    const choices = [s.pilihan1, s.pilihan2, s.pilihan3].filter((c) => c !== '')
    let assigned = null
    let choiceIndex = -1

    for (let i = 0; i < choices.length; i++) {
      const club = choices[i]
      counts[club] = counts[club] ?? 0
      if (counts[club] < capacity) {
        assigned = club
        choiceIndex = i
        counts[club] += 1
        break
      }
    }

    return { ...s, assigned, choiceIndex }
  })

  return { results, counts }
}

const NO_CLUB = '— Tidak dapat klub —'

const CHOICE_LABEL = {
  0: 'Pilihan 1',
  1: 'Pilihan 2',
  2: 'Pilihan 3',
}

const STATUS_STYLE = {
  0: { label: 'Diterima — Pilihan 1', className: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20' },
  1: { label: 'Tergeser ke Pilihan 2', className: 'bg-amber-50 text-amber-700 ring-amber-600/20' },
  2: { label: 'Tergeser ke Pilihan 3', className: 'bg-orange-50 text-orange-700 ring-orange-600/20' },
  '-1': { label: 'Tidak dapat klub', className: 'bg-red-50 text-red-700 ring-red-600/20' },
}

function StatusBadge({ choiceIndex }) {
  const s = STATUS_STYLE[choiceIndex]
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${s.className}`}>
      {s.label}
    </span>
  )
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

export default function App() {
  const [rawInput, setRawInput] = useState('')
  const [capacity, setCapacity] = useState(15)
  const [processed, setProcessed] = useState(null) // { results, counts }
  const [filter, setFilter] = useState('semua') // 'semua' | 'tergeser'
  const [error, setError] = useState('')
  const [view, setView] = useState('tabel') // 'tabel' | 'per-klub'
  const [selectedClub, setSelectedClub] = useState(null)
  const [search, setSearch] = useState('')

  const handleProcess = () => {
    setError('')
    const students = parseData(rawInput)
    if (students.length === 0) {
      setError('Tidak ada data yang terbaca. Pastikan format: Timestamp, Nama, Kelas, Pilihan 1, Pilihan 2, Pilihan 3 (dipisah tab, hasil copy-paste dari Google Sheets).')
      setProcessed(null)
      return
    }
    setProcessed(assignClubs(students, Number(capacity) || 15))
    setSelectedClub(null)
  }

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

  const rosterByClub = useMemo(() => {
    if (!processed) return []
    const groups = new Map()
    processed.results.forEach((r) => {
      const key = r.assigned ?? NO_CLUB
      if (!groups.has(key)) groups.set(key, [])
      groups.get(key).push(r)
    })
    const clubs = Array.from(groups.entries())
      .filter(([club]) => club !== NO_CLUB)
      .sort((a, b) => a[0].localeCompare(b[0]))
    const noClub = groups.get(NO_CLUB) ?? []
    return { clubs, noClub }
  }, [processed])

  const clubTabs = useMemo(() => {
    if (!processed) return []
    const tabs = rosterByClub.clubs.map(([club, members]) => ({ key: club, label: club, members }))
    if (rosterByClub.noClub.length > 0) {
      tabs.push({ key: NO_CLUB, label: 'Tidak dapat klub', members: rosterByClub.noClub })
    }
    return tabs
  }, [processed, rosterByClub])

  const activeClubKey = clubTabs.some((t) => t.key === selectedClub) ? selectedClub : clubTabs[0]?.key
  const activeClubTab = clubTabs.find((t) => t.key === activeClubKey)

  const visibleRows = useMemo(() => {
    if (!processed) return []
    let rows = filter === 'tergeser' ? processed.results.filter((r) => r.choiceIndex !== 0) : processed.results
    const q = search.trim().toLowerCase()
    if (q) rows = rows.filter((r) => r.nama.toLowerCase().includes(q))
    return rows
  }, [processed, filter, search])

  const activeClubMembers = useMemo(() => {
    if (!activeClubTab) return []
    const q = search.trim().toLowerCase()
    if (!q) return activeClubTab.members
    return activeClubTab.members.filter((m) => m.nama.toLowerCase().includes(q))
  }, [activeClubTab, search])

  const tergeserCount = processed ? processed.results.filter((r) => r.choiceIndex !== 0).length : 0
  const noClubCount = processed ? processed.results.filter((r) => r.choiceIndex === -1).length : 0

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Seleksi Klub</h1>
          <p className="mt-1 text-sm text-slate-500">
            Menentukan siapa yang tereliminasi dari <span className="font-medium text-slate-700">Pilihan 1</span> berdasarkan urutan timestamp — kuota penuh akan digeser ke Pilihan 2, lalu Pilihan 3.
          </p>
        </header>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <label className="block text-sm font-medium text-slate-700">
                  Tempel data (copy dari Google Sheets: Timestamp, Nama, Kelas, Pilihan 1-3)
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRawInput(SEED_DATA)}
                    className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                  >
                    Muat data contoh (169 siswa)
                  </button>
                  {rawInput && (
                    <button
                      type="button"
                      onClick={() => setRawInput('')}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100"
                    >
                      Kosongkan
                    </button>
                  )}
                </div>
              </div>
              <textarea
                value={rawInput}
                onChange={(e) => setRawInput(e.target.value)}
                placeholder={SAMPLE}
                rows={8}
                className="w-full resize-y rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-xs text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-end gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">Kuota per klub</label>
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)}
                className="w-28 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm focus:border-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-200"
              />
            </div>
            <button
              onClick={handleProcess}
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Proses
            </button>
            {processed && (
              <button
                onClick={() => downloadCSV(processed.results)}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Unduh CSV
              </button>
            )}
          </div>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        </div>

        {processed && (
          <>
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

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm w-fit">
                <button
                  onClick={() => setView('tabel')}
                  className={`rounded-md px-3 py-1.5 transition ${view === 'tabel' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  Tabel detail
                </button>
                <button
                  onClick={() => setView('per-klub')}
                  className={`rounded-md px-3 py-1.5 transition ${view === 'per-klub' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                >
                  Daftar per klub
                </button>
              </div>

              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cari nama..."
                  className="w-56 rounded-lg border border-slate-300 bg-white py-1.5 pl-3 pr-8 text-sm focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                    aria-label="Hapus pencarian"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {view === 'tabel' && (
              <div className="mt-3 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-sm font-semibold text-slate-900">Detail siswa</h2>
                  <div className="flex gap-1 rounded-lg bg-slate-100 p-1 text-sm">
                    <button
                      onClick={() => setFilter('semua')}
                      className={`rounded-md px-3 py-1 transition ${filter === 'semua' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                    >
                      Semua ({processed.results.length})
                    </button>
                    <button
                      onClick={() => setFilter('tergeser')}
                      className={`rounded-md px-3 py-1 transition ${filter === 'tergeser' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500'}`}
                    >
                      Tereliminasi Pilihan 1 ({tergeserCount})
                    </button>
                  </div>
                </div>

                <div className="mt-3 overflow-x-auto">
                  <table className="w-full min-w-[820px] text-left text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                        <th className="py-2 pr-4">#</th>
                        <th className="py-2 pr-4">Timestamp</th>
                        <th className="py-2 pr-4">Nama</th>
                        <th className="py-2 pr-4">Kelas</th>
                        <th className="py-2 pr-4">Pilihan 1</th>
                        <th className="py-2 pr-4">Klub final</th>
                        <th className="py-2 pr-4">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleRows.map((r, i) => (
                        <tr key={`${r.nama}-${r.idx}`} className="border-b border-slate-100 last:border-0">
                          <td className="py-2 pr-4 text-slate-400">{i + 1}</td>
                          <td className="py-2 pr-4 whitespace-nowrap text-slate-500">{r.timestampRaw}</td>
                          <td className="py-2 pr-4 font-medium text-slate-800">{r.nama}</td>
                          <td className="py-2 pr-4 text-slate-600">{r.kelas}</td>
                          <td className="py-2 pr-4 text-slate-600">{r.pilihan1}</td>
                          <td className="py-2 pr-4 text-slate-600">{r.assigned ?? '—'}</td>
                          <td className="py-2 pr-4"><StatusBadge choiceIndex={r.choiceIndex} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {visibleRows.length === 0 && (
                    <p className="py-6 text-center text-sm text-slate-400">Tidak ada data untuk filter ini.</p>
                  )}
                </div>
              </div>
            )}

            {view === 'per-klub' && (
              <div className="mt-3">
                <div className="flex flex-wrap gap-1.5">
                  {clubTabs.map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setSelectedClub(tab.key)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        tab.key === activeClubKey
                          ? tab.key === NO_CLUB
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-900 text-white'
                          : tab.key === NO_CLUB
                            ? 'bg-red-50 text-red-600 hover:bg-red-100'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label} <span className="opacity-70">({tab.members.length})</span>
                    </button>
                  ))}
                </div>

                {activeClubTab && (
                  <div
                    className={`mt-3 rounded-xl border p-5 shadow-sm ${
                      activeClubTab.key === NO_CLUB ? 'border-red-200 bg-red-50/40' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <div className="flex items-baseline justify-between">
                      <h3 className={`text-sm font-semibold ${activeClubTab.key === NO_CLUB ? 'text-red-700' : 'text-slate-900'}`}>
                        {activeClubTab.label}
                      </h3>
                      <span className={`text-xs ${activeClubTab.key === NO_CLUB ? 'text-red-400' : 'text-slate-400'}`}>
                        {activeClubTab.key === NO_CLUB ? `${activeClubTab.members.length} siswa` : `${activeClubTab.members.length} / ${capacity}`}
                      </span>
                    </div>

                    <ul className={`mt-3 divide-y ${activeClubTab.key === NO_CLUB ? 'divide-red-100' : 'divide-slate-100'}`}>
                      {activeClubMembers.map((m) => (
                        <li key={`${m.nama}-${m.idx}`} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-sm">
                          <span className="text-slate-700">
                            {m.nama} <span className="text-slate-400">— {m.kelas}</span>
                          </span>
                          {activeClubTab.key === NO_CLUB ? (
                            <span className="text-xs text-slate-500">
                              {[m.pilihan1, m.pilihan2, m.pilihan3].filter(Boolean).join(' · ')}
                            </span>
                          ) : (
                            m.choiceIndex !== 0 && (
                              <span className="shrink-0 text-xs font-medium text-amber-600">{CHOICE_LABEL[m.choiceIndex]}</span>
                            )
                          )}
                        </li>
                      ))}
                    </ul>
                    {activeClubMembers.length === 0 && (
                      <p className="py-6 text-center text-sm text-slate-400">Tidak ada nama yang cocok.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
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
