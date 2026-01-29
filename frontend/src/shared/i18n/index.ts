import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

const resources = {
  ru: {
    translation: {
      common: {
        save: 'Сохранить',
        cancel: 'Отмена',
        loading: 'Загрузка...',
      },
      auth: {
        title: 'Вход',
        username: 'Логин',
        password: 'Пароль',
        login: 'Войти',
      },
      dashboard: {
        title: 'Дашборд',
        logout: 'Выйти',
        logged_in_as: 'Вы вошли как: {{username}}',
      },
      users: {
        title: 'Пользователи',
        create: 'Создать пользователя',
        edit: 'Редактировать',
        role: 'Роль',
        status: 'Статус',
        active: 'Активен',
        inactive: 'Неактивен',
        loading_error: 'Не удалось загрузить пользователей',
      },
      cars: {
        title: 'Машины',
        add: 'Добавить машину',
        search: 'Поиск',
        status: 'Статус',
        loading_error: 'Не удалось загрузить машины',
      },
      reports: {
        title: 'Отчёты',
        type: 'Тип отчёта',
        maintenance_costs: 'Затраты на ТО',
        fuel_consumption: 'Топливо и пробег',
        insurance_inspection: 'Страховки и техосмотры',
        from: 'С',
        to: 'По',
        car: 'Машина',
        not_available_for_role: 'Недоступно для вашей роли',
        not_implemented: 'Пока не реализовано',
      },
    },
  },
  en: {
    translation: {
      common: {
        save: 'Save',
        cancel: 'Cancel',
        loading: 'Loading...',
      },
      auth: {
        title: 'Login',
        username: 'Username',
        password: 'Password',
        login: 'Login',
      },
      dashboard: {
        title: 'Dashboard',
        logout: 'Logout',
        logged_in_as: 'Logged in as: {{username}}',
      },
      users: {
        title: 'Users',
        create: 'Create user',
        edit: 'Edit',
        role: 'Role',
        status: 'Status',
        active: 'Active',
        inactive: 'Inactive',
        loading_error: 'Failed to load users',
      },
      cars: {
        title: 'Cars',
        add: 'Add car',
        search: 'Search',
        status: 'Status',
        loading_error: 'Failed to load cars',
      },
      reports: {
        title: 'Reports',
        type: 'Report type',
        maintenance_costs: 'Maintenance costs',
        fuel_consumption: 'Fuel consumption',
        insurance_inspection: 'Insurance & inspection',
        from: 'From',
        to: 'To',
        car: 'Car',
        not_available_for_role: 'Not available for your role',
        not_implemented: 'Not implemented yet',
      },
    },
  },
  ky: {
    translation: {
      common: {
        save: 'Сактоо',
        cancel: 'Жокко чыгаруу',
        loading: 'Жүктөлүүдө...',
      },
      auth: {
        title: 'Кирүү',
        username: 'Логин',
        password: 'Сырсөз',
        login: 'Кирүү',
      },
      dashboard: {
        title: 'Дашборд',
        logout: 'Чыгуу',
        logged_in_as: 'Кирдиңиз: {{username}}',
      },
      users: {
        title: 'Колдонуучулар',
        create: 'Колдонуучу түзүү',
        edit: 'Оңдоо',
        role: 'Роль',
        status: 'Статус',
        active: 'Активдүү',
        inactive: 'Активдүү эмес',
        loading_error: 'Колдонуучулар жүктөлгөн жок',
      },
      cars: {
        title: 'Унаалар',
        add: 'Унаа кошуу',
        search: 'Издөө',
        status: 'Статус',
        loading_error: 'Унаалар жүктөлгөн жок',
      },
      reports: {
        title: 'Отчёттор',
        type: 'Отчёт түрү',
        maintenance_costs: 'ТО чыгымдары',
        fuel_consumption: 'Күйүүчү май жана жүрүш',
        insurance_inspection: 'Страховка жана техосмотр',
        from: 'Башталышы',
        to: 'Аягы',
        car: 'Унаа',
        not_available_for_role: 'Ролуңуз үчүн жеткиликсиз',
        not_implemented: 'Азырынча жок',
      },
    },
  },
} as const

void i18n.use(initReactI18next).init({
  resources,
  lng: 'ru',
  fallbackLng: 'ru',
  interpolation: {
    escapeValue: false,
  },
})

export { i18n }
