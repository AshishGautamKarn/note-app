import { useEffect, useRef, useState } from 'react'

interface UseLazyLoadingOptions {
  rootMargin?: string
  threshold?: number
  triggerOnce?: boolean
}

export const useLazyLoading = (options: UseLazyLoadingOptions = {}) => {
  const {
    rootMargin = '50px',
    threshold = 0.1,
    triggerOnce = true
  } = options

  const [isVisible, setIsVisible] = useState(false)
  const [hasTriggered, setHasTriggered] = useState(false)
  const elementRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    // If triggerOnce is true and we've already triggered, don't observe again
    if (triggerOnce && hasTriggered) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (triggerOnce) {
            setHasTriggered(true)
            observer.unobserve(element)
          }
        } else if (!triggerOnce) {
          setIsVisible(false)
        }
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [rootMargin, threshold, triggerOnce, hasTriggered])

  return {
    elementRef,
    isVisible: triggerOnce ? (isVisible || hasTriggered) : isVisible
  }
}

export default useLazyLoading