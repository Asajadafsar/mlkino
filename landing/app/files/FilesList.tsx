"use client";
import { Grid, Pagination, Paper, Typography } from "@mui/material";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import FileToolbar from "../Components/Sort/Sort";
import CardFile from "../Components/Card/CardFile";
import { usePublicFiles } from "../Core/usePublicFiles";
import { PROPERTIES } from "../Core/listings";
import ResponsiveFilter from "../Components/Filter/ResponsiveFilter";

export default function FilesList({featured = false}: {featured?: boolean}) {
  const router = useRouter(), pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = new URLSearchParams();
  for (const key of ["page", "province", "city", "district", "neighborhood", "propertyType", "contractType", "areaFrom", "areaTo", "priceFrom", "priceTo", "roomCount", "buildYear", "totalFloor", "floor"]) {
    const value = searchParams.get(key);
    if (value) filters.set(key, value);
  }
  const deal = searchParams.get("deal"), land = searchParams.get("landSubtype"), search = searchParams.get("q"), rooms = searchParams.get("rooms");
  if (!filters.has("contractType") && (deal === "buy" || deal === "rent")) filters.set("contractType", deal === "buy" ? "فروش" : "رهن و اجاره");
  if (land) filters.set("landUse", land);
  if (search) filters.set("search", search);
  if (rooms) filters.set("roomsFrom", rooms);
  const unfiltered = !filters.size;
  if (featured) filters.set("featured", "1");
  const result = usePublicFiles(filters.toString());
  const properties = unfiltered && result?.data?.count === 0 ? PROPERTIES : result?.data?.items || [];
  const pages = result?.data ? Math.ceil(result.data.count / result.data.pageSize) : 0;

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
        {!properties.length && <Grid size={12}><Paper variant="outlined" sx={{p:4,textAlign:"center",borderRadius:4}}><Typography role="status" sx={{fontWeight:800}}>{result?.error || (result ? "ملکی با این فیلترها پیدا نشد." : "در حال دریافت فایل‌ها…")}</Typography></Paper></Grid>}
        {pages > 1 && <Grid size={12}><Pagination count={pages} page={Number(filters.get("page")) || 1} onChange={(_, page) => {const next = new URLSearchParams(searchParams); next.set("page", String(page)); router.push(`${pathname}?${next}`);}}/></Grid>}

      </Grid>
    </Grid>
  );
}
