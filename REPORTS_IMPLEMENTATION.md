# Reports System Implementation

## Overview
A comprehensive, flexible reports system with chart visualization, export capabilities, and saved reports management.

## Features

### 1. Report Types
- **Fuel Consumption** - Analyze fuel usage and costs across your fleet
- **Maintenance Costs** - Track maintenance and repair expenses
- **Insurance & Inspection** - Monitor insurance and inspection status
- **Vehicle Utilization** - Analyze vehicle mileage and usage patterns
- **Cost Analysis** - Comprehensive cost breakdown by category

### 2. Report Builder
- Flexible date range selection
- Filter by specific vehicles or all vehicles
- Save reports for later access
- Real-time chart generation
- Export to multiple formats

### 3. Visualization
- **Bar Charts** - Compare values across categories
- **Line Charts** - Show trends over time
- **Pie Charts** - Display proportions
- **Doughnut Charts** - Alternative pie chart style

### 4. Export Options
- **JSON** - View in browser with full interactivity
- **CSV** - Export to spreadsheet applications
- **XLSX** - Excel format with formatting

### 5. Saved Reports
- Save generated reports for future reference
- View report history
- Re-export saved reports
- Delete outdated reports

## Backend Implementation

### Models

#### SavedReport
```python
class SavedReport(models.Model):
    company = ForeignKey(Company)
    created_by = ForeignKey(User)
    name = CharField(max_length=255)
    report_type = CharField(choices=REPORT_TYPES)
    from_date = DateField()
    to_date = DateField()
    car_ids = JSONField(null=True, blank=True)
    filters = JSONField(default=dict)
    summary = JSONField(default=dict)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

#### ReportTemplate
```python
class ReportTemplate(models.Model):
    company = ForeignKey(Company)
    created_by = ForeignKey(User)
    name = CharField(max_length=255)
    description = TextField(blank=True)
    report_type = CharField(max_length=50)
    default_from_date = CharField(max_length=20)
    default_to_date = CharField(max_length=20)
    default_car_ids = JSONField(null=True, blank=True)
    default_filters = JSONField(default=dict)
    show_charts = BooleanField(default=True)
    chart_types = JSONField(default=list)
    is_public = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
    updated_at = DateTimeField(auto_now=True)
```

### API Endpoints

#### Report Generation
```
POST /api/v1/reports/generate/
{
    "report_type": "fuel_consumption",
    "from_date": "2026-01-01",
    "to_date": "2026-01-31",
    "car_ids": [1, 2, 3],  // null for all
    "filters": {},
    "export_format": "json",  // json, csv, xlsx
    "include_charts": true,
    "save_report": false,
    "report_name": "Monthly Fuel Report"
}
```

#### Get Report Types
```
GET /api/v1/reports/types/
```

#### Get Cars for Reports
```
GET /api/v1/reports/cars/
```

#### Get Report Summary
```
GET /api/v1/reports/summary/?period=month  // day, week, month, year
```

#### Saved Reports
```
GET    /api/v1/reports/saved/              # List saved reports
GET    /api/v1/reports/saved/{id}/         # Get saved report details
GET    /api/v1/reports/saved/{id}/data/    # Get full report data
GET    /api/v1/reports/saved/{id}/export/  # Export (format=csv|xlsx|json)
POST   /api/v1/reports/saved/              # Create saved report
PATCH  /api/v1/reports/saved/{id}/         # Update saved report
DELETE /api/v1/reports/saved/{id}/         # Delete saved report
```

#### Report Templates
```
GET    /api/v1/reports/templates/          # List templates
POST   /api/v1/reports/templates/          # Create template
PATCH  /api/v1/reports/templates/{id}/     # Update template
DELETE /api/v1/reports/templates/{id}/     # Delete template
```

### Report Generator Classes

Each report type has a dedicated generator class:
- `FuelConsumptionGenerator`
- `MaintenanceCostsGenerator`
- `InsuranceInspectionGenerator`
- `VehicleUtilizationGenerator`
- `CostAnalysisGenerator`

Each generator provides:
- Data aggregation
- Summary statistics
- Chart data generation
- Export-ready formatting

## Frontend Implementation

### Components

#### ReportBuilder
- Report type selector
- Date range picker
- Vehicle multi-select
- Save report toggle
- Generate button

#### ReportResults
- Summary cards
- Interactive charts
- Detailed data table
- Back navigation

#### SavedReportsList
- List of saved reports
- View, export, delete actions
- Report metadata display

### Hooks

```typescript
useReportTypes()           // Get available report types
useCarsForReports()        // Get vehicles for filtering
useGenerateReport()        // Generate report mutation
useReportSummary()         // Get quick summary stats
useSavedReports()          // List saved reports
useSavedReportData()       // Get saved report data
useDeleteSavedReport()     // Delete report mutation
useExportSavedReport()     // Export report mutation
useReportTemplates()       // List templates
useCreateReportTemplate()  // Create template mutation
useUpdateReportTemplate()  // Update template mutation
useDeleteReportTemplate()  // Delete template mutation
```

### Types

```typescript
type ReportType = 
  | 'fuel_consumption'
  | 'maintenance_costs'
  | 'insurance_inspection'
  | 'vehicle_utilization'
  | 'cost_analysis'

