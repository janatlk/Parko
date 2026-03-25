# Email Sharing Feature Implementation Plan

## Overview
This plan covers three improvements to the Reports feature:
1. **Export History Delete Confirmation** - Add confirmation dialog before deleting
2. **Save Report from Results Page** - Allow saving reports while viewing results
3. **Email Sharing Fix** - Implement actual email sending functionality

---

## Task 1: Export History Delete Confirmation

### Current State
- Delete button in ExportHistory component calls `handleDelete()` directly
- No confirmation, immediate deletion
- Risk of accidental deletions

### Implementation Plan

#### Frontend Changes

**File:** `frontend/src/features/reports/components/ExportHistory.tsx`

**Changes:**
1. Add `ConfirmationModal` component from Mantine
2. Store `pendingDeleteId` in state
3. Show confirmation modal before deleting
4. Only delete after user confirms

**Code Structure:**
```typescript
const [confirmModalOpened, setConfirmModalOpened] = useState(false)
const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

const handleDelete = (id: number) => {
  setPendingDeleteId(id)
  setConfirmModalOpened(true)
}

const handleConfirmDelete = () => {
  if (pendingDeleteId) {
    deleteLog.mutate(pendingDeleteId, { onSuccess: () => refetch() })
    setPendingDeleteId(null)
  }
  setConfirmModalOpened(false)
}
```

**Estimated Time:** 10 minutes

---

## Task 2: Save Report from Results Page

### Current State
- Report can only be saved during generation (via checkbox in ReportBuilder)
- No way to save a report after viewing results
- Users must regenerate to save

### Implementation Plan

#### Frontend Changes

**File:** `frontend/src/features/reports/components/ReportResults.tsx`

**Changes:**
1. Add "Save Report" button near export actions
2. Open modal to enter report name
3. Call `useCreateSavedReport` mutation
4. Show success notification

**New Component:** `SaveReportModal`

**Props needed from parent:**
- `report` - Full report data (report_type, from_date, to_date, summary, etc.)
- `onSave` - Callback to save report

**Implementation:**
```typescript
interface SaveReportModalProps {
  opened: boolean
  onClose: () => void
  report: ReportResponse | null
  onSave: (name: string) => void
}
```

**File:** `frontend/src/pages/ReportsPage.tsx`

**Changes:**
1. Add `handleSaveReport` function
2. Pass save handler to ReportResults
3. Show success/error notifications

**Estimated Time:** 20 minutes

---

## Task 3: Email Sharing Implementation

### Current State Analysis

**Frontend:**
- `ShareReportModal.tsx` exists and collects recipient email
- Calls `shareReportViaEmail()` API function
- Shows API key input on error
- **Problem:** API endpoint doesn't exist on backend

**Backend:**
- No `share-email/` endpoint in `reports/views.py`
- No `email-settings/` endpoint in `reports/views.py`
- No `email_api_key` field in User model
- No email sending service configured

### Implementation Plan

#### Phase 3.1: Backend - Database & Models

**File:** `backend/accounts/models.py`

**Add email settings to User model:**
```python
class User(AbstractUser):
    # ... existing fields ...
    email_api_key = models.CharField(
        max_length=255,
        null=True,
        blank=True,
        help_text='Email service API key (SendGrid, Mailgun, etc.)'
    )
    email_service = models.CharField(
        max_length=50,
        choices=[
            ('sendgrid', 'SendGrid'),
            ('mailgun', 'Mailgun'),
            ('smtp', 'SMTP'),
        ],
        default='sendgrid'
    )
```

**Migration:**
```bash
python manage.py makemigrations accounts
python manage.py migrate
```

**Estimated Time:** 5 minutes

---

#### Phase 3.2: Backend - Email Sending Service

**File:** `backend/reports/services_email.py` (new file)

**Implementation:**
```python
import sendgrid  # or requests for generic HTTP API
from django.conf import settings

def send_report_email(recipient_email: str, report_file, report_name: str, user_email: str) -> bool:
    """
    Send report via email using configured email service
    
    Args:
        recipient_email: Recipient email address
        report_file: File-like object with report content
        report_name: Name of the report file
        user_email: Sender email (from user settings)
    
    Returns:
        True if sent successfully, False otherwise
    """
    # Implementation depends on email service choice
    # Option 1: SendGrid
    # Option 2: Mailgun
    # Option 3: Django's built-in SMTP
    
    pass
```

**Dependencies to add (requirements.txt):**
- `sendgrid` (if using SendGrid)
- OR `requests` (for generic HTTP API)

