"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { type Product } from "@/lib/products-data";
import { useFirestore } from "@/firebase/provider";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

const orderFormSchema = z.object({
  name: z.string().min(2, { message: "يجب إدخال اسم صحيح." }),
  address: z.string().min(10, { message: "يجب إدخال عنوان لا يقل عن 10 أحرف." }),
  phone: z.string().regex(/^[\d\s\-\+]+$/, { message: "الرجاء إدخال رقم هاتف صحيح." }),
});

type OrderDialogProps = {
  product: Product | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OrderDialog({ product, isOpen, onOpenChange }: OrderDialogProps) {
  const { toast } = useToast();
  const firestore = useFirestore();

  const form = useForm<z.infer<typeof orderFormSchema>>({
    resolver: zodResolver(orderFormSchema),
    defaultValues: { name: "", address: "", phone: "" },
  });

  const total = (product?.price || 0) + (product?.deliveryCost || 0);

  async function onSubmit(values: z.infer<typeof orderFormSchema>) {
    if (!product || !firestore) {
        toast({
            variant: "destructive",
            title: "خطأ",
            description: "لا يمكن إتمام الطلب الآن.",
        });
        return;
    }

    const orderData = {
        customerName: values.name,
        customerAddress: values.address,
        customerPhone: values.phone,
        productId: product.id,
        productName: product.name,
        beneficiaryId: product.beneficiaryId,
        orderDate: serverTimestamp(),
        status: "pending" as const,
    };
    
    try {
        await addDoc(collection(firestore, "orders"), orderData);
        toast({
            title: "تم استلام طلبك بنجاح!",
            description: `شكرًا لك، ${values.name}. سيتم توصيل منتج "${product?.name}" إلى عنوانك قريبًا.`,
        });
        form.reset();
        onOpenChange(false);
    } catch (error) {
        toast({
            variant: "destructive",
            title: "خطأ في إرسال الطلب",
            description: "لم نتمكن من حفظ طلبك. الرجاء المحاولة مرة أخرى.",
        });
        errorEmitter.emit('permission-error', new FirestorePermissionError({
            path: 'orders',
            operation: 'create',
            requestResourceData: orderData,
        }));
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>طلب المنتج: {product?.name}</DialogTitle>
          <DialogDescription asChild><div className="space-y-1 text-right">
            <p>{product?.description}</p>
            <p><b>السعر:</b> {product?.price.toFixed(2)} د.أ</p>
            {product?.deliveryCost && product.deliveryCost > 0 && (
                <p><b>تكلفة التوصيل:</b> {product.deliveryCost.toFixed(2)} د.أ</p>
            )}
            <p className="border-t pt-2 mt-2 font-bold"><b>الإجمالي:</b> {total.toFixed(2)} د.أ</p>
            <p><b>البائع:</b> {product?.beneficiaryName} ({product?.location})</p>
            <p className="pt-3 font-semibold">الرجاء إدخال معلومات التوصيل لإكمال عملية الشراء.</p>
          </div></DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>الاسم الكامل</FormLabel>
                  <FormControl>
                    <Input placeholder="اسمك الكامل" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>عنوان التوصيل</FormLabel>
                  <FormControl>
                    <Input placeholder="المدينة، الحي، الشارع، رقم المبنى" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>رقم الهاتف</FormLabel>
                  <FormControl>
                    <Input dir="ltr" placeholder="+962 7X XXX XXXX" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit">تأكيد الطلب</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
