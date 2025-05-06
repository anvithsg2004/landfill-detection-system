import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  BarChart2,
  Clock,
  Settings,
  X,
  GanttChart
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggleSidebar: () => void;
}

const Sidebar = ({ isOpen, toggleSidebar }: SidebarProps) => {
  const location = useLocation();
  const pathname = location.pathname;

  const navigationItems = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Upload', path: '/upload', icon: <Upload size={20} /> },
    { name: 'Detection History', path: '/history', icon: <Clock size={20} /> },
    { name: 'Real Time Analysis', path: '/realtime', icon: <BarChart2 size={20} /> },
    { name: 'Try Demo', path: '/demo', icon: <GanttChart size={20} /> }
  ];

  const additionalLinks = [
    { name: 'Settings', path: '#', icon: <Settings size={20} /> },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      <aside
        className={`fixed md:static z-20 h-full md:h-screen w-64 bg-primary-500 text-white transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
          }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-primary-400">
          <div className="flex items-center space-x-2">
            <GanttChart size={24} className="text-secondary-500" />
            <h1 className="text-lg font-semibold">LandfillDetect</h1>
          </div>
          <button className="md:hidden" onClick={toggleSidebar}>
            <X size={20} />
          </button>
        </div>

        <nav className="px-4 py-6">
          <ul className="space-y-1">
            {navigationItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  onClick={() => toggleSidebar()}
                  className={`flex items-center space-x-2 px-4 py-2.5 rounded-md transition-colors ${isActive(item.path)
                    ? 'bg-primary-600 text-white'
                    : 'text-neutral-100 hover:bg-primary-400'
                    }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-8 pt-6 border-t border-primary-400">
            {/* <p className="px-4 mb-2 text-xs font-medium text-neutral-300 uppercase">
              Settings
            </p> */}
            {/* <ul className="space-y-1">
              {additionalLinks.map((item) => (
                <li key={item.name}>
                  <a
                    href={item.path}
                    className="flex items-center space-x-2 px-4 py-2.5 rounded-md text-neutral-100 hover:bg-primary-400 transition-colors"
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </a>
                </li>
              ))}
            </ul> */}
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;