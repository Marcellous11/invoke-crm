'use client'

import { useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

export function NavigationProgress() {
  const pathname = usePathname()
  const [progress, setProgress] = useState(0)
  const [visible, setVisible] = useState(false)
  const prevPathname = useRef(pathname)
  const intervalRef = useRef<ReturnType<typeof setInterval>>()
  const hideTimer = useRef<ReturnType<typeof setTimeout>>()

  // Start the bar on any internal link click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a')
      if (!anchor) return
      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto')) return
      setVisible(true)
      setProgress(12)
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  // Slowly trickle forward while waiting
  useEffect(() => {
    if (!visible || progress <= 0 || progress >= 85) return
    intervalRef.current = setInterval(() => {
      setProgress(p => {
        const remaining = 85 - p
        return p + remaining * 0.12 + Math.random() * 2
      })
    }, 250)
    return () => clearInterval(intervalRef.current)
  }, [visible, progress > 0])

  // Complete when pathname changes
  useEffect(() => {
    if (pathname === prevPathname.current) return
    prevPathname.current = pathname
    clearInterval(intervalRef.current)
    setProgress(100)
    hideTimer.current = setTimeout(() => {
      setVisible(false)
      setProgress(0)
    }, 350)
    return () => clearTimeout(hideTimer.current)
  }, [pathname])

  if (!visible && progress === 0) return null

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[3px] bg-primary pointer-events-none"
      style={{
        width: `${Math.min(progress, 100)}%`,
        transition: progress === 100 ? 'width 200ms ease-out, opacity 200ms ease-in' : 'width 250ms ease-out',
        opacity: visible ? 1 : 0,
        boxShadow: '0 0 12px 4px #FF6421, 0 0 28px 10px #FF642155',
      }}
    />
  )
}
