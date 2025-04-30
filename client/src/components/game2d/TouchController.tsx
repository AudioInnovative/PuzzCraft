import { useEffect, useRef } from 'react';
import { usePuzznic } from '../../lib/stores/usePuzznic';
import { useIsMobile } from '../../hooks/use-is-mobile';

// Minimum distance (in pixels) to detect a swipe
const MIN_SWIPE_DISTANCE = 30;

export function TouchController() {
  const { moveSelectedBlock, selectBlock, selectedBlockPos } = usePuzznic();
  const touchStartRef = useRef<{ x: number, y: number } | null>(null);
  const isMobile = useIsMobile();
  
  useEffect(() => {
    if (!isMobile) return; // Only use touch controls on mobile
    
    const handleTouchStart = (e: TouchEvent) => {
      // Store the starting position
      if (e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY
        };
      }
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      // If we have a touch start position (don't need to check selectedBlockPos here - let the moveSelectedBlock function check that)
      if (touchStartRef.current) {
        if (e.changedTouches.length === 1) {
          const touchEnd = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
          };
          
          // Calculate distance moved
          const deltaX = touchEnd.x - touchStartRef.current.x;
          const deltaY = touchEnd.y - touchStartRef.current.y;
          
          // Check if swipe was horizontal and long enough
          if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > MIN_SWIPE_DISTANCE) {
            // Swipe right or left
            if (deltaX > 0) {
              moveSelectedBlock('right');
              console.log('Swipe right detected');
            } else {
              moveSelectedBlock('left');
              console.log('Swipe left detected');
            }
          }
        }
      }
      
      // Reset touch start position
      touchStartRef.current = null;
    };
    
    const handleTouchCancel = () => {
      // Reset touch start position
      touchStartRef.current = null;
    };
    
    // Add event listeners
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    window.addEventListener('touchcancel', handleTouchCancel);
    
    // Clean up
    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', handleTouchCancel);
    };
  }, [moveSelectedBlock, selectedBlockPos, isMobile]);
  
  return null; // This component doesn't render anything
}