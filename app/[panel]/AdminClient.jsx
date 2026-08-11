'use client'

import { useEffect, useState } from 'react'

function LoginForm({ onLoggedIn }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json.error ?? 'Gagal login.')
      } else {
        onLoggedIn()
      }
    } catch {
      setError('Gagal terhubung ke server.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Panel Pengelola</p>
        <h1 className="mt-1 font-display text-2xl font-bold text-white">Masuk</h1>
        <p className="mt-2 text-sm text-slate-400">Masukkan password untuk mengelola klub, kuota, dan data peserta.</p>

        <input
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Password"
          className="mt-5 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
        />
        {error && <p className="mt-2 text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || !password}
          className="mt-4 w-full rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? 'Memeriksa…' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}

function Toast({ message, kind }) {
  if (!message) return null
  const color = kind === 'error' ? 'bg-red-600' : 'bg-emerald-600'
  return (
    <div className={`fixed bottom-5 right-5 z-50 rounded-lg ${color} px-4 py-2.5 text-sm text-white shadow-xl`}>
      {message}
    </div>
  )
}

function ClubsTab({ notify }) {
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [newName, setNewName] = useState('')
  const [newCapacity, setNewCapacity] = useState(28)
  const [edits, setEdits] = useState({})

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/clubs')
    const json = await res.json()
    setClubs(json.clubs ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const addClub = async (e) => {
    e.preventDefault()
    if (!newName.trim()) return
    const res = await fetch('/api/admin/clubs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), capacity: newCapacity }),
    })
    const json = await res.json()
    if (!res.ok) return notify(json.error ?? 'Gagal menambah klub.', 'error')
    setNewName('')
    setNewCapacity(28)
    notify('Klub ditambahkan.')
    load()
  }

  const saveEdit = async (id) => {
    const edit = edits[id]
    if (!edit) return
    const res = await fetch(`/api/admin/clubs/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edit),
    })
    const json = await res.json()
    if (!res.ok) return notify(json.error ?? 'Gagal menyimpan.', 'error')
    notify('Klub diperbarui.')
    setEdits((e) => { const c = { ...e }; delete c[id]; return c })
    load()
  }

  const removeClub = async (id, name) => {
    if (!confirm(`Hapus klub "${name}"? Peserta yang memilih klub ini tidak akan otomatis terhapus, tapi klub ini tidak akan dianggap sebagai pilihan yang valid lagi.`)) return
    const res = await fetch(`/api/admin/clubs/${id}`, { method: 'DELETE' })
    if (!res.ok) return notify('Gagal menghapus klub.', 'error')
    notify('Klub dihapus.')
    load()
  }

  if (loading) return <p className="text-sm text-slate-400">Memuat…</p>

  return (
    <div>
      <form onSubmit={addClub} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-800 bg-slate-900 p-4">
        <div className="flex-1 min-w-[200px]">
          <label className="text-xs font-medium text-slate-400">Nama klub baru</label>
          <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="mis. ROBOTIK" className="mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none" />
        </div>
        <div>
          <label className="text-xs font-medium text-slate-400">Kuota</label>
          <input type="number" min="0" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} className="mt-1 w-24 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white focus:border-indigo-400 focus:outline-none" />
        </div>
        <button type="submit" className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400">Tambah klub</button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-4 py-3">Nama klub</th>
              <th className="px-4 py-3">Kuota (maks. akhir)</th>
              <th className="px-4 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {clubs.map((c) => {
              const edit = edits[c.id] ?? {}
              return (
                <tr key={c.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-4 py-2.5">
                    <input
                      defaultValue={c.name}
                      onChange={(e) => setEdits((s) => ({ ...s, [c.id]: { ...s[c.id], name: e.target.value } }))}
                      className="w-full rounded-md border border-transparent bg-transparent px-2 py-1 text-slate-100 hover:border-slate-700 focus:border-indigo-400 focus:bg-slate-800 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2.5">
                    <input
                      type="number"
                      min="0"
                      defaultValue={c.capacity}
                      onChange={(e) => setEdits((s) => ({ ...s, [c.id]: { ...s[c.id], capacity: Number(e.target.value) } }))}
                      className="w-24 rounded-md border border-transparent bg-transparent px-2 py-1 text-slate-100 hover:border-slate-700 focus:border-indigo-400 focus:bg-slate-800 focus:outline-none"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => saveEdit(c.id)} disabled={!edits[c.id]} className="mr-2 rounded-md bg-emerald-600/90 px-3 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-30 hover:bg-emerald-500">Simpan</button>
                    <button onClick={() => removeClub(c.id, c.name)} className="rounded-md bg-red-600/90 px-3 py-1 text-xs font-medium text-white hover:bg-red-500">Hapus</button>
                  </td>
                </tr>
              )
            })}
            {clubs.length === 0 && (
              <tr><td colSpan={3} className="px-4 py-6 text-center text-slate-500">Belum ada klub.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function StudentsTab({ notify }) {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [edits, setEdits] = useState({})

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/students')
    const json = await res.json()
    setStudents(json.students ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const saveEdit = async (id) => {
    const edit = edits[id]
    if (!edit) return
    const res = await fetch(`/api/admin/students/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(edit),
    })
    if (!res.ok) return notify('Gagal menyimpan.', 'error')
    notify('Data peserta diperbarui.')
    setEdits((e) => { const c = { ...e }; delete c[id]; return c })
    load()
  }

  const removeStudent = async (id, nama) => {
    if (!confirm(`Hapus data "${nama}"?`)) return
    const res = await fetch(`/api/admin/students/${id}`, { method: 'DELETE' })
    if (!res.ok) return notify('Gagal menghapus.', 'error')
    notify('Peserta dihapus.')
    load()
  }

  const resetAll = async () => {
    if (!confirm('Hapus SEMUA data peserta? Klub tidak ikut terhapus. Aksi ini tidak bisa dibatalkan.')) return
    const res = await fetch('/api/admin/students', { method: 'DELETE' })
    if (!res.ok) return notify('Gagal reset.', 'error')
    notify('Semua data peserta dihapus.')
    load()
  }

  const filtered = students.filter((s) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return s.nama.toLowerCase().includes(q) || (s.kelas ?? '').toLowerCase().includes(q)
  })

  if (loading) return <p className="text-sm text-slate-400">Memuat…</p>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari nama / kelas…"
          className="w-64 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
        />
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">{students.length} peserta total</span>
          <button onClick={resetAll} className="rounded-lg border border-red-800 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-950">Reset semua peserta</button>
        </div>
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl border border-slate-800">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-800 bg-slate-900/60 text-xs uppercase tracking-wide text-slate-400">
              <th className="px-3 py-3">Timestamp</th>
              <th className="px-3 py-3">Nama</th>
              <th className="px-3 py-3">Kelas</th>
              <th className="px-3 py-3">Pilihan 1</th>
              <th className="px-3 py-3">Pilihan 2</th>
              <th className="px-3 py-3">Pilihan 3</th>
              <th className="px-3 py-3 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => {
              const edit = edits[s.id] ?? {}
              const field = (key, width = 'w-full') => (
                <input
                  defaultValue={s[key === 'timestampRaw' ? 'timestamp_raw' : key]}
                  onChange={(e) => setEdits((prev) => ({ ...prev, [s.id]: { ...prev[s.id], [key]: e.target.value } }))}
                  className={`${width} rounded-md border border-transparent bg-transparent px-2 py-1 text-slate-100 hover:border-slate-700 focus:border-indigo-400 focus:bg-slate-800 focus:outline-none`}
                />
              )
              return (
                <tr key={s.id} className="border-b border-slate-800/60 last:border-0">
                  <td className="px-3 py-2 whitespace-nowrap text-xs text-slate-400">{field('timestampRaw', 'w-36')}</td>
                  <td className="px-3 py-2">{field('nama', 'w-36')}</td>
                  <td className="px-3 py-2">{field('kelas', 'w-20')}</td>
                  <td className="px-3 py-2">{field('pilihan1', 'w-40')}</td>
                  <td className="px-3 py-2">{field('pilihan2', 'w-40')}</td>
                  <td className="px-3 py-2">{field('pilihan3', 'w-40')}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">
                    <button onClick={() => saveEdit(s.id)} disabled={!edits[s.id]} className="mr-2 rounded-md bg-emerald-600/90 px-3 py-1 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-30 hover:bg-emerald-500">Simpan</button>
                    <button onClick={() => removeStudent(s.id, s.nama)} className="rounded-md bg-red-600/90 px-3 py-1 text-xs font-medium text-white hover:bg-red-500">Hapus</button>
                  </td>
                </tr>
              )
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-6 text-center text-slate-500">Tidak ada data.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ImportTab({ notify }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)

  const doImport = async (mode) => {
    if (!text.trim()) return
    if (mode === 'replace' && !confirm('Ini akan MENGHAPUS semua data peserta yang ada sekarang lalu menggantinya dengan data yang kamu tempel. Lanjutkan?')) return
    setLoading(true)
    const res = await fetch('/api/admin/students/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, mode }),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) return notify(json.error ?? 'Gagal impor.', 'error')
    notify(`${json.imported} baris berhasil diimpor.`)
    setText('')
  }

  return (
    <div>
      <p className="text-sm text-slate-400">
        Copy data dari Google Sheets (kolom: Timestamp, Nama, Kelas, Pilihan 1, Pilihan 2, Pilihan 3), lalu tempel di bawah ini.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder="Tempel data di sini…"
        className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-xs text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none"
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <button onClick={() => doImport('append')} disabled={loading || !text.trim()} className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:cursor-not-allowed disabled:opacity-40">
          Tambahkan ke data yang ada
        </button>
        <button onClick={() => doImport('replace')} disabled={loading || !text.trim()} className="rounded-lg border border-red-800 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-950 disabled:cursor-not-allowed disabled:opacity-40">
          Ganti semua data (reset dulu)
        </button>
      </div>
    </div>
  )
}

function DatabaseTab({ notify }) {
  const [info, setInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const load = async () => {
    setLoading(true)
    const res = await fetch('/api/admin/database')
    const json = await res.json()
    setInfo(json.info ?? null)
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const run = async (action, confirmMsg) => {
    if (confirmMsg && !confirm(confirmMsg)) return
    setBusy(true)
    const res = await fetch('/api/admin/database', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action }),
    })
    const json = await res.json()
    setBusy(false)
    if (!res.ok) return notify(json.error ?? 'Gagal.', 'error')
    notify(
      action === 'wipe_students'
        ? `Data lama dihapus (${json.deleted} baris) & storage dibebaskan.`
        : 'Storage dibersihkan.'
    )
    load()
  }

  return (
    <div>
      <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <p className="text-sm text-slate-400">
          Menghapus data biasa (tombol "Hapus" / "Reset semua peserta") cuma menandai baris sebagai
          terhapus — di Postgres/Neon baris itu tetap makan storage sampai dibersihkan pakai
          <span className="mx-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-300">VACUUM</span>.
          Pakai tombol di bawah buat beneran membebaskan storage-nya.
        </p>

        {loading ? (
          <p className="mt-4 text-sm text-slate-500">Memuat info database…</p>
        ) : info && (
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs text-slate-500">Peserta</p>
              <p className="mt-1 text-sm font-semibold text-white">{info.students_count} baris</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs text-slate-500">Tabel peserta</p>
              <p className="mt-1 text-sm font-semibold text-white">{info.students_size}</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs text-slate-500">Klub</p>
              <p className="mt-1 text-sm font-semibold text-white">{info.clubs_count} baris</p>
            </div>
            <div className="rounded-lg border border-slate-800 bg-slate-950 p-3">
              <p className="text-xs text-slate-500">Total database</p>
              <p className="mt-1 text-sm font-semibold text-white">{info.database_size}</p>
            </div>
          </div>
        )}

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            disabled={busy}
            onClick={() => run('wipe_students', 'Hapus SEMUA data peserta secara PERMANEN dan bebaskan storage-nya? Klub tidak ikut terhapus. Aksi ini tidak bisa dibatalkan — pastikan sudah unduh CSV kalau perlu.')}
            className="rounded-lg bg-red-600/90 px-4 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Memproses…' : 'Hapus data peserta lama & bebaskan storage'}
          </button>
          <button
            disabled={busy}
            onClick={() => run('vacuum')}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? 'Memproses…' : 'Bersihkan sisa storage (VACUUM)'}
          </button>
        </div>
      </div>
    </div>
  )
}

