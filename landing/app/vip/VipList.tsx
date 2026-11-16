'use client'
import { Grid } from '@mui/material';
import ResponsiveFilter from '../Components/Filter/ResponsiveFilter';
import FileToolbar from '../Components/Sort/Sort';
import CardFile from '../Components/Card/CardFile';
import { PROPERTIES } from '../Core/listings';

export default function VipList() {
  return (
    <Grid container spacing={2}>
      <ResponsiveFilter />

      {/* کارت‌ها */}
      <Grid
        container
        size={{ xs: 12, md: 8, lg: 9 }}
        rowSpacing={2}
        columnSpacing={1}
      >
        <FileToolbar />
        {PROPERTIES.map((item) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={item.id}>
            <CardFile data={item} />
          </Grid>
        ))}

      </Grid>
    </Grid>
  );
}
