import { User, LogOut } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const { user, logout } = useAppContext();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center mb-6">
        <User size={24} className="text-primary-500 mr-2" />
        <h1 className="text-2xl font-bold text-primary-500">Profile</h1>
      </div>
      
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="h-16 w-16 rounded-full bg-primary-500 flex items-center justify-center text-white text-xl font-medium">
              {user.name.charAt(0)}
            </div>
            <div className="ml-4">
              <h2 className="text-xl font-semibold">{user.name}</h2>
              <p className="text-neutral-600">{user.email}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="btn btn-outline flex items-center space-x-2 text-error border-error hover:bg-error hover:text-white"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
        
        <div className="border-t border-neutral-200 pt-6">
          <h3 className="text-lg font-semibold mb-4">Account Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-500">Role</p>
              <p className="text-neutral-800 font-medium capitalize">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Member Since</p>
              <p className="text-neutral-800 font-medium">
                {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;