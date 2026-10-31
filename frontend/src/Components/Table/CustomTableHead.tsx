import { Checkbox } from '@mui/material'
import TableCell from '@mui/material/TableCell'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableSortLabel from '@mui/material/TableSortLabel'

export type HeadCellType = {
    name: string
    label: string
    sortable?: boolean
}[]

export function createTableHeadCells(label, name) {
    return {label, name, key: name}
}

export function CustomTableHead(props: {
    headCells: HeadCellType
    search: any
    onRequestSort: any
    noDelete?: boolean
    noEdit?: boolean
    hasDetail?: boolean
    groupEdit?: boolean
    allSelected?: boolean
    someSelected?: boolean
    onSelectAll?: (checked: boolean) => void
}) {
    const {
        headCells,
        search,
        onRequestSort,
        noDelete,
        noEdit,
        hasDetail,
        groupEdit,
        allSelected,
        someSelected,
        onSelectAll,
    } = props

    const createSortHandler = (property) => (event) => {
        onRequestSort(event, property)
    }

    return (
        <TableHead>
            <TableRow>
                {groupEdit && (
                    <TableCell padding="checkbox">
                        <Checkbox
                            checked={allSelected}
                            indeterminate={someSelected}
                            onChange={(e) => onSelectAll?.(e.target.checked)}
                            color="primary"
                        />
                    </TableCell>
                )}
                {headCells.map((headCell) => (
                    <TableCell
                        key={headCell.name}
                        color="secondary"
                        sx={{
                            fontSize: {
                                xs: '14px',
                                sm: '15px',
                                lg: '16px',
                                xl: '18px',
                            },
                        }}
                    >
                        <TableSortLabel
                            disabled={headCell.sortable === false}
                            hideSortIcon={headCell.sortable === false}
                            active={search.sort === headCell.name}
                            direction={
                                search.sort === headCell.name
                                    ? search.order === 1
                                        ? 'asc'
                                        : 'desc'
                                    : 'asc'
                            }
                            sx={{
                                whiteSpace: 'nowrap',
                            }}
                            onClick={createSortHandler(headCell.name)}
                            color="#434B59"
                        >
                            {headCell.label}
                        </TableSortLabel>
                    </TableCell>
                ))}
                {/* {!noEdit && <TableCell></TableCell>} */}
                {hasDetail && <TableCell></TableCell>}
                {!noDelete && <TableCell></TableCell>}
            </TableRow>
        </TableHead>
    )
}
