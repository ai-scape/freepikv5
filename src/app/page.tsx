import ControlsPane from "../components/ControlsPane";
import FileBrowser from "../components/FileBrowser";
import PreviewPane from "../components/PreviewPane";
import ProjectBar from "../components/ProjectBar";
import { CatalogProvider } from "../state/catalog";

export default function Page() {
  return (
    <CatalogProvider>
      <div className="flex h-dvh flex-col overflow-hidden bg-slate-950 text-slate-100">
        <div className="flex-shrink-0">
          <ProjectBar />
        </div>
        <div className="flex flex-1 divide-x divide-white/10 overflow-hidden">
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
          <main className="flex w-[420px] min-h-0 flex-shrink-0 flex-col bg-slate-950/40">
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
              <PreviewPane />
            </div>
          </main>
        </div>
      </div>
    </CatalogProvider>
  );
}
