import Header from "@/components/Header";
import LegoBoard from "@/components/LegoBoard";
import BottomNav from "@/components/BottomNav";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-[560px] flex-1 px-3 pt-4 pb-8">
        <LegoBoard />
      </main>
      <BottomNav />
    </div>
  );
}
