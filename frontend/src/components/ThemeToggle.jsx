import { useTheme } from '../contexts/ThemeContext';
import { FaMoon, FaSun } from 'react-icons/fa';

export default function ThemeToggle() {
  const { isDarkTheme, toggleTheme } = useTheme();

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {isDarkTheme ? <FaMoon className="text-gray-600" /> : <FaSun className="text-yellow-500" />}
          <div>
            <h3 className="font-semibold text-gray-800">Theme</h3>
            <p className="text-sm text-gray-600">{isDarkTheme ? 'Dark' : 'Light'} theme</p>
          </div>
        </div>
        <button
          onClick={toggleTheme}
          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${
            isDarkTheme ? 'bg-green-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform ${
              isDarkTheme ? 'translate-x-7' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
