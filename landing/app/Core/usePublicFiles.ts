"use client";

import {useEffect, useState} from "react";
import {apiOrigin} from "./Session";
import {getPublicFiles} from "./publicFiles";

export function usePublicFiles(filters: string, kind: "file" | "request" = "file") {
  const [state, setState] = useState<{key: string; data?: Awaited<ReturnType<typeof getPublicFiles>>; error?: string}>();
  const key = `${kind}:${filters}`;
  useEffect(() => {
    const controller = new AbortController();
    getPublicFiles(apiOrigin(), filters, controller.signal, kind).then(data => {
      if (!controller.signal.aborted) setState({key, data});
    }).catch(error => {
      if (!controller.signal.aborted) setState({key, error: error.message});
    });
    return () => controller.abort();
  }, [filters, key, kind]);
  return state?.key === key ? state : undefined;
}
