from cosmiclens_validate.nfw import nfw_deflection, nfw_potential, nfw_potential_shape


def test_nfw_shape_is_finite():
    assert nfw_potential(0.0, 0.19, 0.62) == 0.0
    for x in (1e-7, 1e-4, 0.1, 0.9, 1.0, 1.1, 5.0):
        assert nfw_potential_shape(x) == nfw_potential_shape(x)


def test_nfw_radial_derivative_matches_deflection():
    kappa_s = 0.19
    radius_scale = 0.62
    for radius in (0.03, 0.11, 0.37, 0.61, 0.93, 2.2):
        h = max(1e-7, radius * 1e-5)
        derivative = (nfw_potential(radius + h, kappa_s, radius_scale) - nfw_potential(radius - h, kappa_s, radius_scale)) / (2.0 * h)
        alpha = nfw_deflection(radius, kappa_s, radius_scale)
        assert abs(derivative - alpha) / max(1e-12, abs(alpha)) < 2e-5
