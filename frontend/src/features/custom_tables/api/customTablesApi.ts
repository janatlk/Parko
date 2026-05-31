import { http } from '@shared/api/http'

export type ColumnType = 'text' | 'number' | 'price' | 'date' | 'select' | 'checkbox' | 'file'

export type ColumnSchema = {
  name: string
  type: ColumnType
  required?: boolean
  options?: string[]
}

export type CustomTable = {
  id: number
  name: string
  description: string
  icon: string
  schema: { columns: ColumnSchema[] }
  record_count: number
  created_at: string
  updated_at: string
}

export type CustomTablePayload = {
  name: string
  description?: string
  icon?: string
  schema: { columns: ColumnSchema[] }
}

export type CustomRecord = {
  id: number
  table: number
  car: number | null
  car_numplate?: string
  car_brand?: string
  car_title?: string
  data: Record<string, unknown>
  created_at: string
  updated_at: string
}

export type CustomRecordPayload = {
  table: number
  car?: number | null
  data: Record<string, unknown>
}

export async function getCustomTables(): Promise<CustomTable[]> {
  const { data } = await http.get<{ results: CustomTable[] }>('custom-tables/tables/')
  return data.results || []
}

export async function getCustomTable(id: number): Promise<CustomTable> {
  const { data } = await http.get<CustomTable>(`custom-tables/tables/${id}/`)
  return data
}

export async function createCustomTable(payload: CustomTablePayload): Promise<CustomTable> {
  const { data } = await http.post<CustomTable>('custom-tables/tables/', payload)
  return data
}

export async function updateCustomTable(id: number, payload: CustomTablePayload): Promise<CustomTable> {
  const { data } = await http.patch<CustomTable>(`custom-tables/tables/${id}/`, payload)
  return data
}

export async function deleteCustomTable(id: number): Promise<void> {
  await http.delete(`custom-tables/tables/${id}/`)
}

export async function getCustomRecords(tableId: number): Promise<CustomRecord[]> {
  const { data } = await http.get<{ results: CustomRecord[] }>('custom-tables/records/', { params: { table: tableId } })
  return data.results || []
}

export async function createCustomRecord(payload: CustomRecordPayload): Promise<CustomRecord> {
  const { data } = await http.post<CustomRecord>('custom-tables/records/', payload)
  return data
}

export async function updateCustomRecord(id: number, payload: CustomRecordPayload): Promise<CustomRecord> {
  const { data } = await http.patch<CustomRecord>(`custom-tables/records/${id}/`, payload)
  return data
}

export async function deleteCustomRecord(id: number): Promise<void> {
  await http.delete(`custom-tables/records/${id}/`)
}
