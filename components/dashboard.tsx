"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { ApplicationTable } from "./application-table";
import { ApplicationModal } from "./application-modal";
import { Application } from "@/types";
import { useRouter } from "next/navigation";

interface DashboardProps {
  user: {
    name?: string | null;
    email: string;
    image?: string | null;
  };
}

async function fetchApplications(): Promise<Application[]> {
  const res = await fetch("/api/applications");
  if (!res.ok) throw new Error("Failed to fetch applications");
  return res.json();
}

async function deleteApplication(id: number): Promise<void> {
  const res = await fetch(`/api/applications/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete application");
}

export function Dashboard({ user }: DashboardProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<Application | null>(null);

  const { data: applications = [], isLoading, isError } = useQuery({
    queryKey: ["applications"],
    queryFn: fetchApplications,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteApplication,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
    },
  });

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  function handleEdit(app: Application) {
    setEditingApp(app);
    setIsModalOpen(true);
  }

  function handleDelete(id: number) {
    if (confirm("Bewerbung wirklich löschen?")) {
      deleteMutation.mutate(id);
    }
  }

  function handleNewApplication() {
    setEditingApp(null);
    setIsModalOpen(true);
  }

  function handleCloseModal() {
    setIsModalOpen(false);
    setEditingApp(null);
  }

  const stats = {
    total: applications.length,
    active: applications.filter((a) =>
      ["applied", "waiting", "interview"].includes(a.status)
    ).length,
    offers: applications.filter((a) => a.status === "offer").length,
    ghosted: applications.filter((a) => a.status === "ghost").length,
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <span className="text-2xl">💼</span>
              <h1 className="text-xl font-bold text-gray-900">Job Tracker</h1>
            </div>
            <div className="flex items-center gap-4">
              {user.image && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={user.image}
                  alt={user.name || user.email}
                  className="w-8 h-8 rounded-full"
                />
              )}
              <span className="text-sm text-gray-600 hidden sm:block">
                {user.name || user.email}
              </span>
              <button
                onClick={handleLogout}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Abmelden
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <StatCard label="Gesamt" value={stats.total} color="blue" />
          <StatCard label="Aktiv" value={stats.active} color="yellow" />
          <StatCard label="Angebote" value={stats.offers} color="green" />
          <StatCard label="Ghosted" value={stats.ghosted} color="gray" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            Bewerbungen ({applications.length})
          </h2>
          <button
            onClick={handleNewApplication}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
          >
            <span>+</span>
            Neue Bewerbung
          </button>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : isError ? (
          <div className="text-center py-20 text-red-500">
            Fehler beim Laden der Bewerbungen.
          </div>
        ) : (
          <ApplicationTable
            applications={applications}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}
      </main>

      {/* Modal */}
      {isModalOpen && (
        <ApplicationModal
          application={editingApp}
          onClose={handleCloseModal}
        />
      )}
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
