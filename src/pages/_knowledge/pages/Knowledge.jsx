import { UserRoundPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator"

export default function Knowledge() {
    return (
        <div>
            {/* create new superior persona */}
            <Link
                to={'/create-knowledge-base'}
                className="w-[30%] h-32 bg-slate-800 hover:bg-slate-700 cursor-pointer rounded-md my-4 flex flex-col items-center justify-center">
                <UserRoundPlus className="text-white " />
                <p className="font-semibold text-xl mt-3 text-white">Create New Superior Persona</p>
            </Link>
            <Separator className="border border-white" />
            {/* header */}
            <div className="my-4">
                <h4 className="text-white text-2xl font-semibold">Your Persona</h4>
                <p className="text-white text-xl">Click To Chat</p>
            </div>
        </div>
    )
}