import type { Metadata } from "next";
import { Shippori_Mincho, Zen_Kaku_Gothic_New } from "next/font/google";
import Masthead from "@/components/Masthead";
import "./globals.css";

/* Mincho for the book, gothic for everything around it — Japanese book practice. */
const shippori = Shippori_Mincho({
  variable: "--font-shippori",
  weight: ["400", "600", "700"],
  subsets: ["latin"],
  display: "swap",
});

const zenKaku = Zen_Kaku_Gothic_New({
  variable: "--font-zen-kaku",
  weight: ["400", "500"],
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Robohouse ’26 Library",
    template: "%s · Robohouse ’26 Library",
  },
  description: "A reading room for long-form research.",
};

/* Applies the saved theme before first paint so the page never flashes the wrong one. */
const themeScript = `try{var t=localStorage.getItem("theme");if(t==="dark"||t==="light")document.documentElement.dataset.theme=t}catch(e){}`;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${shippori.variable} ${zenKaku.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <Masthead />
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
