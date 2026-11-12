export default function SearchBar({
    value,
    onChange,
    placeholder,
}: {
    value: string;
    onChange: (value: string) => void;
    placeholder: string;
}) {
    return (
        <input
            type="search"
            aria-label={placeholder}
            placeholder={placeholder}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 outline-none focus:border-brand"
        />
    );
}
