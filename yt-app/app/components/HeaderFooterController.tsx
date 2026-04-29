'use client';

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";

export default function ClientHeaderFooterController({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideHeaderFooter =
    pathname === "/signin" ||
    pathname === "/signup";

  return (
    <>
      {!hideHeaderFooter && <Header />}

      <main className={hideHeaderFooter ? "" : "flex-1 pt-16"}>
        {children}
      </main>

      {!hideHeaderFooter && <Footer />}
    </>
  );
}