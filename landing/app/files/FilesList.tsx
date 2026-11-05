"use client";
import { Grid } from "@mui/material";
import FileToolbar from "../Components/Sort/Sort";
import CardFile from "../Components/Card/CardFile";
import { propertyItem } from "../Core/sampleData";
import ResponsiveFilter from "../Components/Filter/ResponsiveFilter";

export default function FilesList() {
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
        {[1, 2, 3, 4, 5].map((item) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={item}>
            <CardFile data={propertyItem} />
          </Grid>
        ))}
   
      </Grid>
    </Grid>
  );
}
