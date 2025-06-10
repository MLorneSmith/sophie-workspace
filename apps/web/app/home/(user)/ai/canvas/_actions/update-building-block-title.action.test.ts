/**
 * Unit tests for update-building-block-title.action.ts
 * Tests server action for updating building block titles in the database
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { updateBuildingBlockTitleAction } from './update-building-block-title.action';

// Mock dependencies
vi.mock('@kit/next/actions', () => ({
  enhanceAction: vi.fn((fn, options) => {
    return async (data: any) => {
      // Validate with schema if provided
      if (options?.schema) {
        const result = options.schema.safeParse(data);
        if (!result.success) {
          throw new Error('Validation failed');
        }
        data = result.data;
      }
      
      // Mock authenticated user (required by auth: true)
      const mockUser = { 
        id: '123', 
        email: 'test@example.com',
      };
      
      return fn(data, mockUser);
    };
  }),
}));

vi.mock('@kit/supabase/server-client', () => ({
  getSupabaseServerClient: vi.fn(),
}));

// Import mocked functions for type safety
import { getSupabaseServerClient } from '@kit/supabase/server-client';

describe('updateBuildingBlockTitleAction', () => {
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();
  const mockFrom = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Reset mock chain
    mockUpdate.mockReturnThis();
    mockEq.mockReturnValue({ data: null, error: null });
    mockFrom.mockReturnValue({
      update: mockUpdate,
      eq: mockEq,
    });
    
    vi.mocked(getSupabaseServerClient).mockReturnValue({
      from: mockFrom,
    } as any);
  });

  describe('Schema Validation', () => {
    it('should pass validation with valid data', async () => {
      const input = { id: 'valid-uuid', title: 'Valid Title' };
      
      const result = await updateBuildingBlockTitleAction(input);
      
      expect(result).toEqual({ success: true });
    });

    it('should fail validation when id is missing', async () => {
      const input = { title: 'Valid Title' } as any;
      
      await expect(updateBuildingBlockTitleAction(input)).rejects.toThrow('Validation failed');
    });

    it('should fail validation when title is missing', async () => {
      const input = { id: 'valid-uuid' } as any;
      
      await expect(updateBuildingBlockTitleAction(input)).rejects.toThrow('Validation failed');
    });

    it('should fail validation when id is not a string', async () => {
      const input = { id: 123, title: 'Valid Title' } as any;
      
      await expect(updateBuildingBlockTitleAction(input)).rejects.toThrow('Validation failed');
    });

    it('should fail validation when title is not a string', async () => {
      const input = { id: 'valid-uuid', title: 123 } as any;
      
      await expect(updateBuildingBlockTitleAction(input)).rejects.toThrow('Validation failed');
    });
  });

  describe('Core Functionality', () => {
    it('should successfully update building block title', async () => {
      const input = { id: 'building-block-123', title: 'New Title' };
      
      const result = await updateBuildingBlockTitleAction(input);
      
      expect(result).toEqual({ success: true });
      expect(mockFrom).toHaveBeenCalledWith('building_blocks_submissions');
      expect(mockUpdate).toHaveBeenCalledWith({ title: 'New Title' });
      expect(mockEq).toHaveBeenCalledWith('id', 'building-block-123');
    });

    it('should handle empty title string', async () => {
      const input = { id: 'building-block-123', title: '' };
      
      const result = await updateBuildingBlockTitleAction(input);
      
      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith({ title: '' });
    });

    it('should handle whitespace-only title', async () => {
      const input = { id: 'test-id', title: '   ' };
      
      const result = await updateBuildingBlockTitleAction(input);
      
      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith({ title: '   ' });
    });
  });

  describe('Database Integration', () => {
    it('should call correct database table', async () => {
      const input = { id: 'test-id', title: 'Test Title' };
      
      await updateBuildingBlockTitleAction(input);
      
      expect(mockFrom).toHaveBeenCalledWith('building_blocks_submissions');
    });

    it('should use correct update parameters', async () => {
      const input = { id: 'test-id', title: 'Test Title' };
      
      await updateBuildingBlockTitleAction(input);
      
      expect(mockUpdate).toHaveBeenCalledWith({ title: 'Test Title' });
      expect(mockEq).toHaveBeenCalledWith('id', 'test-id');
    });

    it('should call database methods in correct order', async () => {
      const input = { id: 'test-id', title: 'Test Title' };
      
      await updateBuildingBlockTitleAction(input);
      
      // Verify method chain order
      expect(mockFrom).toHaveBeenCalledBefore(mockUpdate);
      expect(mockUpdate).toHaveBeenCalledBefore(mockEq);
    });
  });

  describe('Error Scenarios', () => {
    it('should throw database error when update fails', async () => {
      const dbError = new Error('Database connection failed');
      mockEq.mockReturnValue({ data: null, error: dbError });
      
      const input = { id: 'error-id', title: 'Test Title' };
      
      await expect(updateBuildingBlockTitleAction(input)).rejects.toThrow('Database connection failed');
    });

    it('should handle special characters in title', async () => {
      const input = { 
        id: 'test-id', 
        title: 'Title with 🎉 emoji & special chars <script>alert("xss")</script>' 
      };
      
      const result = await updateBuildingBlockTitleAction(input);
      
      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith({ 
        title: 'Title with 🎉 emoji & special chars <script>alert("xss")</script>' 
      });
    });

    it('should handle very long title', async () => {
      const longTitle = 'A'.repeat(1000);
      const input = { id: 'test-id', title: longTitle };
      
      const result = await updateBuildingBlockTitleAction(input);
      
      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith({ title: longTitle });
    });

    it('should handle unicode characters in title', async () => {
      const input = { 
        id: 'test-id', 
        title: '测试标题 العنوان كيف 🌟🎯🚀' 
      };
      
      const result = await updateBuildingBlockTitleAction(input);
      
      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith({ title: '测试标题 العنوان كيف 🌟🎯🚀' });
    });

    it('should handle newlines and special whitespace in title', async () => {
      const input = { 
        id: 'test-id', 
        title: 'Title\nwith\ttabs\rand\r\nnewlines' 
      };
      
      const result = await updateBuildingBlockTitleAction(input);
      
      expect(result).toEqual({ success: true });
      expect(mockUpdate).toHaveBeenCalledWith({ title: 'Title\nwith\ttabs\rand\r\nnewlines' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle database returning null data but no error', async () => {
      mockEq.mockReturnValue({ data: null, error: null });
      
      const input = { id: 'test-id', title: 'Test Title' };
      
      const result = await updateBuildingBlockTitleAction(input);
      
      expect(result).toEqual({ success: true });
    });

    it('should handle database returning data and no error', async () => {
      mockEq.mockReturnValue({ 
        data: { id: 'test-id', title: 'Test Title', updated_at: new Date() }, 
        error: null 
      });
      
      const input = { id: 'test-id', title: 'Test Title' };
      
      const result = await updateBuildingBlockTitleAction(input);
      
      expect(result).toEqual({ success: true });
    });

    it('should handle very short UUID-like id', async () => {
      const input = { id: 'a', title: 'Test Title' };
      
      const result = await updateBuildingBlockTitleAction(input);
      
      expect(result).toEqual({ success: true });
      expect(mockEq).toHaveBeenCalledWith('id', 'a');
    });

    it('should handle very long id string', async () => {
      const longId = 'very-long-id-' + 'x'.repeat(100);
      const input = { id: longId, title: 'Test Title' };
      
      const result = await updateBuildingBlockTitleAction(input);
      
      expect(result).toEqual({ success: true });
      expect(mockEq).toHaveBeenCalledWith('id', longId);
    });
  });
});