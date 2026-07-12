import { get, put } from './request'

export interface AiAssistantConfig {
  welcomeText: string
  suggestQuestions: string[]
  searchHotTags: string[]
}

export function fetchAiAssistantConfig() {
  return get<AiAssistantConfig>('/admin/ai-assistant-config')
}

export function saveAiAssistantConfig(data: AiAssistantConfig) {
  return put<AiAssistantConfig>('/admin/ai-assistant-config', data)
}
