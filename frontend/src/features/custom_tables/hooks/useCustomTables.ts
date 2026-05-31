import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  getCustomTables,
  getCustomTable,
  createCustomTable,
  updateCustomTable,
  deleteCustomTable,
  getCustomRecords,
  createCustomRecord,
  updateCustomRecord,
  deleteCustomRecord,
  type CustomTablePayload,
  type CustomRecordPayload,
} from '../api/customTablesApi'

export function useCustomTables() {
  return useQuery({
    queryKey: ['customTables', 'list'],
    queryFn: getCustomTables,
    staleTime: 60_000,
  })
}

export function useCustomTable(id: number) {
  return useQuery({
    queryKey: ['customTables', 'detail', id],
    queryFn: () => getCustomTable(id),
    enabled: !!id,
    staleTime: 60_000,
  })
}

export function useCreateCustomTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCustomTable,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customTables', 'list'] }),
  })
}

export function useUpdateCustomTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CustomTablePayload }) => updateCustomTable(id, payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['customTables', 'list'] })
      qc.invalidateQueries({ queryKey: ['customTables', 'detail', vars.id] })
    },
  })
}

export function useDeleteCustomTable() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCustomTable,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customTables', 'list'] }),
  })
}

export function useCustomRecords(tableId: number) {
  return useQuery({
    queryKey: ['customTables', 'records', tableId],
    queryFn: () => getCustomRecords(tableId),
    enabled: !!tableId,
    staleTime: 60_000,
  })
}

export function useCreateCustomRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: createCustomRecord,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customTables', 'records'] }),
  })
}

export function useUpdateCustomRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CustomRecordPayload }) => updateCustomRecord(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customTables', 'records'] }),
  })
}

export function useDeleteCustomRecord() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: deleteCustomRecord,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['customTables', 'records'] }),
  })
}
