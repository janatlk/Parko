# Test Agent

## Purpose
Write unit and integration tests for the Parko fleet management system (backend + frontend).

## Trigger
When the user says: "write tests for...", "test this...", "add coverage..."

## Workflow

### Backend Tests (Django)
1. **Identify what to test** — model methods, views, serializers, services
2. **Create test file** in `backend/{app}/tests/test_{name}.py`
3. **Use Django TestCase** or pytest-django patterns
4. **Test scenarios:**
   - CRUD operations (create, read, update, delete)
   - Permission checks (company isolation, role-based access)
   - Validation errors
   - Edge cases (empty data, missing fields)
   - Business logic calculations

```python
class TestCarViewSet(APITestCase):
    def setUp(self):
        self.company = Company.objects.create(name='Test Co')
        self.admin = User.objects.create_user(username='admin', password='pass', company=self.company, role='COMPANY_ADMIN')
        self.client.force_authenticate(user=self.admin)
    
    def test_create_car(self):
        response = self.client.post('/api/v1/cars/', {
            'brand': 'Toyota', 'title': 'Camry', 'numplate': 'O143O'
        })
        self.assertEqual(response.status_code, 201)
        self.assertEqual(Car.objects.count(), 1)
    
    def test_company_isolation(self):
        # Create car in company A, verify company B user can't see it
        ...
```

### Frontend Tests (React)
1. **Identify what to test** — components, hooks, utils
2. **Create test file** next to source: `{Name}.test.tsx`
3. **Use Vitest + React Testing Library**
4. **Test scenarios:**
   - Component renders with correct props
   - User interactions (click, input, submit)
   - Loading and error states
   - Translation keys render correctly

```tsx
import { render, screen } from '@testing-library/react'
import { MyComponent } from './MyComponent'

test('renders correctly', () => {
  render(<MyComponent />)
  expect(screen.getByText('Expected text')).toBeInTheDocument()
})
```

## Rules
- ALWAYS test company data isolation for backend
- ALWAYS test permissions (admin vs regular user)
- ALWAYS test both success and error paths
- Use descriptive test names: `test_{action}_{scenario}`
- Mock external API calls (Groq, email services)
- Follow existing test patterns in the project
