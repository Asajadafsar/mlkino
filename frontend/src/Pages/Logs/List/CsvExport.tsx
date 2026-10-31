export interface CsvExportProps<T extends Record<string, unknown>> {
  data: T[];
  fileName?: string;
}

export const downloadCsv = <T extends Record<string, unknown>>({
  data,
  fileName = "export.csv",
}: CsvExportProps<T>) => {
  if (!data.length) return;

  const headers = Object.keys(data[0]);

  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      headers
        .map((header) => {
          const value = row[header];

          if (value === null || value === undefined) {
            return '""';
          }

          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};