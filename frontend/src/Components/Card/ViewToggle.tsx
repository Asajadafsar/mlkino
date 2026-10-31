import GridViewRoundedIcon from '@mui/icons-material/GridViewRounded'
import ViewListRoundedIcon from '@mui/icons-material/ViewListRounded'
import {ToggleButton, ToggleButtonGroup, Tooltip} from '@mui/material'
import {alpha, useTheme} from '@mui/material/styles'
import {ViewMode} from '../../Core/useViewMode'

export function ViewToggle({
    view,
    onChange,
}: {
    view: ViewMode
    onChange: (view: ViewMode) => void
}) {
    const theme = useTheme()
    const primary = theme.palette.primary

    return (
        <ToggleButtonGroup
            exclusive
            size="small"
            value={view}
            onChange={(_, next: ViewMode | null) => {
                if (next) onChange(next)
            }}
            sx={{
                height: 44,
                borderRadius: '12px',
                p: '3px',
                gap: '3px',
                bgcolor: alpha(primary.main, 0.05),
                border: '1px solid',
                borderColor: alpha(primary.main, 0.14),
                '& .MuiToggleButton-root': {
                    border: 'none',
                    borderRadius: '9px !important',
                    px: 1.3,
                    color: 'text.secondary',
                    transition: 'background-color .2s ease, color .2s ease',
                    '&:hover': {bgcolor: alpha(primary.main, 0.08)},
                    '&.Mui-selected': {
                        bgcolor: 'background.paper',
                        color: 'primary.main',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.06)',
                        '&:hover': {bgcolor: 'background.paper'},
                    },
                    '& .MuiSvgIcon-root': {fontSize: 20},
                },
            }}
        >
            <ToggleButton value="list" aria-label="نمای لیستی">
                <Tooltip title="نمای لیستی">
                    <ViewListRoundedIcon />
                </Tooltip>
            </ToggleButton>
            <ToggleButton value="card" aria-label="نمای کارتی">
                <Tooltip title="نمای کارتی">
                    <GridViewRoundedIcon />
                </Tooltip>
            </ToggleButton>
        </ToggleButtonGroup>
    )
}