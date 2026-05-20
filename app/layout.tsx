import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bread Duty App",
  description: "주간 빵 수령 당번표 생성 앱"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
