from services.runtime import TOTAL_CAPACITY, ZONE_CAPACITIES, allocate_population


def test_simulator_population_allocation_is_exact_and_complete() -> None:
    for population in (100, 1_000, 10_000, 50_000):
        allocation = allocate_population(population)
        assert set(allocation) == set(ZONE_CAPACITIES)
        assert sum(allocation.values()) == population
        assert all(value >= 0 for value in allocation.values())


def test_stress_mode_matches_venue_capacity() -> None:
    assert TOTAL_CAPACITY == 50_000
    assert allocate_population(TOTAL_CAPACITY) == ZONE_CAPACITIES
