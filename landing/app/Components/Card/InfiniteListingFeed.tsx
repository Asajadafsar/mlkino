"use client";

import {useEffect, useRef, useState} from "react";
import type {PropertyType} from "@/app/Core/types";
import ListingCard from "./ListingCard";
import styles from "./infinite-listing-feed.module.css";

const PAGE_SIZE = 8;

export default function InfiniteListingFeed({items, label}: {items: PropertyType[]; label: string}) {
  const [count, setCount] = useState(PAGE_SIZE);
  const sentinel = useRef<HTMLDivElement>(null);
  const sample = items.length > 0 && !items[0].published;

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !items.length || (!sample && count >= items.length)) return;
    if (typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      observer.disconnect();
      setCount(current => current + PAGE_SIZE);
    }, {rootMargin: "240px 0px"});
    observer.observe(target);
    return () => observer.disconnect();
  }, [count, items.length, sample]);

  if (!items.length) return null;
  return <div aria-label={label} className={styles.feed}>
    <div className={styles.cards}>
      {(sample ? Array.from({length: count}, (_, index) => items[index % items.length]) : items.slice(0, count))
        .map((item, index) => <div key={`${item.id}-${index}`} data-feed-index={index} className={styles.item}><ListingCard data={item}/></div>)}
    </div>
    <div ref={sentinel} className={styles.sentinel} aria-hidden="true"/>
  </div>;
}
