"use client";

import { useEffect, useRef, useState } from "react";
import type { PropertyType } from "@/app/Core/types";
import ListingCard from "./ListingCard";
import styles from "./infinite-listing-feed.module.css";

const PAGE_SIZE = 3;

export default function InfiniteListingFeed({ items, label }: { items: PropertyType[]; label: string }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = sentinel.current;
    if (!node || items.length === 0) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) setVisibleCount((count) => count + PAGE_SIZE);
    }, { rootMargin: "240px 0px" });

    observer.observe(node);
    return () => observer.disconnect();
  }, [items.length]);

  if (items.length === 0) return null;

  return <div className={styles.feed} aria-label={label}>
    {Array.from({ length: visibleCount }, (_, index) => {
      const item = items[index % items.length];
      return <ListingCard key={`${item.id}-${index}`} data={item} />;
    })}
    <div ref={sentinel} className={styles.sentinel} aria-hidden="true" />
  </div>;
}
