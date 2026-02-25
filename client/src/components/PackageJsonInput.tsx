import { useState, useRef, useCallback, type DragEvent, type ChangeEvent } from 'react'

const PLACEHOLDER = `{
  "name": "my-app",
  "dependencies": {
    "express": "^4.18.2",
    "lodash": "^4.17.21"
  },
  "devDependencies": {
    "typescript": "^5.3.3"
  }
}`

interface PackageJsonInputProps {
  onSubmit: (content: string) => void
  disabled: boolean
}

export function PackageJsonInput({ onSubmit, disabled }: PackageJsonInputProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isDragOver, setIsDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const validate = useCallback((text: string): string | null => {
    if (!text.trim()) return null

    try {
      const parsed = JSON.parse(text)
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
        return 'Must be a JSON object'
      }
      if (!parsed.dependencies && !parsed.devDependencies) {
        return 'No dependencies or devDependencies found'
      }
      return null
    } catch {
      return 'Invalid JSON — check for syntax errors'
    }
  }, [])

  const handleChange = useCallback(
    (text: string) => {
      setContent(text)
      setError(validate(text))
    },
    [validate],
  )

  const handleFileRead = useCallback(
    (file: File) => {
      if (file.size > 512_000) {
        setError('File too large (max 500KB)')
        return
      }

      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result
        if (typeof text === 'string') {
          handleChange(text)
        }
      }
      reader.readAsText(file)
    },
    [handleChange],
  )

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault()
      setIsDragOver(false)
      const file = event.dataTransfer.files[0]
      if (file) handleFileRead(file)
    },
    [handleFileRead],
  )

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (file) handleFileRead(file)
    },
    [handleFileRead],
  )

  const isValid = content.trim().length > 0 && error === null

  return (
    <div className="space-y-4">
      <div
        className={`
          relative rounded-xl border-2 transition-colors duration-200
          ${isDragOver ? 'border-emerald-400 bg-emerald-400/5' : 'border-gray-700 hover:border-gray-600'}
          ${error ? 'border-red-500/60' : ''}
        `}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragOver(true)
        }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
      >
        <textarea
          value={content}
          onChange={(event) => handleChange(event.target.value)}
          placeholder={PLACEHOLDER}
          disabled={disabled}
          spellCheck={false}
          className={`
            w-full h-64 bg-transparent text-gray-100 placeholder-gray-600
            font-mono text-sm leading-relaxed p-4 resize-none
            focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />

        {!content && (
          <div className="absolute bottom-3 left-0 right-0 flex items-center justify-center">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1.5"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
                />
              </svg>
              or drop a package.json file
            </button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {error && (
        <p className="text-red-400 text-sm flex items-center gap-1.5">
          <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          {error}
        </p>
      )}

      <button
        onClick={() => onSubmit(content)}
        disabled={!isValid || disabled}
        className={`
          w-full py-3 px-6 rounded-xl font-semibold text-sm tracking-wide
          transition-all duration-200 cursor-pointer
          ${
            isValid && !disabled
              ? 'bg-emerald-500 hover:bg-emerald-400 text-gray-950 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-400/30'
              : 'bg-gray-800 text-gray-500 cursor-not-allowed'
          }
        `}
      >
        Scan Dependencies
      </button>
    </div>
  )
}
