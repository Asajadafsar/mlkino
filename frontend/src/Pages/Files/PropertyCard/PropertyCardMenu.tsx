import {useState} from 'react'
import type {MouseEvent, ReactNode} from 'react'
import {useNavigate} from 'react-router-dom'
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    IconButton,
    Menu,
    Stack,
    Typography,
} from '@mui/material'
import MoreVertRoundedIcon from '@mui/icons-material/MoreVertRounded'
import EditRoundedIcon from '@mui/icons-material/EditRounded'
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded'
import WarningRoundedIcon from '@mui/icons-material/WarningRounded'
import CheckCircleRoundedIcon from '@mui/icons-material/CheckCircleRounded'
import CancelRoundedIcon from '@mui/icons-material/CancelRounded'
import {RecordMode} from '../../../Components/PropertyRecordForm'
import PushPinRoundedIcon from '@mui/icons-material/PushPinRounded'
import PushPinOutlinedIcon from '@mui/icons-material/PushPinOutlined'
type ActionColor = 'primary' | 'error' | 'success' | 'warning'

const COLORS: Record<ActionColor, {main: string; soft: string; hover: string}> = {
    primary: {main: 'primary.main', soft: 'rgba(30,97,205,0.1)', hover: 'rgba(30,97,205,0.08)'},
    error: {main: 'error.main', soft: 'rgba(211,47,47,0.1)', hover: 'rgba(211,47,47,0.08)'},
    success: {main: 'success.main', soft: 'rgba(46,125,50,0.1)', hover: 'rgba(46,125,50,0.08)'},
    warning: {main: 'warning.main', soft: 'rgba(237,108,2,0.1)', hover: 'rgba(237,108,2,0.08)'},
}

type ConfirmType = 'delete' | 'approve' | 'reject'

export type PropertyCardMenuProps = {
    id?: number
    resource?: string
    mode?: RecordMode
    dark?: boolean
    itemLabel?: string
    onEdit?: () => void
    onDelete?: (id?: number) => void
    onApprove?: (id?: number) => void
    onReject?: (id?: number) => void
    showEdit?: boolean
    showDelete?: boolean
    pinned?: boolean
    onTogglePin?: () => void
}

/** یک آیتم منو با آیکون داخل باکس رنگی؛ کاملاً جدا از MenuItem پیش‌فرض MUI طراحی شده */
function ActionItem({
    icon,
    label,
    color,
    onClick,
}: {
    icon: ReactNode
    label: string
    color: ActionColor
    onClick: () => void
}) {
    const c = COLORS[color]
    return (
        <Stack
            direction="row"
            alignItems="center"
            spacing={1.25}
            onClick={onClick}
            sx={{
                px: 1.25,
                py: 1,
                borderRadius: 2,
                cursor: 'pointer',
                transition: 'background-color .12s ease',
                '&:hover': {bgcolor: c.hover},
            }}
        >
            <Box
                sx={{
                    width: 32,
                    height: 32,
                    borderRadius: 1.75,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    bgcolor: c.soft,
                    color: c.main,
                }}
            >
                {icon}
            </Box>
            <Typography
                variant="bodySm"
                fontWeight={600}
                sx={{color: color === 'primary' ? 'text.primary' : c.main}}
            >
                {label}
            </Typography>
        </Stack>
    )
}