type ReportChartType = 'bar' | 'line' | 'pie' | 'doughnut' | 'area'

interface ReportResponse {
  report_type: ReportType
  from_date: string
  to_date: string
  data: Record<string, unknown>[]
  summary: ReportSummary
  charts?: ChartData[]
}

interface ChartData {
  type: ReportChartType
  title: string
  data: {
    labels?: string[]
    datasets?: ChartDataset[]
    data?: (number | null)[]
    backgroundColor?: string[]
  }
}
```

## Usage Examples

### Generate a Fuel Consumption Report

```javascript
const payload = {
  report_type: 'fuel_consumption',
  from_date: '2026-01-01',
  to_date: '2026-01-31',
  car_ids: null,  // All vehicles
  include_charts: true,
  save_report: true,
  report_name: 'January 2026 Fuel Report',
}

const report = await generateReport(payload)
```

### Export a Saved Report

```javascript
// Export to Excel
const blob = await exportSavedReport(reportId, 'xlsx')
const url = window.URL.createObjectURL(blob)
const link = document.createElement('a')
link.href = url
link.download = `report_${reportId}.xlsx`
link.click()
```

### View Report Charts

Charts are automatically generated and included in the report response:

```javascript
report.charts.forEach(chart => {
  // chart.type: 'bar', 'line', 'pie', etc.
  // chart.title: Chart title
  // chart.data: Chart data object
})
```

## Chart Data Format

### Bar/Line Charts
```json
{
  "type": "bar",
  "title": "Fuel Consumption by Month",
  "data": {
    "labels": ["2026-01", "2026-02", "2026-03"],
    "datasets": [
      {
        "label": "Liters",
        "data": [1500, 1800, 1600],
        "backgroundColor": "rgba(59, 130, 246, 0.5)"
      }
    ]
  }
}
```

### Pie Charts
```json
{
  "type": "pie",
  "title": "Fuel Cost by Vehicle",
  "data": {
    "labels": ["ABC123", "XYZ789"],
    "data": [5000, 3000],
    "backgroundColor": ["rgba(59, 130, 246, 0.7)", "rgba(16, 185, 129, 0.7)"]
  }
}
```

## Files Created/Modified

### Backend
- `backend/reports/models.py` - SavedReport, ReportTemplate models
- `backend/reports/serializers.py` - API serializers
- `backend/reports/report_generator.py` - Enhanced report generator
- `backend/reports/views.py` - API views
- `backend/reports/urls.py` - URL routing
- `backend/reports/migrations/0001_initial.py` - Database migrations

### Frontend
- `frontend/src/features/reports/api/reportsApi.ts` - API functions
- `frontend/src/features/reports/hooks/useReports.ts` - React Query hooks
- `frontend/src/pages/ReportsPage.tsx` - Main reports page
- `frontend/src/shared/i18n/index.ts` - Updated translations

## Testing

### Backend
```bash
cd backend
python manage.py test reports
```

### Frontend
```bash
cd frontend
npm run build
```

## Future Enhancements

1. **PDF Export** - Add PDF export with reportlab
2. **Scheduled Reports** - Auto-generate reports on schedule
3. **Email Delivery** - Send reports via email
4. **Custom Filters** - Advanced filtering options
5. **Dashboard Widgets** - Report summaries on dashboard
6. **Report Sharing** - Share reports between users
7. **Annotations** - Add notes to saved reports
8. **Comparative Analysis** - Compare periods side-by-side
