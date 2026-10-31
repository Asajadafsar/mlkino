import Table from '@mui/material/Table'
import TableBody from '@mui/material/TableBody'
import TableCell from '@mui/material/TableCell'
import TableContainer from '@mui/material/TableContainer'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import Paper from '@mui/material/Paper'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import {IconButton} from '@mui/material'
import EditIcon from '@mui/icons-material/Edit'
import {PropertyType} from '../../Core/types'
import {useNavigate} from 'react-router-dom'
import {Dispatch, SetStateAction} from 'react'



interface Props {
    data: PropertyType[] | null
    removeProperty: (id: number) => void
    editProperty: (id: number) => void
    editMode: boolean
    url: string
    setDeleteId: Dispatch<SetStateAction<number | null>>
    setDeleteModal: Dispatch<SetStateAction<boolean>>
}
export default function PropertiesTable({
    data,
    removeProperty,
    editProperty,
    editMode,
    url,
    setDeleteId,
    setDeleteModal,
}: Props) {
    const rows = data?.map((item) => ({
        id: item.id,
        name: item.name,
        value: item.value,
    }))
    const navigate = useNavigate()
    return (
        <TableContainer component={Paper} sx={{mt: 3}}>
            <Table
                sx={{minWidth: 650, border: '2px solid #3f3f3f', borderRadius: 10}}
                aria-label="simple table"
            >
                <TableHead>
                    <TableRow>
                        <TableCell
                            align="center"
                            sx={{
                                fontSize: {
                                    xs: '15px',
                                    md: '17px',
                                },
                                fontWeight: 'bold',
                            }}
                        >
                            نام
                        </TableCell>
                        <TableCell
                            align="center"
                            sx={{
                                fontSize: {
                                    xs: '15px',
                                    md: '17px',
                                },
                                fontWeight: 'bold',
                            }}
                        >
                            مقدار
                        </TableCell>
                        <TableCell align="left"></TableCell>
                        <TableCell align="left"></TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {rows?.map((row) => (
                        <TableRow
                            key={row.name}
                            sx={{'&:last-child td, &:last-child th': {border: 0}}}
                        >
                            <TableCell
                                align="center"
                                component="th"
                                scope="row"
                                sx={{
                                    fontSize: {
                                        xs: '14px',
                                        md: '16px',
                                    },
                                }}
                            >
                                {row.name}
                            </TableCell>
                            <TableCell
                                align="center"
                                sx={{
                                    fontSize: {
                                        xs: '14px',
                                        md: '16px',
                                    },
                                }}
                            >
                                {row.value}
                            </TableCell>

                            <TableCell align={'right'}>
                                <IconButton
                                    size="large"
                                    onClick={() => {
                                        setDeleteId(row.id)
                                        setDeleteModal(true)
                                    }}
                                >
                                    <DeleteOutlinedIcon />
                                </IconButton>
                            </TableCell>
                            <TableCell align="left">
                                <IconButton
                                    size="large"
                                    onClick={() => {
                                        if (editMode) {
                                            navigate(`${url}${row.id}`, {state: {row}})
                                        } else {
                                            editProperty(row.id)
                                        }
                                    }}
                                >
                                    <EditIcon />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}
