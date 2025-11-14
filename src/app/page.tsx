import ControlsPane from "../components/ControlsPane";
import FileBrowser from "../components/FileBrowser";
import PreviewPane from "../components/PreviewPane";
import ProjectBar from "../components/ProjectBar";
import { CatalogProvider } from "../state/catalog";

export default function Page() {
  return (
    <CatalogProvider>
      <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
        <ProjectBar />
        <div className="flex flex-1 divide-x divide-white/10 overflow-hidden">
          <aside className="flex w-[420px] min-h-0 flex-col bg-slate-950/60">
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
              <ControlsPane />
            </div>
          </aside>
          <section className="flex w-[320px] min-h-0 flex-col bg-slate-950/55">
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
              <FileBrowser />
            </div>
          </section>
          <main className="flex min-w-0 flex-1 flex-col bg-slate-950/40">
            <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4">
              <PreviewPane />
            </div>
          </main>
        </div>
      </div>
    </CatalogProvider>
  );
}
