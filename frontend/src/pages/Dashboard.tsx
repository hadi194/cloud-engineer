import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { fetchUsers } from '../lib/api'

interface User {
  id: number
  name: string
  email: string
  role: string
  created_at: string
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentUser, setCurrentUser] = useState<{ name: string } | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('token')
    const stored = localStorage.getItem('user')
    if (!token) { navigate('/login'); return }
    if (stored) setCurrentUser(JSON.parse(stored))

    fetchUsers(token)
      .then((data) => setUsers(data.users ?? []))
      .catch((err) => {
        if (err.message.includes('401') || err.message.includes('Unauthorized')) {
          localStorage.clear()
          navigate('/login')
        } else {
          setError(err.message)
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  function logout() {
    localStorage.clear()
    navigate('/login')
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Users</h1>
          {currentUser && <p className="text-sm text-gray-500">Logged in as {currentUser.name}</p>}
        </div>
        <div className="flex gap-3">
          <Link
            to="/upload"
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm font-medium transition-colors"
          >
            Upload Image
          </Link>
          <button
            onClick={logout}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded text-sm">{error}</div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {['ID', 'Name', 'Email', 'Role', 'Created At'].map((h) => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">Loading...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-400">No users found</td></tr>
            ) : users.map((u) => (
              <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4 text-sm text-gray-400">{u.id}</td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">{u.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                    u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-700'
                  }`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400">
                  {new Date(u.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
