// Components/Table/ViewModeToggle.tsx
import {ToggleButton, ToggleButtonGroup} from '@mui/material'
import ViewListIcon from '@mui/icons-material/ViewList'
import ViewModuleIcon from '@mui/icons-material/ViewModule'
import { ViewMode } from '../../Core/useViewMode'

export function ViewModeToggle({
    value,
    onChange,
}: {
    value: ViewMode
    onChange: (mode: ViewMode) => void
}) {
    return (
        <ToggleButtonGroup
            value={value}
            exclusive
            size="small"
            onChange={(_, newMode: ViewMode | null) => {
                if (newMode !== null) onChange(newMode)
            }}
        >
            <ToggleButton value="list" aria-label="نمایش لیست">
                <ViewListIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="card" aria-label="نمایش کارت">
                <ViewModuleIcon fontSize="small" />
            </ToggleButton>
        </ToggleButtonGroup>
    )
}