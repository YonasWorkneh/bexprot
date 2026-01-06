import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

const TermsOfService = () => {
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
          <h1 className="text-4xl font-bold mb-4">Terms of Service</h1>
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
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using Bexprot Trading Platform, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Use License</h2>
              <p className="text-muted-foreground mb-4">
                Permission is granted to temporarily use Bexprot for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Modify or copy the materials</li>
                <li>Use the materials for any commercial purpose or for any public display</li>
                <li>Attempt to reverse engineer any software contained on Bexprot</li>
                <li>Remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Account Registration</h2>
              <p className="text-muted-foreground leading-relaxed">
                To access certain features of our platform, you must register for an account. You agree to provide accurate, current, and complete information during the registration process and to update such information to keep it accurate, current, and complete.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Trading Rules</h2>
              <p className="text-muted-foreground mb-4">
                When trading on Bexprot, you agree to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-2 ml-4">
                <li>Comply with all applicable laws and regulations</li>
                <li>Not engage in any fraudulent, manipulative, or deceptive trading practices</li>
                <li>Not use the platform for money laundering or other illegal activities</li>
                <li>Maintain the security of your account credentials</li>
                <li>Report any suspicious activity immediately</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Risk Disclosure</h2>
              <p className="text-muted-foreground leading-relaxed">
                Trading cryptocurrencies, stocks, forex, and commodities involves substantial risk of loss and is not suitable for every investor. The high degree of leverage can work against you as well as for you. Before deciding to trade, you should carefully consider your investment objectives, level of experience, and risk appetite.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Fees and Charges</h2>
              <p className="text-muted-foreground leading-relaxed">
                Bexprot charges fees for various services, including trading fees, withdrawal fees, and other transaction fees. All fees are clearly disclosed before you complete a transaction. By using our services, you agree to pay all applicable fees.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
              <p className="text-muted-foreground leading-relaxed">
                All content, features, and functionality of the Bexprot platform, including but not limited to text, graphics, logos, icons, images, and software, are the exclusive property of Bexprot and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                Bexprot shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Termination</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may terminate or suspend your account and access to the platform immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms of Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right, at our sole discretion, to modify or replace these Terms of Service at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed">
                If you have any questions about these Terms of Service, please contact us at support@bexprot.com
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

