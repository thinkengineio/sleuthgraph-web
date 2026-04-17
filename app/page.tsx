import HealthBadge from "@/components/HealthBadge";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 space-y-6">
      <h1 className="text-4xl font-bold">Sleuthgraph</h1>
      <p className="text-lg text-gray-600">OSINT investigation workbench · pre-alpha</p>
      <HealthBadge />
      <p className="text-sm text-gray-500">
        See{" "}
        <a
          className="underline"
          href="https://github.com/francose/sleuthgraph"
          target="_blank"
          rel="noopener"
        >
          github.com/francose/sleuthgraph
        </a>{" "}
        for docs.
      </p>
    </main>
  );
}
