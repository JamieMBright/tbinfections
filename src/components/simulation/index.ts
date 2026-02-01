/**
 * Simulation Visualization Components
 *
 * This module exports all components used for visualizing the TB simulation:
 * - SimulationCanvas: WebGL agent-based visualization using PixiJS
 * - UKMap: Choropleth map of UK regions using React Simple Maps
 * - TimelineControl: Playback controls and timeline slider
 * - TransmissionEvent: Animated transmission lines
 * - VaccinationShield: Shield effect when vaccination blocks infection
 *
 * @module components/simulation
 */

// Main visualization components
export { SimulationCanvas } from './SimulationCanvas';
export { UKMap } from './UKMap';
export { TimelineControl, TimelineMini } from './TimelineControl';

// Effect components
export { TransmissionEvent, TransmissionEventBatch } from './TransmissionEvent';
export { VaccinationShield, VaccinationShieldBatch } from './VaccinationShield';

// Default export for convenience
export { SimulationCanvas as default } from './SimulationCanvas';
