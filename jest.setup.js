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
  if (typeof window.TextEncoder === "undefined") {
    Object.defineProperty(window, "TextEncoder", { value: TextEncoder });
  }
  if (typeof window.TextDecoder === "undefined") {
    Object.defineProperty(window, "TextDecoder", { value: TextDecoder });
  }
}

import "cross-fetch/polyfill"; // Polyfill Fetch API globals AFTER TextEncoder/Decoder
import "@testing-library/jest-dom";
import { server } from "@/mocks/server";

// Establish API mocking before all tests.
beforeAll(() => server.listen());

// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());

// Clean up after the tests are finished.
afterAll(() => server.close());
