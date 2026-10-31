import { useState, useEffect, useRef } from "react";
import { Button } from "@mui/material";
import IosShareIcon from "@mui/icons-material/IosShare";

// ─── CSV Utility ─────────────────────────────────────────────────────────────

export interface CsvExportProps<T extends Record<string, unknown>> {
  data: T[];
  fileName?: string;
}

export const downloadCsv = <T extends Record<string, unknown>>({
  data,
  fileName = "export.csv",
}: CsvExportProps<T>): void => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);

  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];
          if (value === null || value === undefined) return '""';
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ─── Types ────────────────────────────────────────────────────────────────────

const DEFAULT_ROW_OPTIONS = [5, 10, 25, 50, 100] as const;

type TableExportProps<T extends Record<string, unknown>> = {
  exportType: "table";
  data: T[];
  fileName?: string;
  rowOptions?: number[];
};

type ChartExportProps<T extends Record<string, unknown>> = {
  exportType: "chart";
  data: T[];
  fileName?: string;
};

type CsvExportButtonProps<T extends Record<string, unknown>> =
  | TableExportProps<T>
  | ChartExportProps<T>;

// ─── Component ────────────────────────────────────────────────────────────────

function CsvExportButton<T extends Record<string, unknown>>(
  props: CsvExportButtonProps<T>
) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { data, fileName = "export.csv", exportType } = props;
  const isTable = exportType === "table";
  const rowOptions =
    isTable && (props as TableExportProps<T>).rowOptions
      ? (props as TableExportProps<T>).rowOptions!
      : [...DEFAULT_ROW_OPTIONS];

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [open]);

  const handleExportAll = () => {
    downloadCsv({ data, fileName });
    setOpen(false);
  };

  const handleExportCount = (count: number) => {
    downloadCsv({ data: data.slice(0, count), fileName });
    setOpen(false);
  };

  const menuItemStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 16px",
    border: "none",
    background: "transparent",
    cursor: "pointer",
    textAlign: "right",
    display: "block",
    color: "black",
    fontSize: "0.875rem",
  };

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <Button
        variant="outlined"
        color="primary"
        startIcon={<IosShareIcon />}
        type="button"
        onClick={() => {
          if (isTable) {
            setOpen((prev) => !prev);
          } else {
            handleExportAll();
          }
        }}
      >
        خروجی CSV
      </Button>

      {isTable && open && (
        <div
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            right: 0,
            minWidth: "170px",
            background: "#ffffff",
            border: "1px solid #9fbcee",
            borderRadius: "8px",
            zIndex: 1000,
            overflow: "hidden",
          }}
        >
          {rowOptions.map((count) => (
            <button
              key={count}
              type="button"
              role="menuitem"
              onClick={() => handleExportCount(count)}
              style={menuItemStyle}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#F5F8FD";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              {count} ردیف اول
            </button>
          ))}

          <div style={{ borderTop: "1px solid #9fbcee" }}>
            <button
              type="button"
              role="menuitem"
              onClick={handleExportAll}
              style={{ ...menuItemStyle, color: "#60a5fa", fontWeight: 600 }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "#F5F8FD";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.background = "transparent";
              }}
            >
              همه ردیف‌ها ({data.length})
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default CsvExportButton;
