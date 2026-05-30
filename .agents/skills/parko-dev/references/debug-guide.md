# Debug Guide

## Layer Identification

1. **TypeScript** — `npx tsc --noEmit`
2. **Build** — `npx vite build`
3. **Backend** — Django logs, `python manage.py check`
4. **Runtime** — Browser console, Network tab, Django logs

## Common Errors & Fixes

### TypeScript: "Cannot find module"
- Check file path and `.ts`/`.tsx` extension
- Verify barrel exports (`index.ts` re-exports)
- Check `tsconfig.json` path aliases

### TypeScript: "Property does not exist"
- Add field to type/interface, or use optional chaining `?.`
- Check if the type definition is outdated

### Django: "DoesNotExist"
- Add `try/except`, check object exists before access
- Use `get_object_or_404` in views

### Django: "IntegrityError"
- Check unique constraints, null fields, FK references
- Review migration files for constraint changes

### React: "Maximum update depth exceeded"
- Remove `setState` from render path
- Use `useEffect` with proper dependency array

### React: "Cannot read properties of undefined"
- Add null checks, optional chaining `?.`, default values
- Check loading state before accessing nested data

### API 401
- Access token expired — refresh should auto-handle via `http` interceptor
- If persistent, check `localStorage` tokens and re-login

### API 403
- Missing permissions — check user role vs endpoint requirements
- AI tool calling requires `COMPANY_ADMIN`

### API 500
- Check Django logs and traceback
- Common causes: missing `company` FK, N+1 query timeout, invalid serializer data

## Verification Steps

After any fix, run:

```bash
# Frontend
cd frontend && npx tsc --noEmit && npx vite build

# Backend
cd backend && python manage.py check
```

## Search Strategy

- Use `Grep` tool for searching code (preferred over shell `grep`)
- Search for error message strings to locate source
- Check `backend/core/exceptions.py` for custom exception handlers
