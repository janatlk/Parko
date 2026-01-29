import { notifications } from '@mantine/notifications'

/**
 * Show success notification
 */
export const showSuccess = (message: string, title?: string) => {
    notifications.show({
        title: title || 'Успешно',
        message,
        color: 'green',
        autoClose: 3000,
    })
}

/**
 * Show error notification
 */
export const showError = (message: string, title?: string) => {
    notifications.show({
        title: title || 'Ошибка',
        message,
        color: 'red',
        autoClose: 5000,
    })
}

/**
 * Show info notification
 */
export const showInfo = (message: string, title?: string) => {
    notifications.show({
        title: title || 'Информация',
        message,
        color: 'blue',
        autoClose: 3000,
    })
}

/**
 * Show warning notification
 */
export const showWarning = (message: string, title?: string) => {
    notifications.show({
        title: title || 'Внимание',
        message,
        color: 'yellow',
        autoClose: 4000,
    })
}
