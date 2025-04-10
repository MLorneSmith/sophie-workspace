"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMimeType = getMimeType;
/**
 * Utility for determining MIME types based on file extensions
 */
const path_1 = __importDefault(require("path"));
/**
 * Helper function to determine MIME type based on file extension
 * @param filename - Filename
 * @returns MIME type
 */
function getMimeType(filename) {
    const ext = path_1.default.extname(filename).toLowerCase();
    switch (ext) {
        case '.png':
            return 'image/png';
        case '.jpg':
        case '.jpeg':
            return 'image/jpeg';
        case '.webp':
            return 'image/webp';
        default:
            return 'application/octet-stream';
    }
}
