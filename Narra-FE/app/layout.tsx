import "@livekit/components-styles";
import "./globals.css";
import { Public_Sans } from "next/font/google";

const publicSans400 = Public_Sans({
  weight: "400",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className={`h-full ${publicSans400.className}`}>
      {children}
    </div>
  );
}
