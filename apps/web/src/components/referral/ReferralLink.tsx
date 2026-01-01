import { useState } from 'react';

interface ReferralLinkProps {
  referralUrl: string;
}

export function ReferralLink({ referralUrl }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = referralUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="referral-link-container">
      <h3>Share Your Referral Link</h3>
      <p>Invite friends to donate and track their contributions!</p>
      <div className="referral-link-input">
        <input type="text" value={referralUrl} readOnly />
        <button onClick={handleCopy} className="btn btn-secondary">
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
    </div>
  );
}
