import { useState } from "react";
import ControlsPane from "../components/ControlsPane";
import FileBrowser from "../components/FileBrowser";
import PreviewPane from "../components/PreviewPane";
import ProjectBar from "../components/ProjectBar";
import { CatalogProvider } from "../state/catalog";
import { QueueProvider } from "../state/queue";

export default function Page() {
  const [isFullScreen, setIsFullScreen] = useState(false);

  return (
    <CatalogProvider>
      <QueueProvider>
        <div className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-100">
          <div className="flex-shrink-0">
            <ProjectBar />
          </div>
          <div className="flex flex-1 divide-x divide-white/10 overflow-hidden">
            {!isFullScreen && (
              <>
                <aside className="flex w-[420px] min-h-0 flex-col bg-slate-950/60">
                  <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
                    <ControlsPane />
                  </div>
                </aside>
                <section className="flex min-h-0 min-w-[420px] flex-[1.1] flex-col bg-slate-950/55">
                  <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
                    <FileBrowser />
                  </div>
                </section>
              </>
            )}
            <main
              className={`flex min-h-0 flex-shrink-0 flex-col bg-slate-950/40 ${isFullScreen ? "flex-1 w-full" : "w-[420px]"
                }`}
            >
              <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
                <PreviewPane
                  isFullScreen={isFullScreen}
                  onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                />
              </div>
            </main>
          </div>
        </div>
      </QueueProvider>
    </CatalogProvider>
  );
}
