import { useUser } from "../../context/UserContext";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CircleCheck, LoaderCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { aiIntractions } from "../../lib/config";
import { useEffect, useState, useCallback, memo, useMemo } from "react";
import getUserSuperiorPersona from "../../services/n8n-knowledge-apis/getUserSuperiorPersona";
import { useToast } from "../../hooks/use-toast";

const GroupSuperiorPersonaSection = ({ onFetchSuperiorPersona, isShowInteractionOptions = true }) => {
    const {
        setIsSuperiorPersonaAttached,
        selectedSuperiorPersona,
        setSelectedSuperiorPersona,
        SupPerItems,
        currActiveIntraction,
        setCurrActiveIntraction,
        setSupPerItems,
        user,
        
    } = useUser();
    const { toast } = useToast();
    const [isSupPerItemLoading, setSupPerItemLoading] = useState(false);
    console.log("here ")
    // ✅ Memoize selected persona IDs to prevent re-computation on each render
    const selectedPersonaIds = useMemo(() => new Set(selectedSuperiorPersona.map(itm => itm.id)), [selectedSuperiorPersona]);

    // ✅ Optimized API Call
    const getSuperiorPersona = useCallback(async () => {
        if (SupPerItems.length > 0) return;
        setSupPerItemLoading(true);
        try {
            const response = await getUserSuperiorPersona(user.id);
            if (response.success && response.data.length > 0) {
                setSupPerItems(response.data.map(item => ({
                    id: item.id,
                    date: item.created_at,
                    title: item.sup_per_name,
                })));
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error.message || "Something went wrong",
                variant: "destructive",
            });
        } finally {
            setSupPerItemLoading(false);
        }
    }, [SupPerItems.length, setSupPerItems, user.id]);

    useEffect(() => {
        if (onFetchSuperiorPersona) {
            onFetchSuperiorPersona(getSuperiorPersona);
        }
    }, [onFetchSuperiorPersona, getSuperiorPersona]);

    // ✅ Optimized Click Handler (No re-computation per item)
    const handleItemClick = useCallback((item) => {

        setSelectedSuperiorPersona(prev => {
            const newSelection = selectedPersonaIds.has(item.id)
                ? prev.filter(itm => itm.id !== item.id)
                : [...prev, item];

            if (newSelection.length > 5) {
                toast({
                    title: "Error",
                    description: "You can't select more than 5 superior personas",
                    variant: "destructive"
                });
                return prev;
            }

            setIsSuperiorPersonaAttached(newSelection.length > 0);
            return newSelection;
        });
    }, [setSelectedSuperiorPersona, setIsSuperiorPersonaAttached, selectedPersonaIds]);

    return (
        <div className="p-3">
            {
                isShowInteractionOptions &&
                <div>
                    <div className="font-semibold text-xl text-white">Select Interactions</div>
                    <div className="flex flex-col md:grid grid-rows-1 grid-cols-2 gap-2 my-2">
                        {aiIntractions.map((item, index) => {
                            const isActive = currActiveIntraction === item.value;
                            return (
                                <Card
                                    key={index}
                                    className={`relative ${isActive ? "border-2 border-white bg-slate-600 " : "border-2 border-slate-500"} rounded-md cursor-pointer p-0 flex items-start flex-col`}
                                    onClick={() => setCurrActiveIntraction(item.value)}
                                >
                                    {isActive && <div className="absolute top-5 right-5"><CircleCheck className="text-slate-300" /></div>}
                                    <img src={item.icon} alt={item.label} className="w-full h-24" />
                                    <CardHeader className="p-2">
                                        <CardTitle className="font-semibold text-xl text-white">{item.label}</CardTitle>
                                        <p className=" text-slate-300">{item.description}</p>
                                    </CardHeader>
                                </Card>
                            );
                        })}
                    </div>
                    <hr className="border-slate-300 border-2" />
                </div>
            }


            <div className="overflow-y-scroll">
                {isSupPerItemLoading && (
                    <div className="flex gap-2 w-full items-center text-white justify-center bg-slate-500 m-2 rounded-md">
                        <div className="flex w-fit">
                            <LoaderCircle className="animate-spin" />
                            <p>Loading Your Superior Persona</p>
                        </div>
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 mt-2 overflow-y-scroll">
                    {SupPerItems && SupPerItems.length > 0 && [...SupPerItems].reverse().map((item, index) => {
                        const isSelected = selectedPersonaIds.has(item.id);
                        return (
                            <div
                                onClick={() => handleItemClick(item)}
                                key={index}
                                className={`${isSelected ? 'border-slate-500 bg-slate-500' : "border-slate-400 bg-slate-700 hover:bg-slate-600"} flex gap-1 items-start border p-2  transition-all rounded-md cursor-pointer`}
                            >
                                <div>
                                    <p className="text-ellipsis line-clamp-2 text-white w-[90%]">{item.title}</p>
                                    <p className="text-slate-400">Created {formatDistanceToNow(item.date)} Ago</p>
                                </div>
                                {isSelected && <div><CircleCheck className="text-white" /></div>}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default memo(GroupSuperiorPersonaSection);
