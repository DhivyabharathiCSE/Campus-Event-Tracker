import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { GraduationCap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast, getErrorMessage } from '../context/ToastContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    department: '', year: '', phone: '',
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  function update(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = 'Name is required.';
    if (!form.email.trim()) errs.email = 'Email is required.';
    else if (!EMAIL_REGEX.test(form.email)) errs.email = 'Enter a valid email address.';
    if (!form.password) errs.password = 'Password is required.';
    else if (form.password.length < 6) errs.password = 'Password must be at least 6 characters.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { confirmPassword, ...payload } = form;
      const user = await register(payload);
      showToast(`Welcome, ${user.name.split(' ')[0]}! Your account has been created.`, 'success');
      navigate('/student/dashboard');
    } catch (err) {
      showToast(getErrorMessage(err), 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell">
      <div className="auth-card" style={{ maxWidth: 460 }}>
        <div className="auth-brand">
          <div className="auth-brand-icon"><GraduationCap size={22} /></div>
          <div className="auth-brand-text">
            Campus Events
            <span>Create a student account</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="name">Full Name</label>
            <input id="name" className="input" value={form.name} onChange={(e) => update('name', e.target.value)} placeholder="Harish Kumar" />
            {errors.name && <div className="field-error">{errors.name}</div>}
          </div>

          <div className="field">
            <label htmlFor="reg-email">Email</label>
            <input id="reg-email" type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} placeholder="you@campus.com" />
            {errors.email && <div className="field-error">{errors.email}</div>}
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="department">Department</label>
              <input id="department" className="input" value={form.department} onChange={(e) => update('department', e.target.value)} placeholder="Computer Science" />
            </div>
            <div className="field">
              <label htmlFor="year">Year</label>
              <select id="year" className="input" value={form.year} onChange={(e) => update('year', e.target.value)}>
                <option value="">Select year</option>
                <option>1st Year</option>
                <option>2nd Year</option>
                <option>3rd Year</option>
                <option>4th Year</option>
              </select>
            </div>
          </div>

          <div className="field">
            <label htmlFor="phone">Phone</label>
            <input id="phone" className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} placeholder="9999900000" />
          </div>

          <div className="form-row">
            <div className="field">
              <label htmlFor="reg-password">Password</label>
              <input id="reg-password" type="password" className="input" value={form.password} onChange={(e) => update('password', e.target.value)} placeholder="At least 6 characters" />
              {errors.password && <div className="field-error">{errors.password}</div>}
            </div>
            <div className="field">
              <label htmlFor="confirm-password">Confirm Password</label>
              <input id="confirm-password" type="password" className="input" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} placeholder="Re-enter password" />
              {errors.confirmPassword && <div className="field-error">{errors.confirmPassword}</div>}
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
            {submitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div className="auth-switch">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
