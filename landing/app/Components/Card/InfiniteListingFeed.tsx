"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { PropertyType } from "@/app/Core/types";
import ListingCard from "./ListingCard";
import styles from "./infinite-listing-feed.module.css";

const PAGE_SIZE = 8;
const MAX_RENDERED = 24;
const PRUNE_COUNT = 12;
type WindowRange = { start: number; end: number; offset: number };

export default function InfiniteListingFeed({ items, label }: { items: PropertyType[]; label: string }) {
  const [range, setRange] = useState<WindowRange>({ start: 0, end: PAGE_SIZE, offset: 0 });
  const rangeRef = useRef(range);
  const cards = useRef<HTMLDivElement>(null);
  const sentinel = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(() => {
    const current = rangeRef.current;
    let start = current.start;
    let offset = current.offset;
    if (current.end - current.start >= MAX_RENDERED) {
      const first = cards.current?.querySelector<HTMLElement>(`[data-feed-index="${start}"]`);
      const after = cards.current?.querySelector<HTMLElement>(`[data-feed-index="${start + PRUNE_COUNT}"]`);
      if (first && after) {
        offset += Math.max(0, after.getBoundingClientRect().top - first.getBoundingClientRect().top);
        start += PRUNE_COUNT;
      }
    }
    const next = { start, end: current.end + PAGE_SIZE, offset };
    rangeRef.current = next;
    setRange(next);
  }, []);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || items.length === 0) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) loadMore();
    }, { rootMargin: "240px 0px" });
    observer.observe(target);
    return () => observer.disconnect();
  }, [items.length, loadMore]);

  if (items.length === 0) return null;

  return <div aria-label={label}>
    {range.offset > 0 && <div aria-hidden="true" style={{ height: range.offset }} />}
    <div className={styles.feed}>
      <div ref={cards} className={styles.cards}>
        {Array.from({ length: range.end - range.start }, (_, slot) => {
          const index = range.start + slot;
          const item = items[index % items.length];
          return <div key={`${item.id}-${index}`} data-feed-index={index} className={styles.item}><ListingCard data={item} /></div>;
        })}
      </div>
      <div ref={sentinel} className={styles.sentinel} aria-hidden="true" />
    </div>
  </div>;
}
