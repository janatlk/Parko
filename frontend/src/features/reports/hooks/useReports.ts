import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import {
  generateReport,
  getSavedReports,
  getSavedReport,
  getSavedReportData,
  createSavedReport,
  updateSavedReport,
  deleteSavedReport,
  exportSavedReport,
  getReportTemplates,
  createReportTemplate,
  updateReportTemplate,
  deleteReportTemplate,
  getExportHistory,
  deleteExportLog,
  type GenerateReportParams,
  type ReportResponse,
  type SavedReport,
  type SavedReportList,
  type ReportTemplate,
  type ReportType,
  type ChartType,
  type ReportSummary,
  type ExportLog,
} from '../api/reportsApi'

/**
 * Query keys factory for reports
 */
export const reportsKeys = {
  all: ['reports'] as const,
  generated: (params: GenerateReportParams) => ['reports', 'generated', params] as const,
  saved: {
    all: ['reports', 'saved'] as const,
    list: () => ['reports', 'saved', 'list'] as const,
    detail: (id: number) => ['reports', 'saved', 'detail', id] as const,
    data: (id: number) => ['reports', 'saved', 'data', id] as const,
  },
  templates: {
    all: ['reports', 'templates'] as const,
    list: () => ['reports', 'templates', 'list'] as const,
  },
  exportHistory: {
    all: ['reports', 'export-history'] as const,
    list: () => ['reports', 'export-history', 'list'] as const,
  },
}

/**
 * Hook for generating reports
 */
export function useGenerateReport() {
  return useMutation<ReportResponse, Error, GenerateReportParams>({
    mutationFn: generateReport,
  })
}

/**
 * Hook for getting list of saved reports
 */
export function useSavedReportsQuery() {
  return useQuery<SavedReportList[]>({
    queryKey: reportsKeys.saved.list(),
    queryFn: getSavedReports,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    select: (data) => data || [],
  })
}

/**
 * Hook for getting single saved report
 */
export function useSavedReportQuery(id: number) {
  return useQuery<SavedReport>({
    queryKey: reportsKeys.saved.detail(id),
    queryFn: () => getSavedReport(id),
    enabled: !!id,
  })
}

/**
 * Hook for getting full data of a saved report
 */
export function useSavedReportDataQuery(id: number | null) {
  return useQuery<ReportResponse>({
    queryKey: reportsKeys.saved.data(id || 0),
    queryFn: () => getSavedReportData(id as number),
    enabled: !!id,
    retry: false,
  })
}

/**
 * Hook for creating a saved report
 */
export function useCreateSavedReport() {
  const qc = useQueryClient()
  return useMutation<SavedReport, Error, {
    name: string
    report_type: ReportType
    from_date: string
    to_date: string
    car_ids: number[] | null
    filters: Record<string, unknown>
    summary: ReportSummary
  }>({
    mutationFn: createSavedReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportsKeys.saved.all })
    },
  })
}

/**
 * Hook for updating a saved report
 */
export function useUpdateSavedReport() {
  const qc = useQueryClient()
  return useMutation<SavedReport, Error, {
    id: number
    payload: Partial<{ name: string; filters: Record<string, unknown> }>
  }>({
    mutationFn: ({ id, payload }) => updateSavedReport(id, payload),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: reportsKeys.saved.detail(id) })
      qc.invalidateQueries({ queryKey: reportsKeys.saved.all })
    },
  })
}

/**
 * Hook for deleting a saved report
 */
export function useDeleteSavedReport() {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: deleteSavedReport,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportsKeys.saved.all })
    },
  })
}

/**
 * Hook for exporting a saved report
 */
export function useExportSavedReport() {
  return useMutation<Blob, Error, { id: number; format: 'json' | 'csv' | 'xlsx' | 'pdf' }>({
    mutationFn: ({ id, format }) => exportSavedReport(id, format),
  })
}

/**
 * Hook for getting export history
 */
export function useExportHistoryQuery() {
  return useQuery<ExportLog[]>({
    queryKey: reportsKeys.exportHistory.list(),
    queryFn: getExportHistory,
    retry: false,
    staleTime: 2 * 60 * 1000, // 2 minutes
  })
}

/**
 * Hook for deleting an export log entry
 */
export function useDeleteExportLog() {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: deleteExportLog,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportsKeys.exportHistory.all })
    },
  })
}

/**
 * Hook for getting report templates
 */
export function useReportTemplatesQuery() {
  return useQuery<ReportTemplate[]>({
    queryKey: reportsKeys.templates.list(),
    queryFn: getReportTemplates,
  })
}

/**
 * Hook for creating a report template
 */
export function useCreateReportTemplate() {
  const qc = useQueryClient()
  return useMutation<ReportTemplate, Error, {
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
  }>({
    mutationFn: createReportTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportsKeys.templates.all })
    },
  })
}

/**
 * Hook for updating a report template
 */
export function useUpdateReportTemplate() {
  const qc = useQueryClient()
  return useMutation<ReportTemplate, Error, { id: number; payload: Partial<ReportTemplate> }>({
    mutationFn: ({ id, payload }) => updateReportTemplate(id, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportsKeys.templates.all })
    },
  })
}

/**
 * Hook for deleting a report template
 */
export function useDeleteReportTemplate() {
  const qc = useQueryClient()
  return useMutation<void, Error, number>({
    mutationFn: deleteReportTemplate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: reportsKeys.templates.all })
    },
  })
}
