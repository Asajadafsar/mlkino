
import EditIcon from '@mui/icons-material/Edit'
import { Box, Stack } from '@mui/material'
import {
    type ChangeEvent,
    type Dispatch,
    type SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react'

import userImage from '../../Images/user.png'

interface ProfileUploaderProps {
    avatar: string | File | null
}

interface Props<T extends ProfileUploaderProps> {
    user: T
    setUser: Dispatch<SetStateAction<T>>
}

export default function ProfileUploader<
    T extends ProfileUploaderProps
>({
    user,
    setUser,
}: Props<T>) {
    const [isHover, setIsHover] = useState(false)
    const [imagePreview, setImagePreview] = useState('')

    const previewRef = useRef<string | null>(null)

    useEffect(() => {
        if (!(user.avatar instanceof File)) {
            setImagePreview('')
            return
        }

        const previewUrl = URL.createObjectURL(user.avatar)

        previewRef.current = previewUrl
        setImagePreview(previewUrl)

        return () => {
            URL.revokeObjectURL(previewUrl)

            if (previewRef.current === previewUrl) {
                previewRef.current = null
            }
        }
    }, [user.avatar])

    const handleChange = (
        event: ChangeEvent<HTMLInputElement>
    ) => {
        const file = event.target.files?.[0]

        if (!file) return

        if (!file.type.startsWith('image/')) {
            event.target.value = ''
            return
        }

        setUser((prev) => ({
            ...prev,
            avatar: file,
        }))

        event.target.value = ''
    }

    const imageSrc =
        imagePreview ||
        (typeof user.avatar === 'string'
            ? user.avatar
            : '') ||
        userImage

    return (
        <Stack
            direction="row"
            justifyContent={{
                xs: 'center',
                sm: 'flex-start',
            }}
        >
            <Box
                component="label"
                htmlFor="profile_image"
                onMouseEnter={() => setIsHover(true)}
                onMouseLeave={() => setIsHover(false)}
                sx={{
                    width: {
                        xs: '110px',
                        sm: '125px',
                    },
                    height: {
                        xs: '110px',
                        sm: '125px',
                    },
                    position: 'relative',
                    borderRadius: '50%',
                    mb: {
                        xs: 4,
                        sm: 5,
                    },
                    cursor: 'pointer',
                    overflow: 'hidden',
                    display: 'block',
                    flexShrink: 0,
                }}
            >
                <Box
                    component="img"
                    src={imageSrc}
                    alt="تصویر پروفایل کاربر"
                    onError={(event) => {
                        event.currentTarget.onerror = null
                        event.currentTarget.src = userImage
                    }}
                    sx={{
                        borderRadius: '50%',
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: isHover
                            ? 'brightness(0.4)'
                            : 'brightness(1)',
                        transition: 'filter .2s ease-in-out',
                    }}
                />

                <Box
                    sx={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: isHover ? 1 : 0,
                        transition: 'opacity .2s ease-in-out',
                        pointerEvents: 'none',
                    }}
                >
                    <EditIcon
                        fontSize="large"
                        sx={{
                            color: '#fff',
                        }}
                    />
                </Box>

                <Box
                    component="input"
                    type="file"
                    name="avatar"
                    id="profile_image"
                    accept="image/*"
                    onChange={handleChange}
                    sx={{
                        display: 'none',
                    }}
                />
            </Box>
        </Stack>
    )
}
