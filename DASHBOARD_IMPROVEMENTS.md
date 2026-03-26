# Parko - Improvement Suggestions

**Date:** March 26, 2026  
**Priority Levels:** 🔴 High | 🟡 Medium | 🟢 Low

---

## 🔴 High Priority (Quick Wins)

### 1. Add Demo/Sample Data
**Problem:** Empty dashboard looks broken to new users  
**Solution:** Create management command to populate demo data (5-10 cars with fuel, maintenance, insurance records)  
**Effort:** 2-3 hours  
**Impact:** Users immediately see what the dashboard can do

### 2. Empty State Messages
**Problem:** Widgets show "No data" with no guidance  
**Solution:** Add helpful messages like "No fuel records yet. Click here to add your first fuel entry." with action buttons  
**Effort:** 1-2 hours  
**Impact:** Better user onboarding

### 3. Date Range for Cost Chart Should Persist
**Problem:** Selected period (3m/6m/12m) resets on page refresh  
**Solution:** Save to localStorage (already done for widget visibility)  
**Effort:** 30 minutes  
**Impact:** Better UX consistency

---

## 🟡 Medium Priority (Nice to Have)

### 4. Cost Per Vehicle Metric
**Problem:** Can't see which vehicles are most expensive  
**Solution:** Add "Top 5 Most Expensive Vehicles" widget showing total cost per vehicle  
**Effort:** 3-4 hours  
**Impact:** Helps identify problem vehicles

### 5. Export Dashboard Data
**Problem:** Can't share dashboard reports with management  
**Solution:** Add "Export" button on Cost Breakdown chart (PDF/Excel)  
**Effort:** 4-6 hours  
**Impact:** Better reporting capabilities

### 6. Alert Thresholds for Fuel Consumption
**Problem:** No way to flag vehicles with abnormal fuel usage  
**Solution:** Add settings to set consumption threshold (e.g., >20 L/100km = warning)  
**Effort:** 3-4 hours  
**Impact:** Early detection of vehicle issues

### 7. Dashboard Date Range Selector
**Problem:** All data is "last 6 months" with no customization  
**Solution:** Add global date range picker affecting all widgets  
**Effort:** 6-8 hours  
**Impact:** More flexible reporting

---

## 🟢 Low Priority (Future Enhancements)

### 8. Widget Drag & Drop
**Problem:** Widget positions are fixed  
**Solution:** Allow users to reorder widgets by dragging  
**Effort:** 8-12 hours  
**Impact:** Personalization (but most users won't care)

### 9. Compare Periods
**Problem:** Can't compare this month vs last month easily  
**Solution:** Add "vs previous period" percentage on all cost widgets  
**Effort:** 4-6 hours  
**Impact:** Better trend analysis

### 10. Notifications for Expiring Items
**Problem:** Users must check dashboard to see expiring insurance  
**Solution:** Add email/notification when insurance expires in <7 days  
**Effort:** 6-8 hours  
**Impact:** Prevents compliance issues

### 11. Mobile Responsive Improvements
**Problem:** Dashboard is cramped on phones  
**Solution:** Optimize widget stacking and font sizes for mobile  
**Effort:** 4-6 hours  
**Impact:** Better mobile experience (but most users use desktop)

### 12. Dark Mode
**Problem:** No dark theme option  
**Solution:** Add dark mode toggle (Mantine supports this)  
**Effort:** 3-4 hours  
**Impact:** Nice to have, but not critical for business

---

## 📋 Quick Reference

| # | Feature | Effort | Impact | Priority |
|---|---------|--------|--------|----------|
| 1 | Demo Data | Low | High | 🔴 |
| 2 | Empty States | Low | High | 🔴 |
| 3 | Persist Chart Period | Very Low | Medium | 🔴 |
| 4 | Cost Per Vehicle | Medium | High | 🟡 |
| 5 | Export Data | Medium | Medium | 🟡 |
| 6 | Fuel Alerts | Medium | Medium | 🟡 |
| 7 | Date Range Picker | High | Medium | 🟡 |
| 8 | Drag & Drop | High | Low | 🟢 |
| 9 | Compare Periods | Medium | Low | 🟢 |
| 10 | Notifications | High | Medium | 🟢 |
| 11 | Mobile Responsive | Medium | Low | 🟢 |
| 12 | Dark Mode | Low | Low | 🟢 |

---

## 💡 Recommendation

**Start with #1, #2, #3** - These take less than a day total but dramatically improve first impressions and usability.

Then pick **one** from Medium priority based on user feedback.

---

## ✅ Completed Today

- [x] Redesigned dashboard layout (eliminated empty space)
- [x] Added comprehensive cost breakdown (6 categories)
- [x] Added category toggle settings
- [x] Added vehicle fuel consumption list with goal tracking
- [x] Added car edit activity to Recent Activity feed
- [x] Fixed expired insurance showing in dashboard
- [x] Fixed reports showing multiple results
- [x] Enhanced compact mode
- [x] Added User management to Django admin
- [x] Made customization menu more flexible
