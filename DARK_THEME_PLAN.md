# Dark Theme Implementation Plan

## Overview
Add a dark/light theme toggle to Parko fleet management system using Mantine's built-in theming capabilities.

---

## Phase 1: Backend (User Preference Storage)

### 1.1. Database Schema Changes
**File**: `backend/accounts/models.py`
- Add `theme` field to User model
- Choices: `'light'`, `'dark'`, `'system'`
- Default: `'system'`

```python
theme = models.CharField(
    max_length=10,
    choices=[
        ('light', 'Light'),
        ('dark', 'Dark'),
        ('system', 'System (auto)'),
    ],
    default='system',
    help_text='Theme preference for UI'
)
```

### 1.2. Migration
```bash
python manage.py makemigrations accounts
python manage.py migrate
```

### 1.3. Serializer Updates
**File**: `backend/accounts/serializers.py`
- Add `theme` to `UserListSerializer`
- Add `theme` to `MeUpdateSerializer`

### 1.4. API Endpoint
**File**: `backend/accounts/views.py`
- Update `MeView` to accept theme in PATCH requests

---

## Phase 2: Frontend Infrastructure

### 2.1. Theme Context
**File**: `frontend/src/app/providers/ThemeProvider.tsx` (NEW)
```typescript
- Create ThemeContext with useState for theme
- Provide: theme, setTheme, resolvedTheme (for 'system' detection)
- Detect system preference via window.matchMedia('(prefers-color-scheme: dark)')
- Listen to system changes when theme='system'
```

### 2.2. Theme Hook
**File**: `frontend/src/features/theme/hooks/useTheme.ts` (NEW)
```typescript
- useTheme() hook for easy access
- Return: { theme, setTheme, resolvedTheme, toggleTheme }
```

### 2.3. Update AppProviders
**File**: `frontend/src/app/providers/index.tsx`
- Wrap app with ThemeProvider
- Order: AuthProvider → ThemeProvider → App

---

## Phase 3: Mantine Theme Configuration

### 3.1. Create Theme Definitions
**File**: `frontend/src/shared/theme/darkTheme.ts` (NEW)
```typescript
import { createTheme } from '@mantine/core'

export const darkTheme = createTheme({
  colors: {
    // Custom dark color palette
  },
  primaryColor: 'blue',
  // Mantine dark theme overrides
})
```

**File**: `frontend/src/shared/theme/lightTheme.ts` (NEW)
```typescript
// Similar for light theme (or use default)
```

### 3.2. CSS Variables
**File**: `frontend/src/index.css` (or create new)
```css
[data-mantine-color-scheme='dark'] {
  --custom-bg: #1a1b1e;
  --custom-surface: #25262b;
  // Additional custom variables
}

[data-mantine-color-scheme='light'] {
  --custom-bg: #ffffff;
  --custom-surface: #f8f9fa;
}
```

---

## Phase 4: UI Components

### 4.1. Theme Toggle Component
**File**: `frontend/src/features/theme/ui/ThemeToggle.tsx` (NEW)
```typescript
- SegmentedControl or Switch component
- Options: Light | Dark | System
- Icons: Sun, Moon, Monitor (system)
- Located in: AppLayout header or Profile page
```

### 4.2. Update AppLayout
**File**: `frontend/src/widgets/layout/AppLayout.tsx`
- Add ThemeToggle to header
- Or add to user menu dropdown

### 4.3. Update Profile Page
**File**: `frontend/src/pages/ProfilePage.tsx`
- Add "Theme" select/segmented control
- Save to backend via updateMe mutation
- Sync with local storage

---

## Phase 5: Persistence & Sync

### 5.1. Local Storage
**File**: `frontend/src/features/theme/utils/themeStorage.ts` (NEW)
```typescript
- Save theme preference to localStorage
- Key: 'parko-theme'
- Load on app initialization
```

### 5.2. Backend Sync
**File**: `frontend/src/features/theme/hooks/useThemeSync.ts` (NEW)
```typescript
- Sync theme preference with backend
- Debounce saves to avoid excessive API calls
- Handle offline state (use localStorage)
```

### 5.3. Update AuthProvider
**File**: `frontend/src/app/providers/AuthProvider.tsx`
- Load theme from user data on login
- Apply theme when user logs in

