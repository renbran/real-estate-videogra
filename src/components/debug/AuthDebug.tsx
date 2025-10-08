import { useAuth } from '../../hooks/useClientAPI'

export function AuthDebug() {
  const { currentUser, isLoading, error, isProduction } = useAuth()

  return (
    <div className="fixed top-4 right-4 bg-white p-4 rounded-lg shadow-lg border z-50 max-w-sm">
      <h3 className="font-bold text-sm mb-2">Auth Debug</h3>
      <div className="text-xs space-y-1">
        <p><strong>Production:</strong> {isProduction ? 'Yes' : 'No'}</p>
        <p><strong>Loading:</strong> {isLoading ? 'Yes' : 'No'}</p>
        <p><strong>Error:</strong> {error || 'None'}</p>
        <p><strong>User:</strong> {currentUser ? `${currentUser.name} (${currentUser.role})` : 'None'}</p>
        <p><strong>User ID:</strong> {currentUser?.id || 'None'}</p>
      </div>
    </div>
  )
}