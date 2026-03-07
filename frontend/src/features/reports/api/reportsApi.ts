import { http } from '@shared/api/http'
import type { PaginatedResponse } from '@shared/api/types'

// Types
export type ReportType =
  | 'fuel_consumption'
  | 'maintenance_costs'
  | 'insurance_inspection'
  | 'vehicle_utilization'
  | 'cost_analysis'

export type ChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'area'

export interface ChartDataset {
  label: string
  data: (number | null)[]
  backgroundColor?: string | string[]
  borderColor?: string
  tension?: number
}

export interface ChartData {
  type: ChartType
  title: string
  data: {
    labels?: string[]
    datasets?: ChartDataset[]
    data?: (number | null)[]
    backgroundColor?: string[]
  }
}

export interface ReportSummary {
  [key: string]: number | string
}

export interface GenerateReportParams {
  report_type: ReportType
  from_date: string
  to_date: string
  car_ids?: number[] | null
  filters?: Record<string, unknown>
  export_format?: 'json' | 'csv' | 'xlsx'
  include_charts?: boolean
  save_report?: boolean
  report_name?: string
}

export interface ReportResponse {
  report_type: ReportType
  from_date: string
  to_date: string
  data: Record<string, unknown>[]
  summary: ReportSummary
  charts?: ChartData[]
}

export interface SavedReport {
  id: number
  name: string
  report_type: ReportType
  from_date: string
  to_date: string
  car_ids: number[] | null
  filters: Record<string, unknown>
  summary: ReportSummary
  created_by: number
  created_by_name: string
  company: number
  company_name: string
  created_at: string
  updated_at: string
}

export interface SavedReportList {
  id: number
  name: string
  report_type: ReportType
  from_date: string
  to_date: string
  summary: ReportSummary
  created_by_name: string
  created_at: string
}

export interface ReportTemplate {
  id: number
  name: string
  description: string
  report_type: ReportType
  default_from_date: string
  default_to_date: string
  default_car_ids: number[] | null
  default_filters: Record<string, unknown>
  show_charts: boolean
  chart_types: ChartType[]
  show_totals: boolean
  is_public: boolean
  created_by: number
  created_by_name: string
  company: number
  company_name: string
  created_at: string
  updated_at: string
}

// API Functions

/**
 * Generate a new report
 */
export async function generateReport(params: GenerateReportParams): Promise<ReportResponse> {
  console.log('[reportsApi] Calling generateReport with params:', params)
  try {
    const response = await http.post<ReportResponse>('generate/', params)
    console.log('[reportsApi] Raw response:', response)
    console.log('[reportsApi] Response data:', response.data)
    return response.data
  } catch (error) {
    console.error('[reportsApi] Error generating report:', error)
    console.error('[reportsApi] Error response:', (error as any).response)
    throw error
  }
}

/**
 * Generate and download report in specific format
 */
export async function downloadReport(params: GenerateReportParams, format: 'csv' | 'xlsx'): Promise<Blob> {
  const response = await http.post(`generate/`, params, {
    responseType: 'blob',
    params: {
      export_format: format,
    },
  })
  return response.data as Blob
}

/**
 * Get list of saved reports
 */
export async function getSavedReports(): Promise<SavedReportList[]> {
  try {
    const response = await http.get<PaginatedResponse<SavedReportList>>('saved/')
    return response.data?.results || []
  } catch (error) {
    console.error('Error fetching saved reports:', error)
    return []
  }
}

/**
 * Get single saved report
 */
export async function getSavedReport(id: number): Promise<SavedReport> {
  const { data } = await http.get<SavedReport>(`saved/${id}/`)
  return data
}

/**
 * Get full data for a saved report
 */
export async function getSavedReportData(id: number): Promise<ReportResponse> {
  const response = await http.get<ReportResponse>(`saved/${id}/data/`)
  // StandardJSONRenderer wraps with {"status": "success", "data": report_data}
  // Axios interceptor unwraps it, so response.data is the report_data
  return response.data
}

/**
 * Create a new saved report
 */
export async function createSavedReport(payload: {
  name: string
  report_type: ReportType
  from_date: string
  to_date: string
  car_ids: number[] | null
  filters: Record<string, unknown>
  summary: ReportSummary
}): Promise<SavedReport> {
  const { data } = await http.post<SavedReport>('saved/', payload)
  return data
}

/**
 * Update a saved report
 */
export async function updateSavedReport(
  id: number,
  payload: Partial<{
    name: string
    filters: Record<string, unknown>
  }>,
): Promise<SavedReport> {
  const { data } = await http.patch<SavedReport>(`saved/${id}/`, payload)
  return data
}

/**
 * Delete a saved report
 */
export async function deleteSavedReport(id: number): Promise<void> {
  await http.delete(`saved/${id}/`)
}

/**
 * Export saved report in specific format
 */
export async function exportSavedReport(id: number, format: 'json' | 'csv' | 'xlsx'): Promise<Blob | ReportResponse> {
  if (format === 'json') {
    const { data } = await http.get<ReportResponse>(`saved/${id}/export/`)
    return data
  }
  
  const response = await http.get(`saved/${id}/export/`, {
    responseType: 'blob',
    params: { format },
  })
  return response.data as Blob
}

/**
 * Get list of report templates
 */
export async function getReportTemplates(): Promise<ReportTemplate[]> {
  const { data } = await http.get<ReportTemplate[]>('templates/')
  return data
}

/**
 * Create a new report template
 */
export async function createReportTemplate(payload: {
  name: string
  description?: string
  report_type: ReportType
  default_from_date: string
  default_to_date: string
  default_car_ids?: number[] | null
  default_filters?: Record<string, unknown>
  show_charts?: boolean
  chart_types?: ChartType[]
  is_public?: boolean
}): Promise<ReportTemplate> {
  const { data } = await http.post<ReportTemplate>('templates/', payload)
  return data
}

/**
 * Update a report template
 */
export async function updateReportTemplate(
  id: number,
  payload: Partial<ReportTemplate>,
): Promise<ReportTemplate> {
  const { data } = await http.patch<ReportTemplate>(`templates/${id}/`, payload)
  return data
}

/**
 * Delete a report template
 */
export async function deleteReportTemplate(id: number): Promise<void> {
  await http.delete(`templates/${id}/`)
}

// Legacy function for backward compatibility
export type MaintenanceCostsParams = {
  from?: string
  to?: string
  car?: number
}

export type MaintenanceCostsReport = {
  filters: {
    from: string | null
    to: string | null
    car: number | null
  }
  totals: {
    part_total: number
    job_total: number
    total: number
  }
  by_car: Array<{
    car_id: number
    car__numplate: string
    part_total: number
    job_total: number
    total: number
  }>
}

export async function getMaintenanceCostsReport(
  params: MaintenanceCostsParams = {},
): Promise<MaintenanceCostsReport> {
  const { data } = await http.get<MaintenanceCostsReport>('maintenance-costs/', {
    params: {
      from: params.from,
      to: params.to,
      car: params.car,
    },
  })
  return data
}
