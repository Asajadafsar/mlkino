"use client";
import {useEffect, useState} from "react";
import {Alert, Grid, Pagination} from "@mui/material";
import {apiOrigin, useLandingSession} from "@/app/Core/Session";
import {toPublicFile} from "@/app/Core/publicFiles";
import type {PropertyType} from "@/app/Core/types";
import CardFile from "../Card/CardFile";

export default function SavedItems() {
  const {user, loading} = useLandingSession();
  const [state, setState] = useState<{key: string; items?: PropertyType[]; pages?: number; error?: string}>();
  const [page, setPage] = useState(1);
  const key = `${user?.id ?? ""}:${page}`;
  useEffect(() => {
    if (!user) return;
    const controller = new AbortController();
    async function load() {
      try {
        const size = 24;
        const response = await fetch(`${apiOrigin()}/api/panel/workflows/favorites/?page=${page}&page_size=${size}`,
          {credentials: "include", signal: controller.signal, cache: "no-store"});
        if (!response.ok) throw new Error();
        const {data} = await response.json();
        if (!controller.signal.aborted) setState({
          key,
          items: data.results.map((row: {property: Parameters<typeof toPublicFile>[0]}) => toPublicFile(row.property)),
          pages: Math.ceil(data.total_results / size),
        });
      } catch {
        if (!controller.signal.aborted) setState({key, error: "دریافت فایل‌های ذخیره‌شده انجام نشد."});
      }
    }
    void load();
    return () => controller.abort();
  }, [user, page, key]);
  if (loading || (user && state?.key !== key)) return <p role="status">در حال دریافت علاقه‌مندی‌ها…</p>;
  if (!user) return <Alert severity="info">برای مشاهدهٔ علاقه‌مندی‌ها وارد حساب خود شوید.</Alert>;
  if (state?.error) return <Alert severity="error">{state.error}</Alert>;
  if (!state?.items?.length) return <Alert severity="info">هیچ فایل ذخیره‌شده‌ای موجود نیست.</Alert>;
  return <Grid container spacing={2}>
    {state.items.map(item => <Grid size={{xs:12, sm:6, md:4, lg:3}} key={item.id}>
      <CardFile data={item} initialBookmarked onBookmarkToggle={bookmarked => {
        if (!bookmarked) setState(current => current && ({...current, items: current.items?.filter(file => file.id !== item.id)}));
      }}/>
    </Grid>)}
    {(state.pages ?? 0) > 1 && <Grid size={12}><Pagination page={page} count={state.pages} onChange={(_, next) => setPage(next)}/></Grid>}
  </Grid>;
}
