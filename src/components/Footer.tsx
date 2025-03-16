import twitter from '../assets/twitter.svg';

function Footer() {
  return (
    <div className="bg-white/[0.03] px-4 md:px-0">
      <div className="max-w-5xl mx-auto py-10 flex flex-col md:flex-row items-center justify-center md:justify-between font-dm">
        {/* Logo and Title Section */}
        <div className="flex items-center justify-center md:gap-x-6 gap-x-4 mb-5 md:mb-0">
          <img
            src="/logo-footer.png"
            alt="logo"
            className="h-12 w-12 md:h-[70px] md:w-[70px] object-cover"
          />
          <h1 className="font-bold text-2xl md:text-4xl text-center md:text-left">
            Turn Network
          </h1>
        </div>

        {/* Quick Links Section */}
        <div className="flex items-center justify-center md:items-start flex-col gap-3 md:gap-5 mb-5 md:mb-0">
          <h2 className="font-bold text-lg text-center md:text-left">
            Quick Links
          </h2>
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-6 text-sm text-[#F1F1F1]">
            <a
              href="https://turn-network.gitbook.io/turn"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer hover:text-slate-300 duration-200"
            >
              Docs
            </a>
          </div>
        </div>

        {/* Follow Us Section */}
        <div className="flex items-center justify-center md:items-start flex-col gap-3 md:gap-5">
          <h2 className="font-bold text-lg text-center md:text-left">
            Follow us on
          </h2>
          <img
            src={twitter} // Ensure this is the correct source for your Twitter logo
            alt="Twitter logo"
            className="h-8 w-8 object-cover cursor-pointer"
          />
        </div>
      </div>

      {/* Separator Line */}
      <div className="w-full border-b border-white/15 my-4" />

      {/* Footer Text */}
      <div className="max-w-5xl mx-auto pt-4 pb-6 font-dm text-slate-50 text-sm text-center">
        © 2025 Turn Network. All rights reserved. Built on Turn Network.
      </div>
    </div>
  );
}

export default Footer;
