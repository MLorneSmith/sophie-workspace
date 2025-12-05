# Context7 Research: Transformers.js for Browser-Based AI

**Date**: 2025-12-05
**Agent**: context7-expert
**Libraries Researched**: huggingface/transformers.js (13.5k stars)

## Query Summary

Comprehensive research on Transformers.js for implementing browser-based AI in a Next.js presentation authoring tool. Focus areas: architecture, model loading/caching, WebGPU vs WASM backends, memory management, text generation/autocomplete models, React/Next.js integration, and worker thread patterns.

## Executive Summary

Transformers.js is a JavaScript port of Hugging Face Transformers that enables running ONNX-converted ML models directly in the browser or Node.js. It supports both WASM (CPU) and WebGPU (GPU) backends, automatic model caching, and provides 30+ pipeline types for common ML tasks. **Key finding**: For presentation authoring with autocomplete, use Qwen2.5-0.5B-Instruct (500MB quantized) with WebGPU acceleration and Web Workers for non-blocking inference.

## 1. Architecture & Capabilities

### Core Design

**Multi-Backend Architecture**:
- **WASM Backend**: CPU-based inference using ONNX Runtime WebAssembly
- **WebGPU Backend**: GPU-accelerated inference (10-100x faster for large models)
- Automatic backend selection based on browser capabilities

**ONNX Runtime Foundation**:
- All models converted from PyTorch/TensorFlow to ONNX format
- Optimized for browser execution with quantization support
- No server-side dependencies required

**Pipeline API**:
