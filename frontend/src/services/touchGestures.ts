export interface TouchGesture {
  type: 'swipe' | 'pinch' | 'pan' | 'tap' | 'longPress'
  direction?: 'up' | 'down' | 'left' | 'right'
  distance?: number
  duration?: number
  scale?: number
  deltaX?: number
  deltaY?: number
}

export interface TouchGestureCallbacks {
  onSwipe?: (direction: 'up' | 'down' | 'left' | 'right', distance: number) => void
  onPinch?: (scale: number, deltaScale: number) => void
  onPan?: (deltaX: number, deltaY: number) => void
  onTap?: (x: number, y: number) => void
  onLongPress?: (x: number, y: number) => void
}

export class TouchGesturesService {
  private element: HTMLElement
  private callbacks: TouchGestureCallbacks
  private touchStartTime: number = 0
  private touchStartX: number = 0
  private touchStartY: number = 0
  private lastTouchX: number = 0
  private lastTouchY: number = 0
  private initialDistance: number = 0
  private initialScale: number = 1
  private longPressTimer: NodeJS.Timeout | null = null
  private isLongPress: boolean = false
  private isPanning: boolean = false
  private isPinching: boolean = false

  constructor(element: HTMLElement, callbacks: TouchGestureCallbacks) {
    this.element = element
    this.callbacks = callbacks
    this.bindEvents()
  }

  private bindEvents() {
    this.element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false })
    this.element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false })
    this.element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false })
    this.element.addEventListener('touchcancel', this.handleTouchCancel.bind(this), { passive: false })
  }

  private handleTouchStart(event: TouchEvent) {
    if (event.touches.length === 0) return

    const touch = event.touches[0]
    this.touchStartTime = Date.now()
    this.touchStartX = touch.clientX
    this.touchStartY = touch.clientY
    this.lastTouchX = touch.clientX
    this.lastTouchY = touch.clientY
    this.isLongPress = false
    this.isPanning = false
    this.isPinching = false

    // Start long press timer
    this.longPressTimer = setTimeout(() => {
      this.isLongPress = true
      if (this.callbacks.onLongPress) {
        this.callbacks.onLongPress(touch.clientX, touch.clientY)
      }
    }, 500)

    // Handle multi-touch for pinch
    if (event.touches.length === 2) {
      this.handlePinchStart(event)
    }
  }

  private handleTouchMove(event: TouchEvent) {
    if (event.touches.length === 0) return

    const touch = event.touches[0]
    const deltaX = touch.clientX - this.touchStartX
    const deltaY = touch.clientY - this.touchStartY
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)

    // Clear long press timer if moved
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    // Handle pinch
    if (event.touches.length === 2) {
      this.handlePinchMove(event)
      return
    }

    // Handle pan
    if (distance > 10) {
      this.isPanning = true
      if (this.callbacks.onPan) {
        this.callbacks.onPan(touch.clientX - this.lastTouchX, touch.clientY - this.lastTouchY)
      }
      this.lastTouchX = touch.clientX
      this.lastTouchY = touch.clientY
    }
  }

  private handleTouchEnd(event: TouchEvent) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }

    if (event.touches.length === 0) {
      const touch = event.changedTouches[0]
      const deltaX = touch.clientX - this.touchStartX
      const deltaY = touch.clientY - this.touchStartY
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
      const duration = Date.now() - this.touchStartTime

      // Handle tap
      if (distance < 10 && duration < 300 && !this.isLongPress) {
        if (this.callbacks.onTap) {
          this.callbacks.onTap(touch.clientX, touch.clientY)
        }
      }

      // Handle swipe
      if (distance > 50 && duration < 300 && !this.isPanning && !this.isPinching) {
        this.handleSwipe(deltaX, deltaY, distance)
      }

      this.isPanning = false
      this.isPinching = false
    }
  }

  private handleTouchCancel(event: TouchEvent) {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer)
      this.longPressTimer = null
    }
    this.isPanning = false
    this.isPinching = false
  }

  private handlePinchStart(event: TouchEvent) {
    if (event.touches.length !== 2) return

    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    this.initialDistance = this.getDistance(touch1, touch2)
    this.initialScale = 1
    this.isPinching = true
  }

  private handlePinchMove(event: TouchEvent) {
    if (event.touches.length !== 2 || !this.isPinching) return

    const touch1 = event.touches[0]
    const touch2 = event.touches[1]
    const currentDistance = this.getDistance(touch1, touch2)
    const scale = currentDistance / this.initialDistance
    const deltaScale = scale - this.initialScale

    if (this.callbacks.onPinch) {
      this.callbacks.onPinch(scale, deltaScale)
    }

    this.initialScale = scale
  }

  private handleSwipe(deltaX: number, deltaY: number, distance: number) {
    if (!this.callbacks.onSwipe) return

    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)

    if (absDeltaX > absDeltaY) {
      // Horizontal swipe
      if (deltaX > 0) {
        this.callbacks.onSwipe('right', distance)
      } else {
        this.callbacks.onSwipe('left', distance)
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        this.callbacks.onSwipe('down', distance)
      } else {
        this.callbacks.onSwipe('up', distance)
      }
    }
  }

  private getDistance(touch1: Touch, touch2: Touch): number {
    const deltaX = touch1.clientX - touch2.clientX
    const deltaY = touch1.clientY - touch2.clientY
    return Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  }

  public destroy() {
    this.element.removeEventListener('touchstart', this.handleTouchStart.bind(this))
    this.element.removeEventListener('touchmove', this.handleTouchMove.bind(this))
    this.element.removeEventListener('touchend', this.handleTouchEnd.bind(this))
    this.element.removeEventListener('touchcancel', this.handleTouchCancel.bind(this))
  }
}

export const isMobileDevice = (): boolean => {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
}

export const isTouchDevice = (): boolean => {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}