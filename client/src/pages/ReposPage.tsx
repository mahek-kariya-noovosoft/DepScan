import { useRepos } from '../hooks/useRepos'
import { RepoCard } from '../components/RepoCard'

function LoadingSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="bg-gray-800/40 border border-gray-700/50 rounded-xl p-5 h-36 animate-pulse" />
      ))}
    </div>
  )
}

function Pagination({ page, totalPages, setPage }: { page: number; totalPages: number; setPage: (p: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-center gap-3 mt-8">
      <button onClick={() => setPage(page - 1)} disabled={page === 1} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm disabled:opacity-40 hover:bg-gray-700 transition-colors">
        Previous
      </button>
      <span className="text-gray-500 text-sm">Page {page} of {totalPages}</span>
      <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="px-4 py-2 rounded-lg bg-gray-800 text-gray-300 text-sm disabled:opacity-40 hover:bg-gray-700 transition-colors">
        Next
      </button>
    </div>
  )
}

export function ReposPage() {
  const { repos, state, errorMessage, page, totalPages, setPage, pagedRepos } = useRepos()

  return (
    <div className="min-h-screen px-4 py-12 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-50 mb-2">Your Repositories</h1>
      <p className="text-gray-400 text-sm mb-8">Select a repository to scan its dependencies.</p>

      {state === 'loading' && <LoadingSkeleton />}

      {state === 'error' && (
        <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
          Failed to load repos{errorMessage ? `: ${errorMessage}` : ''}
        </div>
      )}

      {state === 'success' && repos.length === 0 && (
        <div className="text-center py-20 text-gray-500">No repos found</div>
      )}

      {state === 'success' && repos.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pagedRepos.map((repo) => (
              <RepoCard key={repo.id} repo={repo} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} setPage={setPage} />
        </>
      )}
    </div>
  )
}
