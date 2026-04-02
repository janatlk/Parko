import { useMemo, useState } from 'react'

import {
  Button,
  Container,
  Group,
  Pagination,
  Select,
  Text,
  Title,
} from '@mantine/core'
import { useTranslation } from 'react-i18next'

import type { User } from '@entities/user/types'
import { useAuth } from '@features/auth/hooks/useAuth'
import {
  useCreateUserMutation,
  useUpdateUserMutation,
  useUsersQuery,
} from '@features/users/hooks/useUsers'
import { UserFormModal } from '@features/users/ui/UserFormModal'
import { USER_ROLES } from '@shared/constants/roles'
import { canEditUsers } from '@shared/lib/permissions'
import { PermissionGuard } from '@shared/ui/PermissionGuard'
import { ModernTable, ModernTableRow, TableCell, TableCellBadge } from '@shared/ui/ModernTable'

export function UsersPage() {
  const { t } = useTranslation()
  const { user: currentUser } = useAuth()

  const [page, setPage] = useState(1)
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<string | null>(null)

  const canEdit = canEditUsers(currentUser)

  const { data, isLoading, isError } = useUsersQuery({ page })
  const createMutation = useCreateUserMutation()
  const updateMutation = useUpdateUserMutation()

  const [modalOpened, setModalOpened] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [selectedUser, setSelectedUser] = useState<User | undefined>(undefined)

  const openCreate = () => {
    setSelectedUser(undefined)
    setModalMode('create')
    setModalOpened(true)
  }

  const openEdit = (u: User) => {
    setSelectedUser(u)
    setModalMode('edit')
    setModalOpened(true)
  }

  const users = data?.results ?? []

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter && u.role !== roleFilter) return false
      if (statusFilter === 'active' && !u.is_active) return false
      if (statusFilter === 'inactive' && u.is_active) return false
      return true
    })
  }, [roleFilter, statusFilter, users])

  const totalPages = data ? Math.max(1, Math.ceil(data.count / 20)) : 1

  return (
    <Container>
      <Group justify="space-between" align="center" mb="xs">
        <Title order={2}>{t('users.title')}</Title>

        <PermissionGuard canAccess={canEdit} mode="disable">
          <Button onClick={openCreate}>{t('users.create')}</Button>
        </PermissionGuard>
      </Group>

      <Group align="flex-end" mb="md">
        <Select
          label={t('users.role')}
          placeholder={t('common.all') || 'All'}
          data={USER_ROLES.map((r) => ({ value: r, label: r }))}
          value={roleFilter}
          onChange={setRoleFilter}
          clearable
          w={240}
        />
        <Select
          label={t('users.status')}
          placeholder={t('common.all') || 'All'}
          data={[
            { value: 'active', label: t('users.active') },
            { value: 'inactive', label: t('users.inactive') },
          ]}
          value={statusFilter}
          onChange={setStatusFilter}
          clearable
          w={160}
        />
      </Group>

      {isLoading && <Text c="dimmed">{t('common.loading')}</Text>}
      {isError && <Text c="red">{t('users.loading_error')}</Text>}

      {!isLoading && !isError && (
        <>
          <ModernTable
            columns={[
              { key: 'id', title: 'ID', width: 70 },
              { key: 'username', title: t('auth.username'), width: 180 },
              { key: 'role', title: t('users.role'), width: 140 },
              { key: 'language', title: t('users.language'), width: 100 },
              { key: 'status', title: t('users.status'), width: 110 },
              { key: 'actions', title: '', width: 100 },
            ]}
            data={filteredUsers}
            renderRow={(u) => (
              <ModernTableRow
                key={u.id}
                cells={[
                  <TableCell key="id" align="center" fw={500}>#{u.id}</TableCell>,
                  <TableCell key="username" fw={500}>{u.username}</TableCell>,
                  <TableCell key="role">{u.role}</TableCell>,
                  <TableCell key="language">{u.language.toUpperCase()}</TableCell>,
                  <TableCell key="status">
                    <TableCellBadge color={u.is_active ? 'green' : 'gray'}>
                      {u.is_active ? t('users.active') : t('users.inactive')}
                    </TableCellBadge>
                  </TableCell>,
                  <TableCell key="actions" align="right">
                    <PermissionGuard canAccess={canEdit} mode="disable">
                      <Button size="xs" variant="light" onClick={() => openEdit(u)}>
                        {t('users.edit')}
                      </Button>
                    </PermissionGuard>
                  </TableCell>,
                ]}
              />
            )}
            emptyMessage={t('users.no_data') || 'No users found'}
          />

          <Group justify="space-between" align="center" mt="md">
            <Text size="sm" c="dimmed">
              {t('common.total')}: {data?.count ?? 0}
            </Text>
            <Pagination total={totalPages} value={page} onChange={setPage} />
          </Group>
        </>
      )}

      <UserFormModal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        mode={modalMode}
        user={selectedUser}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
        onCreate={async (payload) => {
          await createMutation.mutateAsync(payload)
        }}
        onUpdate={async (userId, payload) => {
          await updateMutation.mutateAsync({ userId, payload })
        }}
      />
    </Container>
  )
}
