import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ApiRepo } from '@shared/types'
import { fetchRepos } from '../api/repos'

type LoadState = 'loading' | 'success' | 'error'

interface UseReposResult {
  repos: ApiRepo[]
  state: LoadState
  errorMessage: string | null
  page: number
  totalPages: number
  setPage: (page: number) => void
  pagedRepos: ApiRepo[]
}

const PAGE_SIZE = 20

export function useRepos(): UseReposResult {
  const navigate = useNavigate()
  const [repos, setRepos] = useState<ApiRepo[]>([])
  const [state, setState] = useState<LoadState>('loading')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [page, setPage] = useState(1)

  useEffect(() => {
    async function load() {
      const result = await fetchRepos()
      if (result.success && result.data) {
        setRepos(result.data)
        setState('success')
      } else {
        if (result.error?.toLowerCase().includes('401') || result.error?.toLowerCase().includes('unauthorized')) {
          navigate('/')
          return
        }
        setErrorMessage(result.error ?? 'Failed to load repos')
        setState('error')
      }
    }
    load()
  }, [navigate])

  const totalPages = Math.ceil(repos.length / PAGE_SIZE)
  const pagedRepos = repos.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  return { repos, state, errorMessage, page, totalPages, setPage, pagedRepos }
}
