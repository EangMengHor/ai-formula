import { ChartPie, Download } from 'lucide-react';
import mermaid from 'mermaid';
import panzoom from 'panzoom';
import React, { useEffect, useRef, useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogTrigger,
} from "@/components/ui/dialog";
import { memo } from "react";
export const Mermaid = memo(({ chart }) => {
    const mermaidRef = useRef(null);
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

    useEffect(() => {
        if (chart) {
            mermaid.initialize({ ...customConfig });
            mermaid.contentLoaded();
        }
    }, [chart]);

    useEffect(() => {
        if (isOpen && mermaidRef.current) {
            panZoomInstanceRef.current = panzoom(mermaidRef.current, {
                maxZoom: 5,
                minZoom: 0.5,
                wheelAction: 'zoom',
            });
        }
        return () => {
            if (panZoomInstanceRef.current) {
                panZoomInstanceRef.current.dispose();
                panZoomInstanceRef.current = null;
            }
        };
    }, [isOpen]);

    // Download as SVG
    const downloadSVG = () => {
        const svg = mermaidRef.current.querySelector('svg');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = 'mermaid-diagram.svg';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Download as PNG
    const downloadPNG = async () => {
        const svg = mermaidRef.current?.querySelector("svg");
        if (!svg) return;

        // Set width & height explicitly to avoid cropping issues
        const { width, height } = svg.getBBox();
        svg.setAttribute("width", width);
        svg.setAttribute("height", height);

        const serializer = new XMLSerializer();
        const svgData = serializer.serializeToString(svg);
        const img = new Image();

        img.onload = () => {
            const scaleFactor = 3; // Increase for better resolution
            const canvas = document.createElement("canvas");
            canvas.width = width * scaleFactor;
            canvas.height = height * scaleFactor;

            const ctx = canvas.getContext("2d");
            ctx.fillStyle = "white"; // Background fix
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const link = document.createElement("a");
            link.href = canvas.toDataURL("image/png");
            link.download = "mermaid-diagram.png";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        };

        img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    };

    console.log("6787867867876876876876876876868768768768", chart.replaceAll('`', '').replaceAll('chart ', '').replace('flow', 'flowchart ', ''));
    return (
        <div className='w-full h-full my-5 border border-gray-500 rounded-lg'>
            <div className='flex items-center justify-between'>
                <div></div>

                <div className='p-2'>
                    <Dialog onOpenChange={setIsOpen}>
                        <DialogTrigger>
                            <div
                                className="flex gap-2 w-fit bg-gray-500 hover:bg-slate-500 px-2 py-1 rounded-md cursor-pointer items-center"
                            >
                                <ChartPie className="w-5 h-5" />
                                <p>Open Visualization</p>
                            </div>
                        </DialogTrigger>
                        <DialogContent
                            className="bg-slate-800 border-0 w-[calc(100vw-10rem)] h-[calc(100vh-5rem)] "
                            onOpenAutoFocus={() => mermaid.contentLoaded()}
                        >
                            <div className=''>
                                <div className='h-fit flex  justify-between w-full my-7 gap-2  items-center'>
                                    <div className='text-white font-semibold'>
                                        Scroll & Zoom (via PanZoom)
                                    </div>
                                    <div className='flex gap-2 w-fit'>
                                        <button
                                            onClick={downloadPNG}
                                            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 flex items-center gap-2"
                                        >
                                            <Download className="w-5 h-5" />
                                            Download PNG
                                        </button>
                                        <button
                                            onClick={downloadSVG}
                                            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center gap-2"
                                        >
                                            <Download className="w-5 h-5" />
                                            Download SVG
                                        </button>

                                    </div>
                                </div>
                                <div>

                                    <div
                                        ref={mermaidRef}
                                        className="mermaid"
                                        dangerouslySetInnerHTML={{ __html: chart.replaceAll('`', '').replaceAll('chart ', '').replace('flow', 'flowchart ', '') }}
                                    ></div>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            <div>
                <div
                    ref={mermaidRef}
                    className="mermaid"
                    dangerouslySetInnerHTML={{ __html: chart.replaceAll('`', '').replaceAll('chart ', '').replace('flow', 'flowchart ', '') }}
                ></div>
            </div>
        </div>
    );
})
