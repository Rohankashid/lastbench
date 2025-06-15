import React from 'react';

const Footer = () => {
  return (
    <footer className="bg-white border-t">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-600 text-sm">
            © {new Date().getFullYear()} StudyNest. All rights reserved.
          </div>
          <div className="mt-4 md:mt-0">
            <nav className="flex space-x-6">
              <a href="/about" className="text-gray-600 hover:text-gray-900 text-sm">
                About
              </a>
              <a href="/contact" className="text-gray-600 hover:text-gray-900 text-sm">
                Contact
              </a>
              <a href="/privacy" className="text-gray-600 hover:text-gray-900 text-sm">
                Privacy Policy
              </a>
              <a href="/terms" className="text-gray-600 hover:text-gray-900 text-sm">
                Terms of Service
              </a>
            </nav>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer; 