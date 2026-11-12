import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useUser } from "@/hooks/useUser";
import type { Animal, TrainingLog } from "@/utils/types";

export default function TrainingLogForm({ log }: { log?: TrainingLog }) {
    const router = useRouter();
    const { user } = useUser();
    const [animals, setAnimals] = useState<Animal[]>([]);
    const [title, setTitle] = useState(log ? log.title : "");
    const [animal, setAnimal] = useState(log && log.animal ? log.animal._id : "");
    const [hours, setHours] = useState(log ? String(log.hours) : "");
    const [description, setDescription] = useState(log ? log.description : "");
    const [error, setError] = useState("");

    useEffect(() => {
        if (!user) return;
        fetch(`/api/animal?owner=${user.id}`)
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                    return;
                }
                setAnimals(data);
                if (!log && data.length > 0) {
                    setAnimal(data[0]._id);
                }
            })
            .catch(() => setError("Could not load your animals"));
    }, [user, log]);

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        if (!user) return;
        setError("");
        let logSaved = false;

        try {
            const res = await fetch("/api/training", {
                method: log ? "PATCH" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: log?._id, 
                    user: user.id,
                    animal,
                    title,
                    description,
                    hours: Number(hours),
                    date: new Date().toISOString(), 
                }),
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error);
                return;
            }
            logSaved = true;
            if (!log) {
                await updateAnimalHours(animal, Number(hours));
            } else if (log.animal && log.animal._id === animal) {
                await updateAnimalHours(animal, Number(hours) - log.hours);
            } else {
                if (log.animal) {
                    await updateAnimalHours(log.animal._id, -log.hours);
                }
                await updateAnimalHours(animal, Number(hours));
            }

            router.push("/training-logs");
        } catch {
            setError(logSaved
                ? "Training log saved, but animal hours could not be updated. Check the total before retrying."
                : "Something went wrong, please try again");
        }
    }

    const inputStyle = "rounded-lg border border-gray-300 px-3 py-2 outline-none focus:border-brand";

    return (
        <form onSubmit={handleSubmit} className="flex max-w-2xl flex-col gap-5">
            <label className="flex flex-col gap-1 font-medium">
                Title
                <input value={title} onChange={(e) => setTitle(e.target.value)} required className={inputStyle} />
            </label>
            <label className="flex flex-col gap-1 font-medium">
                Select Animal
                <select value={animal} onChange={(e) => setAnimal(e.target.value)} required className={inputStyle + " bg-white"}>
                    {animals.map((a) => (
                        <option key={a._id} value={a._id}>
                            {a.name} - {a.breed}
                        </option>
                    ))}
                </select>
                {animals.length === 0 && (
                    <span className="text-sm font-normal text-gray-500">
                        You don&apos;t have any animals yet.{" "}
                        <Link href="/animals/new" className="text-brand">
                            Create one first
                        </Link>
                    </span>
                )}
            </label>
            <label className="flex flex-col gap-1 font-medium">
                Total hours trained
                <input type="number" min="0" step="0.5" value={hours} onChange={(e) => setHours(e.target.value)} required className={inputStyle} />
            </label>
            <label className="flex flex-col gap-1 font-medium">
                Note
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={5} className={inputStyle} />
            </label>
            {error && <p className="text-red-600">{error}</p>}
            <div className="flex gap-3">
                <Link href="/training-logs" className="rounded-lg border border-brand px-8 py-2 font-semibold text-brand">
                    Cancel
                </Link>
                <button type="submit" className="rounded-lg bg-brand px-8 py-2 font-semibold text-white hover:bg-brand-dark">
                    {log ? "Save" : "Create"}
                </button>
            </div>
        </form>
    );
}
async function updateAnimalHours(animal: string, hours: number) {
    if (hours === 0) return;
    const res = await fetch("/api/animal", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ animal, hours }),
    });
    if (!res.ok) throw new Error("Could not update animal hours");
}
