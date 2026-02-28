import { Providers } from "@/components/providers";
import { AppSidebar } from "@/components/app-sidebar";
import { AppTopbar } from "@/components/app-topbar";
import { ContentRouter } from "@/components/content-router";

export default function Home() {
  return (
    <Providers>
      <div className="flex h-screen overflow-hidden">
        <AppSidebar />
        <div className="flex flex-1 flex-col overflow-hidden">
          <AppTopbar />
          <main className="flex-1 overflow-auto">
            <ContentRouter />
          </main>
        </div>
      </div>
    </Providers>
  );
}
