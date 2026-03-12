import { useState, useEffect, useCallback } from 'react'
import { getChatUnreadCount } from '../services/api'

const POLL_INTERVAL = 30_000

export default function useTotalUnread() {
  const [count, setCount] = useState(0)

  const refresh = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken')
      if (!token) { setCount(0); return }
      const res = await getChatUnreadCount()
      if (res?.success) setCount(res.count ?? 0)
    } catch {
      /* ignore */
    }
  }, [])

  useEffect(() => {
    refresh()
    const id = setInterval(refresh, POLL_INTERVAL)
    return () => clearInterval(id)
  }, [refresh])

  return { unreadChatCount: count, refreshUnread: refresh }
}
