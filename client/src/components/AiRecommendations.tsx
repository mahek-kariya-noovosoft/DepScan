interface AiRecommendationsProps {
  recommendation?: string
}

export function AiRecommendations({ recommendation }: AiRecommendationsProps) {
  const hasContent = recommendation && recommendation.trim().length > 0

  return (
    <div className="rounded-xl border border-gray-700/50 bg-gray-800/50 p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
          <svg
            className="h-5 w-5 text-purple-400"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-200">
          AI Recommendations
        </h3>
        {!hasContent && (
          <span className="ml-auto rounded-full bg-gray-700/50 px-3 py-1 text-xs text-gray-500">
            Coming Soon
          </span>
        )}
      </div>

      {hasContent ? (
        <p className="text-sm leading-relaxed text-gray-300 whitespace-pre-line">
          {recommendation}
        </p>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-700 bg-gray-900/30 p-8 text-center">
          <svg
            className="mx-auto h-8 w-8 text-gray-600 mb-3"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z"
            />
          </svg>
          <p className="text-sm text-gray-500">
            AI-powered recommendations coming soon
          </p>
          <p className="mt-1 text-xs text-gray-600">
            Requires Anthropic API key
          </p>
        </div>
      )}
    </div>
  )
}
