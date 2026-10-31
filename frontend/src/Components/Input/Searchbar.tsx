import FilterAltIcon from '@mui/icons-material/FilterAlt'
import FilterAltOutlinedIcon from '@mui/icons-material/FilterAltOutlined'
import SearchIcon from '@mui/icons-material/Search'
import {Box, Button, Collapse, Divider, IconButton, InputBase, Stack} from '@mui/material'
import {useState} from 'react'
import {CustomFilter} from '../Filter/CustomFilter'

export function Searchbar(props) {
    const {filtersData, setParams, searchField, placeholder, noFilters, params} = props
    const [filterIn, setFilterIn] = useState(params.filter)
    const [textFieldData, setTextfieldData] = useState('')
    const handleFilterIn = () => {
        setFilterIn(!filterIn)
    }
    const handleChange = (event) => {
        const value = event.target.value
        setTextfieldData(value)
        setParams((filter) => {
            const newFilter = {...filter}

            if (value === null) {
                delete newFilter.search
            } else {
                newFilter.search = value
            }

            if (!newFilter.ordering) {
                delete newFilter.ordering
            }

            return newFilter
        })
    }
    return (
        <Box width="100%" mt={2}>
            <Stack direction="row" gap={1} alignItems="center" sx={{mb: 1.5, p: .5, border: '1px solid', borderColor: 'divider', borderRadius: '12px', maxWidth: 420}}>
                <SearchIcon sx={{mx: 1, color: 'text.secondary'}} />
                <InputBase placeholder={props.searchText || 'جستجو…'} value={textFieldData} onChange={handleChange} inputProps={{'aria-label': 'جستجو در فهرست'}} sx={{flex: 1, fontSize: 13}} />
            </Stack>
        
            {!noFilters && (
                    <CustomFilter filtersData={filtersData} setParams={setParams} params={params} />
            )}
        </Box>
    )
}
