import { useLocation } from "react-router-dom";
import { LayoutDashboard, TrendingUp, Wallet, BarChart3, Settings, User, FileText } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import logo from "@/assets/favicon.png";

const navItems = [
  { path: "/", icon: LayoutDashboard, label: "Dashboard" },
  { path: "/trade", icon: TrendingUp, label: "Trade" },
  { path: "/markets", icon: BarChart3, label: "Markets" },
  { path: "/wallet", icon: Wallet, label: "Wallet" },
  { path: "/profile", icon: User, label: "Profile" },
  { path: "/settings", icon: Settings, label: "Settings" },
];

const Navigation = () => {
  const { open: isOpen } = useSidebar();
  const [privacyOpen, setPrivacyOpen] = useState(false);

  return (
    <>
      <Sidebar collapsible="icon" className="border-r border-border">
        <SidebarContent>
          <div className="px-4 py-6 border-b border-border">
            <div className="flex items-center gap-3">
              <img
                src={logo}
                alt="Bexprot Logo"
                className={`object-cover shrink-0 transition-all duration-300 ${isOpen ? "w-10 h-10 min-w-10 min-h-10 rounded-xl" : "w-5 h-5 min-w-5 min-h-5 rounded-none"
                  }`}
              />
              {isOpen && (
                <div>
                  <div className="font-bold text-foreground text-lg">Bexprot</div>
                  <div className="text-xs text-muted-foreground">Trading Platform</div>
                </div>
              )}
            </div>
          </div>

          {/* Navigation Items */}
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.path}
                          end
                          className="hover:bg-secondary/50 transition-colors rounded-xl"
                          activeClassName="bg-primary text-foreground font-medium hover:bg-primary"
                        >
                          <Icon className="h-5 w-5" />
                          <span>{item.label}</span>
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          {/* Privacy Policy Section */}
          <div className="mt-auto border-t border-border">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => setPrivacyOpen(true)}
                      className="hover:bg-secondary/50 transition-colors rounded-xl h-auto py-2"
                    >
                      <div className={`bg-secondary flex items-center justify-center shrink-0 transition-all duration-300 ${isOpen ? "w-8 h-8 rounded-xl" : "w-5 h-5 rounded-none"
                        }`}>
                        <FileText size={isOpen ? 18 : 14} className="text-muted-foreground" />
                      </div>
                      {isOpen && (
                        <div className="flex-1 overflow-hidden text-left ml-2">
                          <div className="text-sm font-medium text-foreground truncate">Privacy Policy</div>
                          <div className="text-xs text-muted-foreground truncate">Terms & Conditions</div>
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </div>
        </SidebarContent>
      </Sidebar>

      {/* Privacy Policy Dialog */}
      <Dialog open={privacyOpen} onOpenChange={setPrivacyOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Privacy Policy & Terms of Service</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 text-sm">
            <section>
              <h3 className="text-lg font-semibold mb-2">1. Introduction</h3>
              <p className="text-muted-foreground">
                Welcome to Bexprot Trading Platform. This privacy policy explains how we collect, use, and protect your personal information when you use our trading services.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">2. Information We Collect</h3>
              <p className="text-muted-foreground mb-2">We collect the following information:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Personal identification information (Name, email address)</li>
                <li>Trading history and preferences</li>
                <li>Wallet addresses and transaction data</li>
                <li>Device and browser information</li>
                <li>KYC verification documents</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">3. How We Use Your Information</h3>
              <p className="text-muted-foreground mb-2">Your information is used to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Provide and improve our trading services</li>
                <li>Process transactions and manage your account</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Protect against fraud and unauthorized access</li>
                <li>Send important updates and notifications</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">4. Data Storage & Security</h3>
              <p className="text-muted-foreground">
                All data is securely stored on our backend servers. We implement industry-standard security measures to protect your information. Your wallet private keys are never stored on our servers.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">5. MetaMask Integration</h3>
              <p className="text-muted-foreground">
                When you connect your MetaMask wallet, we only access your public wallet address and balance. We never request or store your private keys or seed phrases.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">6. Trading Risks</h3>
              <p className="text-muted-foreground">
                Trading involves significant risk. You should only trade with funds you can afford to lose. Past performance does not guarantee future results. All trading decisions are your responsibility.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">7. KYC Requirements</h3>
              <p className="text-muted-foreground">
                To comply with regulations, we may require you to complete Know Your Customer (KYC) verification. This includes providing identification documents and proof of address.
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">8. Your Rights</h3>
              <p className="text-muted-foreground mb-2">You have the right to:</p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account</li>
                <li>Withdraw consent at any time</li>
                <li>File a complaint with supervisory authorities</li>
              </ul>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">9. Contact Us</h3>
              <p className="text-muted-foreground">
                If you have any questions about this privacy policy, please contact us at privacy@bexprot.com
              </p>
            </section>

            <section>
              <h3 className="text-lg font-semibold mb-2">10. Updates to This Policy</h3>
              <p className="text-muted-foreground">
                We may update this privacy policy from time to time. The latest version will always be available on our platform.
              </p>
            </section>

            <p className="text-xs text-muted-foreground pt-4 border-t border-border">
              Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navigation;