---

## Phase 6: Testing & Polish

### 6.1. Component Testing
- Test all pages in both themes
- Check contrast ratios
- Verify icons are visible

### 6.2. Common Issues to Fix
- **Charts**: Recharts may need theme-aware colors
- **Tables**: Ensure borders visible in dark mode
- **Images**: May need opacity adjustments
- **Maps**: If used, need dark theme styles

### 6.3. Performance
- Memoize theme context value
- Avoid unnecessary re-renders
- Lazy load theme assets if needed

---

## Implementation Order (Recommended)

1. **Day 1**: Backend (Phase 1) - 2 hours
   - Add model field
   - Create migration
   - Update serializers

2. **Day 1**: Frontend Infrastructure (Phase 2) - 3 hours
   - Create ThemeContext
   - Create useTheme hook
   - Setup providers

3. **Day 2**: Mantine Theme (Phase 3) - 3 hours
   - Define dark theme colors
   - Test basic components
   - Fix contrast issues

4. **Day 2**: UI Components (Phase 4) - 2 hours
   - Create ThemeToggle
   - Add to AppLayout
   - Add to ProfilePage

5. **Day 3**: Persistence (Phase 5) - 2 hours
   - LocalStorage implementation
   - Backend sync
   - AuthProvider integration

6. **Day 3**: Testing (Phase 6) - 4 hours
   - Test all pages
   - Fix bugs
   - Polish animations

**Total Estimated Time**: 16 hours (~2-3 days)

---

## File Structure

```
frontend/src/
├── app/
│   └── providers/
│       ├── ThemeProvider.tsx (NEW)
│       └── index.tsx (UPDATE)
├── features/
│   └── theme/
│       ├── hooks/
│       │   ├── useTheme.ts (NEW)
│       │   └── useThemeSync.ts (NEW)
│       ├── ui/
│       │   └── ThemeToggle.tsx (NEW)
│       └── utils/
│           └── themeStorage.ts (NEW)
├── shared/
│   ├── theme/
│   │   ├── darkTheme.ts (NEW)
│   │   └── lightTheme.ts (NEW)
│   └── i18n/
│       └── index.ts (ADD theme translations)
└── widgets/
    └── layout/
        └── AppLayout.tsx (ADD ThemeToggle)
```

---

## Color Palette Suggestions

### Dark Theme
```typescript
{
  background: '#1a1b1e',      // Very dark gray
  surface: '#25262b',         // Dark gray (cards)
  surfaceHover: '#2c2e33',    // Slightly lighter
  border: '#373a40',          // Border color
  text: '#e9ecef',            // Light text
  textMuted: '#909296',       // Muted text
  primary: '#3b82f6',         // Blue (keep brand color)
  error: '#ef4444',           // Red
  success: '#10b981',         // Green
  warning: '#f59e0b',         // Amber
}
```

### Light Theme (Mantine Default)
```typescript
// Use Mantine's default light theme
// Only override if needed
```

---

## Translations

Add to `frontend/src/shared/i18n/index.ts`:

```typescript
// Russian
theme: {
  label: 'Тема',
  light: 'Светлая',
  dark: 'Тёмная',
  system: 'Системная',
}

// English
theme: {
  label: 'Theme',
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

// Kyrgyz
theme: {
  label: 'Тема',
  light: 'Ачык',
  dark: 'Караңгы',
  system: 'Системалык',
}
```

---

## Success Criteria

- [ ] User can toggle between Light/Dark/System themes
- [ ] Theme persists across page reloads (localStorage)
- [ ] Theme syncs with backend (user preference)
- [ ] System theme detection works when 'system' selected
- [ ] All pages look good in both themes
- [ ] No contrast/accessibility issues
- [ ] Smooth transitions between themes
- [ ] Charts and graphs themed correctly
- [ ] Profile page shows current theme setting

---

## Future Enhancements (Post-MVP)

1. **Per-page themes**: Allow different themes per page
2. **Auto-switch**: Schedule theme changes (dark at night)
3. **More themes**: Blue, Green, Purple color schemes
4. **High contrast**: Accessibility mode
5. **Animations**: Smooth theme transition effects
