"use client";
import { Grid, Paper, Typography } from "@mui/material";
import { useSearchParams } from "next/navigation";
import { useMemo } from "react";
import FileToolbar from "../Components/Sort/Sort";
import CardFile from "../Components/Card/CardFile";
import { PROPERTIES } from "../Core/listings";
import ResponsiveFilter from "../Components/Filter/ResponsiveFilter";

export default function FilesList() {
  const searchParams = useSearchParams();
  const properties = useMemo(() => {
    const priceFrom = Number(searchParams.get("priceFrom"));
    const priceTo = Number(searchParams.get("priceTo"));
    const areaFrom = Number(searchParams.get("areaFrom"));
    const areaTo = Number(searchParams.get("areaTo"));
    const city = searchParams.get("city");
    const propertyType = searchParams.get("propertyType");
    const rooms = Number(searchParams.get("rooms"));

    return PROPERTIES.filter(item => {
      const price = Number(item.totalPrice || 0);
      const area = Number(item.area || 0);
      if (Number.isFinite(priceFrom) && priceFrom > 0 && price < priceFrom) return false;
      if (Number.isFinite(priceTo) && priceTo > 0 && price > priceTo) return false;
      if (Number.isFinite(areaFrom) && areaFrom > 0 && area < areaFrom) return false;
      if (Number.isFinite(areaTo) && areaTo > 0 && area > areaTo) return false;
      if (city && city !== item.city) return false;
      if (propertyType && propertyType !== item.propertyType) return false;
      if (Number.isFinite(rooms) && rooms > 0 && Number(item.roomCount || 0) < rooms) return false;
      return true;
    });
  }, [searchParams]);

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
        {properties.map((item) => (
          <Grid size={{ xs: 12, sm: 6, lg: 4, xl: 3 }} key={item.id}>
            <CardFile data={item} />
          </Grid>
        ))}
        {!properties.length && <Grid size={12}><Paper variant="outlined" sx={{p:4,textAlign:"center",borderRadius:4}}><Typography sx={{fontWeight:800}}>ملکی با این بازه قیمت پیدا نشد.</Typography><Typography color="text.secondary" sx={{mt:1}}>مبلغ حداقل یا حداکثر را تغییر دهید و دوباره جستجو کنید.</Typography></Paper></Grid>}

      </Grid>
    </Grid>
  );
}
