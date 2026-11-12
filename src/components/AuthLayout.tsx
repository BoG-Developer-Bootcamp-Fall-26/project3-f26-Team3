import { ReactNode } from "react";
import Image from "next/image";
import appLogo from "../../public/images/appLogo.png";
import quarterCircle from "../../public/images/quarterCircle.png";

export default function AuthLayout({ title, children}: { title: string; children: ReactNode}) {
    return (
        <div className="relative flex min-h-screen flex-col overflow-hidden">
            <header className="flex items-center gap-2 px-4 py-4 shadow-sm md:px-6">
                <Image src={appLogo} alt="Logo" className="h-8 w-auto" />
                <span className="text-2xl font-bold">Progress</span>
            </header>

            <main className="relative z-10 flex flex-1 items-center justify-center px-4 py-10">
                <div className="w-full max-w-md">
                    <h1 className="mb-8 text-center text-4xl font-bold sm:text-5xl">{title}</h1>
                    {children}
                </div>
            </main>
            <Image src={quarterCircle} alt="" className="absolute bottom-0 left-0 w-28 sm:w-40 md:w-56" />
        </div>
    );
}