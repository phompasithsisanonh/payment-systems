import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'

export function useWalletBalance(intervalMs = 10000) {
  const [balance, setBalance]   = useState(null)
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)

  const fetch = useCallback(async () => {
    try {
      const res = await api.get('/wallet')
      setBalance(res.data.data)
      setLastUpdate(new Date())
      setError(null)
    } catch (err) {
      setError('ดึงข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetch() // โหลดครั้งแรก
    const timer = setInterval(fetch, intervalMs) // poll ทุก 10 วินาที
    return () => clearInterval(timer)
  }, [fetch, intervalMs])

  return { balance, loading, error, lastUpdate, refresh: fetch }
}