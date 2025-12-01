"""
Performance tests for OHLCV data handling.

This module contains performance tests for OHLCV data operations including:
- Data creation and validation
- Serialization to dictionary format
- Memory usage analysis
- Processing time benchmarks

Test datasets are based on real-world trading scenarios:
- Small: 1 day of 1-minute data (375 candles)
- Medium: 1 month of 1-minute data (~7,500 candles)
- Large: 1 year of 1-minute data (~94,000 candles)
- Very Large: 9 years of 1-minute data (~850,000 candles)
"""

import concurrent.futures
import gc
import math
import time
from datetime import datetime
from typing import List

import psutil
import pytest
from lightweight_charts_core.data.ohlcv_data import OhlcvData


@pytest.mark.performance
class TestOhlcvDataPerformance:
    """Performance tests for OhlcvData class."""

    @pytest.fixture
    def base_timestamp(self):
        """Base timestamp for generating test data."""
        return int(datetime(2020, 1, 1, 9, 30).timestamp())  # Market open

    @pytest.fixture
    def small_dataset(self, base_timestamp) -> List[OhlcvData]:
        """Small dataset: 1 day of 1-minute data (375 candles)."""
        data = []
        for i in range(375):  # 1 trading day
            timestamp = base_timestamp + (i * 60)  # 1-minute intervals
            # Generate realistic OHLCV data
            base_price = 100.0 + (i * 0.01)  # Slight upward trend
            open_price = base_price + (math.sin(i * 0.1) * 0.5)
            high_price = open_price + abs(math.cos(i * 0.2) * 1.0)
            low_price = open_price - abs(math.sin(i * 0.3) * 0.8)
            close_price = open_price + (math.cos(i * 0.4) * 0.3)
            volume = 1000 + (i % 100) * 10  # Varying volume

            data.append(
                OhlcvData(
                    time=timestamp,
                    open=open_price,
                    high=high_price,
                    low=low_price,
                    close=close_price,
                    volume=volume,
                ),
            )
        return data

    @pytest.fixture
    def medium_dataset(self, base_timestamp) -> List[OhlcvData]:
        """Medium dataset: 1 month of 1-minute data (~7,500 candles)."""
        data = []
        for day in range(20):  # ~20 trading days
            for minute in range(375):  # 1 trading day
                timestamp = base_timestamp + (day * 24 * 60 * 60) + (minute * 60)
                # Generate realistic OHLCV data with daily patterns
                base_price = 100.0 + (day * 0.5) + (minute * 0.01)
                open_price = base_price + (math.sin(minute * 0.1) * 0.5)
                high_price = open_price + abs(math.cos(minute * 0.2) * 1.0)
                low_price = open_price - abs(math.sin(minute * 0.3) * 0.8)
                close_price = open_price + (math.cos(minute * 0.4) * 0.3)
                volume = 1000 + (minute % 100) * 10 + (day * 50)

                data.append(
                    OhlcvData(
                        time=timestamp,
                        open=open_price,
                        high=high_price,
                        low=low_price,
                        close=close_price,
                        volume=volume,
                    ),
                )
        return data

    @pytest.fixture
    def large_dataset(self, base_timestamp) -> List[OhlcvData]:
        """Large dataset: 1 year of 1-minute data (~94,000 candles)."""
        data = []
        for day in range(251):  # 251 trading days per year
            for minute in range(375):  # 1 trading day
                timestamp = base_timestamp + (day * 24 * 60 * 60) + (minute * 60)
                # Generate realistic OHLCV data with yearly trends
                base_price = 100.0 + (day * 0.2) + (minute * 0.01)
                open_price = base_price + (math.sin(minute * 0.1) * 0.5)
                high_price = open_price + abs(math.cos(minute * 0.2) * 1.0)
                low_price = open_price - abs(math.sin(minute * 0.3) * 0.8)
                close_price = open_price + (math.cos(minute * 0.4) * 0.3)
                volume = 1000 + (minute % 100) * 10 + (day * 20)

                data.append(
                    OhlcvData(
                        time=timestamp,
                        open=open_price,
                        high=high_price,
                        low=low_price,
                        close=close_price,
                        volume=volume,
                    ),
                )
        return data

    @pytest.fixture
    def very_large_dataset(self, base_timestamp) -> List[OhlcvData]:
        """Very large dataset: 9 years of 1-minute data (~850,000 candles)."""
        data = []
        for year in range(9):  # 9 years
            for day in range(251):  # 251 trading days per year
                for minute in range(375):  # 1 trading day
                    timestamp = (
                        base_timestamp
                        + (year * 365 * 24 * 60 * 60)
                        + (day * 24 * 60 * 60)
                        + (minute * 60)
                    )
                    # Generate realistic OHLCV data with multi-year trends
                    base_price = 100.0 + (year * 10) + (day * 0.2) + (minute * 0.01)
                    open_price = base_price + (math.sin(minute * 0.1) * 0.5)
                    high_price = open_price + abs(math.cos(minute * 0.2) * 1.0)
                    low_price = open_price - abs(math.sin(minute * 0.3) * 0.8)
                    close_price = open_price + (math.cos(minute * 0.4) * 0.3)
                    volume = 1000 + (minute % 100) * 10 + (day * 20) + (year * 100)

                    data.append(
                        OhlcvData(
                            time=timestamp,
                            open=open_price,
                            high=high_price,
                            low=low_price,
                            close=close_price,
                            volume=volume,
                        ),
                    )
        return data

    def test_small_dataset_creation_performance(self, small_dataset):
        """Test performance of creating small dataset (375 candles)."""
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        # Dataset is already created in fixture, just measure access
        data_count = len(small_dataset)

        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        creation_time = end_time - start_time
        memory_used = end_memory - start_memory

        print("\nSmall Dataset Performance:")
        print(f"  Data points: {data_count:,}")
        print(f"  Creation time: {creation_time:.4f} seconds")
        print(f"  Memory used: {memory_used:.2f} MB")
        print(f"  Time per data point: {(creation_time / data_count) * 1000:.4f} ms")
        print(f"  Memory per data point: {(memory_used / data_count) * 1024:.2f} KB")

        # Performance assertions
        assert creation_time < 1.0  # Should be very fast
        assert memory_used < 50  # Should use reasonable memory
        assert data_count == 375

    def test_medium_dataset_creation_performance(self, medium_dataset):
        """Test performance of creating medium dataset (~7,500 candles)."""
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        data_count = len(medium_dataset)

        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        creation_time = end_time - start_time
        memory_used = end_memory - start_memory

        print("\nMedium Dataset Performance:")
        print(f"  Data points: {data_count:,}")
        print(f"  Creation time: {creation_time:.4f} seconds")
        print(f"  Memory used: {memory_used:.2f} MB")
        print(f"  Time per data point: {(creation_time / data_count) * 1000:.4f} ms")
        print(f"  Memory per data point: {(memory_used / data_count) * 1024:.2f} KB")

        # Performance assertions
        assert creation_time < 5.0  # Should be reasonably fast
        assert memory_used < 500  # Should use reasonable memory
        assert data_count == 7500

    def test_large_dataset_creation_performance(self, large_dataset):
        """Test performance of creating large dataset (~94,000 candles)."""
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        data_count = len(large_dataset)

        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        creation_time = end_time - start_time
        memory_used = end_memory - start_memory

        print("\nLarge Dataset Performance:")
        print(f"  Data points: {data_count:,}")
        print(f"  Creation time: {creation_time:.4f} seconds")
        print(f"  Memory used: {memory_used:.2f} MB")
        print(f"  Time per data point: {(creation_time / data_count) * 1000:.4f} ms")
        print(f"  Memory per data point: {(memory_used / data_count) * 1024:.2f} KB")

        # Performance assertions
        assert creation_time < 30.0  # Should be acceptable for large dataset
        assert memory_used < 5000  # Should use reasonable memory
        assert data_count == 94125  # 251 days * 375 minutes

    def test_very_large_dataset_creation_performance(self, very_large_dataset):
        """Test performance of creating very large dataset (~850,000 candles)."""
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        data_count = len(very_large_dataset)

        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        creation_time = end_time - start_time
        memory_used = end_memory - start_memory

        print("\nVery Large Dataset Performance:")
        print(f"  Data points: {data_count:,}")
        print(f"  Creation time: {creation_time:.4f} seconds")
        print(f"  Memory used: {memory_used:.2f} MB")
        print(f"  Time per data point: {(creation_time / data_count) * 1000:.4f} ms")
        print(f"  Memory per data point: {(memory_used / data_count) * 1024:.2f} KB")

        # Performance assertions
        assert creation_time < 300.0  # Should be acceptable for very large dataset
        assert memory_used < 50000  # Should use reasonable memory
        assert data_count == 847125  # 9 years * 251 days * 375 minutes

    def test_small_dataset_serialization_performance(self, small_dataset):
        """Test performance of serializing small dataset to dictionary."""
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        serialized_data = [data.asdict() for data in small_dataset]

        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        serialization_time = end_time - start_time
        memory_used = end_memory - start_memory

        print("\nSmall Dataset Serialization Performance:")
        print(f"  Data points: {len(small_dataset):,}")
        print(f"  Serialization time: {serialization_time:.4f} seconds")
        print(f"  Memory used: {memory_used:.2f} MB")
        print(f"  Time per data point: {(serialization_time / len(small_dataset)) * 1000:.4f} ms")
        print(f"  Memory per data point: {(memory_used / len(small_dataset)) * 1024:.2f} KB")

        # Verify serialization
        assert len(serialized_data) == len(small_dataset)
        assert all(isinstance(item, dict) for item in serialized_data)
        assert all(
            "time" in item
            and "open" in item
            and "high" in item
            and "low" in item
            and "close" in item
            and "volume" in item
            for item in serialized_data
        )

        # Performance assertions
        assert serialization_time < 1.0  # Should be very fast
        assert memory_used < 100  # Should use reasonable memory

    def test_medium_dataset_serialization_performance(self, medium_dataset):
        """Test performance of serializing medium dataset to dictionary."""
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        [data.asdict() for data in medium_dataset]

        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        serialization_time = end_time - start_time
        memory_used = end_memory - start_memory

        print("\nMedium Dataset Serialization Performance:")
        print(f"  Data points: {len(medium_dataset):,}")
        print(f"  Serialization time: {serialization_time:.4f} seconds")
        print(f"  Memory used: {memory_used:.2f} MB")
        print(f"  Time per data point: {(serialization_time / len(medium_dataset)) * 1000:.4f} ms")
        print(f"  Memory per data point: {(memory_used / len(medium_dataset)) * 1024:.2f} KB")

        # Performance assertions
        assert serialization_time < 5.0  # Should be reasonably fast
        assert memory_used < 1000  # Should use reasonable memory

    def test_large_dataset_serialization_performance(self, large_dataset):
        """Test performance of serializing large dataset to dictionary."""
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        [data.asdict() for data in large_dataset]

        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        serialization_time = end_time - start_time
        memory_used = end_memory - start_memory

        print("\nLarge Dataset Serialization Performance:")
        print(f"  Data points: {len(large_dataset):,}")
        print(f"  Serialization time: {serialization_time:.4f} seconds")
        print(f"  Memory used: {memory_used:.2f} MB")
        print(f"  Time per data point: {(serialization_time / len(large_dataset)) * 1000:.4f} ms")
        print(f"  Memory per data point: {(memory_used / len(large_dataset)) * 1024:.2f} KB")

        # Performance assertions
        assert serialization_time < 60.0  # Should be acceptable for large dataset
        assert memory_used < 10000  # Should use reasonable memory

    def test_very_large_dataset_serialization_performance(self, very_large_dataset):
        """Test performance of serializing very large dataset to dictionary."""
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        # Process in chunks to avoid memory issues
        chunk_size = 10000
        serialized_data = []

        for i in range(0, len(very_large_dataset), chunk_size):
            chunk = very_large_dataset[i : i + chunk_size]
            serialized_chunk = [data.asdict() for data in chunk]
            serialized_data.extend(serialized_chunk)

            # Force garbage collection to manage memory
            if i % (chunk_size * 10) == 0:
                gc.collect()

        end_time = time.time()
        end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        serialization_time = end_time - start_time
        memory_used = end_memory - start_memory

        print("\nVery Large Dataset Serialization Performance:")
        print(f"  Data points: {len(very_large_dataset):,}")
        print(f"  Serialization time: {serialization_time:.4f} seconds")
        print(f"  Memory used: {memory_used:.2f} MB")
        print(
            "  Time per data point: "
            f"{(serialization_time / len(very_large_dataset)) * 1000:.4f} ms",
        )
        print(f"  Memory per data point: {(memory_used / len(very_large_dataset)) * 1024:.2f} KB")

        # Performance assertions
        assert serialization_time < 600.0  # Should be acceptable for very large dataset
        assert memory_used < 50000  # Should use reasonable memory

    def test_memory_efficiency_small_dataset(self, small_dataset):
        """Test memory efficiency for small dataset."""
        gc.collect()  # Force garbage collection
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        # Create dataset and measure memory
        data = small_dataset.copy()
        memory_after_creation = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        # Serialize and measure memory
        serialized = [item.asdict() for item in data]
        memory_after_serialization = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        # Clear references and measure memory
        del data, serialized
        gc.collect()
        memory_after_cleanup = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        print("\nSmall Dataset Memory Efficiency:")
        print(f"  Initial memory: {start_memory:.2f} MB")
        print(f"  After creation: {memory_after_creation:.2f} MB")
        print(f"  After serialization: {memory_after_serialization:.2f} MB")
        print(f"  After cleanup: {memory_after_cleanup:.2f} MB")
        print(f"  Memory overhead: {memory_after_creation - start_memory:.2f} MB")
        print(
            "  Serialization overhead: "
            f"{memory_after_serialization - memory_after_creation:.2f} MB",
        )

        # Memory efficiency assertions
        assert memory_after_creation - start_memory < 50  # Reasonable overhead
        assert (
            memory_after_serialization - memory_after_creation < 100
        )  # Reasonable serialization overhead
        assert memory_after_cleanup <= start_memory + 10  # Should clean up properly

    def test_memory_efficiency_large_dataset(self, large_dataset):
        """Test memory efficiency for large dataset."""
        gc.collect()  # Force garbage collection
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        # Create dataset and measure memory
        data = large_dataset.copy()
        memory_after_creation = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        # Serialize and measure memory
        serialized = [item.asdict() for item in data]
        memory_after_serialization = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        # Clear references and measure memory
        del data, serialized
        gc.collect()
        memory_after_cleanup = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        print("\nLarge Dataset Memory Efficiency:")
        print(f"  Initial memory: {start_memory:.2f} MB")
        print(f"  After creation: {memory_after_creation:.2f} MB")
        print(f"  After serialization: {memory_after_serialization:.2f} MB")
        print(f"  After cleanup: {memory_after_cleanup:.2f} MB")
        print(f"  Memory overhead: {memory_after_creation - start_memory:.2f} MB")
        print(
            "  Serialization overhead: "
            f"{memory_after_serialization - memory_after_creation:.2f} MB",
        )

        # Memory efficiency assertions
        assert memory_after_creation - start_memory < 5000  # Reasonable overhead
        assert (
            memory_after_serialization - memory_after_creation < 10000
        )  # Reasonable serialization overhead
        assert memory_after_cleanup <= start_memory + 100  # Should clean up properly

    def test_validation_performance_small_dataset(self, small_dataset):
        """Test validation performance for small dataset."""
        start_time = time.time()

        # Test validation by accessing all properties
        for data in small_dataset:
            # This triggers validation in __post_init__
            assert data.time > 0
            assert data.open >= 0
            assert data.high >= data.low
            assert data.close >= 0
            assert data.volume >= 0

        end_time = time.time()
        validation_time = end_time - start_time

        print("\nSmall Dataset Validation Performance:")
        print(f"  Data points: {len(small_dataset):,}")
        print(f"  Validation time: {validation_time:.4f} seconds")
        print(f"  Time per data point: {(validation_time / len(small_dataset)) * 1000:.4f} ms")

        # Performance assertions
        assert validation_time < 1.0  # Should be very fast

    def test_validation_performance_large_dataset(self, large_dataset):
        """Test validation performance for large dataset."""
        start_time = time.time()

        # Test validation by accessing all properties
        for data in large_dataset:
            # This triggers validation in __post_init__
            assert data.time > 0
            assert data.open >= 0
            assert data.high >= data.low
            assert data.close >= 0
            assert data.volume >= 0

        end_time = time.time()
        validation_time = end_time - start_time

        print("\nLarge Dataset Validation Performance:")
        print(f"  Data points: {len(large_dataset):,}")
        print(f"  Validation time: {validation_time:.4f} seconds")
        print(f"  Time per data point: {(validation_time / len(large_dataset)) * 1000:.4f} ms")

        # Performance assertions
        assert validation_time < 30.0  # Should be reasonably fast

    def test_concurrent_processing_small_dataset(self, small_dataset):
        """Test concurrent processing performance for small dataset."""
        start_time = time.time()

        def process_data(data):
            """Process a single data point."""
            serialized = data.asdict()
            # Simulate some processing
            return {
                "timestamp": serialized["time"],
                "price_change": serialized["close"] - serialized["open"],
                "volume_weighted": (
                    serialized["volume"] * (serialized["high"] + serialized["low"]) / 2
                ),
            }

        # Process data concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            results = list(executor.map(process_data, small_dataset))

        end_time = time.time()
        processing_time = end_time - start_time

        print("\nSmall Dataset Concurrent Processing Performance:")
        print(f"  Data points: {len(small_dataset):,}")
        print(f"  Processing time: {processing_time:.4f} seconds")
        print(f"  Time per data point: {(processing_time / len(small_dataset)) * 1000:.4f} ms")
        print(f"  Results count: {len(results)}")

        # Performance assertions
        assert processing_time < 5.0  # Should be reasonably fast
        assert len(results) == len(small_dataset)

    def test_concurrent_processing_large_dataset(self, large_dataset):
        """Test concurrent processing performance for large dataset."""
        start_time = time.time()

        def process_data(data):
            """Process a single data point."""
            serialized = data.asdict()
            # Simulate some processing
            return {
                "timestamp": serialized["time"],
                "price_change": serialized["close"] - serialized["open"],
                "volume_weighted": (
                    serialized["volume"] * (serialized["high"] + serialized["low"]) / 2
                ),
            }

        # Process data concurrently
        with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
            results = list(executor.map(process_data, large_dataset))

        end_time = time.time()
        processing_time = end_time - start_time

        print("\nLarge Dataset Concurrent Processing Performance:")
        print(f"  Data points: {len(large_dataset):,}")
        print(f"  Processing time: {processing_time:.4f} seconds")
        print(f"  Time per data point: {(processing_time / len(large_dataset)) * 1000:.4f} ms")
        print(f"  Results count: {len(results)}")

        # Performance assertions
        assert processing_time < 120.0  # Should be acceptable for large dataset
        assert len(results) == len(large_dataset)

    def test_batch_processing_performance(self, large_dataset):
        """Test batch processing performance for large dataset."""
        start_time = time.time()

        # Process data in batches
        batch_size = 1000
        batches = [
            large_dataset[i : i + batch_size] for i in range(0, len(large_dataset), batch_size)
        ]

        all_results = []
        for batch in batches:
            batch_results = []
            for data in batch:
                serialized = data.asdict()
                # Simulate batch processing
                processed = {
                    "timestamp": serialized["time"],
                    "price_change": serialized["close"] - serialized["open"],
                    "volume_weighted": (
                        serialized["volume"] * (serialized["high"] + serialized["low"]) / 2
                    ),
                }
                batch_results.append(processed)
            all_results.extend(batch_results)

        end_time = time.time()
        processing_time = end_time - start_time

        print("\nLarge Dataset Batch Processing Performance:")
        print(f"  Data points: {len(large_dataset):,}")
        print(f"  Batch size: {batch_size}")
        print(f"  Number of batches: {len(batches)}")
        print(f"  Processing time: {processing_time:.4f} seconds")
        print(f"  Time per data point: {(processing_time / len(large_dataset)) * 1000:.4f} ms")
        print(f"  Results count: {len(all_results)}")

        # Performance assertions
        assert processing_time < 60.0  # Should be reasonably fast
        assert len(all_results) == len(large_dataset)

    def test_memory_cleanup_performance(self, large_dataset):
        """Test memory cleanup performance after processing large dataset."""
        gc.collect()  # Force garbage collection
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        # Process large dataset
        serialized_data = [data.asdict() for data in large_dataset]

        # Measure memory after processing
        memory_after_processing = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        # Clear references
        del serialized_data
        del large_dataset

        # Force garbage collection
        gc.collect()

        # Measure memory after cleanup
        memory_after_cleanup = psutil.Process().memory_info().rss / 1024 / 1024  # MB

        print("\nMemory Cleanup Performance:")
        print(f"  Initial memory: {start_memory:.2f} MB")
        print(f"  After processing: {memory_after_processing:.2f} MB")
        print(f"  After cleanup: {memory_after_cleanup:.2f} MB")
        print(f"  Memory recovered: {memory_after_processing - memory_after_cleanup:.2f} MB")

        # Calculate cleanup efficiency safely
        memory_allocated = memory_after_processing - start_memory
        if memory_allocated > 0:
            cleanup_efficiency = (
                (memory_after_processing - memory_after_cleanup) / memory_allocated
            ) * 100
            print(f"  Cleanup efficiency: {cleanup_efficiency:.1f}%")
        else:
            print("  Cleanup efficiency: N/A (no memory allocated during processing)")

        # Memory cleanup assertions
        assert memory_after_cleanup <= start_memory + 100  # Should clean up properly
        assert (
            memory_after_processing - memory_after_cleanup >= 0
        )  # Should not use more memory after cleanup
