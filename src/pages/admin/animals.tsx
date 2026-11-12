import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import AnimalCard from "@/components/AnimalCard";
import type { Animal } from "@/utils/types";

export default function AdminAnimalsPage() {
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const visibleAnimals = animals.filter((animal) =>
        animal.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    useEffect(() => {
        fetch("/api/admin/animals")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setAnimals(data);
                }
            })
            .catch(() => setError("Could not load animals"));
    }, []);

    return (
        <DashboardLayout adminOnly search={<SearchBar value={search} onChange={setSearch} placeholder="Search animals" />}>
            <PageHeader title="All animals" />
            <div className="p-4 md:p-8">
                {error && <p className="text-red-600">{error}</p>}
                {visibleAnimals.length === 0 && <p className="text-gray-500">Nothing to show.</p>}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleAnimals.map((animal) => (
                        <AnimalCard key={animal._id} animal={animal} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
