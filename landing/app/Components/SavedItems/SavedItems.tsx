"use client";
import React, { useState } from "react";
import StatsFilterBar, { FilterItem } from "../Filter/StatsFilterBar";
import { Grid } from "@mui/material";
import CardFile from "../Card/CardFile";
import { propertyItem } from "@/app/Core/sampleData";

type TabType = "all" | "buy" | "rent" | "requests";

const ITEMS: FilterItem<TabType>[] = [
  {
    key: "all",
    value: "همه فایل ها",
    count: "۱۶۸۰",
    color: "#d99a1e",
  },
  {
    key: "buy",
    value: "خرید و فروش",
    count: "۱۰۰۰",
    color: "#2563c9",
  },
  {
    key: "rent",
    value: "رهن و اجاره",
    count: "۳۴۰",
    color: "#7b3fb0",
  },
  {
    key: "requests",
    value: "درخواست ها",
    count: "۳۴۰",
    color: "#d1495b",
  },
];
export default function SavedItems() {
  const [tab, setTab] = useState<TabType>("all");

  return (
    <>
      <StatsFilterBar items={ITEMS} value={tab} onChange={setTab} />
      <Grid container spacing={2}>
        {[1, 2, 3, 4, 5].map((item) => (
          <Grid size={{ xs: 12, sm: 6,md:4, lg: 3, xl: 12/5 }} key={item}>
            <CardFile data={propertyItem} />
          </Grid>
        ))}
      </Grid>
    </>
  );
}
