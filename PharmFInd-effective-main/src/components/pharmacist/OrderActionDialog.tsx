import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface OrderActionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  action: 'accept' | 'reject';
  onConfirm: (reason?: string) => Promise<void>;
  orderNumber: string;
}

export const OrderActionDialog = ({
  isOpen,
  onClose,
  action,
  onConfirm,
  orderNumber,
}: OrderActionDialogProps) => {
  const [reason, setReason] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (action === 'reject' && reason.trim().length < 10) {
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(action === 'reject' ? reason : undefined);
      handleClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setReason('');
    setIsLoading(false);
    onClose();
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {action === 'accept' ? 'Accept Order' : 'Reject Order'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {action === 'accept' 
              ? `Are you sure you want to accept order ${orderNumber}? The patient will be notified.`
              : `Are you sure you want to reject order ${orderNumber}?`
            }
          </AlertDialogDescription>
        </AlertDialogHeader>

        {action === 'reject' && (
          <div className="space-y-2">
            <Label htmlFor="reason">Rejection Reason *</Label>
            <Textarea
              id="reason"
              placeholder="Please provide a detailed reason for rejection..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
            {reason.trim().length > 0 && reason.trim().length < 10 && (
              <p className="text-sm text-destructive">
                Reason must be at least 10 characters
              </p>
            )}
          </div>
        )}

        <AlertDialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button
            variant={action === 'accept' ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={isLoading || (action === 'reject' && reason.trim().length < 10)}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {action === 'accept' ? 'Accept Order' : 'Reject Order'}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
