import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { PaginatedResponse } from '@shared/api/types'
import type { User } from '@entities/user/types'

import { createUser, deleteUser, listUsers, updateUser } from '../api/usersApi'
import type { UserCreatePayload, UserUpdatePayload } from '../api/usersApi'

type UsersQueryArgs = {
  page: number
}

const usersKeys = {
  all: ['users'] as const,
  list: (args: UsersQueryArgs) => [...usersKeys.all, 'list', args] as const,
}

export function useUsersQuery(args: UsersQueryArgs) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: usersKeys.list(args),
    queryFn: () => listUsers({ page: args.page }),
  })
}

export function useCreateUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: UserCreatePayload) => createUser(payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: usersKeys.all })
    },
  })
}

export function useUpdateUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, payload }: { userId: number; payload: UserUpdatePayload }) =>
      updateUser(userId, payload),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: usersKeys.all })
    },
  })
}

export function useDeleteUserMutation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (userId: number) => deleteUser(userId),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: usersKeys.all })
    },
  })
}
