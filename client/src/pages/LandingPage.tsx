import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PackageJsonInput } from '../components/PackageJsonInput'
import { LoadingState } from '../components/LoadingState'
import { analyzePackageJson } from '../api/analyze'

type PageState = 'idle' | 'loading' | 'error'

export function LandingPage() {
  const navigate = useNavigate()
  const [pageState, setPageState] = useState<PageState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const handleSubmit = async (content: string) => {
    setPageState('loading')
    setErrorMessage(null)

    const result = await analyzePackageJson(content)

    if (result.success && result.data) {
      navigate('/dashboard', { state: { analysis: result.data } })
    } else {
      setPageState('error')
      setErrorMessage(result.error ?? 'Analysis failed. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-3xl">
        {/* Hero */}
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-tight text-gray-50 mb-3">
            Dep
            <span className="text-emerald-400">Scan</span>
          </h1>
          <p className="text-lg text-gray-400">
            Know Your Dependency Risk
          </p>
        </div>

        {/* Description */}
        <p className="text-center text-sm text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
          Paste your <code className="text-gray-400 bg-gray-800/60 px-1.5 py-0.5 rounded text-xs">package.json</code> below
          and get an instant risk analysis of every dependency — staleness, vulnerabilities,
          bus factor, license issues, and more.
        </p>

        {pageState === 'loading' ? (
          <LoadingState />
        ) : (
          <>
            <PackageJsonInput onSubmit={handleSubmit} disabled={false} />

            {pageState === 'error' && errorMessage && (
              <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                <p className="text-red-400 text-sm flex items-center gap-2">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                  </svg>
                  {errorMessage}
                </p>
                <button
                  onClick={() => {
                    setPageState('idle')
                    setErrorMessage(null)
                  }}
                  className="mt-3 text-xs text-gray-400 hover:text-gray-200 underline underline-offset-2 transition-colors"
                >
                  Try again
                </button>
              </div>
            )}
          </>
        )}

        {/* Footer hint */}
        <p className="text-center text-xs text-gray-600 mt-12">
          Analyzes up to 50 dependencies per scan
        </p>
      </div>
    </div>
  )
}
