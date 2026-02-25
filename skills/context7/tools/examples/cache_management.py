#!/usr/bin/env python3
"""
Example demonstrating cache management and statistics.

Shows how to monitor cache performance and manage cached data.
"""

import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from context7 import get_documentation
from context7.cache import get_cache


def main() -> None:
    """Demonstrate cache usage and statistics."""
    cache = get_cache()

    print("Context7 Cache Management Example")
    print("=" * 80)

    # Initial cache stats
    print("\nInitial cache statistics:")
    print_stats(cache)

    # Fetch documentation (will miss cache on first call)
    print("\nFetching Next.js documentation (first call - cache miss expected)...")
    docs1 = get_documentation("vercel", "next.js", topic="routing", tokens=2000)
    print(f"Received {docs1.tokens} tokens")

    print("\nCache statistics after first fetch:")
    print_stats(cache)

    # Fetch same documentation again (should hit cache)
    print("\nFetching same documentation again (cache hit expected)...")
    docs2 = get_documentation("vercel", "next.js", topic="routing", tokens=2000)
    print(f"Received {docs2.tokens} tokens")

    print("\nCache statistics after second fetch:")
    print_stats(cache)

    # Fetch with cache disabled
    print("\nFetching with cache disabled...")
    docs3 = get_documentation(
        "vercel", "next.js", topic="routing", tokens=2000, use_cache=False
    )
    print(f"Received {docs3.tokens} tokens")

    print("\nCache statistics after cache-disabled fetch:")
    print_stats(cache)

    # Invalidate specific entry
    print("\nInvalidating cache entry for vercel/next.js routing...")
    invalidated = cache.invalidate(
        owner="vercel",
        repo="next.js",
        version="latest",
        topic="routing",
        tokens=2000,
        format="txt",
    )
    print(f"Entry {'was' if invalidated else 'was not'} invalidated")

    print("\nCache statistics after invalidation:")
    print_stats(cache)

    # Clear all cache
    print("\nClearing all cache entries...")
    cleared = cache.clear()
    print(f"Cleared {cleared} cache entries")

    print("\nFinal cache statistics:")
    print_stats(cache)


def print_stats(cache) -> None:
    """Print cache statistics in a formatted way."""
    stats = cache.get_stats()
    print(f"  Hits: {stats['hits']}")
    print(f"  Misses: {stats['misses']}")
    print(f"  Total requests: {stats['total_requests']}")
    print(f"  Hit rate: {stats['hit_rate']:.2f}%")
    print(f"  Cache size: {stats['size']} entries")


if __name__ == "__main__":
    main()
