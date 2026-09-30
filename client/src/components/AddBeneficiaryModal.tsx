import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Building2, Loader2, User, Globe2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { insertBeneficiarySchema, type Beneficiary, type InsertBeneficiary } from "@shared/schema";
import {
  BENEFICIARY_COUNTRIES,
  BENEFICIARY_SERVICE_TYPES,
  bankFieldsFor,
  beneficiaryName,
  currencyForCountry,
  requiresNarration,
} from "@/lib/beneficiaries";

interface AddBeneficiaryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called with the saved beneficiary after a successful create. */
  onCreated: (beneficiary: Beneficiary) => void;
  /** When set, the country is fixed (e.g. "Nigeria" for the GBP → NGN corridor). */
  lockedCountry?: string;
  defaultServiceType?: InsertBeneficiary["serviceType"];
}

const emptyForm = (country: string, serviceType: InsertBeneficiary["serviceType"]): InsertBeneficiary => ({
  recipientType: "individual",
  firstName: "",
  lastName: "",
  businessName: "",
  email: "",
  country,
  bankName: "",
  accountNumber: "",
  sortCode: "",
  iban: "",
  swift: "",
  serviceType,
  narration: "",
  relationship: "Personal",
});

const fieldClass = "h-11 sm:h-9";

/**
 * Add Recipient — same fields, rules and process as Rhemito's recipient form
 * (type, name/business, email, country, bank, account, routing fields by country,
 * service type, narration). Saves via POST /api/beneficiaries.
 */