**Estimated Time:** 30-45 minutes

---

#### Phase 3.3: Backend - API Views

**File:** `backend/reports/views.py`

**Add new view for email settings:**
```python
class EmailSettingsView(APIView):
    permission_classes = [IsCompanyStaff]
    
    def get(self, request):
        """Get user's email settings"""
        user = request.user
        return Response({
            'email_api_key': user.email_api_key,  # Maybe mask this?
            'email_service': user.email_service,
            'user_email': user.email,
        })
    
    def post(self, request):
        """Save user's email API key"""
        user = request.user
        serializer = EmailSettingsSerializer(data=request.data)
        if serializer.is_valid():
            user.email_api_key = serializer.validated_data.get('email_api_key')
            user.email_service = serializer.validated_data.get('email_service', 'sendgrid')
            user.save()
            return Response({'success': True, 'message': 'Email settings saved'})
        return Response(serializer.errors, status=400)
```

**Add new view for sharing reports:**
```python
class ShareReportEmailView(APIView):
    permission_classes = [IsCompanyStaff]
    
    def post(self, request):
        """
        Share report via email
        
        Request body:
        {
            "report_type": "fuel_consumption",
            "from_date": "2026-01-01",
            "to_date": "2026-01-31",
            "recipient_email": "user@example.com",
            "format": "xlsx"
        }
        """
        user = request.user
        
        # Validate user has email API key
        if not user.email_api_key:
            return Response(
                {'error': 'Email API key not configured. Please save your API key first.'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Generate report
        report_data = ReportGenerator.generate(...)
        
        # Export to requested format
        export_data = get_export_preparator(report_type)(report_data)
        report_file = export_to_file(export_data, format)
        
        # Send email
        success = send_report_email(
            recipient_email=request.data['recipient_email'],
            report_file=report_file,
            report_name=f"report_{report_type}.{format}",
            user_email=user.email
        )
        
        if success:
            return Response({'success': True, 'message': 'Report sent successfully'})
        else:
            return Response({'error': 'Failed to send email'}, status=500)
```

**Estimated Time:** 45 minutes

---

#### Phase 3.4: Backend - URL Routing

**File:** `backend/reports/urls.py`

**Add new URLs:**
```python
from .views import EmailSettingsView, ShareReportEmailView

urlpatterns = [
    # ... existing URLs ...
    path('share-email/', ShareReportEmailView.as_view(), name='share-report-email'),
    path('email-settings/', EmailSettingsView.as_view(), name='email-settings'),
]
```

**Estimated Time:** 5 minutes

---

#### Phase 3.5: Frontend - API Updates

**File:** `frontend/src/features/reports/api/reportsApi.ts`

**Update existing functions** (already exist, may need type fixes):
- `shareReportViaEmail()` - Already exists
- `updateEmailSettings()` - Already exists
- `getEmailSettings()` - Already exists

**Check:** Ensure types match backend responses

**Estimated Time:** 10 minutes

---

#### Phase 3.6: Frontend - ShareReportModal Improvements

**File:** `frontend/src/features/reports/components/ShareReportModal.tsx`

**Changes:**
1. On mount, check if user has email API key configured
2. If not, show API key input immediately
3. Improve error messages
4. Add email service selection (SendGrid vs Mailgun vs SMTP)
5. Validate email format

**Estimated Time:** 20 minutes

---

#### Phase 3.7: Backend - Report Generation for Email

**File:** `backend/reports/views.py` (in ShareReportEmailView)

**Challenge:** The view needs to regenerate the report to attach to email

**Solution:**
- Reuse `ReportGenerator.generate()` 
- Then use appropriate exporter function
- Convert to file-like object for attachment

**Code Example:**
```python
from io import BytesIO

def export_to_bytes(export_data, format: str):
    """Export data to BytesIO for email attachment"""
    buffer = BytesIO()
    
    if format == 'xlsx':
        from openpyxl import Workbook
        wb = Workbook()
        ws = wb.active
        # ... populate workbook ...
        wb.save(buffer)
    elif format == 'csv':
        import csv
        writer = csv.writer(buffer)
        # ... write CSV ...
    elif format == 'pdf':
        from reportlab.platypus import SimpleDocTemplate
        # ... create PDF ...
    
    buffer.seek(0)
    return buffer
```

**Estimated Time:** 30 minutes

---

### Email Service Options

