import {useCallback, useEffect, useRef, useState} from 'react'
import AssignmentTurnedInRoundedIcon from '@mui/icons-material/AssignmentTurnedInRounded'
import {Link} from 'react-router-dom'
import {useSelector} from 'react-redux'
import {selectRole, UserRole} from '../../redux/RoleSlice'
import {useDispatch} from 'react-redux'
import {DataProvider} from '../../Core/DataProvider'
import {formatDate} from '../../Core/FormatDate'
import {setUtil} from '../../redux/UtilSlice'
import {taskStatusOptions, type TasksType} from '../Tasks/Tasks'
import {
    Stack,
    Checkbox,
    CircularProgress,
    LinearProgress,
    Alert,
    Button,
    Chip,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Typography,
} from '@mui/material'

export default function TodayImportantTasks() {
    const dispatch = useDispatch()
    const role = useSelector(selectRole)
    const [tasks, setTasks] = useState<TasksType[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [togglingId, setTogglingId] = useState<number | null>(null)
    const togglePending = useRef(false)

    const getTasks = useCallback(
        async (showLoading = true) => {
            if (showLoading) setLoading(true)
            setError('')
            try {
                const response = await DataProvider.get<{
                    total_results: number
                    results: TasksType[]
                }>('tasks/?period=today')
                setTasks(response.data.results)
            } catch (error: any) {
                const message = error.message || 'خطا در دریافت تسک‌ها'
                setError(message)
                dispatch(setUtil({open: true, message, severity: 'error'}))
            } finally {
                if (showLoading) setLoading(false)
            }
        },
        [dispatch],
    )

    useEffect(() => {
        getTasks()
    }, [getTasks])

    const toggleTask = async (id: number) => {
        if (togglePending.current) return
        togglePending.current = true
        setTogglingId(id)
        try {
            await DataProvider.patch(`dashboard/tasks/${id}/toggle/`)
            await getTasks(false)
        } catch (error: any) {
            dispatch(
                setUtil({
                    open: true,
                    message: error.message || 'خطا در تغییر وضعیت تسک',
                    severity: 'error',
                }),
            )
        } finally {
            togglePending.current = false
            setTogglingId(null)
        }
    }

    return (
        <Paper
            elevation={0}
            sx={{p: 2, borderRadius: 3, border: '1px solid', borderColor: 'divider'}}
        >
            {loading && <LinearProgress aria-label="دریافت تسک‌ها" />}
            {error && (
                <Alert
                    severity="error"
                    action={
                        <Button color="inherit" onClick={() => getTasks()}>
                            تلاش مجدد
                        </Button>
                    }
                >
                    {error}
                </Alert>
            )}
            <List disablePadding>
                {tasks.map((task) => (
                    <ListItem
                        key={task.id}
                        sx={{
                            borderBottom: '1px solid',
                            borderColor: 'divider',
                            '&:last-of-type': {borderBottom: 'none'},
                            opacity: task.status === 'done' ? 0.5 : 1,
                        }}
                        secondaryAction={
                            <Chip
                                label={
                                    taskStatusOptions.find(({value}) => value === task.status)
                                        ?.label ?? '--'
                                }
                                size="small"
                                color={
                                    task.status === 'done'
                                        ? 'success'
                                        : task.status === 'in_progress'
                                          ? 'info'
                                          : 'warning'
                                }
                                variant="outlined"
                            />
                        }
                    >
                        <ListItemIcon sx={{minWidth: 40}}>
                            {togglingId === task.id ? (
                                <CircularProgress size={22} aria-label="تغییر وضعیت تسک" />
                            ) : (
                                <Checkbox
                                    edge="start"
                                    checked={task.status === 'done'}
                                    onChange={() => toggleTask(task.id)}
                                    disabled={togglingId !== null || loading}
                                    inputProps={{'aria-label': `تغییر وضعیت ${task.title}`}}
                                />
                            )}
                        </ListItemIcon>
                        <ListItemText
                            primary={task.title}
                            secondary={task.due_date ? formatDate(task.due_date) : undefined}
                            primaryTypographyProps={{
                                sx: {
                                    textDecoration:
                                        task.status === 'done' ? 'line-through' : 'none',
                                },
                            }}
                        />
                    </ListItem>
                ))}
                {!loading && !error && tasks.length === 0 && (
                    <Stack alignItems="center" spacing={1} sx={{p: 3.5}}>
                        <AssignmentTurnedInRoundedIcon sx={{fontSize: 70, color: '#58c79a', filter: 'drop-shadow(0 8px 10px #5ecaa030)'}} />
                        <Typography fontWeight={700}>کار مهمی برای امروز ثبت نشده است.</Typography>
                        <Typography variant="body2" color="text.secondary">برای شروع یک روز منظم، کارهای مهم و یادآوری‌های خود را ثبت کنید.</Typography>
                        {[UserRole.SUPERADMIN, UserRole.AGENCY].includes(role!) && <Button component={Link} to="/tasks/create" variant="contained" size="small">+ افزودن وظیفه جدید</Button>}
                    </Stack>
                )}
            </List>
        </Paper>
    )
}
