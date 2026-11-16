import React from 'react'
import TitleHeader from '../Components/PropertyDetail/TitleHeader'
import { Container } from '@mui/material'
import FilesList from './FilesList'

export default function FilesPage() {
  return (
     <Container
      maxWidth={false}
      sx={{
        px: {
          xs: 2,
          sm: 4,
        },
        width: "100%",
        maxWidth: "var(--page-max-width)",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        mb: 5,
        mt:2
      }}
    >
        <TitleHeader title='لیست فایل های ملکی' />
       <FilesList/>
    </Container>
  )
}
