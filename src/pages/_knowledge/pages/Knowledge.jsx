import { useState, useEffect } from "react";
import { Clock, MessageCircle, ReceiptText, UserRoundPlus, Users } from "lucide-react";
import { Link } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "../../../hooks/use-toast";
import getUserSuperiorPersona from "../../../services/n8n-knowledge-apis/getUserSuperiorPersona";
import { useUser } from "../../../context/UserContext";
import { buttonVariants } from "../../../components/ui/button";

export default function Knowledge() {
    const [personas, setPersonas] = useState([]);
    const [loading, setLoading] = useState(true);
    const { toast } = useToast();
    const { user } = useUser();
    useEffect(() => {
        async function getUserAllPersona() {
            try {
                const response = await getUserSuperiorPersona(user.id);
                console.log(response, "is persona data")
                if (response.success) {
                    setPersonas(response.data)
                }
                else {
                    throw new Error(response.message)
                }
            } catch (error) {
                toast({
                    title: "Error",
                    description: error.message,
                    varient: "destructive"
                })
            }
            finally {
                setLoading(false);

            }
        }
        if (user.id) {
            getUserAllPersona()
        }
    }, [user]);

    return (
        <div>
            {/* Create New Superior Persona */}
            <Link
                to="/create-knowledge-base"
                className="w-full sm:w-[30%] h-32 bg-slate-800 hover:bg-slate-700 cursor-pointer rounded-md my-4 flex flex-col items-center justify-center"
            >
                <UserRoundPlus className="text-white" />
                <p className="font-semibold text-xl mt-3 text-white text-center">Create New Superior Persona</p>
            </Link>
            <Separator className="border border-white" />

            {/* Header */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-100">Your Superior Persona</h2>
                <p className="text-md text-gray-300">Click to Chat</p>
            </div>

            {/* Loading State */}
            {loading ? (
                <div className="gap-5 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 items-center ">
                    {[1, 2, 3].map((_, i) => (
                        <Skeleton key={i} className="w-full h-24 rounded-md bg-gray-700" />
                    ))}
                </div>
            ) : (
                // Render Personas
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {personas.reverse().map((persona) => (
                        <Card key={persona.id} className="bg-gray-800 hover:bg-gray-700 transition-colors duration-200 shadow-md flex flex-col justify-between items-center">
                            <CardContent className="p-5">
                                <h3 className="text-lg font-semibold text-gray-100 mb-2">{persona.sup_per_name}</h3>
                                <div className="flex items-center mt-3 text-gray-300 text-sm">
                                    <Users className="mr-2 h-4 w-4 my-3" />
                                    <span>{persona.numberOfPersona} Personas</span>
                                </div>
                                <p className="text-sm text-gray-400 line-clamp-2">{persona.sup_per_description}</p>
                                <div className="flex items-center mt-2 text-gray-300 text-xs">
                                    <Clock className="mr-2 h-3 w-3" />
                                    <span>Created {formatDistanceToNow(new Date(persona.created_at))} ago</span>
                                </div>
                                <div className="flex space-x-2 mt-4 w-full ">
                                    {/* <Link
                                        className={`${buttonVariants({ variant: "outline", size: "sm" })} w-full flex gap-2`}
                                        to={`/knowledge/chat/${persona.route}`}>
                                        <MessageCircle />
                                        Chat
                                    </Link> */}
                                    <Link
                                        className={`${buttonVariants({ variant: "outline", size: "sm" })} w-full flex gap-2`}
                                        to={`/editSuperPersona/${persona.route}`}>
                                        <ReceiptText />
                                        Details
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
