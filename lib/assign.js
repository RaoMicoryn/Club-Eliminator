// Logika inti seleksi klub — dipindah dari versi lama (client-only) supaya
// bisa dipakai di server, jalan di atas data yang sudah tersimpan di DB.

export function parseTimestamp(raw) {
  const t = Date.parse(raw)
  return Number.isNaN(t) ? null : t
}

// Baris mentah dari tabel `students` -> bentuk yang dipakai algoritma.
export function rowsToStudents(rows) {
  const withIdx = rows.map((r, idx) => ({
    idx,
    id: r.id,
    timestampRaw: r.timestamp_raw ?? '',
    timestamp: r.timestamp_ms === null || r.timestamp_ms === undefined ? null : Number(r.timestamp_ms),
    nama: r.nama,
    kelas: r.kelas ?? '',
    pilihan1: r.pilihan1 ?? '',
    pilihan2: r.pilihan2 ?? '',
    pilihan3: r.pilihan3 ?? '',
  }))

  withIdx.sort((a, b) => {
    if (a.timestamp === null && b.timestamp === null) return a.idx - b.idx
    if (a.timestamp === null) return 1
    if (b.timestamp === null) return -1
    return a.timestamp - b.timestamp || a.idx - b.idx
  })

  return withIdx
}

// capacities: Map/objek nama-klub -> kuota
export function assignClubs(students, capacities) {
  const counts = {}
  const settled = new Map()

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
      const capacity = capacities[club] ?? 0
      const freeSlots = capacity - counts[club]
      if (freeSlots <= 0) return
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

export function toCSV(rows) {
  const header = ['No', 'Nama', 'Kelas', 'Timestamp', 'Pilihan 1', 'Pilihan 2', 'Pilihan 3', 'Klub Final', 'Status']
  const statusLabel = { 0: 'Diterima — Pilihan 1', 1: 'Tergeser ke Pilihan 2', 2: 'Tergeser ke Pilihan 3', '-1': 'Tidak dapat klub' }
  const lines = [header.join(',')]
  rows.forEach((r, i) => {
    const cells = [
      i + 1,
      r.nama,
      r.kelas,
      r.timestampRaw,
      r.pilihan1,
      r.pilihan2,
      r.pilihan3,
      r.assigned ?? '-',
      statusLabel[r.choiceIndex],
    ].map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`)
    lines.push(cells.join(','))
  })
  return lines.join('\n')
}

// Parser untuk teks tempelan (dari Google Sheets: tab-separated) dipakai di
// fitur import massal panel admin.
export function parsePastedRows(text) {
  const lines = text.split('\n').map((l) => l.replace(/\r$/, '')).filter((l) => l.trim() !== '')
  if (lines.length === 0) return []

  const delimiter = lines[0].includes('\t') ? '\t' : ','
  let rows = lines.map((l) => l.split(delimiter).map((c) => c.trim()))

  if (rows[0][0] && /timestamp/i.test(rows[0][0])) {
    rows = rows.slice(1)
  }

  return rows
    .map((cols) => ({
      timestampRaw: cols[0] ?? '',
      timestampMs: parseTimestamp(cols[0] ?? ''),
      nama: cols[1] ?? '',
      kelas: cols[2] ?? '',
      pilihan1: (cols[3] ?? '').trim(),
      pilihan2: (cols[4] ?? '').trim(),
      pilihan3: (cols[5] ?? '').trim(),
    }))
    .filter((r) => r.nama !== '' && r.pilihan1 !== '')
}
