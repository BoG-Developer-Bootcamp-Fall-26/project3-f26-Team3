import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import TrainingLogCard from "@/components/TrainingLogCard";
import type { TrainingLog } from "@/utils/types";

export default function AdminTrainingPage() {
    const [logs, setLogs] = useState<TrainingLog[]>([]);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const visibleLogs = logs.filter((log) =>
        log.title.toLowerCase().includes(search.trim().toLowerCase())
    );

    useEffect(() => {
        fetch("/api/admin/training")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setLogs(data);
                }
            })
            .catch(() => setError("Could not load training logs"));
    }, []);

    return (
        <DashboardLayout adminOnly search={<SearchBar value={search} onChange={setSearch} placeholder="Search training logs" />}>
            <PageHeader title="All training logs" />
            <div className="p-4 md:p-8">
                {error && <p className="text-red-600">{error}</p>}
                {visibleLogs.length === 0 && <p className="text-gray-500">Nothing to show.</p>}
                <div className="flex flex-col gap-4">
                    {visibleLogs.map((log) => (
                        <TrainingLogCard key={log._id} log={log} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
