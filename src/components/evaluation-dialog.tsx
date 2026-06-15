"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useFirestore } from '@/firebase/provider';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const evaluationSchema = z.object({
  rating: z.number().min(1, { message: 'التقييم مطلوب.' }).max(5),
  comment: z.string().optional(),
});

type EvaluationFormValues = z.infer<typeof evaluationSchema>;

interface EvaluationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: string;
  evaluatorId: string;
  evaluatedId: string;
  evaluatedName: string;
  type: 'mentor_to_beneficiary' | 'beneficiary_to_mentor';
}

export function EvaluationDialog({
  isOpen,
  onOpenChange,
  sessionId,
  evaluatorId,
  evaluatedId,
  evaluatedName,
  type,
}: EvaluationDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [hoverRating, setHoverRating] = useState(0);

  const form = useForm<EvaluationFormValues>({
    resolver: zodResolver(evaluationSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const rating = form.watch('rating');

  const onSubmit = async (values: EvaluationFormValues) => {
    if (!firestore) return;
    const evaluationData = {
      ...values,
      sessionId,
      evaluatorId,
      evaluatedId,
      type,
      createdAt: serverTimestamp(),
    };

    try {
      await addDoc(collection(firestore, 'evaluations'), evaluationData);
      toast({
        title: 'تم إرسال التقييم',
        description: `شكرًا لك على تقييم ${evaluatedName}.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'خطأ!',
        description: 'لم نتمكن من حفظ تقييمك.',
      });
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: 'evaluations',
        operation: 'create',
        requestResourceData: evaluationData,
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl">
        <DialogHeader>
          <DialogTitle>تقييم الجلسة</DialogTitle>
          <DialogDescription>
            شاركنا رأيك حول الجلسة مع {evaluatedName}. تقييمك يساعدنا على التحسين.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>التقييم العام</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-1" dir="ltr">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn(
                            'h-8 w-8 cursor-pointer transition-colors',
                            (hoverRating >= star || rating >= star)
                              ? 'text-yellow-400 fill-yellow-400'
                              : 'text-gray-300'
                          )}
                          onClick={() => field.onChange(star)}
                          onMouseEnter={() => setHoverRating(star)}
                          onMouseLeave={() => setHoverRating(0)}
                        />
                      ))}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ملاحظات إضافية (اختياري)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="هل لديك أي ملاحظات أخرى تود مشاركتها؟" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="ghost">إلغاء</Button>
              </DialogClose>
              <Button type="submit">إرسال التقييم</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
