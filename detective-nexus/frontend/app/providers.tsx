'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import { NotificationProvider } from '@/contexts/NotificationContext'
import { ReportsProvider } from '@/contexts/ReportsContext'
import { UserProvider } from '@/contexts/UserContext'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <UserProvider>
        <NotificationProvider>
          <ReportsProvider>
            {children}
          </ReportsProvider>
        </NotificationProvider>
      </UserProvider>
    </QueryClientProvider>
  )
}