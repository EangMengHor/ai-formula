import { Book, CalendarCheck, Clock } from "lucide-react";

const AutomationCard = ({ block, blockIdx }) => {
    return <div
        key={`automation-${blockIdx}`}
        className="bg-gradient-to-r from-g1 to-g2 max-w-[80%] border-2 border-slate-800 px-3 py-4 rounded-2xl shadow break-words whitespace-pre-wrap space-y-2"
    >
        <h2 className="text-lg font-semibold mb-2">
            {block.name}
        </h2>
        <div className="items-center flex gap-2">
            <CalendarCheck className="w-4 h-4" />
            <p>Task</p>
        </div>
        <p className="text-sm text-slate-400">
            {block.task}
        </p>
        <div className="items-center flex gap-2">
            <Clock className="w-4 h-4" />
            <p>Trigger Time</p>
        </div>
        <p className="text-sm text-slate-400 mt-2">
            {block.time}
        </p>
        <div className="items-center flex gap-2">
            <Book className="w-4 h-4" />
            <p>Output Format</p>
        </div>
        <p className="text-sm text-slate-400 mt-2">
            {block.outputFormat}
        </p>
    </div>
}

export default AutomationCard;