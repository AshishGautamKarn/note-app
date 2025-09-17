import { useState, useEffect, useRef, useCallback } from 'react'

interface UseVirtualScrollingOptions {
  itemHeight: number
  containerHeight: number
  overscan?: number
  totalItems: number
}

interface UseVirtualScrollingReturn {
  containerRef: React.RefObject<HTMLDivElement>
  scrollTop: number
  visibleItems: Array<{
    index: number
    top: number
    height: number
  }>
  totalHeight: number
  scrollToIndex: (index: number) => void
  scrollToTop: () => void
  scrollToBottom: () => void
}

export const useVirtualScrolling = (options: UseVirtualScrollingOptions): UseVirtualScrollingReturn => {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    totalItems
  } = options

  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const totalHeight = totalItems * itemHeight

  const visibleItems = (() => {
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
    const endIndex = Math.min(
      totalItems - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    )

    const items = []
    for (let i = startIndex; i <= endIndex; i++) {
      items.push({
        index: i,
        top: i * itemHeight,
        height: itemHeight
      })
    }

    return items
  })()

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

  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current
    if (!container) return

    const targetScrollTop = index * itemHeight
    container.scrollTop = targetScrollTop
    setScrollTop(targetScrollTop)
  }, [itemHeight])

  const scrollToTop = useCallback(() => {
    scrollToIndex(0)
  }, [scrollToIndex])

  const scrollToBottom = useCallback(() => {
    scrollToIndex(totalItems - 1)
  }, [scrollToIndex, totalItems])

  return {
    containerRef,
    scrollTop,
    visibleItems,
    totalHeight,
    scrollToIndex,
    scrollToTop,
    scrollToBottom
  }
}

export default useVirtualScrolling