const TABS = [
  { key: 'clubs', label: 'Klub & Kuota' },
  { key: 'students', label: 'Peserta' },
  { key: 'import', label: 'Import massal' },
  { key: 'database', label: 'Database' },
]

export default function AdminClient() {
  const [checking, setChecking] = useState(true)
  const [authed, setAuthed] = useState(false)
  const [tab, setTab] = useState('clubs')
  const [toast, setToast] = useState(null)

  useEffect(() => {
    fetch('/api/admin/me')
      .then((r) => r.json())
      .then((json) => setAuthed(!!json.authed))
      .finally(() => setChecking(false))
  }, [])

  const notify = (message, kind = 'success') => {
    setToast({ message, kind })
    setTimeout(() => setToast(null), 3000)
  }

  const logout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    setAuthed(false)
  }

  if (checking) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-400">Memeriksa sesi…</div>
  }

  if (!authed) {
    return <LoginForm onLoggedIn={() => setAuthed(true)} />
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">Panel Pengelola</p>
            <h1 className="mt-1 font-display text-2xl font-bold text-white">Kelola Seleksi Klub</h1>
          </div>
          <div className="flex gap-2">
            <a href="/api/export" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">Unduh CSV hasil</a>
            <a href="/" className="rounded-lg border border-slate-700 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800">Lihat halaman publik</a>
            <button onClick={logout} className="rounded-lg bg-slate-800 px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-700">Keluar</button>
          </div>
        </header>

        <nav className="mt-6 flex gap-1 border-b border-slate-800">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
                tab === t.key ? 'border-indigo-400 text-white' : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>

        <div className="mt-6">
          {tab === 'clubs' && <ClubsTab notify={notify} />}
          {tab === 'students' && <StudentsTab notify={notify} />}
          {tab === 'import' && <ImportTab notify={notify} />}
          {tab === 'database' && <DatabaseTab notify={notify} />}
        </div>
      </div>
      <Toast message={toast?.message} kind={toast?.kind} />
    </div>
  )
}
