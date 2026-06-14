from cosmiclens_validate.point_mass import point_mass_images, point_mass_magnifications


def test_point_mass_positions():
    plus, minus = point_mass_images(0.3, 1.0)
    assert abs(plus - 1.1611874208) < 1e-9
    assert abs(minus + 0.8611874208) < 1e-9


def test_point_mass_parity():
    mu_plus, mu_minus = point_mass_magnifications(0.3, 1.0)
    assert mu_plus > 0
    assert mu_minus < 0
