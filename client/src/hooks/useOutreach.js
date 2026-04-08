import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '../lib/api'

export function useOutreach(params = {}) {
  return useQuery({
    queryKey: ['outreach', params],
    queryFn: () => api.getOutreach(params),
  })
}

export function useCreateOutreach() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data) => api.createOutreach(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outreach'] }),
  })
}

export function useUpdateOutreach() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }) => api.updateOutreach(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outreach'] }),
  })
}
