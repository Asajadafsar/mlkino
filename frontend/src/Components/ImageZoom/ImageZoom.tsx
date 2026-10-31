import { Box } from '@mui/material';
import React, { ReactNode, useState } from 'react';
import { TransformComponent, TransformWrapper } from 'react-zoom-pan-pinch';

export default function ImageZoom({ children }: { children: ReactNode }) {
    const [zoomed, setZoomed] = useState(false);
    const [currentScale, setCurrentScale] = useState(1);

    return (
        <TransformWrapper
            initialScale={1}
            minScale={1}
            maxScale={2}
            wheel={{ disabled: true }}
        >
            {({ setTransform, resetTransform }) => (
                <TransformComponent>
                    <Box
                        sx={{
                            position: "relative",
                            borderRadius: 2,
                            overflow: "hidden",
                            cursor: zoomed ? "zoom-out" : "zoom-in",
                        }}
                        component="div"
                        onClick={(e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const clickX = e.clientX - rect.left;
                            const clickY = e.clientY - rect.top;

                            if (zoomed) {
                                resetTransform();
                                setCurrentScale(1);
                            } else {
                                const newScale = 2;
                                
                                const originX = clickX / currentScale;
                                const originY = clickY / currentScale;

                                const x = rect.width / 2 - originX * newScale;
                                const y = rect.height / 2 - originY * newScale;

                                setTransform(x, y, newScale);
                                setCurrentScale(newScale);
                            }

                            setZoomed(!zoomed);
                        }}
                    >
                        {children}
                    </Box>
                </TransformComponent>
            )}
        </TransformWrapper>
    );
}
