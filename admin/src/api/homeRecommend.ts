import { del, get, post, put } from './request'
import type { HomeRecommendGrouped, HomeRecommendItem, HomeRecommendModule } from '@/types/api'

export function fetchHomeRecommends() {
  return get<HomeRecommendGrouped>('/admin/home-recommends')
}

export function createHomeRecommend(data: {
  moduleType: HomeRecommendModule
  targetId: number
  sort: number
  status: number
}) {
  return post<HomeRecommendItem>('/admin/home-recommends', data)
}

export function updateHomeRecommend(id: number, data: { sort: number; status: number }) {
  return put<HomeRecommendItem>(`/admin/home-recommends/${id}`, data)
}

export function removeHomeRecommend(id: number) {
  return del<void>(`/admin/home-recommends/${id}`)
}
