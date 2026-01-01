import type { LevelBreakdown } from '@kassa/shared';
import { formatCurrency } from '../../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Badge } from '../ui/badge';
import { Users, TrendingUp } from 'lucide-react';

interface ReferralLevelBreakdownProps {
  breakdown: LevelBreakdown[];
  totalDescendants: number;
  totalDescendantDonations: number;
}

export function ReferralLevelBreakdown({
  breakdown,
  totalDescendants,
  totalDescendantDonations,
}: ReferralLevelBreakdownProps) {
  if (breakdown.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Referral Network</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No referrals yet. Share your link to start building your network!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl">Referral Network</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-primary-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Users className="h-5 w-5 text-primary-600" />
              <span className="text-2xl font-bold text-primary-700">{totalDescendants}</span>
            </div>
            <span className="text-sm text-primary-600">Total Referrals</span>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <span className="text-2xl font-bold text-green-700">
                {formatCurrency(totalDescendantDonations)}
              </span>
            </div>
            <span className="text-sm text-green-600">Total Raised</span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Level</TableHead>
              <TableHead className="text-center">Users</TableHead>
              <TableHead className="text-right">Donated</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {breakdown.map((level) => (
              <TableRow key={level.level}>
                <TableCell>
                  <Badge variant="secondary">Level {level.level}</Badge>
                </TableCell>
                <TableCell className="text-center">{level.userCount}</TableCell>
                <TableCell className="text-right">{formatCurrency(level.totalDonated)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="font-semibold">Total</TableCell>
              <TableCell className="text-center font-semibold">{totalDescendants}</TableCell>
              <TableCell className="text-right font-semibold">
                {formatCurrency(totalDescendantDonations)}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </CardContent>
    </Card>
  );
}
