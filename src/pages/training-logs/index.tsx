import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import TrainingLogCard from "@/components/TrainingLogCard";
import { useUser } from "@/hooks/useUser";
import type { TrainingLog } from "@/utils/types";

export default function TrainingLogsPage() {
    const { user } = useUser();
    const [logs, setLogs] = useState<TrainingLog[]>([]);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const visibleLogs = logs.filter((log) =>
        log.title.toLowerCase().includes(search.trim().toLowerCase())
    );

    useEffect(() => {
        if (!user) return;
        fetch(`/api/training?user=${user.id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setLogs(data);
                }
            })
            .catch(() => setError("Could not load training logs"));
    }, [user]);

    async function handleDelete(id: string) {
        const password = prompt("Enter your password to delete this training log");
        if (!password) return;
        const res = await fetch("/api/training", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error);
            return;
        }
        setLogs(logs.filter((log) => log._id !== id));
    }

    return (
        <DashboardLayout search={<SearchBar value={search} onChange={setSearch} placeholder="Search training logs" />}>
            <PageHeader title="Training logs" createLink="/training-logs/new" />
            <div className="flex flex-col gap-4 p-4 md:p-8">
                {error && <p className="text-red-600">{error}</p>}
                {visibleLogs.length === 0 && <p className="text-gray-500">No training logs to show.</p>}
                {visibleLogs.map((log) => (
                    <TrainingLogCard
                        key={log._id}
                        log={log}
                        editLink={`/training-logs/${log._id}/edit`}
                        onDelete={() => handleDelete(log._id)}
                    />
                ))}
            </div>
        </DashboardLayout>
    );
}
