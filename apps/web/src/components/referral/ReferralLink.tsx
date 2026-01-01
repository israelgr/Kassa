import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Copy, Check, Share2 } from 'lucide-react';
import { copyToClipboard } from '../../lib/clipboard';
import { TIMING } from '../../lib/constants';

interface ReferralLinkProps {
  referralUrl: string;
}

export function ReferralLink({ referralUrl }: ReferralLinkProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(referralUrl);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), TIMING.COPY_FEEDBACK_DURATION);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Share2 className="h-5 w-5 text-primary" />
          <CardTitle className="text-xl">Share Your Referral Link</CardTitle>
        </div>
        <CardDescription>
          Invite friends to donate and track their contributions!
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input type="text" value={referralUrl} readOnly className="bg-muted/50 flex-1 font-mono text-sm" />
          <Button variant={copied ? 'default' : 'secondary'} onClick={handleCopy}>
            {copied ? (
              <>
                <Check className="h-4 w-4 mr-2" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4 mr-2" />
                Copy
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
