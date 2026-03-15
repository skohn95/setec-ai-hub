"""Tests for the shared stats_common module."""
import pytest
import sys
import os

# Add api directory to path for imports
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))

from utils.stats_common import norm_ppf


class TestNormPpf:
    """Tests for norm_ppf (inverse standard normal CDF)."""

    def test_ppf_025_approx_neg196(self):
        """norm_ppf(0.025) ≈ -1.96 (Z for 95% CI lower)."""
        result = norm_ppf(0.025)
        assert abs(result - (-1.96)) < 0.01

    def test_ppf_005_approx_neg1645(self):
        """norm_ppf(0.05) ≈ -1.645 (Z for 90% CI lower)."""
        result = norm_ppf(0.05)
        assert abs(result - (-1.645)) < 0.01

    def test_ppf_020_approx_neg0842(self):
        """norm_ppf(0.20) ≈ -0.842 (Z for 80% power)."""
        result = norm_ppf(0.20)
        assert abs(result - (-0.842)) < 0.01

    def test_ppf_010_approx_neg1282(self):
        """norm_ppf(0.10) ≈ -1.282 (Z for 90% power)."""
        result = norm_ppf(0.10)
        assert abs(result - (-1.282)) < 0.01

    def test_ppf_050_approx_zero(self):
        """norm_ppf(0.50) ≈ 0.0 (median)."""
        result = norm_ppf(0.50)
        assert abs(result) < 0.01

    def test_ppf_0975_approx_196(self):
        """norm_ppf(0.975) ≈ 1.96 (symmetry with 0.025)."""
        result = norm_ppf(0.975)
        assert abs(result - 1.96) < 0.01

    def test_ppf_symmetry(self):
        """norm_ppf(p) = -norm_ppf(1-p) for symmetry."""
        for p in [0.01, 0.05, 0.10, 0.25]:
            left = norm_ppf(p)
            right = norm_ppf(1 - p)
            assert abs(left + right) < 1e-10

    def test_ppf_zero_raises_value_error(self):
        """norm_ppf(0) should raise ValueError."""
        with pytest.raises(ValueError):
            norm_ppf(0)

    def test_ppf_one_raises_value_error(self):
        """norm_ppf(1) should raise ValueError."""
        with pytest.raises(ValueError):
            norm_ppf(1)

    def test_ppf_negative_raises_value_error(self):
        """norm_ppf(-0.5) should raise ValueError."""
        with pytest.raises(ValueError):
            norm_ppf(-0.5)

    def test_ppf_greater_than_one_raises_value_error(self):
        """norm_ppf(1.5) should raise ValueError."""
        with pytest.raises(ValueError):
            norm_ppf(1.5)
