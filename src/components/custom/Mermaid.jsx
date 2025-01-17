import { ChartPie } from 'lucide-react';
import mermaid from 'mermaid';
import React, { useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog"
export const Mermaid = ({ chart }) => {
    const mermaidRef = useRef(null);
    const customConfig = {
        theme: 'dark', // Use the dark base theme as a starting point
        themeVariables: {
            primaryColor: '#808080', // Gray for nodes
            primaryTextColor: '#ffffff', // White text
            secondaryColor: '#808080', // Gray for secondary nodes
            tertiaryColor: '#808080', // Gray for accents
            edgeLabelBackground: '#808080', // White background for edge labels
            lineColor: '#808080', // Gray lines for edges
            fontFamily: 'Arial, sans-serif', // Optional: Custom font
            background: '#2b2b2b', // Dark background for the diagram
        },
    };

    useEffect(() => {
        if (chart) {
            mermaid.initialize(customConfig);

            mermaid.contentLoaded();
        }
    }, [chart]);

    return (
        <div className='w-full h-full my-5 border border-gray-500  rounded-lg'>
            <div className='flex items-center justify-between'>
                <div></div>
                <div className='p-2'>
                    <Dialog>
                        <DialogTrigger>
                            <div className="flex gap-2 w-fit bg-gray-500 hover:bg-slate-500 px-2 py-1 rounded-md cursor-pointer items-center">
                                <ChartPie className="w-5 h-5" />
                                <p>Open Visualization</p>
                            </div>
                        </DialogTrigger>
                        <DialogContent className="flex  flex-col justify-center items-center bg-slate-800 border-0 w-[calc(100vw-10rem)] h-[calc(100vh-5rem)]" onOpenAutoFocus={() => mermaid.contentLoaded()}>
                            <div className='w-full text-white font-semibold'>Scroll and Shift + Scroll To Explore Visualization</div>
                            <div
                                ref={mermaidRef}
                                className="mermaid w-full h-full overflow-auto flex items-center justify-center"
                                dangerouslySetInnerHTML={{ __html: chart }}
                            ></div>
                        </DialogContent>
                    </Dialog>

                </div>
            </div>
            <div>
                <div
                    ref={mermaidRef}
                    className="mermaid"
                    dangerouslySetInnerHTML={{ __html: chart }}
                ></div>
            </div>
        </div>
    );
};