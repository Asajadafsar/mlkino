"use client";

export default function LandingError({ retry }: { retry: () => void }) {
  return (
    <main
      dir="rtl"
      style={{
        minHeight: "60vh",
        display: "grid",
        placeContent: "center",
        gap: 16,
        padding: 24,
        textAlign: "center",
        color: "#15244d",
      }}
    >
      <h1 style={{ fontSize: 22, fontWeight: 800 }}>بارگذاری صفحه با مشکل روبه‌رو شد</h1>
      <p>صفحه را دوباره بارگذاری کنید تا نمایش ادامه پیدا کند.</p>
      <button
        type="button"
        onClick={retry}
        style={{ justifySelf: "center", border: 0, borderRadius: 12, padding: "12px 22px", background: "#075bff", color: "white", font: "inherit", cursor: "pointer" }}
      >
        تلاش دوباره
      </button>
    </main>
  );
}
