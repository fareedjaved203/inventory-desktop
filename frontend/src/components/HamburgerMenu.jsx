import { FaBars } from 'react-icons/fa';

function HamburgerMenu({ onClick, className = '' }) {
  return (
    <button
      onClick={onClick}
      className={`p-3 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors md:hidden focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-opacity-50 ${className}`}
      aria-label="Open navigation menu"
      type="button"
    >
      <FaBars className="w-5 h-5 text-gray-700" />
    </button>
  );
}

export default HamburgerMenu;