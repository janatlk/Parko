# Testing Guide

## Backend Tests (Django)

Use `APITestCase` from DRF. Test files: `backend/{app}/tests/test_{name}.py`

### Template

```python
from django.urls import reverse
from rest_framework.test import APITestCase
from accounts.models import User
from companies.models import Company
from fleet.models import Car

class TestCarViewSet(APITestCase):
    def setUp(self):
        self.company = Company.objects.create(name='Test Co')
        self.admin = User.objects.create_user(
            username='admin', password='pass',
            company=self.company, role='COMPANY_ADMIN'
        )
        self.client.force_authenticate(user=self.admin)

    def test_create_car(self):
        response = self.client.post('/api/v1/cars/', {
            'brand': 'Toyota', 'title': 'Camry', 'numplate': 'O143O'
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Car.objects.count(), 1)

    def test_company_isolation(self):
        other_company = Company.objects.create(name='Other Co')
        other_user = User.objects.create_user(
            username='other', password='pass',
            company=other_company, role='COMPANY_ADMIN'
        )
        Car.objects.create(company=self.company, brand='Toyota', title='Camry', numplate='A001A')
        self.client.force_authenticate(user=other_user)
        response = self.client.get('/api/v1/cars/')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.data['data']['results'], [])
```

### Scenarios to Cover

- CRUD operations
- Permission checks (role-based access)
- Company data isolation
- Validation errors
- Edge cases (empty data, missing fields)
- Business logic calculations

### Mock External APIs

Mock Groq, email services, and any third-party HTTP calls:

```python
from unittest.mock import patch

@patch('ai.services.groq_client.chat.completions.create')
def test_ai_chat(self, mock_create):
    mock_create.return_value = ...
    # test logic
```

## Frontend Tests

Use **Vitest** + **React Testing Library**. Co-locate tests: `{Name}.test.tsx`

### Template

```tsx
import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MyComponent } from './MyComponent'

const queryClient = new QueryClient()

function Wrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}

test('renders correctly', () => {
  render(<MyComponent />, { wrapper: Wrapper })
  expect(screen.getByText('Expected text')).toBeInTheDocument()
})
```

### Scenarios to Cover

- Component renders with correct props
- User interactions (click, input, submit)
- Loading and error states
- Translation keys render correctly
- Hook behavior with mocked API responses

## Rules

- ALWAYS test company data isolation for backend
- ALWAYS test permissions (admin vs regular user)
- ALWAYS test both success and error paths
- Use descriptive names: `test_{action}_{scenario}`
- Mock external API calls
- Follow existing test patterns in the project
