import { ChartPie } from 'lucide-react';
import mermaid from 'mermaid';
import panzoom from 'panzoom';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";

export const Mermaid = ({ chart }) => {
    const mermaidRef = useRef(null); // will reference only the mermaid diagram
    const [isOpen, setIsOpen] = useState(false);
    const panZoomInstanceRef = useRef(null);

    const customConfig = {
        theme: 'dark',
        themeVariables: {
            primaryColor: '#808080',
            primaryTextColor: '#ffffff',
            secondaryColor: '#808080',
            tertiaryColor: '#808080',
            edgeLabelBackground: '#808080',
            lineColor: '#808080',
            fontFamily: 'Arial, sans-serif',
            background: '#2b2b2b',
        },

    };

    // Initialize mermaid when the chart updates
    useEffect(() => {
        if (chart) {
            mermaid.initialize({
                ...customConfig
            });
            mermaid.contentLoaded();
            mermaid.parseError = (err, hash) => {
                console.log(err, hash)
            }
        }
    }, [chart]);

    // When Dialog opens, attach panzoom to the Mermaid diagram element
    useEffect(() => {
        if (isOpen && mermaidRef.current) {
            panZoomInstanceRef.current = panzoom(mermaidRef.current, {
                maxZoom: 5,
                minZoom: 0.5,
                wheelAction: 'zoom',
                // You can customize additional options as needed
            });
        }
        return () => {
            if (panZoomInstanceRef.current) {
                panZoomInstanceRef.current.dispose();
                panZoomInstanceRef.current = null;
            }
        };
    }, [isOpen]);

    return (
        <div className='w-full h-full my-5 border border-gray-500 rounded-lg'>
            <div className='flex items-center justify-between'>
                <div></div>
                <div className='p-2'>
                    <Dialog onOpenChange={setIsOpen}>
                        <DialogTrigger>
                            <div className="flex gap-2 w-fit bg-gray-500 hover:bg-slate-500 px-2 py-1 rounded-md cursor-pointer items-center">
                                <ChartPie className="w-5 h-5" />
                                <p>Open Visualization</p>
                            </div>
                        </DialogTrigger>
                        <DialogContent
                            className="bg-slate-800 border-0 w-[calc(100vw-10rem)] h-[calc(100vh-5rem)] "
                            onOpenAutoFocus={() => {
                                // Refresh mermaid rendering when the Dialog opens
                                mermaid.contentLoaded();
                            }}
                        >

                            {/* Scrollable container that initially shows only the top-left part */}
                            <div
                                style={{
                                    width: '100%',
                                    height: 'calc(100% - 2rem)',
                                    overflow: 'auto',
                                    position: 'relative',
                                }}
                                className='border-2 border-slate-500  rounded-md'
                            >
                                <div
                                    ref={mermaidRef}
                                    className="mermaid"
                                    dangerouslySetInnerHTML={{ __html: chart }}
                                ></div>
                            </div>
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
