"use client";

import { ViewValue } from "../Sort/Sort";
import CardFile, { CardFileProps } from "./CardFile";
import CardFileHorizontal from "./CardFileHorizontal";

export default function CardFileView({
  view,
  ...props
}: CardFileProps & { view: ViewValue }) {
  return view === "list" ? (
    <CardFileHorizontal {...props} />
  ) : (
    <CardFile {...props} />
  );
}