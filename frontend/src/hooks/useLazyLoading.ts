import { useState, useEffect, useRef, useCallback } from 'react'

interface UseLazyLoadingOptions {
  threshold?: number
  rootMargin?: string
  triggerOnce?: boolean
  skip?: boolean
}

interface UseLazyLoadingReturn {
  ref: React.RefObject<HTMLElement>
  isVisible: boolean
  hasBeenVisible: boolean
}

export const useLazyLoading = (options: UseLazyLoadingOptions = {}): UseLazyLoadingReturn => {
  const {
    threshold = 0.1,
    rootMargin = '0px',
    triggerOnce = true,
    skip = false
  } = options

  const [isVisible, setIsVisible] = useState(false)
  const [hasBeenVisible, setHasBeenVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  const handleIntersection = useCallback((entries: IntersectionObserverEntry[]) => {
    const [entry] = entries
    
    if (entry.isIntersecting) {
      setIsVisible(true)
      if (!hasBeenVisible) {
        setHasBeenVisible(true)
      }
    } else if (!triggerOnce) {
      setIsVisible(false)
    }
  }, [triggerOnce, hasBeenVisible])

  useEffect(() => {
    if (skip || !ref.current) return

    const observer = new IntersectionObserver(handleIntersection, {
      threshold,
      rootMargin
    })

    observer.observe(ref.current)

    return () => {
      observer.disconnect()
    }
  }, [handleIntersection, threshold, rootMargin, skip])

  return {
    ref,
    isVisible,
    hasBeenVisible
  }
}

export default useLazyLoading
