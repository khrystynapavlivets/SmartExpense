import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { expensesApi } from '../api/expenses'

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  const handleFile = (f: File) => {
    setFile(f)
    setError('')
    if (f.type.startsWith('image/')) {
      setPreview(URL.createObjectURL(f))
    } else {
      setPreview(null)
    }
  }

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  const onSubmit = async () => {
    if (!file) return
    setLoading(true)
    setError('')
    try {
      const expense = await expensesApi.upload(file)
      navigate(`/expenses/${expense.id}`)
    } catch (e: any) {
      setError(e.response?.data?.detail ?? 'Помилка завантаження')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto space-y-6">
      <h1 className="text-2xl font-semibold text-gray-900">Завантажити чек</h1>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-colors ${
          dragging ? 'border-indigo-400 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {preview ? (
          <img src={preview} alt="preview" className="max-h-48 mx-auto rounded-lg object-contain" />
        ) : (
          <>
            <div className="text-4xl mb-3">📄</div>
            <p className="text-sm text-gray-600">Перетягніть файл або натисніть</p>
            <p className="text-xs text-gray-400 mt-1">JPEG, PNG, WEBP, PDF — до 10 MB</p>
          </>
        )}
      </div>

      {file && (
        <div className="bg-gray-50 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">📎</span>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{file.name}</p>
            <p className="text-xs text-gray-400">{(file.size / 1024).toFixed(0)} KB</p>
          </div>
          <button onClick={() => { setFile(null); setPreview(null) }} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <button
        onClick={onSubmit}
        disabled={!file || loading}
        className="w-full bg-indigo-600 text-white py-3 rounded-xl font-medium hover:bg-indigo-700 disabled:opacity-40 transition-colors"
      >
        {loading ? '⏳ Розпізнаємо...' : 'Розпізнати та зберегти'}
      </button>
    </div>
  )
}
