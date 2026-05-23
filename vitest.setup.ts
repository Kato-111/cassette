import "@testing-library/jest-dom/vitest";

class ResizeObserverMock {
  private callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    const height =
      target.getAttribute?.("data-slot") === "table-container" ? 600 : 0;
    const width = 800;
    this.callback(
      [
        {
          target,
          contentRect: {
            x: 0,
            y: 0,
            width,
            height,
            top: 0,
            left: 0,
            bottom: height,
            right: width,
            toJSON: () => ({}),
          },
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        } as ResizeObserverEntry,
      ],
      this,
    );
  }

  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = ResizeObserverMock;

const scrollContainerClientHeight = 600;

Object.defineProperty(HTMLElement.prototype, "clientHeight", {
  configurable: true,
  get(this: HTMLElement) {
    if (this.getAttribute?.("data-slot") === "table-container") {
      return scrollContainerClientHeight;
    }
    return 0;
  },
});

Object.defineProperty(HTMLElement.prototype, "scrollHeight", {
  configurable: true,
  get(this: HTMLElement) {
    if (this.getAttribute?.("data-slot") === "table-container") {
      return Math.max(
        scrollContainerClientHeight,
        Number(this.dataset.scrollHeight ?? scrollContainerClientHeight),
      );
    }
    return 0;
  },
});

Object.defineProperty(HTMLElement.prototype, "getBoundingClientRect", {
  configurable: true,
  value(this: HTMLElement) {
    const height =
      this.getAttribute?.("data-slot") === "table-container" ? 600 : 0;
    return {
      x: 0,
      y: 0,
      width: 800,
      height,
      top: 0,
      left: 0,
      bottom: height,
      right: 800,
      toJSON: () => ({}),
    };
  },
});
