import Dashboard from "@/components/Dashboard";
import MismatchView from "@/components/MismatchView";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-12">
      <Dashboard />
      <MismatchView />
    </div>
  );
}
