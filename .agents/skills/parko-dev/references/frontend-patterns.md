# Frontend Patterns

## FSD Layers

| Layer | Purpose | Example |
|-------|---------|---------|
| `app/` | Entry, providers, router | `App.tsx`, `ThemeProvider` |
| `pages/` | Route pages | `CarsPage.tsx`, `DashboardPage.tsx` |
| `widgets/` | Large reusable blocks | `AppLayout.tsx` |
| `features/` | Domain features | `features/cars/`, `features/fuel/` |
| `entities/` | Domain types | `entities/car/types.ts` |
| `shared/` | Infrastructure | `api/`, `theme/`, `ui/`, `i18n/`, `utils/` |

## Feature Folder Structure

```
features/cars/
├── api/
│   └── carsApi.ts          # HTTP calls
├── hooks/
│   └── useCars.ts          # useQuery / useMutation hooks
└── ui/
    └── CarList.tsx         # Presentational components
```

## Page Component Template

```tsx
import { Container, Stack, Title } from '@mantine/core'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@features/auth'

export function NewPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'

  // const { data, isLoading, error } = useSomeQuery()

  return (
    <Container size="fluid" px="md" py="md">
      <Stack gap="md">
        <Title order={2}>{t('newPage.title')}</Title>
        {/* content */}
      </Stack>
    </Container>
  )
}
```

## API Function Pattern

```ts
import { http } from '@shared/api/http'
import type { PaginatedResponse, ListParams } from '@shared/api/types'

export async function listItems(params?: ListParams): Promise<PaginatedResponse<Item>> {
  const { data } = await http.get<PaginatedResponse<Item>>('items/', { params })
  return data
}

export async function createItem(payload: CreateItemDto): Promise<Item> {
  const { data } = await http.post<Item>('items/', payload)
  return data
}
```

## React Query Hook Pattern

```ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listItems, createItem } from '../api/itemsApi'
import type { PaginatedResponse, Item } from '@shared/api/types'

export function useItemsQuery(page = 1) {
  return useQuery<PaginatedResponse<Item>>({
    queryKey: ['items', page],
    queryFn: () => listItems({ page }),
  })
}

export function useCreateItemMutation() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: createItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['items'] })
    },
  })
}
```

## Route Registration

Add the page to the router (in `frontend/src/app/router/` or `App.tsx`):

```tsx
{ path: '/new-page', element: <NewPage /> }
```

## Navigation Link

Add to `frontend/src/widgets/layout/AppLayout.tsx` (or navigation component):

```tsx
<NavLink to="/new-page" label={t('navigation.newPage')} />
```

## Money Values

Always use `formatPrice(value, currency)` for monetary values. Never concatenate manually.

## Dark Theme

- Use Mantine props and CSS variables
- Never hardcode colors like `#fff` or `black`
- Avoid `!important` unless overriding third-party styles
- Custom dark styles live in `frontend/src/shared/theme/darkStyles.css`

## Rules Checklist

- [ ] TypeScript only (no `.js`)
- [ ] Mantine components used
- [ ] `useTranslation` for all user-facing text
- [ ] TanStack Query for server state
- [ ] Loading, error, empty states handled
- [ ] `formatPrice` for money
- [ ] Dark theme compatible
