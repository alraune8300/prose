import React, { useRef, useEffect, useCallback, useState } from 'react'

interface ColorWheelProps {
  value: string
  onChange: (hex: string) => void
  size?: number
}

function hexToHsv(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255
  const g = parseInt(hex.slice(3, 5), 16) / 255
  const b = parseInt(hex.slice(5, 7), 16) / 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  const d = max - min
  const s = max === 0 ? 0 : d / max
  const v = max
  let h = 0
  if (d !== 0) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
    else if (max === g) h = ((b - r) / d + 2) / 6
    else h = ((r - g) / d + 4) / 6
  }
  return [h * 360, s, v]
}

function hsvToHex(h: number, s: number, v: number): string {
  h = ((h % 360) + 360) % 360
  const i = Math.floor(h / 60)
  const f = h / 60 - i
  const p = v * (1 - s)
  const q = v * (1 - f * s)
  const t = v * (1 - (1 - f) * s)
  let r = 0, g = 0, b = 0
  switch (i % 6) {
    case 0: r = v; g = t; b = p; break
    case 1: r = q; g = v; b = p; break
    case 2: r = p; g = v; b = t; break
    case 3: r = p; g = q; b = v; break
    case 4: r = t; g = p; b = v; break
    case 5: r = v; g = p; b = q; break
  }
  return '#' + [r, g, b].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join('')
}

function clamp(x: number, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, x)) }

