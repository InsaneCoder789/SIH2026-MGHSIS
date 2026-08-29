import Link from "next/link";
import { ArrowLeft, Command, MapPinOff } from "lucide-react";
import { OperationsHeader } from "@/components/operations-header";

export default function NotFound() {
  return <main className="ops-module-page not-found-page"><OperationsHeader section="Not Found" /><section><MapPinOff size={34} /><p className="eyebrow">Route unavailable</p><h1>This workspace does not exist.</h1><p>The requested operational view is not part of the current event deployment.</p><div><Link href="/"><ArrowLeft size={16} />Return to overview</Link><Link href="/command-center"><Command size={16} />Open Command Centre</Link></div></section></main>;
}
