import { BandRegistry } from "@/components/band-registry";
import { OperationsHeader } from "@/components/operations-header";
import { DEMO_BAND_COUNT } from "@/lib/bands";

export default function BandsPage() {
  return <main className="registry-page"><OperationsHeader section="Band Registry" /><section className="registry-heading"><div><p className="eyebrow">Event-scoped wearables</p><h1>Band Registry</h1><p>Search, filter and inspect all Smart Safety Band digital twins registered to GT vs DC - IPL 2025.</p></div><div><span>Catalogue mode</span><strong>Server paginated</strong><small>{DEMO_BAND_COUNT.toLocaleString()} simulated bands</small></div></section><div className="registry-content"><BandRegistry total={DEMO_BAND_COUNT} /></div></main>;
}
