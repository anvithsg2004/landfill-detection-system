import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { UserPlus } from 'lucide-react';
import axios from 'axios';
import { useAppContext } from '../../context/AppContext';
import { setupAxios } from '../../../axiosConfig';

const RegisterPage = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const { setUser } = useAppContext();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;

    setError('');
    setIsLoading(true);

    try {
      const response = await axios.post(
        'http://localhost:5000/register',
        { name, email, password },
        { withCredentials: true }
      );

      if (response.status === 201) {
        const authHeader = `Basic ${btoa(`${email}:${password}`)}`;
        const loginResponse = await axios.post(
          'http://localhost:5000/login',
          {},
          {
            withCredentials: true,
            headers: {
              Authorization: authHeader,
            },
          }
        );

        if (loginResponse.status === 200) {
          localStorage.setItem('userEmail', email);
          localStorage.setItem('userAuth', authHeader);
          setupAxios(email, password); // Configure axios with the new credentials
          const userResponse = await axios.get('http://localhost:5000/current-user', {
            withCredentials: true,
            headers: {
              Authorization: authHeader,
            },
          });
          setUser(userResponse.data);
          navigate('/');
        }
      }
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 400) {
        setError(err.response.data.error || 'Email already exists');
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <UserPlus size={40} className="text-primary-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary-500">Create Account</h1>
          <p className="text-neutral-600 mt-2">Join us to start detecting landfills</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-card">
          {error && (
            <div className="mb-4 p-3 bg-error bg-opacity-10 border border-error rounded-md text-error text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                placeholder="Enter your full name"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="Enter your email"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                placeholder="Choose a strong password"
                required
                disabled={isLoading}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-full flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-neutral-600">Already have an account? </span>
            <Link to="/login" className="text-primary-500 hover:text-primary-600 font-medium">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
