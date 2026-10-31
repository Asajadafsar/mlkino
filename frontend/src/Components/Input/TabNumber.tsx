import { Box, Typography } from "@mui/material"
import React from "react"

function TabNumber(props) {
    return (
        <Box display="inline-block" bgcolor="#E4E7ED" padding="0px 4px" marginLeft="16px"
            style={{ backgroundColor: props.tab == props.index ? "rgba(4, 135, 255, 0.1)" : "#E4E7ED" }}>
            <Typography>{props.number}</Typography>
        </Box>
    ) 
}



export default TabNumber