/**
 * Relationship Repair System - Entry Point
 *
 * This module provides a unified entry point to the relationship repair system,
 * exporting all necessary components for easy access.
 */
// Core components
export * from './core/types.js';
export * from './core/constants.js';
export * from './core/utils.js';
export * from './core/detection.js';
// Database components
export * from './database/views.js';
export * from './database/helpers.js';
// Fix components
export * from './fixes/quiz-question.js';
// Re-export the orchestration function
export { runRelationshipRepair } from '../../../orchestration/relationship-repair.js';
/**
 * Run the relationship repair process with default options
 */
export default async function repairRelationships() {
    const { runRelationshipRepair } = await import('../../../orchestration/relationship-repair.js');
    return runRelationshipRepair();
}
