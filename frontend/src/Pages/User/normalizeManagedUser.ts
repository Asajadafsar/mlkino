// API profile objects are nested; forms edit a single, flat record.
export function normalizeManagedUser<T>(value: T): T {
    const user = value as any
    const profile = user.agency_profile || user.expert_profile || {}
    return {
        ...profile, ...user,
        ...(user.agency_profile ? {ownership_type: profile.occupancy_type ?? ''} : {}),
        ...(user.expert_profile ? {bio: profile.job_details ?? ''} : {}),
    } as T
}
