import { Handle, Position } from 'reactflow';
import { User } from 'lucide-react';

export function CustomNode({ data }) {
    const getBgColor = () => {
        if (data.isStart) return 'bg-emerald-600';
        if (data.isEnd) return 'bg-rose-600';
        return 'bg-slate-800';
    };

    const getBorderColor = () => {
        if (data.isStart) return 'border-emerald-500';
        if (data.isEnd) return 'border-rose-500';
        return 'border-slate-700';
    };

    return (
        <div className={`py-4 px-4 shadow-lg rounded-lg ${getBgColor()} border-2 ${getBorderColor()} w-[300px] `}>
            <Handle
                type="target"
                position={Position.Left}
                className="w-2 h-2 !bg-blue-400"
            />
            <div className="flex items-center gap-2 text-slate-200">
                {!data.isStart && !data.isEnd && <User className="w-5 h-5" />}
                <span className="font-semibold">
                    {data.isStart || data.isEnd ? data.goal : data.name}
                </span>
            </div>
            {!data.isStart && !data.isEnd && (
                <div className="mt-2 text-sm text-slate-300 ">
                    {data.goal}
                </div>
            )}
            <Handle
                type="source"
                position={Position.Right}
                className="w-2 h-2 !bg-blue-400"
            />
        </div>
    );
}