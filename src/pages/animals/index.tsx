import { useEffect, useState } from "react";
import AnimalCard from "@/components/AnimalCard";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import { useUser } from "@/hooks/useUser";
import type { Animal } from "@/utils/types";

export default function AnimalsPage() {
    const { user } = useUser();
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const visibleAnimals = animals.filter((animal) =>
        animal.name.toLowerCase().includes(search.trim().toLowerCase())
    );

    useEffect(() => {
        if (!user) return;
        fetch(`/api/animal?owner=${user.id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setAnimals(data);
                }
            })
            .catch(() => setError("Could not load animals"));
    }, [user]);

    async function handleDelete(id: string) {
        const password = prompt("Enter your password to delete this animal and all of its training logs");
        if (!password) return;
        const res = await fetch("/api/animal", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, password }),
        });
        const data = await res.json();
        if (!res.ok) {
            setError(data.error);
            return;
        }
        setAnimals(animals.filter((animal) => animal._id !== id));
    }

    return (
        <DashboardLayout search={<SearchBar value={search} onChange={setSearch} placeholder="Search animals" />}>
            <PageHeader title="Animals" createLink="/animals/new" />
            <div className="p-4 md:p-8">
                {error && <p className="text-red-600">{error}</p>}
                {visibleAnimals.length === 0 && <p className="text-gray-500">No animals to show.</p>}
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleAnimals.map((animal) => (
                        <AnimalCard key={animal._id} animal={animal} onDelete={() => handleDelete(animal._id)} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
