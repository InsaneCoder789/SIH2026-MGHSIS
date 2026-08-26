# Hardware Integration Boundary

The current system is software-first and hardware-ready. The project does not claim that physical bands, BLE gateways, RFID readers, or CCTV cameras are already integrated.

`POST /api/v1/hardware/observations` accepts an event-scoped observation with source identity and type, event and zone IDs, capture timestamp, a monotonic source-local sequence number, and a validated payload for CCTV, BLE gateway, RFID gate, manual, or simulator data. Replayed or out-of-order sequences return `409`; development retains a bounded recent buffer and returns an ingestion ID for audit correlation.

Physical bridge roadmap:

1. Provision each device with an event-scoped identity and signed credentials.
2. Use a BLE gateway bridge to normalize band packets into this ingestion contract.
3. Add mutual TLS, replay protection, key rotation, firmware signing, and gateway health telemetry.
4. Persist observations and audit events in PostgreSQL, with Redis/WebSocket fan-out for live Digital Twin updates.
5. Validate sensor calibration, radio coverage, battery behavior, failure modes, and privacy controls in a controlled pilot.

The Digital Twin intentionally exposes zone and segment precision only. It is not a GPS or facial-recognition system.

## Virtual commissioning path

Before physical devices are available, the event simulator exercises the same inference contract with scenario-based observations. It models normal flow, congestion, distress, barricade breach, gateway degradation, and redirect response, allowing API latency, model behavior, operator decisions, and recovery verification to be tested together. Hardware adapters should eventually publish observations into the same normalized contract rather than bypassing the ML API.
