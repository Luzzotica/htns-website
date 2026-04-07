import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export default function HtnsBookPartyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex flex-1 flex-col px-6 py-12">{children}</main>
      <Footer />
    </div>
  );
}
