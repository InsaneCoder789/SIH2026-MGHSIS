import Link from "next/link";
import { Activity, Command, Map, RadioTower, ShieldCheck, Siren, Watch, Workflow } from "lucide-react";

const navigation = [
  { href: "/", label: "Overview", icon: Command },
  { href: "/command-center", label: "Command Centre", icon: RadioTower },
  { href: "/digital-twin", label: "Digital Twin", icon: Map },
  { href: "/bands", label: "Band Registry", icon: Watch },
  { href: "/alerts", label: "Alerts", icon: Siren },
  { href: "/interventions", label: "Interventions", icon: Workflow },
];

export function OperationsHeader({ section }: { section: string }) {
  return (
    <header className="operations-header">
      <Link href="/" className="operations-brand">
        <ShieldCheck size={31} />
        <span><strong>MGHSIS</strong><small>Mass-Gathering Human Safety Intelligence System</small></span>
      </Link>
      <nav aria-label="Primary operations navigation">
        {navigation.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={section === label ? "active" : ""}><Icon size={15} />{label}</Link>
        ))}
      </nav>
      <div className="operations-live"><Activity size={15} /><span>Event Live</span><strong>20:34:18</strong></div>
    </header>
  );
}
