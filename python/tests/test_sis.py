from cosmiclens_validate.sis import sis_images


def test_sis_inside_einstein_radius():
    assert len(sis_images(0.3, 1.0)) == 2


def test_sis_outside_einstein_radius():
    assert len(sis_images(1.3, 1.0)) == 1
