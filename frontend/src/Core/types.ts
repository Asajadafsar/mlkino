export type PaginationType = {
    pages: number
    next: string
    previous: string
}

export type PaginatedResponse<T> = {
    results: T
    pagination: PaginationType
}

export type PropertyType = {
    id: number
    name: string
    value: string
}
export type OptionType = {
    id: number
    title: string
    price: number | undefined
}
export type ProfileType = {
        mobile: string
        first_name: string
        last_name: string
        profile_picture: string | null
        role: string
        date_joined: string
}