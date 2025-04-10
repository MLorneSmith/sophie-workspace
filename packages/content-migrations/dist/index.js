"use strict";
/**
 * Content Migrations Package
 *
 * This package provides utilities and scripts for migrating content from various sources
 * to Payload CMS collections.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateMultipleCollectionSchemas = exports.validateCollectionSchema = exports.getPayloadClient = void 0;
// Export utility functions
var payload_client_js_1 = require("./utils/payload-client.js");
Object.defineProperty(exports, "getPayloadClient", { enumerable: true, get: function () { return payload_client_js_1.getPayloadClient; } });
var validate_schema_js_1 = require("./utils/validate-schema.js");
Object.defineProperty(exports, "validateCollectionSchema", { enumerable: true, get: function () { return validate_schema_js_1.validateCollectionSchema; } });
Object.defineProperty(exports, "validateMultipleCollectionSchemas", { enumerable: true, get: function () { return validate_schema_js_1.validateMultipleCollectionSchemas; } });
// Note: Migration scripts are not exported as they are meant to be run directly
