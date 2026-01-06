import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-black text-foreground">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Back Button */}
        <div className="mb-8">
          <Link to="/">
            <Button variant="default" size="sm" className="gap-2 bg-primary hover:bg-primary/90">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="glass rounded-xl p-8 md:p-12">
          <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-8">
            Last Updated:{" "}
            {new Date().toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>

          <div className="space-y-8 text-sm">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to Bexprot Trading Platform. This privacy policy
                explains how we collect, use, and protect your personal
                information when you use our trading services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                2. Information We Collect
              </h2>
              <p className="text-muted-foreground mb-4">
                We collect the following information:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>
                  Personal identification information (Name, email address)
                </li>
                <li>Trading history and preferences</li>
                <li>Wallet addresses and transaction data</li>
                <li>Device and browser information</li>
                <li>KYC verification documents</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                3. How We Use Your Information
              </h2>
              <p className="text-muted-foreground mb-4">
                Your information is used to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Provide and improve our trading services</li>
                <li>Process transactions and manage your account</li>
                <li>Comply with legal and regulatory requirements</li>
                <li>Protect against fraud and unauthorized access</li>
                <li>Send important updates and notifications</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                4. Data Storage & Security
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                All data is securely stored on our backend servers. We implement
                industry-standard security measures to protect your information.
                Your wallet private keys are never stored on our servers.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                5. MetaMask Integration
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                When you connect your MetaMask wallet, we only access your
                public wallet address and balance. We never request or store
                your private keys or seed phrases.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Trading Risks</h2>
              <p className="text-muted-foreground leading-relaxed">
                Trading involves significant risk. You should only trade with
                funds you can afford to lose. Past performance does not
                guarantee future results. All trading decisions are your
                responsibility.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                7. KYC Requirements
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                To comply with regulations, we may require you to complete Know
                Your Customer (KYC) verification. This includes providing
                identification documents and proof of address.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Your Rights</h2>
              <p className="text-muted-foreground mb-4">
                You have the right to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Access your personal data</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account</li>
                <li>Withdraw consent at any time</li>
                <li>File a complaint with supervisory authorities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about this privacy policy, please
                contact us at privacy@bexprot.com
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">
                10. Updates to This Policy
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this privacy policy from time to time. The latest
                version will always be available on our platform.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;

