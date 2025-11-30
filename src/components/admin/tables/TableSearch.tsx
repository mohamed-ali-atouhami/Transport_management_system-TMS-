"use client"
import { Search } from "lucide-react";
import { useRouter } from "next/navigation";

interface TableSearchProps {
  placeholder?: string;
}

export default function TableSearch({ placeholder = "Search..." }: TableSearchProps) {
    const router = useRouter();
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const params = new URLSearchParams(window.location.search);
        params.set('search', e.target.value);
        router.push(`${window.location.pathname}?${params.toString()}`);
    }
    return (
        <div className="w-full md:w-auto flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2">
            <Search className="h-3.5 w-3.5 text-gray-400" />
            <input 
                type="text" 
                placeholder={placeholder}
                className="w-full p-2 bg-transparent outline-none" 
                onChange={handleSearch}
            />
        </div>
    );
}

