import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { BookOpen, MessageSquare, Users, Sparkles } from "lucide-react"
import { createPersonaFormSchema, createTemplateFormSchema } from "../../../Schema"
import { Separator } from "../../../components/ui/separator"
import { useState } from "react"
import { createTemplatePersona } from "../../../services/n8n-knowledge-apis/createTemplatePersona"
import { useToast } from "../../../hooks/use-toast"
import { createPersona } from "../../../services/n8n-knowledge-apis/createPersona"
import { useLocation, useNavigate } from "react-router-dom"


export default function CreateKnowledgeBase() {
    const createPersonaForm = useForm({
        resolver: zodResolver(createPersonaFormSchema),
        defaultValues: {
            title: "",
            prompt: "This superior persona for ",
            maxPersonas: 1
        },
    })

    const navigate = useNavigate()
    const { toast } = useToast()
    const createTemplateForm = useForm({
        resolver: zodResolver(createTemplateFormSchema),
        defaultValues: {
            goal: "Create Superior Persona For "
        },
    })

    const [autoFillVisible, setAutoFillVisible] = useState(false);
    const [isTemplateLoading, setIsTemplateLoading] = useState(false);
    const [isTemplateSuccess, setIsTemplateSuccess] = useState(false);

    // create form
    const [isCreateLoading, setIsCreateLoading] = useState(false);




    async function onSubmit(values) {
        console.log(values)
        setIsCreateLoading(true);
        try {
            const response = await createPersona({
                title: values.title,
                description: values.prompt,
                maxPer: values.maxPersonas
            })

            navigate(`/editSuperPersona/${response.data}?title=${values.title}&description=${values.prompt}&maxPer=${values.maxPersonas}`)

            console.log(response)
            setIsCreateLoading(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: "destructive"
            })


        } finally {
            setIsCreateLoading(false);
        }
    }


    async function onTemplateFormSubmit(values) {
        console.log("Template Form Submitted", values)
        setIsTemplateLoading(true);
        try {
            const response = await createTemplatePersona(values.goal);
            console.log(response, "is ui data");
            createPersonaForm.setValue("prompt", response.data[0].output.description);
            createPersonaForm.setValue("title", response.data[0].output.title);
            createPersonaForm.setValue("maxPersonas", response.data[0].output.maxPersonas);
            setIsTemplateLoading(false);
            setIsTemplateSuccess(true);
            setAutoFillVisible(false);
        } catch (error) {
            toast({
                title: 'Error',
                description: error.message,
                variant: "destructive"
            })

        }
    }


    const toggleAutoFill = () => {
        setAutoFillVisible(!autoFillVisible);
    };

    return (
        <div className="container max-w-2xl mx-auto py-10">
            <Card className="border-2">
                <CardHeader>
                    <div className="flex items-center space-x-2">
                        <Sparkles className="w-6 h-6 text-primary" />
                        <CardTitle className="text-2xl">Create Superior Persona</CardTitle>
                    </div>
                    <CardDescription>
                        Configure your AI persona with specific traits and behaviors. Fill out the form below to create a new
                        superior persona to auto fill below form.
                    </CardDescription>
                </CardHeader>
                <Separator className="border border-white" />
                <CardContent className="mt-10">

                    <Button onClick={toggleAutoFill} className="mb-5">
                        Auto Fill
                        <Sparkles className="w-4 h-4 ml-2" />
                    </Button>

                    {autoFillVisible && (
                        <div className="my-5 bg-slate-800 p-2 rounded-md">
                            <Form {...createTemplateForm}>
                                <form onSubmit={createTemplateForm.handleSubmit(onTemplateFormSubmit)} className="space-y-6">
                                    <FormField
                                        control={createTemplateForm.control}
                                        name="goal"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="flex items-center space-x-2">
                                                    <Sparkles className="w-4 h-4" />
                                                    <span>Auto Fill Superior Persona Form</span>
                                                </FormLabel>
                                                <FormDescription>
                                                    Define the primary goal or objective of this persona.
                                                </FormDescription>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="e.g., To provide excellent customer service and resolve issues efficiently."
                                                        className="min-h-[120px] border-primary transition-all hover:border-primary"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                                <Button type="submit" onClick={createTemplateForm.handleSubmit(onTemplateFormSubmit)} className="w-full sm:w-auto">
                                                    {
                                                        isTemplateSuccess && !isTemplateLoading ? "Auto Fill Successful" :
                                                            isTemplateLoading ? "Loading..." : "Auto Fill Superior Persona"
                                                    }
                                                    <Sparkles className="w-4 h-4 " />
                                                </Button>
                                            </FormItem>
                                        )}
                                    />
                                </form>
                            </Form>
                        </div>
                    )}



                    <Form {...createPersonaForm}>
                        <form onSubmit={createPersonaForm.handleSubmit(onSubmit)} className="space-y-6">
                            <FormField
                                control={createPersonaForm.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center space-x-2">
                                            <BookOpen className="w-4 h-4" />
                                            <span>Title of Superior Persona</span>
                                        </FormLabel>
                                        <FormDescription>Give your persona a unique and descriptive title.</FormDescription>
                                        <FormControl>
                                            <Input
                                                placeholder="e.g., Advanced Customer Service Assistant"
                                                className="transition-all hover:border-primary"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />

                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createPersonaForm.control}
                                name="prompt"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center space-x-2">
                                            <MessageSquare className="w-4 h-4" />
                                            <span>Prompt and Description</span>
                                        </FormLabel>
                                        <FormDescription>
                                            Describe the persona's behavior, knowledge, task and Output formats and details about each persona style.
                                        </FormDescription>
                                        <FormControl>
                                            <Textarea
                                                placeholder="Describe how your persona should behave and interact..."
                                                className="min-h-[120px] transition-all hover:border-primary"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={createPersonaForm.control}
                                name="maxPersonas"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="flex items-center space-x-2">
                                            <Users className="w-4 h-4" />
                                            <span>Maximum Personas Number</span>
                                        </FormLabel>
                                        <FormDescription>Set the maximum number of instances for this persona.</FormDescription>
                                        <FormControl>
                                            <Input
                                                type="number"
                                                min="1"
                                                placeholder="Enter a number"
                                                className="max-w-[200px] transition-all hover:border-primary"
                                                {...field}
                                            />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </form>
                    </Form>
                </CardContent>
                <CardFooter>
                    <Button type="submit" onClick={createPersonaForm.handleSubmit(onSubmit)} className="w-full sm:w-auto">
                        {
                            isCreateLoading ? "Creating Persona..." : <div className="flex gap-2 items-center">
                                Create Persona
                                <Sparkles className="w-4 h-4 ml-2" />
                            </div>
                        }
                    </Button>
                </CardFooter>
            </Card>
        </div>
    )
}

