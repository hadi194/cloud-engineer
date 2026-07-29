import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { uploadImage } from '../lib/api'

export default function Upload() {
  const navigate = useNavigate()
  const fileRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    setUploadedUrl(null)
    setError('')
  }

  async function handleUpload() {
    const file = fileRef.current?.files?.[0]
    if (!file) return
    const token = localStorage.getItem('token')
    if (!token) { navigate('/login'); return }

    setLoading(true)
    setError('')
    try {
      const data = await uploadImage(token, file)
      setUploadedUrl(data.url)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/dashboard" className="text-blue-600 hover:underline text-sm">← Dashboard</Link>
        <h1 className="text-2xl font-bold text-gray-800">Upload Image</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-4">
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 transition-colors"
          onClick={() => fileRef.current?.click()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
          {preview ? (
            <img src={preview} alt="preview" className="max-h-48 mx-auto rounded object-contain" />
          ) : (
            <div className="text-gray-400">
              <p className="text-4xl mb-2">📁</p>
              <p className="font-medium">Click to select an image</p>
              <p className="text-sm mt-1">JPG, PNG, GIF, WebP</p>
            </div>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
        )}

        {uploadedUrl && (
          <div className="p-4 bg-green-50 border border-green-200 rounded space-y-2">
            <p className="text-sm font-semibold text-green-800">Uploaded to MinIO!</p>
            <a href={uploadedUrl} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline break-all block">
              {uploadedUrl}
            </a>
            <img src={uploadedUrl} alt="uploaded" className="max-h-40 rounded object-contain" />
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={!preview || loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
        >
          {loading ? 'Uploading...' : 'Upload to MinIO'}
        </button>
      </div>
    </div>
  )
}
