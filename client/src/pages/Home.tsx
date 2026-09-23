import { ArrowRight, Check, ChevronRight, RadioTower, ShieldCheck, Waves } from "lucide-react";
import { Link } from "wouter";

const pipeline = [
  { label: "WARNING", detail: "Trusted signal", color: "bg-[#d9f1f0] text-[#0d5960]" },
  { label: "EVIDENCE", detail: "Source context", color: "bg-[#e8eef4] text-[#27445b]" },
  { label: "RISK", detail: "Local relevance", color: "bg-[#fff2d4] text-[#7d5411]" },
  { label: "ACTION", detail: "Next safe step", color: "bg-[#fde5e3] text-[#8d3636]" },
  { label: "ACCESS", detail: "For every person", color: "bg-[#e6e1f7] text-[#514175]" },
  { label: "SAFETY", detail: "Close the loop", color: "bg-[#daf0e8] text-[#21684f]" },
];

const modules = [
  ["01", "SignalCore", "Emergency alert interpretation"],
  ["02", "GeoShield", "Geospatial risk and relevance"],
  ["03", "TrustMesh", "Evidence and uncertainty"],
  ["04", "ActionForge", "Emergency action compilation"],
  ["05", "AccessBridge", "Multilingual and accessible delivery"],
  ["06", "SafeLoop", "Safety status and response loop"],
  ["07", "ResilienceVault", "Offline emergency continuity"],
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f4f7f9] text-[#152536] sb-noise">
      <nav className="mx-auto flex max-w-[1260px] items-center justify-between px-5 py-6 md:px-10">
        <Link href="/" className="sb-focus flex items-center gap-3 rounded-lg">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0d1b2a] text-sm font-bold text-[#7ee2de] shadow-[0_8px_22px_rgba(13,27,42,.16)]">SB</span>
          <span className="font-display text-lg font-bold tracking-[-.03em]">SIGNAL<span className="text-[#2e8b91]">BRIDGE</span></span>
        </Link>
        <div className="hidden items-center gap-7 text-sm font-medium text-[#5c6d79] md:flex">
          <a href="#pipeline" className="transition-colors hover:text-[#0d3448]">How it works</a>
          <a href="#modules" className="transition-colors hover:text-[#0d3448]">Foundation</a>
          <span className="font-mono text-[11px] uppercase tracking-[.16em] text-[#8999a3]">CHENNAI / FLOOD DEMO</span>
        </div>
        <Link href="/dashboard" className="sb-focus inline-flex items-center gap-2 rounded-lg bg-[#0d3448] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(13,52,72,.16)] transition hover:bg-[#174a60]">
          Open command center <ArrowRight size={16} />
        </Link>
      </nav>

      <section className="mx-auto grid max-w-[1260px] gap-10 px-5 pb-20 pt-12 md:grid-cols-[1.1fr_.9fr] md:px-10 md:pb-28 md:pt-24">
        <div className="sb-enter flex flex-col justify-center">
          <div className="mb-6 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-[#2e8b91]"><span className="h-2 w-2 rounded-full bg-[#38b8bd] shadow-[0_0_0_4px_#d9f1f0]" /> Emergency intelligence foundation</div>
          <h1 className="max-w-[710px] font-display text-5xl font-semibold leading-[1.02] tracking-[-.055em] text-[#0d1b2a] md:text-7xl">From trusted warnings to <span className="text-[#2e8b91]">personalized safe action.</span></h1>
          <p className="mt-7 max-w-[600px] text-lg leading-8 text-[#5c6d79]">SignalBridge is an AI-powered emergency intelligence layer that transforms trusted warnings into localized, evidence-linked and accessible actions.</p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/dashboard" className="sb-focus inline-flex items-center gap-2 rounded-lg bg-[#0d1b2a] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#174a60]">Enter the demo <ChevronRight size={17} /></Link>
            <a href="#pipeline" className="sb-focus inline-flex items-center gap-2 rounded-lg border border-[#c8d6dd] bg-white px-5 py-3 text-sm font-semibold text-[#27445b] transition hover:border-[#7fb8bf]">See the pipeline</a>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 border-t border-[#d8e1e8] pt-5 text-xs font-medium text-[#71818b]"><span className="flex items-center gap-2"><Check size={14} className="text-[#2e8b70]" /> Official sources first</span><span className="flex items-center gap-2"><Check size={14} className="text-[#2e8b70]" /> Evidence-linked actions</span><span className="flex items-center gap-2"><Check size={14} className="text-[#2e8b70]" /> Human-accessible by design</span></div>
        </div>

        <div className="sb-enter sb-enter-delay-2 relative min-h-[440px] overflow-hidden rounded-2xl border border-[#c9d8df] bg-[#0d1b2a] p-5 text-white shadow-[0_22px_60px_rgba(13,27,42,.16)] md:p-7">
          <div className="absolute inset-0 opacity-30 sb-grid" style={{ backgroundColor: "#0d1b2a", backgroundImage: "linear-gradient(rgba(126,226,222,.07) 1px, transparent 1px), linear-gradient(90deg, rgba(126,226,222,.07) 1px, transparent 1px)" }} />
          <div className="relative flex h-full flex-col justify-between">
            <div className="flex items-start justify-between"><div><div className="font-mono text-[10px] uppercase tracking-[.19em] text-[#7ee2de]">LIVE FOUNDATION STATUS</div><div className="mt-2 font-display text-2xl font-semibold">Chennai flood response</div></div><span className="rounded-full border border-[#4d6875] bg-[#18394b] px-3 py-1 font-mono text-[10px] uppercase tracking-[.12em] text-[#b8eeee]">Demo simulation</span></div>
            <div className="my-10 grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#284b5b] bg-[#122b3b] p-4"><RadioTower size={19} className="text-[#7ee2de]" /><div className="mt-7 font-mono text-3xl font-semibold">02</div><div className="mt-1 text-xs text-[#9cb5bf]">active warnings</div></div>
              <div className="rounded-xl border border-[#284b5b] bg-[#122b3b] p-4"><Waves size={19} className="text-[#f6c45c]" /><div className="mt-7 font-mono text-3xl font-semibold">HIGH</div><div className="mt-1 text-xs text-[#9cb5bf]">localized risk state</div></div>
              <div className="col-span-2 rounded-xl border border-[#284b5b] bg-[#122b3b] p-4"><div className="flex items-center justify-between text-xs text-[#9cb5bf]"><span>Signal → action coverage</span><span className="font-mono text-[#b8eeee]">7 / 7 modules ready</span></div><div className="mt-3 h-2 overflow-hidden rounded-full bg-[#274657]"><div className="h-full w-full rounded-full bg-[#7ee2de]" /></div></div>
            </div>
            <div className="flex items-center gap-3 border-t border-[#284b5b] pt-5 text-sm text-[#bdd0d7]"><ShieldCheck size={17} className="text-[#7ee2de]" /><span>Not a replacement for official warning systems.</span></div>
          </div>
        </div>
      </section>

      <section id="pipeline" className="border-y border-[#d8e1e8] bg-white px-5 py-16 md:px-10 md:py-24">
        <div className="mx-auto max-w-[1260px]"><div className="max-w-[540px]"><div className="font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-[#2e8b91]">THE SIGNALBRIDGE METHOD</div><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-.04em] text-[#0d1b2a] md:text-4xl">Every warning becomes a chain of accountable decisions.</h2></div><div className="mt-10 grid gap-2 md:grid-cols-6">{pipeline.map((item, index) => <div key={item.label} className="flex items-center gap-2 md:block"><div className={`flex h-[86px] flex-1 flex-col justify-between rounded-xl p-4 ${item.color}`}><span className="font-mono text-[10px] font-semibold tracking-[.14em]">0{index + 1}</span><span className="font-display text-sm font-bold tracking-[.08em]">{item.label}</span></div>{index < pipeline.length - 1 && <ArrowRight size={16} className="shrink-0 text-[#a6b5bd] md:mx-auto md:my-3 md:block" />}</div>)}</div></div>
      </section>

      <section id="modules" className="mx-auto max-w-[1260px] px-5 py-16 md:px-10 md:py-24"><div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><div className="font-mono text-[11px] font-semibold uppercase tracking-[.18em] text-[#2e8b91]">PHASE 1 / FOUNDATION</div><h2 className="mt-3 font-display text-3xl font-semibold tracking-[-.04em] text-[#0d1b2a] md:text-4xl">Built to become more capable, not more opaque.</h2></div><p className="max-w-[420px] text-sm leading-6 text-[#5c6d79]">This MVP focuses on a stable emergency command foundation for a Chennai flood demonstration. The AI layer arrives later, with clear boundaries.</p></div><div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-[#d8e1e8] bg-[#d8e1e8] sm:grid-cols-2 lg:grid-cols-3">{modules.map(([number, title, detail]) => <div key={title} className="bg-white p-6 transition hover:bg-[#f8fbfc]"><div className="font-mono text-xs text-[#91a1aa]">{number}</div><div className="mt-7 font-display text-lg font-semibold text-[#0d1b2a]">{title}</div><div className="mt-2 text-sm text-[#5c6d79]">{detail}</div></div>)}</div></section>
      <footer className="border-t border-[#d8e1e8] bg-[#0d1b2a] px-5 py-7 text-[#9cb5bf] md:px-10"><div className="mx-auto flex max-w-[1260px] flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between"><span className="font-display font-semibold text-white">SIGNAL<span className="text-[#7ee2de]">BRIDGE</span></span><span>Urban flood demonstration · Chennai / Tamil Nadu</span><span className="font-mono uppercase tracking-[.12em] text-[#7ee2de]">Foundation v0.1</span></div></footer>
    </main>
  );
}
