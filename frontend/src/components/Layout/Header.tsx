import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Search, Download, User } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useState, useRef, useEffect } from 'react';

interface HeaderProps {
  toggleSidebar: () => void;
}

const Header = ({ toggleSidebar }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { exportResults, user } = useAppContext();
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const getPageTitle = () => {
    const path = location.pathname;

    if (path === '/') return 'Dashboard';
    if (path === '/upload') return 'Upload Images';
    if (path.startsWith('/analysis')) return 'Image Analysis';
    if (path === '/history') return 'Detection History';
    if (path === '/profile') return 'Profile';
    return 'Landfill Detection System';
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="bg-white border-b border-neutral-200 py-4 px-6 flex items-center justify-between">
      <div className="flex items-center">
        <button
          onClick={toggleSidebar}
          className="p-1 rounded-md text-primary-500 hover:bg-primary-50 md:hidden"
        >
          <Menu size={24} />
        </button>
        <h1 className="text-xl font-semibold ml-4 text-primary-500">
          {getPageTitle()}
        </h1>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4">
        {/* <div className="relative hidden md:block">
          <input 
            type="text" 
            placeholder="Search..." 
            className="pl-9 pr-4 py-2 w-48 lg:w-64 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <Search className="absolute left-2.5 top-2.5 text-neutral-400" size={18} />
        </div> */}

        {/* {(location.pathname === '/analysis' || location.pathname.includes('/analysis/')) && (
          <button
            onClick={exportResults}
            className="btn btn-outline flex items-center space-x-1 text-sm"
          >
            <Download size={16} />
            <span>Export</span>
          </button>
        )} */}

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="h-8 w-8 rounded-full bg-primary-500 flex items-center justify-center text-white hover:bg-primary-600 transition-colors"
          >
            {user ? (
              <span className="text-sm font-medium">{user.name.charAt(0)}</span>
            ) : (
              <User size={20} />
            )}
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-elevated border border-neutral-200 py-1 z-50">
              <button
                onClick={() => {
                  navigate('/profile');
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                Profile
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
