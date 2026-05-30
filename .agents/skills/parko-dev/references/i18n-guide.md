# i18n Guide

## Languages

Russian (RU) — primary, English (EN), Kyrgyz (KY). All three are mandatory for every key.

## Translation File

`frontend/src/shared/i18n/index.ts`

## Key Naming Convention

```
module.page.element
```

Examples:
- `reports.cost_per_km.total_distance`
- `cars.detail.fuel_consumption`
- `common.actions.save`

## Adding Translations

```ts
ru: {
  translation: {
    module: {
      new_key: 'Русский текст',
    },
  },
},
en: {
  translation: {
    module: {
      new_key: 'English text',
    },
  },
},
ky: {
  translation: {
    module: {
      new_key: 'Кыргызча текст',
    },
  },
},
```

## Terminology Reference

| Russian | English | Kyrgyz |
|---------|---------|--------|
| Автомобиль | Car | Унаа |
| Топливо | Fuel | Отун |
| Отчёт | Report | Отчёт |
| Добавить | Add | Кошуу |
| Удалить | Delete | Өчүрүү |
| Сохранить | Save | Сактоо |
| Отмена | Cancel | Жокко чыгаруу |
| Ошибка | Error | Ката |
| Автопарк | Fleet | Автопарк |

## Rules

- ALWAYS add all 3 languages
- Russian first, then translate to EN and KY
- Keep terminology consistent (e.g., always "автопарк", never "парк")
- Do NOT translate: brand names, technical terms (VIN, API, JSON, JWT)
- Scan components for hardcoded strings and replace with `t('key')`
- When adding a new module, create the full i18n structure upfront