export function AddBeneficiaryModal({
  open,
  onOpenChange,
  onCreated,
  lockedCountry,
  defaultServiceType = "Bank Deposit",
}: AddBeneficiaryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<InsertBeneficiary>({
    resolver: zodResolver(insertBeneficiarySchema),
    defaultValues: emptyForm(lockedCountry ?? "Nigeria", defaultServiceType),
    mode: "onTouched",
  });

  // Fresh form every time the popup opens
  useEffect(() => {
    if (open) form.reset(emptyForm(lockedCountry ?? "Nigeria", defaultServiceType));
  }, [open, lockedCountry, defaultServiceType, form]);

  const [recipientType, country, serviceType] = useWatch({
    control: form.control,
    name: ["recipientType", "country", "serviceType"],
  });
  const bankFields = bankFieldsFor(country);
  const narrationRequired = requiresNarration(country);
  const isNigeriaBank = country === "Nigeria" && serviceType === "Bank Deposit";

  const createMutation = useMutation({
    mutationFn: async (values: InsertBeneficiary) => {
      const res = await apiRequest("POST", "/api/beneficiaries", values);
      return (await res.json()) as Beneficiary;
    },
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ["/api/beneficiaries"] });
      toast({
        title: "Recipient added",
        description: `${beneficiaryName(created)} is ready to receive payouts.`,
      });
      onCreated(created);
    },
    onError: (error: Error) => {
      // apiRequest errors look like `409: {"message":"..."}`
      let description = "Please check the details and try again.";
      const json = error.message.slice(error.message.indexOf(":") + 1).trim();
      try {
        description = JSON.parse(json).message ?? description;
      } catch {
        /* keep default */
      }
      toast({ title: "Recipient not saved", description, variant: "destructive" });
    },
  });

  const onSubmit = form.handleSubmit(
    (values) => createMutation.mutate(values),
    () =>
      toast({
        title: "Please complete the required fields",
        description: "Some recipient details are missing or invalid.",
        variant: "destructive",
      })
  );

  return (
    <Dialog open={open} onOpenChange={(next) => !createMutation.isPending && onOpenChange(next)}>
      <DialogContent
        className={cn(
          "p-0 gap-0 max-h-[92dvh] overflow-y-auto",
          // Mobile: bottom sheet · Desktop: centred dialog
          "max-sm:top-auto max-sm:bottom-0 max-sm:translate-y-0 max-sm:rounded-t-3xl max-sm:border-x-0 max-sm:border-b-0",
          "sm:max-w-lg sm:rounded-2xl",
          // Desktop: pin to the viewport (no reliance on translate centering) so the dialog can never hang off-screen
          "sm:top-[4dvh] sm:translate-y-0 sm:max-h-[92dvh]",
          // Centre horizontally with left/right + auto margins instead of translate (older browsers ignore the CSS `translate` property)
          "left-0 right-0 mx-auto translate-x-0",
          // Keep the built-in close (X) above the sticky header, with a comfortable tap target
          "[&>button:last-child]:z-20 [&>button:last-child]:right-3 [&>button:last-child]:top-3 [&>button:last-child]:p-2 [&>button:last-child]:rounded-full [&>button:last-child]:bg-background"
        )}
        data-testid="dialog-add-recipient"
      >
        <DialogHeader className="px-5 sm:px-6 pt-5 sm:pt-6 pb-4 pr-14 border-b text-left sticky top-0 bg-background z-10">
          <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-gray-200 sm:hidden" aria-hidden="true" />
          <DialogTitle className="text-lg font-bold">Add New Recipient</DialogTitle>
          <DialogDescription>Their bank details will be saved for future transfers.</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={onSubmit} className="px-5 sm:px-6 py-5 space-y-4" noValidate>
            {/* Recipient type */}
            <FormField
              control={form.control}
              name="recipientType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Recipient Type *</FormLabel>
                  <div className="flex gap-3">
                    {([
                      { value: "individual", label: "Individual", icon: User },
                      { value: "business", label: "Business", icon: Building2 },
                    ] as const).map(({ value, label, icon: Icon }) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => field.onChange(value)}
                        aria-pressed={field.value === value}
                        className={cn(
                          "flex-1 flex items-center gap-2 p-3 rounded-xl border-2 transition-colors",
                          field.value === value ? "border-primary bg-primary/5" : "border-border hover:border-gray-300"
                        )}
                        data-testid={`button-recipient-type-${value}`}
                      >
                        <Icon className={cn("w-4 h-4", field.value === value ? "text-primary" : "text-muted-foreground")} />
                        <span className={cn("text-sm font-medium", field.value === value && "text-primary")}>{label}</span>
                      </button>
                    ))}
                  </div>
                </FormItem>
              )}
            />

            {/* Name */}
            {recipientType === "individual" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name *</FormLabel>
                      <FormControl>
                        <Input {...field} className={fieldClass} placeholder="First name" autoComplete="off" data-testid="input-recipient-first-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name *</FormLabel>
                      <FormControl>
                        <Input {...field} className={fieldClass} placeholder="Last name" autoComplete="off" data-testid="input-recipient-last-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            ) : (
              <FormField
                control={form.control}
                name="businessName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Name *</FormLabel>
                    <FormControl>
                      <Input {...field} className={fieldClass} placeholder="Enter business name" data-testid="input-recipient-business-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {/* Email */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address *</FormLabel>
                  <FormControl>
                    <Input {...field} type="email" inputMode="email" className={fieldClass} placeholder="e.g. name@example.com" data-testid="input-recipient-email" />
                  </FormControl>
                  <FormDescription className="text-xs">Used to uniquely identify this recipient.</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Country */}
            <FormField
              control={form.control}
              name="country"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Country *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange} disabled={Boolean(lockedCountry)}>
                    <FormControl>
                      <SelectTrigger className={cn(fieldClass, "text-base sm:text-sm")} data-testid="select-recipient-country">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BENEFICIARY_COUNTRIES.map((c) => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Globe2 className="w-3.5 h-3.5" />
                    Payout currency: <span className="font-semibold text-foreground">{currencyForCountry(field.value)}</span>
                    {lockedCountry && <span>· matches this transfer</span>}
                  </p>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Banking details */}
            <div className="rounded-2xl border border-gray-100 bg-gray-50/60 p-4 space-y-4">
              <p className="text-sm font-semibold text-foreground">Banking Details</p>
              <FormField
                control={form.control}
                name="bankName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank Name *</FormLabel>
                    <FormControl>
                      <Input {...field} className={cn(fieldClass, "bg-white")} placeholder="e.g. GTBank, Access Bank, Zenith Bank" data-testid="input-recipient-bank-name" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="accountNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Account Number *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        onChange={(e) => field.onChange(isNigeriaBank ? e.target.value.replace(/\D/g, "") : e.target.value)}
                        inputMode={isNigeriaBank ? "numeric" : "text"}
                        maxLength={isNigeriaBank ? 10 : 34}
                        className={cn(fieldClass, "bg-white font-mono tracking-wide")}
                        placeholder={isNigeriaBank ? "10-digit account number" : "Account / wallet number"}
                        data-testid="input-recipient-account-number"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {bankFields.sortCode && (
                <FormField
                  control={form.control}
                  name="sortCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sort Code *</FormLabel>
                      <FormControl>
                        <Input {...field} className={cn(fieldClass, "bg-white")} placeholder="e.g. 20-45-67" maxLength={8} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {bankFields.iban && (
                <FormField
                  control={form.control}
                  name="iban"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>IBAN *</FormLabel>
                      <FormControl>
                        <Input {...field} className={cn(fieldClass, "bg-white")} placeholder="e.g. DE89 3704 0044 0532 0130 00" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {bankFields.swift && (
                <FormField
                  control={form.control}
                  name="swift"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SWIFT / BIC *</FormLabel>
                      <FormControl>
                        <Input {...field} className={cn(fieldClass, "bg-white")} placeholder="e.g. WFBIUS6S" maxLength={11} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            {/* Service type */}
            <FormField
              control={form.control}
              name="serviceType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Service Type *</FormLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <FormControl>
                      <SelectTrigger className={cn(fieldClass, "text-base sm:text-sm")} data-testid="select-recipient-service-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {BENEFICIARY_SERVICE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Narration */}
            <FormField
              control={form.control}
              name="narration"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Narration{" "}
                    {narrationRequired ? <span className="text-destructive">*</span> : <span className="text-muted-foreground font-normal">(Optional)</span>}
                  </FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={2} className="resize-none text-base sm:text-sm" placeholder="Purpose of transfer, e.g. School fees" data-testid="input-recipient-narration" />
                  </FormControl>
                  {narrationRequired && <p className="text-xs text-amber-600">Narration is required for Nigerian accounts.</p>}
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-3 pt-2 pb-[env(safe-area-inset-bottom)] sticky bottom-0 bg-background">
              <Button
                type="button"
                variant="outline"
                className="flex-1 h-12 sm:h-11 rounded-xl"
                onClick={() => onOpenChange(false)}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 sm:h-11 rounded-xl bg-primary hover:bg-primary/90"
                disabled={createMutation.isPending}
                data-testid="button-save-recipient"
              >
                {createMutation.isPending ? (
                  <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Saving…</span>
                ) : (
                  "Save Recipient"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
