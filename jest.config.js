const nextJest = require("next/jest");

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: "./",
});

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-fixed-jsdom",
  resolver: "./jest.resolver.js",
  moduleNameMapper: {
    // Handle module aliases
    "^@/(.*)$": "<rootDir>/src/$1",
    // Force msw and its dependencies to resolve from node_modules directly
    "^msw/node$": "<rootDir>/node_modules/msw/lib/node/index.js",
    "^msw$": "<rootDir>/node_modules/msw/lib/core/index.js",
    "^@mswjs/interceptors/ClientRequest$":
      "<rootDir>/node_modules/@mswjs/interceptors/lib/node/interceptors/ClientRequest/index.js",
    // Add a general one for other @mswjs/interceptors if needed, pointing to its main lib
    "^@mswjs/interceptors$":
      "<rootDir>/node_modules/@mswjs/interceptors/lib/node/index.js",
  },
  preset: "ts-jest",
  // Optionally, add transformIgnorePatterns if ESM issues arise with these deps
  // transformIgnorePatterns: [
  //   '/node_modules/(?!(@mswjs/interceptors|msw)/)', // Adjust as needed
  // ],
};

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
module.exports = createJestConfig(customJestConfig);
