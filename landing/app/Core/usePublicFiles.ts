"use client";

import {useEffect, useState} from "react";
import {apiOrigin} from "./Session";
import {getPublicFiles} from "./publicFiles";

export function usePublicFiles(filters: string) {
  const [state, setState] = useState<{key: string; data?: Awaited<ReturnType<typeof getPublicFiles>>; error?: string}>();
  useEffect(() => {
    const controller = new AbortController();
    getPublicFiles(apiOrigin(), filters, controller.signal).then(data => {
      if (!controller.signal.aborted) setState({key: filters, data});
    }).catch(error => {
      if (!controller.signal.aborted) setState({key: filters, error: error.message});
    });
    return () => controller.abort();
  }, [filters]);
  return state?.key === filters ? state : undefined;
}
