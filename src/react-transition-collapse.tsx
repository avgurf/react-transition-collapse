// Import here Polyfills if needed. Recommended core-js (npm i -D core-js)
// import "core-js/fn/array.find"
// ...

import * as React from 'react'

const innerBaseStyle = {
  height: 'auto'
}

const wrapperBaseStyle = {
  transition: 'height 0.5s ease',
  height: '0px',
  overflow: 'hidden'
}

type DomEl = null | HTMLElement

type transitionProps = {
  expanded: boolean
  children: Element
  duration?: number | string
}

class ReactTransitionCollapse extends React.PureComponent<transitionProps> {
  innerEl: DomEl = null
  wrapperEl: DomEl = null
  wrapperParentEl: DomEl | Node = null
  height: number | null = null
  detachReMeasureListeners: (() => void) | null = null

  componentDidMount() {
    this.detachReMeasureListeners = this.reMeasure()
  }

  getListener = (cb: () => void) => {
    if (!(window as any).ResizeObserver) {
      window.addEventListener('resize', cb)
      return () => {
        window.removeEventListener('resize', cb)
      }
    }
    const ro = new (window as any).ResizeObserver(cb)
    ro.observe(this.innerEl)
    return () => {
      ro.disconnect()
    }
  }

  reMeasure = () => {
    let timeout: NodeJS.Timeout
    return this.getListener(() => {
      if (
        !this.wrapperEl ||
        !this.wrapperParentEl ||
        !this.wrapperParentEl.contains(this.wrapperEl)
      ) {
        return
      }
      clearTimeout(timeout)
      timeout = setTimeout(() => {
        this.measure(this.innerEl)
        this.setHeight()
      }, 500)
    })
  }

  componentDidUpdate() {
    this.setHeight()
  }

  updateInnerHeight = (height: number | null) => {
    if (!this.wrapperEl || height === null) {
      return
    }
    if (this.wrapperEl.style.height !== height + 'px') {
      this.wrapperEl.style.height = height + 'px'
    }
  }

  setHeight = () => {
    if (this.props.expanded && this.wrapperEl) {
      if (this.wrapperParentEl && !this.wrapperParentEl.contains(this.wrapperEl)) {
        this.wrapperParentEl.appendChild(this.wrapperEl)
        const reexec = () =>
          requestAnimationFrame(() => {
            if (
              this.wrapperEl &&
              this.wrapperParentEl &&
              this.wrapperParentEl.contains(this.wrapperEl)
            ) {
              this.measure(this.innerEl)
              this.updateInnerHeight(this.height)
            } else {
              reexec()
            }
          })
        reexec()
      } else {
        this.measure(this.innerEl)
        this.updateInnerHeight(this.height)
      }
    } else if (this.wrapperEl) {
      this.updateInnerHeight(0)
    }
  }

  transitionEnd = () => {
    if (!this.props.expanded && this.wrapperParentEl && this.wrapperEl) {
      this.wrapperParentEl.removeChild(this.wrapperEl)
    }
  }

  measure = (el: DomEl) => {
    if (!el) {
      return
    }
    this.innerEl = el
    this.height = el.offsetHeight
  }

  setWrapperEl = (el: DomEl) => {
    this.wrapperEl = el
    if (el) {
      this.wrapperParentEl = el.parentNode
    }
  }

  render() {
    const { children, duration } = this.props

    const wrapperStyle = {
      ...wrapperBaseStyle
    }

    if (typeof duration === 'number' || typeof duration === 'string') {
      wrapperStyle.transition = duration + 'ms ease'
    }

    return (
      <div style={wrapperStyle} ref={this.setWrapperEl} onTransitionEnd={this.transitionEnd}>
        <div style={innerBaseStyle} ref={this.measure}>
          {children}
        </div>
      </div>
    )
  }
}

export default ReactTransitionCollapse
