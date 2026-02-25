import { useState, useEffect } from 'react'

interface Step {
  label: string
  duration: number
}

const STEPS: Step[] = [
  { label: 'Parsing dependencies...', duration: 1200 },
  { label: 'Fetching package data...', duration: 2400 },
  { label: 'Calculating risk scores...', duration: 1800 },
]

export function LoadingState() {
  const [activeStep, setActiveStep] = useState(0)

  useEffect(() => {
    if (activeStep >= STEPS.length) return

    const timer = setTimeout(() => {
      setActiveStep((prev) => prev + 1)
    }, STEPS[activeStep].duration)

    return () => clearTimeout(timer)
  }, [activeStep])

  return (
    <div className="w-full max-w-md mx-auto py-12">
      <div className="space-y-4">
        {STEPS.map((step, index) => {
          const isCompleted = index < activeStep
          const isActive = index === activeStep

          return (
            <div
              key={step.label}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-500
                ${isActive ? 'bg-gray-800/80 shadow-lg shadow-emerald-500/5' : ''}
                ${isCompleted ? 'bg-gray-800/40' : ''}
                ${!isActive && !isCompleted ? 'opacity-40' : ''}
              `}
            >
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isCompleted ? (
                  <svg
                    className="w-5 h-5 text-emerald-400 animate-fade-in"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : isActive ? (
                  <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <div className="w-5 h-5 border-2 border-gray-600 rounded-full" />
                )}
              </div>
              <span
                className={`text-sm font-medium transition-colors duration-300 ${
                  isCompleted
                    ? 'text-gray-400'
                    : isActive
                      ? 'text-gray-100'
                      : 'text-gray-500'
                }`}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
