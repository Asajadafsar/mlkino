export function formatPrice(price: number | null): string {
  if (price === null) return '--'
  return new Intl.NumberFormat("fa-IR").format(price) + ' تومان';
}
