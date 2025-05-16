"use client";

import Logo from "./Logo";
import NavIcons from "./NavIcons";
import NavMenu from "./NavMenu";

const Navbar = () => {
  return (
    <div className="relative w-full max-w-7xl mx-auto rounded-xl glass-effect shadow-2xl overflow-hidden">
      <nav className="relative z-10 container mx-auto px-6 py-4 flex justify-between items-center">
        <Logo />
        <NavMenu />
        <NavIcons cartCount={0} />
      </nav>
    </div>
  );
};

export default Navbar;
