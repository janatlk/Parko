import { useMutation } from '@tanstack/react-query'

import { patchMeApi } from '@features/auth/api/authApi'
import type { MeUpdatePayload } from '@features/auth/api/authApi'

export function useUpdateMeMutation() {
  return useMutation({
    mutationFn: (payload: MeUpdatePayload) => patchMeApi(payload),
  })
}
