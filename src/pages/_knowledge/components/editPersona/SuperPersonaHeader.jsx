import { Atom } from 'lucide-react';
import { Skeleton } from "@/components/ui/skeleton"

export const SuperPersonaHeader = ({ title, description, descriptionLength, expanded, toggleExpanded, maxPer, loading }) => {
    const truncatedDescription = description.length > descriptionLength
        ? description.substring(0, descriptionLength) + "..."
        : description;
    if (loading) {
        return <Skeleton className="w-full h-36 rounded-lg" />
    }
    return (
        <div className="flex gap-4 items-center p-6 bg-gray-800 text-white rounded-lg shadow-md space-y-3">
            <Atom className="w-12 h-12 text-white" />
            <div>
                <p className="text-xl font-semibold text-white">{title}</p>
                <p className="text-gray-300">
                    {expanded ? description : truncatedDescription}
                    {description.length > descriptionLength && (
                        <button onClick={toggleExpanded} className="text-blue-400 ml-1">
                            {expanded ? "Read Less" : "Read More"}
                        </button>
                    )}
                </p>
                <p className="text-gray-400">{maxPer} Persona</p>
            </div>
        </div>
    );
};