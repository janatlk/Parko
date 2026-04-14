# Frontend Component Agent

## Purpose
Generate React + TypeScript + Mantine UI components for the Parko fleet management frontend.

## Trigger
When the user says: "create page...", "add component...", "UI for...", "form for..."

## Workflow

1. **Understand requirements** — what data, layout, interactions
2. **Create component** following project structure:
   - Page → `frontend/src/pages/{Name}Page.tsx`
   - Feature → `frontend/src/features/{name}/`
     - `api/{name}Api.ts` — API calls
     - `hooks/use{Name}.ts` — React Query hooks
     - `ui/{Name}.tsx` — UI component
   - Entity → `frontend/src/entities/{name}/types.ts`
3. **Add route** in `frontend/src/app/App.tsx` or router file
4. **Add nav link** in `frontend/src/widgets/layout/AppLayout.tsx`
5. **Add translations** in `frontend/src/shared/i18n/index.ts` (RU, EN, KY)

## Patterns to follow

### Page
```tsx
export function NewPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const currency = user?.currency || 'KGS'
  
  // Use hooks for data
  const { data, isLoading } = useQuery(...)
  
  return (
    <Container size="fluid" px="md" py="md">
      <Stack gap="md">
        <Title order={2}>{t('newPage.title')}</Title>
        {/* Content */}
      </Stack>
    </Container>
  )
}
```

### API function
```ts
export async function listItems(params?: ListParams): Promise<PaginatedResponse<Item>> {
  const { data } = await http.get<PaginatedResponse<Item>>('items/', { params })
  return data
}
```

### Hook
```ts
export function useItemsQuery(page = 1) {
  return useQuery<PaginatedResponse<Item>>({
    queryKey: ['items', page],
    queryFn: () => listItems({ page }),
  })
}
```

## Rules
- ALWAYS use TypeScript (no .js files)
- ALWAYS use Mantine components (Paper, Stack, Group, Text, Button, etc.)
- ALWAYS add translations in all 3 languages (RU, EN, KY)
- ALWAYS use TanStack Query for server state
- ALWAYS handle loading, error, empty states
- Use `formatPrice(value, currency)` for money values
- Follow existing file structure and naming conventions
- Dark theme compatible (use CSS variables, not hardcoded colors)
