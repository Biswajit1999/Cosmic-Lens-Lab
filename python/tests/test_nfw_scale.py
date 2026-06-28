from cosmiclens_validate.nfw import nfw_potential_shape


def test_nfw_scale_radius_is_smooth():
    at_scale = nfw_potential_shape(1.0)
    below = nfw_potential_shape(1.0 - 1e-8)
    above = nfw_potential_shape(1.0 + 1e-8)
    assert abs(below - at_scale) / at_scale < 1e-5
    assert abs(above - at_scale) / at_scale < 1e-5
