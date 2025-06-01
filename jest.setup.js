// Polyfill TextEncoder and TextDecoder FIRST
import { TextEncoder, TextDecoder } from "util";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}

// JSDOM specific polyfills
if (typeof window !== "undefined") {
  // Robust window.location setup
  if (!window.location) {
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost/",
        origin: "http://localhost",
        protocol: "http:",
        host: "localhost",
        hostname: "localhost",
        pathname: "/",
        search: "",
        hash: "",
      },
      writable: true,
      configurable: true,
    });
  } else {
    if (!window.location.origin)
      window.location.origin = `${window.location.protocol}//${
        window.location.hostname
      }${window.location.port ? ":" + window.location.port : ""}`;
    if (!window.location.pathname) window.location.pathname = "/";
    if (!window.location.href)
      window.location.href =
        window.location.origin +
        window.location.pathname +
        window.location.search +
        window.location.hash;
  }

  // TextEncoder/Decoder on window object
  if (typeof window.TextEncoder === "undefined") {
    Object.defineProperty(window, "TextEncoder", { value: TextEncoder });
  }
  if (typeof window.TextDecoder === "undefined") {
    Object.defineProperty(window, "TextDecoder", { value: TextDecoder });
  }

  // PointerEvent polyfills for JSDOM for @testing-library/user-event compatibility with some components
  if (typeof Element.prototype.hasPointerCapture === "undefined") {
    Element.prototype.hasPointerCapture = function (pointerId) {
      return false;
    }; // Basic mock
    Element.prototype.setPointerCapture = function (pointerId) {
      /* no-op */
    };
    Element.prototype.releasePointerCapture = function (pointerId) {
      /* no-op */
    };
  }

  // Mock scrollIntoView for JSDOM compatibility with components that use it (e.g., Radix UI Select)
  if (typeof Element.prototype.scrollIntoView === "undefined") {
    Element.prototype.scrollIntoView = function () {
      /* no-op */
    };
  }
}

import "cross-fetch/polyfill";
import "@testing-library/jest-dom";
import { server } from "@/mocks/server";

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
