import { useEffect, useRef, useState } from 'react';

// A simple virtualized list component that only renders visible items
function VirtualizedList({ items, itemHeight = 80, renderItem, className = "", overscan = 3 }) {
    const containerRef = useRef(null);
    const [visibleItems, setVisibleItems] = useState([]);
    const [scrollTop, setScrollTop] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            if (containerRef.current) {
                setScrollTop(containerRef.current.scrollTop);
            }
        };

        const container = containerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            handleScroll();
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, []);

    useEffect(() => {
        if (containerRef.current) {
            const { height } = containerRef.current.getBoundingClientRect();
            const visibleStartIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
            const visibleEndIndex = Math.min(
                items.length - 1,
                Math.ceil((scrollTop + height) / itemHeight) + overscan
            );

            const newVisibleItems = [];
            for (let i = visibleStartIndex; i <= visibleEndIndex; i++) {
                newVisibleItems.push({
                    index: i,
                    item: items[i],
                    style: {
                        position: 'absolute',
                        top: i * itemHeight,
                        height: itemHeight,
                        left: 0,
                        right: 0,
                    },
                });
            }
            setVisibleItems(newVisibleItems);
        }
    }, [items, scrollTop, itemHeight, overscan]);

    return (
        <div
            ref={containerRef}
            style={{ overflowY: 'auto', position: 'relative', height: '100%' }}
            className={className}
        >
            <div style={{ height: items.length * itemHeight, position: 'relative' }}>
                {visibleItems.map(({ index, item, style }) => (
                    <div key={index} style={style}>
                        {renderItem(item, index)}
                    </div>
                ))}
            </div>
        </div>
    );
}

export default VirtualizedList;
