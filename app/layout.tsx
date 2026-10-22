import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import "./globals.css";
import { CartProvider } from "@/components/context/CartContext";
import { Toaster } from "sonner";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("http://localhost:3000"),
  title: "Teabox: Buy Delicious Indian Teas Online - Delivered Fresh",
  description:
    "Enjoy India's finest tea selection. Buy 100% fresh, delicious organic teas direct from the source. Free express shipping on orders above INR 399.",
  icons: {
    icon: "/assets/teabox-logo.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr" className={`${poppins.variable}`}>
      <body className="min-h-screen bg-white text-[#202020] antialiased selection:bg-[#02cb5a] selection:text-[#1f3a2c]">
        <CartProvider>
          {children}
          <Toaster
            position="top-right"
            richColors
            closeButton
            duration={3500}
            theme="light"
          />
        </CartProvider>
      </body>
    </html>
  );
}