export default function ColorWheel({ value, onChange, size = 220 }: ColorWheelProps) {
  const slCanvas = useRef<HTMLCanvasElement>(null)
  const hueCanvas = useRef<HTMLCanvasElement>(null)
  const [hsv, setHsv] = useState<[number, number, number]>(() => {
    try { return hexToHsv(value.length === 7 ? value : '#3a78d0') } catch { return [210, 0.6, 0.8] }
  })
  const [hex, setHex] = useState(value)
  const [hexInput, setHexInput] = useState(value)
  const draggingSL = useRef(false)
  const draggingHue = useRef(false)

  const hueBarH = 18
  const sqSize = size - 8

  const hueVal = hsv[0]
  const satVal = hsv[1]
  const valVal = hsv[2]

  const drawSL = useCallback(() => {
    const canvas = slCanvas.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width, h = canvas.height
    const hueColor = hsvToHex(hueVal, 1, 1)
    const gradH = ctx.createLinearGradient(0, 0, w, 0)
    gradH.addColorStop(0, '#ffffff')
    gradH.addColorStop(1, hueColor)
    ctx.fillStyle = gradH
    ctx.fillRect(0, 0, w, h)
    const gradV = ctx.createLinearGradient(0, 0, 0, h)
    gradV.addColorStop(0, 'rgba(0,0,0,0)')
    gradV.addColorStop(1, 'rgba(0,0,0,1)')
    ctx.fillStyle = gradV
    ctx.fillRect(0, 0, w, h)
  }, [hueVal])

  const drawHue = useCallback(() => {
    const canvas = hueCanvas.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    const w = canvas.width, h = canvas.height
    const grad = ctx.createLinearGradient(0, 0, w, 0)
    for (let i = 0; i <= 360; i += 30) {
      grad.addColorStop(i / 360, `hsl(${i},100%,50%)`)
    }
    ctx.fillStyle = grad
    ctx.fillRect(0, 0, w, h)
  }, [])

  useEffect(() => { drawSL() }, [drawSL])
  useEffect(() => { drawHue() }, [drawHue])

  useEffect(() => {
    if (value !== hex && value.length === 7) {
      try {
        const newHsv = hexToHsv(value)
        setHsv(newHsv)
        setHex(value)
        setHexInput(value)
      } catch (err) {
        console.error(err)
      }
    }
  }, [value, hex])

  const updateFromHsv = useCallback((h: number, s: number, v: number) => {
    const newHex = hsvToHex(h, s, v)
    setHsv([h, s, v])
    setHex(newHex)
    setHexInput(newHex)
    onChange(newHex)
  }, [onChange])

  const handleSLPointer = useCallback((e: React.PointerEvent | PointerEvent) => {
    const canvas = slCanvas.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const s = clamp((e.clientX - rect.left) / rect.width)
    const v = clamp(1 - (e.clientY - rect.top) / rect.height)
    updateFromHsv(hueVal, s, v)
  }, [hueVal, updateFromHsv])

  const handleHuePointer = useCallback((e: React.PointerEvent | PointerEvent) => {
    const canvas = hueCanvas.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const h = clamp((e.clientX - rect.left) / rect.width) * 360
    updateFromHsv(h, satVal, valVal)
  }, [satVal, valVal, updateFromHsv])

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (draggingSL.current) handleSLPointer(e)
      if (draggingHue.current) handleHuePointer(e)
    }
    const onUp = () => { draggingSL.current = false; draggingHue.current = false }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    return () => { window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp) }
  }, [handleSLPointer, handleHuePointer])

  const thumbX = hsv[1] * sqSize
  const thumbY = (1 - hsv[2]) * sqSize
  const hueX = (hsv[0] / 360) * sqSize

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, userSelect: 'none' }}>
      {/* SL Square */}
      <div style={{ position: 'relative', width: sqSize, height: sqSize, borderRadius: 6, overflow: 'hidden', cursor: 'crosshair', boxShadow: '0 1px 4px rgba(0,0,0,0.18)' }}>
        <canvas
          ref={slCanvas}
          width={sqSize}
          height={sqSize}
          style={{ display: 'block', width: '100%', height: '100%' }}
          onPointerDown={e => {
            draggingSL.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            handleSLPointer(e)
          }}
        />
        <div style={{
          position: 'absolute',
          left: thumbX - 7, top: thumbY - 7,
          width: 14, height: 14,
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 0 0 1.5px rgba(0,0,0,0.4), 0 1px 3px rgba(0,0,0,0.3)',
          background: hex,
          pointerEvents: 'none',
        }} />
      </div>

      {/* Hue slider */}
      <div style={{ position: 'relative', width: sqSize, height: hueBarH }}>
        <canvas
          ref={hueCanvas}
          width={sqSize}
          height={hueBarH}
          style={{ display: 'block', width: '100%', height: '100%', borderRadius: hueBarH / 2, boxShadow: '0 1px 3px rgba(0,0,0,0.15)', cursor: 'ew-resize' }}
          onPointerDown={e => {
            draggingHue.current = true
            e.currentTarget.setPointerCapture(e.pointerId)
            handleHuePointer(e)
          }}
        />
        <div style={{
          position: 'absolute',
          left: hueX - 10, top: '50%', transform: 'translateY(-50%)',
          width: 20, height: 20,
          borderRadius: '50%',
          border: '2px solid white',
          boxShadow: '0 0 0 1.5px rgba(0,0,0,0.35), 0 1px 3px rgba(0,0,0,0.25)',
          background: `hsl(${hsv[0]},100%,50%)`,
          pointerEvents: 'none',
        }} />
      </div>

      {/* Hex input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: sqSize }}>
        <div style={{ width: 24, height: 24, borderRadius: 5, background: hex, border: '1px solid rgba(0,0,0,0.18)', flexShrink: 0 }} />
        <input
          value={hexInput}
          onChange={e => {
            const v = e.target.value
            setHexInput(v)
            if (/^#[0-9a-fA-F]{6}$/.test(v)) {
              try {
                const newHsv = hexToHsv(v)
                setHsv(newHsv)
                setHex(v)
                onChange(v)
              } catch (err) {
                console.error(err)
              }
            }
          }}
          onBlur={() => {
            if (!/^#[0-9a-fA-F]{6}$/.test(hexInput)) setHexInput(hex)
          }}
          style={{
            flex: 1, padding: '4px 8px', borderRadius: 5,
            border: '1px solid rgba(0,0,0,0.14)',
            fontFamily: 'ui-monospace, monospace', fontSize: '0.8rem',
            background: 'transparent', color: 'inherit', outline: 'none',
          }}
          spellCheck={false}
          maxLength={7}
        />
      </div>
    </div>
  )
}
