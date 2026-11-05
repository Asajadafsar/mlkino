import { Container } from "@mui/material";
import React from "react";
import SavedItemsHeader from "../Components/SavedItems/SavedItemsHeader";
import SavedItems from "../Components/SavedItems/SavedItems";
import EmptySavedState from "../Components/SavedItems/EmptySavedState";
import RequestPropertyBanner from "../Components/SavedItems/RequestPropertyBanner";

export default function SavedPage() {
  return (
    <Container
      maxWidth={false}
      sx={{
        px: {
          xs: 2,
          sm: 4,
        },
        width: "100%",
        maxWidth: "var(--page-max-width)",
        display: "flex",
        flexDirection: "column",
        gap: 3,
        mb: 5,
        mt:2
      }}
    >
      <SavedItemsHeader />
      <SavedItems/>
      <EmptySavedState/>
      <RequestPropertyBanner />
    </Container>
  );
}
