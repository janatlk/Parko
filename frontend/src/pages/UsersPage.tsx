import { useMemo, useState } from 'react'

import {
  Badge,
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
  useBulkDeleteUsersMutation,
} from '@features/users/hooks/useUsers'
import { UserFormModal } from '@features/users/ui/UserFormModal'
import { USER_ROLES } from '@shared/constants/roles'
import { canEditUsers } from '@shared/lib/permissions'
import { PermissionGuard } from '@shared/ui/PermissionGuard'
import { ModernTable, ModernTableRow, TableCell, TableCellBadge, MobileTableCard } from '@shared/ui/ModernTable'

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
  const [selectedIds, setSelectedIds] = useState<number[]>([])

  const bulkDeleteMutation = useBulkDeleteUsersMutation()

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

  const handleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    )
  }

  const handleSelectAll = () => {
    const allIds = filteredUsers.map((u) => u.id)
    const allSelected = allIds.every((id) => selectedIds.includes(id))
    if (allSelected) {
      setSelectedIds((prev) => prev.filter((id) => !allIds.includes(id)))
    } else {
      setSelectedIds((prev) => Array.from(new Set([...prev, ...allIds])))
    }
  }

  const confirmBulkDelete = () => {
    if (selectedIds.length === 0) return
    // Simple confirm without modals since we don't have modals imported here
    if (window.confirm(`Delete ${selectedIds.length} users? This cannot be undone.`)) {
      bulkDeleteMutation.mutate(selectedIds, {
        onSuccess: () => setSelectedIds([]),
      })
    }
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
      <Group justify="space-between" align="center" mb="xs" wrap="wrap" gap="sm">
        <Title order={2} style={{ flex: 1, minWidth: 200 }}>{t('users.title')}</Title>

        <div style={{ width: '100%' }}>
          <PermissionGuard canAccess={canEdit} mode="disable">
            <Button onClick={openCreate}>{t('users.create')}</Button>
          </PermissionGuard>
        </div>
      </Group>

      <Group align="flex-end" mb="md" wrap="wrap" gap="sm">
        <Select
          label={t('users.role')}
          placeholder={t('common.all') || 'All'}
          data={USER_ROLES.map((r) => ({ value: r, label: r }))}
          value={roleFilter}
          onChange={setRoleFilter}
          clearable
          style={{ flex: 1, minWidth: 140 }}
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
          style={{ flex: 1, minWidth: 140 }}
        />
      </Group>

      {isLoading && <Text c="dimmed">{t('common.loading')}</Text>}
      {isError && <Text c="red">{t('users.loading_error')}</Text>}

      {!isLoading && !isError && (
        <>
          {selectedIds.length > 0 && (
            <Group mb="sm" gap="sm" wrap="wrap">
              <Badge size="sm" variant="light" color="blue">
                Selected: {selectedIds.length}
              </Badge>
              <PermissionGuard canAccess={canEdit} mode="disable">
                <Button
                  size="xs"
                  color="red"
                  variant="light"
                  onClick={confirmBulkDelete}
                  loading={bulkDeleteMutation.isPending}
                >
                  Delete selected
                </Button>
              </PermissionGuard>
              <Button size="xs" variant="subtle" onClick={() => setSelectedIds([])}>
                Clear
              </Button>
            </Group>
          )}
          <ModernTable
            selectable
            selectedIds={selectedIds}
            
            onSelectAll={handleSelectAll}
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
                selectable
                selected={selectedIds.includes(u.id)}
                onSelect={() => handleSelect(u.id)}
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
            renderMobileCard={(u) => (
              <MobileTableCard
                key={u.id}
                selectable
                selected={selectedIds.includes(u.id)}
                onSelect={() => handleSelect(u.id)}
                title={u.username}
                subtitle={`${u.first_name || ''} ${u.last_name || ''}`.trim() || undefined}
                badges={[
                  {
                    label: u.is_active ? t('users.active') : t('users.inactive'),
                    color: u.is_active ? 'green' : 'gray',
                  },
                  { label: u.role, color: 'blue' },
                ]}
                details={[
                  { label: t('users.language'), value: u.language.toUpperCase() },
                  { label: t('users.email'), value: u.email || '—' },
                ]}
                actions={
                  <PermissionGuard canAccess={canEdit} mode="disable">
                    <Button size="xs" variant="light" onClick={(e) => {
                      e.stopPropagation()
                      openEdit(u)
                    }}>
                      {t('users.edit')}
                    </Button>
                  </PermissionGuard>
                }
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