export function PropertyCardMenu({
    id,
    resource = 'files',
    dark,
    itemLabel = 'فایل',
    onEdit,
    onDelete,
    onApprove,
    onReject,
    showEdit = true,
    showDelete = true,
    mode,
    pinned,
    onTogglePin,
}: PropertyCardMenuProps) {
    const navigate = useNavigate()
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null)
    const [confirm, setConfirm] = useState<ConfirmType | null>(null)

    const handleOpen = (event: MouseEvent<HTMLElement>) => {
        event.stopPropagation()
        setAnchorEl(event.currentTarget)
    }
    const handleClose = () => setAnchorEl(null)

    const handleEdit = () => {
        handleClose()
        if (onEdit) onEdit()
        else navigate(`/${resource}/${id}/edit`)
    }

    const handleTogglePin = () => {
        handleClose()
        onTogglePin?.()
    }

    const ask = (type: ConfirmType) => {
        handleClose()
        setConfirm(type)
    }
    const handleConfirm = () => {
        if (confirm === 'delete') onDelete?.(id)
        else if (confirm === 'approve') onApprove?.(id)
        else if (confirm === 'reject') onReject?.(id)
        setConfirm(null)
    }

    const CONFIRM_CONTENT: Record<
        ConfirmType,
        {icon: ReactNode; title: string; text: string; button: string; color: ActionColor}
    > = {
        delete: {
            icon: <WarningRoundedIcon />,
            title: `حذف ${itemLabel}`,
            text: `آیا از حذف این ${itemLabel} مطمئن هستید؟ این عملیات قابل بازگشت نیست.`,
            button: 'حذف',
            color: 'error',
        },
        approve: {
            icon: <CheckCircleRoundedIcon />,
            title: `تایید ${itemLabel}`,
            text: `آیا این ${itemLabel} تایید شود؟ پس از تایید برای کاربران نمایش داده می‌شود.`,
            button: 'تایید',
            color: 'success',
        },
        reject: {
            icon: <CancelRoundedIcon />,
            title: `رد کردن ${itemLabel}`,
            text: `آیا از رد کردن این ${itemLabel} مطمئن هستید؟`,
            button: 'رد کردن',
            color: 'warning',
        },
    }

    const active = confirm ? CONFIRM_CONTENT[confirm] : null
    const activeColor = active ? COLORS[active.color] : null

    return (
        <>
            <IconButton
                size="small"
                onClick={handleOpen}
                sx={{
                    position: 'absolute',
                    top: 8,
                    insetInlineEnd: 8,
                    zIndex: 2,
                    width: 30,
                    height: 30,
                    bgcolor: dark ? 'rgba(0,0,0,0.4)' : 'background.paper',
                    color: dark ? '#fff' : 'text.secondary',
                    backdropFilter: dark ? 'blur(4px)' : undefined,
                    boxShadow: dark ? 'none' : '0 2px 6px rgba(0,0,0,0.08)',
                    '&:hover': {bgcolor: dark ? 'rgba(0,0,0,0.6)' : 'action.hover'},
                }}
            >
                <MoreVertRoundedIcon fontSize="small" />
            </IconButton>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleClose}
                onClick={(e) => e.stopPropagation()}
                anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
                transformOrigin={{vertical: 'top', horizontal: 'left'}}
                PaperProps={{
                    sx: {
                        mt: 0.75,
                        p: 0.75,
                        borderRadius: 2.5,
                        minWidth: 190,
                        boxShadow: '0 12px 28px -8px rgba(0,0,0,0.22)',
                    },
                }}
                MenuListProps={{sx: {p: 0, display: 'flex', flexDirection: 'column', gap: 0.25}}}
            >
                {onTogglePin && (
        <ActionItem
            icon={
                pinned ? (
                    <PushPinRoundedIcon sx={{fontSize: 17}} />
                ) : (
                    <PushPinOutlinedIcon sx={{fontSize: 17}} />
                )
            }
            label={pinned ? 'حذف پین' : 'پین کردن'}
            color={pinned ? 'warning' : 'primary'}
            onClick={handleTogglePin}
        />
    )}

                {mode === 'request' && (
                    <ActionItem
                        icon={<CheckCircleRoundedIcon sx={{fontSize: 17}} />}
                        label="تایید"
                        color="success"
                        onClick={() => ask('approve')}
                    />
                )}
                {mode === 'request' && (
                    <ActionItem
                        icon={<CancelRoundedIcon sx={{fontSize: 17}} />}
                        label="رد کردن"
                        color="warning"
                        onClick={() => ask('reject')}
                    />
                )}
                {showEdit && (
                    <ActionItem
                        icon={<EditRoundedIcon sx={{fontSize: 17}} />}
                        label="ویرایش"
                        color="primary"
                        onClick={handleEdit}
                    />
                )}
                {showDelete && (
                    <ActionItem
                        icon={<DeleteRoundedIcon sx={{fontSize: 17}} />}
                        label="حذف"
                        color="error"
                        onClick={() => ask('delete')}
                    />
                )}
            </Menu>

            <Dialog
                open={Boolean(confirm)}
                onClose={() => setConfirm(null)}
                maxWidth="xs"
                fullWidth
                onClick={(e) => e.stopPropagation()}
                PaperProps={{sx: {borderRadius: 3}}}
            >
                <DialogContent
                    sx={{
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        textAlign: 'center',
                        gap: 1.5,
                        pt: 3.5,
                    }}
                >
                    <Box
                        sx={{
                            width: 52,
                            height: 52,
                            borderRadius: '50%',
                            bgcolor: activeColor?.soft,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: activeColor?.main,
                        }}
                    >
                        {active?.icon}
                    </Box>
                    <Typography variant="titleMd" fontWeight={700}>
                        {active?.title}
                    </Typography>
                    <Typography variant="bodySm" color="text.secondary">
                        {active?.text}
                    </Typography>
                </DialogContent>
                <DialogActions sx={{px: 3, pb: 2.5, gap: 1}}>
                    <Button fullWidth variant="outlined" onClick={() => setConfirm(null)}>
                        انصراف
                    </Button>
                    <Button
                        fullWidth
                        color={
                            active?.color === 'warning'
                                ? 'warning'
                                : active?.color === 'success'
                                  ? 'success'
                                  : 'error'
                        }
                        variant="contained"
                        onClick={handleConfirm}
                    >
                        {active?.button}
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    )
}
