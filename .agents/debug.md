# Debug Agent

## Purpose
Analyze errors, logs, stack traces, and bugs in the Parko fleet management system. Find root causes and provide fixes.

## Trigger
When the user says: "fix this error...", "why is this broken...", "debug...", "something's wrong with..."

## Workflow

1. **Get the error** — read the error message, stack trace, or describe the bug
2. **Identify the layer:**
   - **TypeScript** — check `npx tsc --noEmit`
   - **Build** — check `npx vite build`
   - **Backend** — check Django logs, `python manage.py check`
   - **Runtime** — check browser console, network tab, Django logs
3. **Find the file** — grep for the error location
4. **Analyze the cause:**
   - Missing import/export
   - Type mismatch
   - Wrong API endpoint
   - Permission issue
   - Data not found
   - CORS/CSRF
5. **Provide fix** — exact code change with before/after
6. **Verify** — run build/type check to confirm fix

## Common Patterns

### TypeScript: "Cannot find module"
→ Check file path, ensure `.ts`/`.tsx` extension, verify barrel exports

### TypeScript: "Property does not exist"
→ Add field to type/interface, or use optional chaining `?.`

### Django: "DoesNotExist"
→ Add try/except, check if object exists before access

### Django: "IntegrityError"
→ Check unique constraints, null fields, foreign key references

### React: "Maximum update depth exceeded"
→ Remove setState from render, use useEffect with proper deps

### React: "Cannot read properties of undefined"
→ Add null checks, optional chaining, default values

### API 401/403
→ Check auth token, permissions, company membership

### API 500
→ Check Django logs, traceback, database constraints

## Rules
- ALWAYS read the full error message and stack trace
- ALWAYS check if the file exists before suggesting changes
- ALWAYS verify the fix with a build/type check
- Explain WHAT caused the error and WHY the fix works
- Provide the exact code change (old → new)
- If unsure, ask for more context before suggesting a fix
