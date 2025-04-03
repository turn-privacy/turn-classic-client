<<<<<<< Updated upstream
import { Link } from 'react-router';
import Logo from '../components/Logo';
import { Twitter, Github, MessageSquare, ExternalLink } from 'lucide-react';
=======
import { paymentCredentialOf } from "@lucid-evolution/lucid";
import { ExternalLink, Twitter } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";
import Logo from "../components/Logo";
import { useAppSelector } from "../store/hooks";
import { AdminModal } from "./AdminModal";
import { AiOutlineDiscord } from "react-icons/ai";
>>>>>>> Stashed changes

const Footer = () => {
  return (
    <footer className="border-t border-primary/10 bg-background/90 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <Logo size="sm" />
            <p className="text-muted-foreground">
              Privacy-focused mixing protocol for the Cardano blockchain.
            </p>
            <div className="flex space-x-4">
              <SocialLink
                href="https://twitter.com"
                icon={<Twitter className="h-5 w-5" />}
              />
              <SocialLink
<<<<<<< Updated upstream
                href="https://github.com"
                icon={<Github className="h-5 w-5" />}
              />
              <SocialLink
                href="https://discord.com"
                icon={<MessageSquare className="h-5 w-5" />}
=======
                href="https://discord.com/invite/4BTgMb9BBB"
                icon={
                  <svg
                    stroke="currentColor"
                    fill="currentColor"
                    stroke-width="0"
                    viewBox="0 0 1024 1024"
                    fill-rule="evenodd"
                    height="20px"
                    width="20px"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M340.992 0 316 3.008S203.872 15.264 121.984 81.024h-.96l-1.024.96c-18.368 16.896-26.368 37.664-39.008 68.032a982.08 982.08 0 0 0-37.984 112C19.264 347.872 0 451.872 0 547.008v8l4 8c29.632 52 82.24 85.12 131.008 108 48.736 22.88 90.88 35.008 120 36l19.008.992L284 691.008l35.008-62.016c37.12 8.384 79.872 14.016 128.992 14.016 49.12 0 91.872-5.632 128.992-14.016L612 691.008 622.016 708l18.976-.992c29.12-.992 71.264-13.12 120-36 48.768-22.88 101.376-56 131.008-108l4-8v-8c0-95.136-19.264-199.136-43.008-284.992a982.08 982.08 0 0 0-37.984-112c-12.64-30.4-20.64-51.136-39.008-68l-.992-1.024h-1.024C692.16 15.264 580 3.008 580 3.008L555.008 0l-9.024 23.008s-9.248 23.36-14.976 50.016A643.04 643.04 0 0 0 448 67.008c-17.12 0-46.72 1.12-83.008 6.016-5.76-26.656-15.008-50.016-15.008-50.016zm-44 73.024c1.376 4.48 2.752 8.352 4 12-41.376 10.24-85.504 25.856-125.984 50.976l33.984 54.016C292 138.496 411.232 131.008 448 131.008c36.736 0 156 7.488 239.008 59.008L720.992 136c-40.48-25.12-84.608-40.736-125.984-51.008 1.248-3.616 2.624-7.488 4-12 29.856 6.016 86.88 19.776 133.984 57.024-.256.128 12 18.624 23.008 44.992 11.264 27.136 23.744 63.264 35.008 104 21.632 78.112 38.624 173.248 40 256.992-20.16 30.752-57.504 58.496-97.024 77.024A311.808 311.808 0 0 1 656 637.984l-16-26.976c9.504-3.52 18.88-7.36 27.008-11.008 49.248-21.632 76-44.992 76-44.992l-42.016-48s-17.984 16.512-60 35.008C599.04 560.512 534.88 579.008 448 579.008s-151.008-18.496-192.992-36.992c-42.016-18.496-60-35.008-60-35.008l-42.016 48s26.752 23.36 76 44.992A424.473 424.473 0 0 0 256 611.008l-16 27.008a311.808 311.808 0 0 1-78.016-25.024c-39.488-18.496-76.864-46.24-96.96-76.992 1.344-83.744 18.336-178.88 40-256.992a917.216 917.216 0 0 1 34.976-104c11.008-26.368 23.264-44.864 23.008-44.992 47.104-37.248 104.128-51.008 133.984-56.992M336 291.008c-24.736 0-46.624 14.112-60 32-13.376 17.888-20 39.872-20 64s6.624 46.112 20 64c13.376 17.888 35.264 32 60 32 24.736 0 46.624-14.112 60-32 13.376-17.888 20-39.872 20-64s-6.624-46.112-20-64c-13.376-17.888-35.264-32-60-32m224 0c-24.736 0-46.624 14.112-60 32-13.376 17.888-20 39.872-20 64s6.624 46.112 20 64c13.376 17.888 35.264 32 60 32 24.736 0 46.624-14.112 60-32 13.376-17.888 20-39.872 20-64s-6.624-46.112-20-64c-13.376-17.888-35.264-32-60-32m-224 64c1.76 0 4 .64 8 6.016 4 5.344 8 14.72 8 25.984 0 11.264-4 20.64-8 26.016-4 5.344-6.24 5.984-8 5.984-1.76 0-4-.64-8-6.016a44.832 44.832 0 0 1-8-25.984c0-11.264 4-20.64 8-26.016 4-5.344 6.24-5.984 8-5.984m224 0c1.76 0 4 .64 8 6.016 4 5.344 8 14.72 8 25.984 0 11.264-4 20.64-8 26.016-4 5.344-6.24 5.984-8 5.984-1.76 0-4-.64-8-6.016a44.832 44.832 0 0 1-8-25.984c0-11.264 4-20.64 8-26.016 4-5.344 6.24-5.984 8-5.984"
                      transform="translate(64 158)"
                    ></path>
                  </svg>
                }
>>>>>>> Stashed changes
              />
            </div>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <FooterLink to="/">Home</FooterLink>
              <FooterLink to="/mix">Mix</FooterLink>
              {/* <FooterLink to="/pools">Pools</FooterLink> */}
              <FooterLink to="/docs">Documentation</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Resources</h3>
            <ul className="space-y-2">
              <FooterLink to="/faq">FAQ</FooterLink>
              <FooterLink to="/tutorials">Tutorials</FooterLink>
              <FooterLink to="/blog">Blog</FooterLink>
              <FooterLink to="/privacy">Privacy Policy</FooterLink>
            </ul>
          </div>

          <div>
            <h3 className="font-medium text-lg mb-4">Community</h3>
            <ul className="space-y-2">
              <FooterLink to="/community">Join Community</FooterLink>
              <FooterLink to="/governance">Governance</FooterLink>
              <FooterExternalLink href="https://cardano.org">
                Cardano Foundation
              </FooterExternalLink>
              <FooterExternalLink href="https://forum.cardano.org">
                Cardano Forum
              </FooterExternalLink>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary/10 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <div>
            © {new Date().getFullYear()} Turn Network. All rights reserved.
          </div>
          <div className="mt-4 md:mt-0">
            Built with <span className="gradient-text">♥</span> for privacy on
            Cardano
          </div>
        </div>
      </div>
    </footer>
  );
};

const SocialLink = ({
  href,
  icon,
}: {
  href: string;
  icon: React.ReactNode;
}) => {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="w-10 h-10 rounded-full border border-primary/20 flex items-center justify-center text-foreground hover:bg-primary/10 hover:border-primary/40 transition-colors"
    >
      {icon}
    </a>
  );
};

const FooterLink = ({
  to,
  children,
}: {
  to: string;
  children: React.ReactNode;
}) => {
  return (
    <li>
      <Link
        to={to}
        className="text-muted-foreground hover:text-primary transition-colors"
      >
        {children}
      </Link>
    </li>
  );
};

const FooterExternalLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => {
  return (
    <li>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-muted-foreground hover:text-primary transition-colors flex items-center"
      >
        {children}
        <ExternalLink className="ml-1 h-3 w-3" />
      </a>
    </li>
  );
};

export default Footer;
