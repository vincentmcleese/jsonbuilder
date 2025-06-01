module.exports = (path, options) => {
  // Jest + jsdom acts like a browser (i.e., it looks for "browser" imports
  // under pkg.exports), but msw recommends using its Node builds for setupServer
  // even in jsdom, as jsdom is a Node-based environment.
  // This custom resolver adjusts the export conditions *only* for msw packages
  // to prefer Node-like exports or remove conflicting browser conditions.
  const mswRelatedPattern = new RegExp(
    "^(msw|@mswjs\\\\/interceptors)(\\\\/|$)"
  );
  if (mswRelatedPattern.test(path)) {
    let newConditions = options.conditions.filter((c) => c !== "browser");
    if (!newConditions.includes("node")) {
      newConditions.push("node"); // Prefer node condition
    }
    // It might also be beneficial to ensure 'import' and 'require' are present if Node expects them
    // or simply an empty array if that's what msw expects to default to Node.
    // The goal is to avoid msw trying to use a browser-specific build that lacks TextEncoder.

    return options.defaultResolver(path, {
      ...options,
      conditions: newConditions,
    });
  }

  // For all other modules, use the default resolver with original options
  return options.defaultResolver(path, options);
};
