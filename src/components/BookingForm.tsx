import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, ClockIcon, UserIcon, PhoneIcon, MailIcon, BikeIcon } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Booking, ShopSettings } from "./Dashboard";

interface BookingFormProps {
  onSubmit: (booking: Omit<Booking, "id">) => void;
  onClose: () => void;
  selectedDate: Date;
  settings: ShopSettings;
  getAvailableBikes: (date: Date, startTime: string, endTime: string) => number;
}

export const BookingForm = ({ onSubmit, onClose, selectedDate, settings, getAvailableBikes }: BookingFormProps) => {
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    bikeCount: 1,
    startTime: "09:00",
    endTime: "18:00",
    status: "confirmed" as const
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Nome cliente obbligatorio";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Numero di telefono obbligatorio";
    }

    if (formData.bikeCount < 1) {
      newErrors.bikeCount = "Selezionare almeno 1 bici";
    }

    if (formData.startTime >= formData.endTime) {
      newErrors.time = "L'orario di fine deve essere dopo quello di inizio";
    }

    const availableBikes = getAvailableBikes(selectedDate, formData.startTime, formData.endTime);
    if (formData.bikeCount > availableBikes) {
      newErrors.bikeCount = `Solo ${availableBikes} bici disponibili in questo orario`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSubmit({
      ...formData,
      date: selectedDate,
      email: formData.email || undefined
    });
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 9; hour <= 19; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      options.push(timeStr);
      if (hour < 19) {
        const halfHour = `${hour.toString().padStart(2, '0')}:30`;
        options.push(halfHour);
      }
    }
    return options;
  };

  const availableBikes = getAvailableBikes(selectedDate, formData.startTime, formData.endTime);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-electric-green to-electric-green-light rounded-lg flex items-center justify-center">
              <BikeIcon className="w-4 h-4 text-white" />
            </div>
            Nuova Prenotazione
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Date Info */}
          <Card className="bg-gradient-to-r from-electric-green/5 to-electric-green-light/5 border-electric-green/20">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-electric-green" />
                  <span className="font-medium">
                    {format(selectedDate, "EEEE, d MMMM yyyy", { locale: it })}
                  </span>
                </div>
                <Badge className="bg-available text-white">
                  {availableBikes} bici disponibili
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Customer Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="flex items-center gap-2">
                <UserIcon className="w-4 h-4" />
                Nome Cliente *
              </Label>
              <Input
                id="customerName"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                placeholder="Mario Rossi"
                className={errors.customerName ? "border-destructive" : ""}
              />
              {errors.customerName && (
                <p className="text-sm text-destructive">{errors.customerName}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <PhoneIcon className="w-4 h-4" />
                Telefono *
              </Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+39 123 456 7890"
                className={errors.phone ? "border-destructive" : ""}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="flex items-center gap-2">
              <MailIcon className="w-4 h-4" />
              Email (opzionale)
            </Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="mario.rossi@email.com"
            />
          </div>

          {/* Booking Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bikeCount" className="flex items-center gap-2">
                <BikeIcon className="w-4 h-4" />
                Numero Bici *
              </Label>
              <Input
                id="bikeCount"
                type="number"
                min="1"
                max={availableBikes}
                value={formData.bikeCount}
                onChange={(e) => setFormData({ ...formData, bikeCount: parseInt(e.target.value) || 1 })}
                className={errors.bikeCount ? "border-destructive" : ""}
              />
              {errors.bikeCount && (
                <p className="text-sm text-destructive">{errors.bikeCount}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime" className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                Orario Inizio *
              </Label>
              <select
                id="startTime"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generateTimeOptions().slice(0, -1).map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="flex items-center gap-2">
                <ClockIcon className="w-4 h-4" />
                Orario Fine *
              </Label>
              <select
                id="endTime"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generateTimeOptions().slice(1).map((time) => (
                  <option key={time} value={time}>
                    {time}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errors.time && (
            <p className="text-sm text-destructive">{errors.time}</p>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-electric-green to-electric-green-light hover:from-electric-green-dark hover:to-electric-green"
            >
              Conferma Prenotazione
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};