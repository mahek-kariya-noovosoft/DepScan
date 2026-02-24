import type { DependencyResult } from '@shared/types/index'

export async function getAiRecommendation(_results: DependencyResult[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    return 'AI-powered recommendations coming soon. Connect your Anthropic API key to get personalized dependency upgrade advice.'
  }

  // TODO: Implement Claude API call when API key is available
  return 'AI-powered recommendations coming soon. Connect your Anthropic API key to get personalized dependency upgrade advice.'
}
