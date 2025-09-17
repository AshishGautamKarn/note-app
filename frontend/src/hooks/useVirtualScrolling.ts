import { useState, useEffect, useRef, useCallback } from 'react'

interface UseVirtualScrollingOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
}

export const useVirtualScrolling = <T>(
  items: T[],
  options: UseVirtualScrollingOptions
) => {
  const { itemHeight, containerHeight, overscan = 5 } = options
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = items.length * itemHeight
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const endIndex = Math.min(
    items.length - 1,
    startIndex + visibleCount + overscan * 2
  )

  const visibleItems = items.slice(startIndex, endIndex + 1).map((item, index) => ({
    item,
    index: startIndex + index
  }))

  const offsetY = startIndex * itemHeight

  const handleScroll = useCallback((e: Event) => {
    const target = e.target as HTMLDivElement
    setScrollTop(target.scrollTop)
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  return {
    containerRef,
    totalHeight,
    visibleItems,
    offsetY,
    scrollTop
  }
}

export default useVirtualScrolling