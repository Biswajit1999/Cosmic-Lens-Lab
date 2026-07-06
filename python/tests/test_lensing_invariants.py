import math

from cosmiclens_validate.point_mass import point_mass_images, point_mass_magnifications
from cosmiclens_validate.sis import sis_images


def test_point_mass_image_roots_match_lens_equation_invariants():
    """The scalar point-mass image locations are the roots of theta^2 - beta theta - theta_E^2 = 0."""
    beta = 0.37
    theta_e = 1.25
    theta_plus, theta_minus = point_mass_images(beta, theta_e)

    assert math.isclose(theta_plus + theta_minus, beta, rel_tol=0.0, abs_tol=1e-14)
    assert math.isclose(theta_plus * theta_minus, -(theta_e ** 2), rel_tol=0.0, abs_tol=1e-14)

    for theta in (theta_plus, theta_minus):
        mapped_beta = theta - (theta_e ** 2 / theta)
        assert math.isclose(mapped_beta, beta, rel_tol=0.0, abs_tol=1e-14)


def test_point_mass_signed_and_total_magnification_are_consistent():
    """Signed parity must preserve the saddle sign while absolute total magnification matches the analytic formula."""
    beta = 0.42
    theta_e = 1.1
    mu_plus, mu_minus = point_mass_magnifications(beta, theta_e)
    u = abs(beta / theta_e)
    expected_total = (u * u + 2.0) / (u * math.sqrt(u * u + 4.0))

    assert mu_plus > 0.0
    assert mu_minus < 0.0
    assert math.isclose(abs(mu_plus) + abs(mu_minus), expected_total, rel_tol=0.0, abs_tol=1e-14)
    assert math.isclose(mu_plus + mu_minus, 1.0, rel_tol=0.0, abs_tol=1e-14)


def test_sis_boundary_is_single_image_and_inside_has_opposite_parity_locations():
    """For the singular isothermal sphere, |beta| < theta_E gives two scalar roots; |beta| >= theta_E gives one."""
    theta_e = 1.0

    assert sis_images(theta_e, theta_e) == [2.0]
    assert sis_images(-theta_e, theta_e) == [-2.0]

    inside = sis_images(0.25, theta_e)
    assert len(inside) == 2
    assert inside[0] > 0.0
    assert inside[1] < 0.0
    assert math.isclose(inside[0] - inside[1], 2.0 * theta_e, rel_tol=0.0, abs_tol=1e-14)


def test_sis_symmetry_for_positive_and_negative_sources():
    """The scalar SIS implementation should be antisymmetric under beta -> -beta."""
    positive = sis_images(0.4, 1.2)
    negative = sis_images(-0.4, 1.2)
    assert negative == [-value for value in positive]
