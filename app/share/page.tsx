import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ApplicationStatus, STATUS_COLORS } from "@/types";
import { format } from "date-fns";
import { de } from "date-fns/locale";

interface SharePageProps {
  searchParams: Promise<{ token?: string }>;
}

function StatusBadge({ status }: { status: ApplicationStatus }) {
  const labels: Record<ApplicationStatus, string> = {
    applied: "Beworben",
    waiting: "Wartend",
    interview: "Interview",
    rejected: "Abgelehnt",
    offer: "Angebot",
    ghost: "Ghosted",
    draft: "Entwurf",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[status] || "bg-gray-100 text-gray-600"}`}
    >
      {labels[status] ?? status}
    </span>
  );
}

function formatDate(dateVal: Date | string | null): string {
  if (!dateVal) return "—";
  try {
    return format(new Date(dateVal), "dd.MM.yyyy", { locale: de });
  } catch {
    return "—";
  }
}

export default async function SharePage({ searchParams }: SharePageProps) {
  const { token } = await searchParams;
  const expectedToken = process.env.PUBLIC_READ_TOKEN;

  if (!expectedToken || !token || token !== expectedToken) {
    notFound();
  }

  const applications = await prisma.application.findMany({
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: applications.length,
    active: applications.filter((a) =>
      ["applied", "waiting", "interview"].includes(a.status)
    ).length,
    offers: applications.filter((a) => a.status === "offer").length,
    rejected: applications.filter((a) => a.status === "rejected").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💼</span>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Job Tracker</h1>
                <p className="text-xs text-gray-500">Read-only Ansicht</p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
              Lesezugriff
            </span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Gesamt" value={stats.total} color="blue" />
          <StatCard label="Aktiv" value={stats.active} color="yellow" />
          <StatCard label="Angebote" value={stats.offers} color="green" />
          <StatCard label="Abgelehnt" value={stats.rejected} color="gray" />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Bewerbungen ({applications.length})
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {["Firma", "Stelle", "Status", "Beworben", "Letzter Kontakt", "Follow-up", "Notizen"].map(
                    (h) => (
                      <th
                        key={h}
                        className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {applications.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-gray-400">
                      Noch keine Bewerbungen eingetragen.
                    </td>
                  </tr>
                ) : (
                  applications.map((app) => (
                    <tr
                      key={app.id}
                      className="border-b border-gray-50 hover:bg-blue-50/30 transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-gray-900">{app.company}</td>
                      <td className="px-4 py-3 text-gray-700">{app.role}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={app.status as ApplicationStatus} />
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {formatDate(app.appliedAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {formatDate(app.lastContact)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-sm">
                        {formatDate(app.followUpAt)}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="text-gray-500 text-sm max-w-xs truncate block"
                          title={app.notes || ""}
                        >
                          {app.notes || "—"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {applications.length} Bewerbungen gesamt · Zuletzt aktualisiert:{" "}
            {format(new Date(), "dd.MM.yyyy HH:mm", { locale: de })} Uhr
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Diese Seite ist schreibgeschützt. Nur Christian kann Änderungen vornehmen.
        </p>
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "blue" | "yellow" | "green" | "gray";
}) {
  const colors = {
    blue: "bg-blue-50 text-blue-700",
    yellow: "bg-yellow-50 text-yellow-700",
    green: "bg-green-50 text-green-700",
    gray: "bg-gray-100 text-gray-600",
  };

  return (
    <div className={`${colors[color]} rounded-xl p-4 text-center`}>
      <div className="text-3xl font-bold">{value}</div>
      <div className="text-sm font-medium mt-1">{label}</div>
    </div>
  );
}

export const metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};
