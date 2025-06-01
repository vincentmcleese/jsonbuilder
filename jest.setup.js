// Polyfill TextEncoder and TextDecoder for JSDOM environment if not present on global/window
import { TextEncoder, TextDecoder } from "util";

if (typeof global.TextEncoder === "undefined") {
  global.TextEncoder = TextEncoder;
}
if (typeof global.TextDecoder === "undefined") {
  global.TextDecoder = TextDecoder;
}
// JSDOM specific: Ensure TextEncoder and TextDecoder are on the window object for MSW.
if (typeof window !== "undefined") {
  if (!window.location) {
    Object.defineProperty(window, "location", {
      value: {
        href: "http://localhost/", // Ensure trailing slash for base path
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
    if (!window.location.pathname) window.location.pathname = "/"; // Ensure pathname exists
    if (!window.location.href)
      window.location.href =
        window.location.origin +
        window.location.pathname +
        window.location.search +
        window.location.hash;
  }

  if (typeof window.TextEncoder === "undefined") {
    Object.defineProperty(window, "TextEncoder", { value: TextEncoder });
  }
  if (typeof window.TextDecoder === "undefined") {
    Object.defineProperty(window, "TextDecoder", { value: TextDecoder });
  }
}

import "cross-fetch/polyfill"; // Ensure this is active
import "@testing-library/jest-dom";
import { server } from "@/mocks/server";

// Establish API mocking before all tests.
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
