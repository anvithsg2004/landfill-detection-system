import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn } from 'lucide-react';
import axios from 'axios';
import { useAppContext } from '../../context/AppContext';
import { setupAxios } from '../../../axiosConfig';

const LoginPage = () => {
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
      const authHeader = `Basic ${btoa(`${email}:${password}`)}`;

      const response = await axios.post(
        'http://localhost:5000/login',
        {},
        {
          withCredentials: true,
          headers: {
            Authorization: authHeader,
          },
        }
      );

      if (response.status === 200) {
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
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        setError('Invalid email or password');
      } else {
        setError('An error occurred. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <LogIn size={40} className="text-primary-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-primary-500">Welcome Back</h1>
          <p className="text-neutral-600 mt-2">Sign in to your account</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-card">
          {error && (
            <div className="mb-4 p-3 bg-error bg-opacity-10 border border-error rounded-md text-error text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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
                placeholder="Enter your password"
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
                'Sign In'
              )}
            </button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-neutral-600">Don't have an account? </span>
            <Link to="/register" className="text-primary-500 hover:text-primary-600 font-medium">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
