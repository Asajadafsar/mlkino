import {apiOrigin} from "./Session";

export async function setFileFavorite(id: number, saved: boolean) {
  const origin = apiOrigin();
  const csrf = await fetch(`${origin}/api/accounts/csrf/`, {credentials: "include", cache: "no-store"});
  if (!csrf.ok) throw new Error("عملیات علاقه‌مندی انجام نشد.");
  const {csrfToken} = await csrf.json();
  const response = await fetch(`${origin}/api/panel/workflows/favorites/${saved ? "" : `${id}/`}`, {
    credentials: "include",
    method: saved ? "POST" : "DELETE",
    headers: {"Content-Type": "application/json", "X-CSRFToken": csrfToken},
    body: saved ? JSON.stringify({property_id: id}) : undefined,
  });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(response.status === 401 ? "برای ذخیرهٔ فایل وارد حساب شوید." :
      payload?.message || "عملیات علاقه‌مندی انجام نشد.");
  }
}
