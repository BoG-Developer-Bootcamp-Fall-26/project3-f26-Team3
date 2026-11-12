import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import PageHeader from "@/components/PageHeader";
import SearchBar from "@/components/SearchBar";
import UserCard from "@/components/UserCard";
import type { User } from "@/utils/types";

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const visibleUsers = users.filter((user) =>
        user.fullName.toLowerCase().includes(search.trim().toLowerCase())
    );

    useEffect(() => {
        fetch("/api/admin/users")
            .then((res) => res.json())
            .then((data) => {
                if (data.error) {
                    setError(data.error);
                } else {
                    setUsers(data);
                }
            })
            .catch(() => setError("Could not load users"));
    }, []);

    return (
        <DashboardLayout adminOnly search={<SearchBar value={search} onChange={setSearch} placeholder="Search users" />}>
            <PageHeader title="All users" />
            <div className="p-4 md:p-8">
                {error && <p className="text-red-600">{error}</p>}
                {visibleUsers.length === 0 && <p className="text-gray-500">Nothing to show.</p>}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {visibleUsers.map((user) => (
                        <UserCard key={user._id} user={user} />
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
}