| Service | Pros | Cons | Setup Complexity |
|---------|------|------|------------------|
| **SendGrid** | Free tier (100/day), reliable, good docs | Requires account | Easy |
| **Mailgun** | Free tier (5/day for 3 months) | Limited free tier | Easy |
| **SMTP (Gmail)** | No new account if using Gmail | Less reliable, auth issues | Medium |
| **Amazon SES** | Very cheap, scalable | Complex setup, AWS account needed | Hard |

**Recommendation:** Start with **SendGrid** (easiest, generous free tier)

---

### SendGrid Setup Instructions (for documentation)

1. Create account at https://sendgrid.com
2. Verify email address
3. Create API Key (Settings → API Keys → Create API Key)
4. Copy API key
5. In Parko app: Open Reports → Share → Paste API key
6. Test by sending a report

---

## Complete Task List

### Task 1: Export History Delete Confirmation
- [ ] Add confirmation modal to ExportHistory.tsx
- [ ] Test delete flow

**Estimated Time:** 10 minutes

---

### Task 2: Save Report from Results Page
- [ ] Create SaveReportModal component
- [ ] Add save button to ReportResults.tsx
- [ ] Add handleSaveReport to ReportsPage.tsx
- [ ] Test save flow

**Estimated Time:** 20 minutes

---

### Task 3: Email Sharing Implementation

#### Backend
- [ ] Add email_api_key and email_service fields to User model
- [ ] Create and run migrations
- [ ] Create services_email.py with send_report_email()
- [ ] Add EmailSettingsView to views.py
- [ ] Add ShareReportEmailView to views.py
- [ ] Add URLs to urls.py
- [ ] Install sendgrid package (`pip install sendgrid`)
- [ ] Test email sending manually

**Estimated Time:** 2 hours

#### Frontend
- [ ] Update API types if needed
- [ ] Improve ShareReportModal with API key check on mount
- [ ] Add email service selection
- [ ] Add email validation
- [ ] Test full flow

**Estimated Time:** 30 minutes

---

## Total Estimated Time
- **Task 1:** 10 minutes
- **Task 2:** 20 minutes
- **Task 3:** 2.5 hours
- **Total:** ~3 hours

---

## Testing Checklist

### Export History Delete Confirmation
- [ ] Click delete button → confirmation modal appears
- [ ] Click "Cancel" → modal closes, nothing deleted
- [ ] Click "Delete" → record deleted, list refreshes

### Save Report from Results
- [ ] Generate a report
- [ ] Click "Save Report" button on Results page
- [ ] Enter report name
- [ ] Click "Save"
- [ ] Check "Saved Reports" tab → report appears
- [ ] Open saved report → data matches

### Email Sharing
- [ ] Open Share modal without API key → prompts for API key
- [ ] Save API key → success notification
- [ ] Enter recipient email
- [ ] Select format (XLSX)
- [ ] Click "Send"
- [ ] Check recipient inbox → email received with attachment
- [ ] Check email content → attachment present and opens correctly

---

## Risks & Considerations

1. **Email Service Costs:** SendGrid free tier is 100 emails/day. Monitor usage.
2. **Email Deliverability:** Emails might go to spam. Consider domain verification.
3. **Large Attachments:** Excel files with lots of data might exceed email size limits.
4. **Security:** API keys stored in database. Consider encryption at rest.
5. **Rate Limiting:** Add rate limiting to prevent abuse of email feature.

---

## Future Enhancements (Not in MVP)

1. **Email Templates:** Customizable email body text
2. **Scheduled Reports:** Send reports automatically on schedule
3. **Multiple Recipients:** Send to multiple emails at once
4. **Email History:** Log all sent emails with status
5. **CC/BCC Support:** Add CC and BCC fields
6. **Email Preview:** Preview email before sending

---

## Decision Points

### Email Service Choice
**Recommended:** SendGrid (easiest setup, good free tier)

**Alternative:** Use Django's built-in SMTP with Gmail (no new service, but less reliable)

### API Key Storage
**Recommended:** Plain text in database for MVP (simple)

**Better:** Encrypt API keys using Django's `cryptography` package

### Report Regeneration for Email
**Approach:** Regenerate report on-the-fly when sending email
- **Pros:** Always sends latest data
- **Cons:** Slower, might differ from what user saw

**Alternative:** Save report first, then email the saved report
- **Pros:** Faster, consistent data
- **Cons:** Requires save step

**Decision for MVP:** Regenerate on-the-fly (simpler flow)

---

## Ready to Start?

When ready to implement, start with:
1. **Task 1** (Delete confirmation) - Quick win, 10 minutes
2. **Task 2** (Save from Results) - Medium complexity, 20 minutes
3. **Task 3** (Email sharing) - Start with backend model changes

Shall I proceed with implementation?
