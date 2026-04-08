import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useTriggers(params = {}) {
  return useQuery({
    queryKey: ['triggers', params],
    queryFn: () => api.getTriggers(params),
    refetchInterval: 15_000,
  })
}

export function useCreateTrigger() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.createTrigger(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['triggers'] })
      qc.invalidateQueries({ queryKey: ['companies'] })
    },
  })
}
