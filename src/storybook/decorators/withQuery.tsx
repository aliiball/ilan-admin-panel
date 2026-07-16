import type { Decorator } from '@storybook/react-vite'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

/**
 * Story'leri TanStack Query context'i ile sarmalar.
 *
 * Bu olmadan `useQuery()` veya `useMutation()` kullanan component'ler
 * "No QueryClient set" hatası verir.
 *
 * Her story için YENİ bir QueryClient üretilir. Paylaşılan tek bir client
 * kullanılsaydı bir story'nin cache'i diğerine sızar ve story'ler birbirinden
 * etkilenirdi — sıralamaya göre değişen, teşhisi zor testler doğardı.
 *
 * Storybook'ta gerçek sunucu olmadığı için `retry` kapalıdır; açık olsaydı
 * başarısız her istek arka planda tekrar tekrar denenip testleri yavaşlatırdı.
 */
export const withQuery: Decorator = (Story) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
      },
      mutations: {
        retry: false,
      },
    },
  })

  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  )
}
