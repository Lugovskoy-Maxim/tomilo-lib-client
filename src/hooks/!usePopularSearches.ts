"use client"

import { getPopularSearches, PopularSearchesResult } from "@/api/!popularSearches"
import { useEffect, useState } from "react"

export function usePopularSearches() {
  const [popularSearches, setPopularSearches] = useState<PopularSearchesResult[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchPopularSearches = async () => {
      try {
        setLoading(true)
        const result = await getPopularSearches()
        setPopularSearches(result)
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'))
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchPopularSearches()
  }, [])

  return { popularSearches, loading, error }
}