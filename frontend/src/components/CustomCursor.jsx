import { useEffect, useRef } from 'react';

export default function CustomCursor() {
    const dotRef = useRef(null);
    const ringRef = useRef(null);

    useEffect(() => {
        let mouseX = 0, mouseY = 0;
        let dotX = 0, dotY = 0;
        let ringX = 0, ringY = 0;
        let scaleDot = 1;
        let scaleRing = 1;
        let opacityRing = 0.5;
        let isHovering = false;
        
        const updateMousePosition = (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const handleMouseOver = (e) => {
            if (
                e.target.tagName === 'BUTTON' ||
                e.target.tagName === 'A' ||
                e.target.closest('button') ||
                e.target.closest('a') ||
                e.target.closest('[role="button"]')
            ) {
                isHovering = true;
            } else {
                isHovering = false;
            }
        };

        window.addEventListener('mousemove', updateMousePosition);
        window.addEventListener('mouseover', handleMouseOver);

        let animationFrameId;

        const render = () => {
            // Apply smoothing (lerping)
            dotX += (mouseX - dotX) * 0.4;
            dotY += (mouseY - dotY) * 0.4;
            ringX += (mouseX - ringX) * 0.12;
            ringY += (mouseY - ringY) * 0.12;

            const targetScaleDot = isHovering ? 2.5 : 1;
            const targetScaleRing = isHovering ? 1.5 : 1;
            const targetOpacityRing = isHovering ? 0 : 0.5;

            scaleDot += (targetScaleDot - scaleDot) * 0.2;
            scaleRing += (targetScaleRing - scaleRing) * 0.2;
            opacityRing += (targetOpacityRing - opacityRing) * 0.2;

            if (dotRef.current) {
                dotRef.current.style.transform = `translate3d(${dotX - 8}px, ${dotY - 8}px, 0) scale(${scaleDot})`;
            }

            if (ringRef.current) {
                ringRef.current.style.transform = `translate3d(${ringX - 16}px, ${ringY - 16}px, 0) scale(${scaleRing})`;
                ringRef.current.style.opacity = opacityRing;
            }

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        return () => {
            window.removeEventListener('mousemove', updateMousePosition);
            window.removeEventListener('mouseover', handleMouseOver);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <>
            <div
                ref={dotRef}
                className="fixed top-0 left-0 w-4 h-4 bg-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
                style={{ willChange: 'transform' }}
            />
            <div
                ref={ringRef}
                className="fixed top-0 left-0 w-8 h-8 border border-white rounded-full pointer-events-none z-[9999] mix-blend-difference"
                style={{ willChange: 'transform, opacity' }}
            />
        </>
    );
}
