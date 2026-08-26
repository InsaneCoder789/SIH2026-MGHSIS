# Digital Twin Notes

The current frontend implements a code-native cricket stadium Digital Twin inspired by the uploaded stadium seating reference.

Implemented now:

- Oval sector/block heatmap
- Risk colors for low, moderate, high, critical
- Gate markers anchored to the south stand geometry
- Zone click selection
- Expected, authenticated, observed population values
- Scenario-driven Human Risk, Crowd Risk, and Population Integrity state changes
- 300 deterministic Smart Safety Band dots with status color, search, visibility, distress, and selected-zone controls
- Clickable band dots with a compact telemetry readout and Band Detail link
- President Gallery, Presidential Suites, and Premium Suites built as concentric lower-bowl sectors

## Stadium Geometry

The bowl is generated in SVG from polar coordinates around `(450, 330)`. Seating blocks use annular sectors and are vertically flattened with `translate(0 75.9) scale(1 .77)` to create the stadium perspective.

The south premium stand uses the same coordinate system. Its three rings begin at radius `343`, the exact outer boundary of the bay ring, and continue through radii `382`, `426`, and `472`. This shared boundary keeps the President Gallery and both suite levels physically attached to the main orbit at both ends.

## Band Placement

`apps/web/src/lib/bands.ts` defines each zone's angular and radial bounds. A deterministic seeded function places each band inside those bounds, so every render and API request returns the same position. The current demo creates 300 bands; the SVG layer is a direct projection of that event-scoped dataset rather than a separate visual mock.

Not implemented yet:

- Live WebSocket aggregation
- Backend persistence
- Real simulator updates
- CCTV model inference
- Intervention verification derived from simulator state
