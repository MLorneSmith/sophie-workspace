"""
File-based caching layer for Context7 API responses.

This module provides simple file-based caching to reduce API calls for
frequently accessed documentation that doesn't change often.
"""

import hashlib
import json
import logging
import os
import time
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)


class Context7Cache:
    """
    Simple file-based cache for Context7 API responses.

    Caches responses in JSON files with TTL-based expiration.
    """

    # Cache directory relative to this module (resolves to .ai/tools/context7/.cache)
    DEFAULT_CACHE_DIR = Path(__file__).parent / ".cache"
    DEFAULT_TTL = 86400  # 24 hours in seconds

    def __init__(self, cache_dir: str | Path | None = None, ttl: int | None = None):
        """
        Initialize cache.

        Args:
            cache_dir: Directory for cache files (default: module_dir/.cache)
            ttl: Time-to-live in seconds (default: 86400 = 24 hours)
        """
        self.cache_dir = Path(cache_dir or self.DEFAULT_CACHE_DIR)
        self.ttl = ttl or self.DEFAULT_TTL

        # Create cache directory if it doesn't exist
        self.cache_dir.mkdir(parents=True, exist_ok=True)

        # Statistics
        self._hits = 0
        self._misses = 0

        logger.debug(f"Initialized cache: dir={self.cache_dir} ttl={self.ttl}s")

    def _generate_key(self, **params) -> str:
        """
        Generate cache key from parameters.

        Args:
            **params: Parameters to hash for cache key

        Returns:
            Cache key string (hexadecimal hash)
        """
        # Create deterministic string from sorted parameters
        param_str = json.dumps(params, sort_keys=True)

        # Generate hash
        return hashlib.sha256(param_str.encode()).hexdigest()

    def _get_cache_path(self, key: str) -> Path:
        """
        Get file path for cache key.

        Args:
            key: Cache key

        Returns:
            Path to cache file
        """
        return self.cache_dir / f"{key}.json"

    def get(self, **params) -> dict[str, Any] | None:
        """
        Retrieve cached value if valid.

        Args:
            **params: Parameters identifying the cached value

        Returns:
            Cached data or None if not found or expired
        """
        key = self._generate_key(**params)
        cache_path = self._get_cache_path(key)

        if not cache_path.exists():
            logger.debug(f"Cache miss: {key} (not found)")
            self._misses += 1
            return None

        try:
            with open(cache_path, "r") as f:
                cache_data = json.load(f)

            # Check expiration
            cached_at = cache_data.get("cached_at", 0)
            age = time.time() - cached_at

            if age > self.ttl:
                logger.debug(f"Cache miss: {key} (expired, age={age:.0f}s)")
                self._misses += 1
                # Clean up expired cache file
                cache_path.unlink(missing_ok=True)
                return None

            logger.debug(f"Cache hit: {key} (age={age:.0f}s)")
            self._hits += 1
            return cache_data.get("data")

        except Exception as e:
            logger.warning(f"Cache read error: {e}")
            self._misses += 1
            # Clean up corrupted cache file
            cache_path.unlink(missing_ok=True)
            return None

    def set(self, data: dict[str, Any], **params) -> None:
        """
        Store value in cache.

        Args:
            data: Data to cache
            **params: Parameters identifying the cached value
        """
        key = self._generate_key(**params)
        cache_path = self._get_cache_path(key)

        cache_data = {
            "data": data,
            "cached_at": time.time(),
            "params": params,
        }

        try:
            with open(cache_path, "w") as f:
                json.dump(cache_data, f, indent=2)

            logger.debug(f"Cached: {key}")

        except Exception as e:
            logger.warning(f"Cache write error: {e}")

    def clear(self) -> int:
        """
        Clear all cached data.

        Returns:
            Number of files removed
        """
        count = 0
        for cache_file in self.cache_dir.glob("*.json"):
            try:
                cache_file.unlink()
                count += 1
            except Exception as e:
                logger.warning(f"Failed to remove {cache_file}: {e}")

        logger.info(f"Cleared {count} cache files")
        return count

    def get_stats(self) -> dict[str, int]:
        """
        Get cache statistics.

        Returns:
            Dictionary with hits, misses, size, and hit_rate
        """
        total_requests = self._hits + self._misses
        hit_rate = (self._hits / total_requests * 100) if total_requests > 0 else 0

        # Count cache files
        size = len(list(self.cache_dir.glob("*.json")))

        return {
            "hits": self._hits,
            "misses": self._misses,
            "total_requests": total_requests,
            "hit_rate": round(hit_rate, 2),
            "size": size,
        }

    def invalidate(self, **params) -> bool:
        """
        Invalidate specific cache entry.

        Args:
            **params: Parameters identifying the cached value

        Returns:
            True if entry was removed, False if not found
        """
        key = self._generate_key(**params)
        cache_path = self._get_cache_path(key)

        if cache_path.exists():
            try:
                cache_path.unlink()
                logger.debug(f"Invalidated cache: {key}")
                return True
            except Exception as e:
                logger.warning(f"Failed to invalidate {key}: {e}")
                return False

        return False


# Global cache instance
_cache = Context7Cache()


def get_cache() -> Context7Cache:
    """
    Get global cache instance.

    Returns:
        Context7Cache instance
    """
    return _cache
