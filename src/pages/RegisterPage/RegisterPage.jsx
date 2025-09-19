import React, { useState, useMemo } from 'react';
import { ORGANIZATION_AFFILIATIONS } from '../../constants.js';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    selectedOrg: '',
    selectedCenter: '',
    advisor: '',
    email: '',
    id: '',
    password: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState({});

  const centers = useMemo(() => {
    return ORGANIZATION_AFFILIATIONS[formData.selectedOrg] || [];
  }, [formData.selectedOrg]);

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidId = (id) => id.length >= 5 && id.length <= 20;
  const isValidPassword = (pw) =>
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/.test(
      pw,
    );

  const handleSubmit = (event) => {
    event.preventDefault();
    const newErrors = {};

    if (!formData.selectedOrg) newErrors.org = 'Please select an organization.';
    if (formData.selectedOrg !== '개인연구자' && !formData.selectedCenter)
      newErrors.center = 'Please select a center.';
    if (!isValidEmail(formData.email))
      newErrors.email = 'Please enter a valid email address.';
    if (!isValidId(formData.id))
      newErrors.id = 'ID must be between 5 and 20 characters.';
    if (!isValidPassword(formData.password))
      newErrors.password =
        'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.';
    if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match.';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log('🟢 All fields are valid. Proceeding...', formData);
    }
  };

  return (
    <>
      <title>Register - Bento</title>
      <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8"
        >
          <h1 className="mb-4 text-3xl font-bold">Register</h1>
          <div className="mb-4">
            <label htmlFor="selectedOrg" className="block font-bold">
              Organization
            </label>
            <select
              id="selectedOrg"
              value={formData.selectedOrg}
              onChange={handleChange}
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
            >
              <option value="" disabled>
                Select an Organization
              </option>
              {Object.keys(ORGANIZATION_AFFILIATIONS).map((org) => (
                <option key={org} value={org}>
                  {org}
                </option>
              ))}
            </select>
            {errors.org && (
              <p className="mt-1 text-sm text-red-500">{errors.org}</p>
            )}
          </div>

          <div className="mb-4">
            <label
              htmlFor="selectedCenter"
              className="mb-1 block font-semibold"
            >
              Center / Department
            </label>
            <select
              id="selectedCenter"
              value={formData.selectedCenter}
              onChange={handleChange}
              disabled={formData.selectedOrg === '개인연구자'}
              className="mt-1 w-full rounded-md border border-gray-300 p-2"
            >
              <option value="" disabled>
                Select a Center
              </option>
              {centers.map((center) => (
                <option key={center} value={center}>
                  {center}
                </option>
              ))}
            </select>
            {errors.center && (
              <p className="mt-1 text-sm text-red-500">{errors.center}</p>
            )}
          </div>

          <button
            type="submit"
            className="w-full rounded-md border border-blue-600 bg-white px-3 py-2 text-lg font-bold text-blue-600 transition-colors hover:bg-blue-50"
          >
            Register
          </button>
        </form>
      </div>
    </>
  );
}
