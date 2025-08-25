import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, ClockIcon, UserIcon, PhoneIcon, MailIcon, BikeIcon, EuroIcon, UsersIcon } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import type { Booking, ShopSettings, BikeDetails, BookingCategory } from "./Dashboard";
import { BikeSelector } from "./BikeSelector";

interface BookingFormProps {
  onSubmit: (booking: Omit<Booking, "id" | "totalPrice">) => void;
  onClose: () => void;
  selectedDate: Date;
  settings: ShopSettings;
  getAvailableBikes: (date: Date, startTime: string, endTime: string, category: BookingCategory) => BikeDetails[];
}

export const BookingForm = ({ onSubmit, onClose, selectedDate, settings, getAvailableBikes }: BookingFormProps) => {
  const [formData, setFormData] = useState({
    customerName: "",
    phone: "",
    email: "",
    startTime: "09:00",
    endTime: "18:00",
    category: "hourly" as BookingCategory,
    needsGuide: false,
    status: "confirmed" as const
  });

  const [selectedBikes, setSelectedBikes] = useState<BikeDetails[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [estimatedPrice, setEstimatedPrice] = useState(0);

  const calculateEstimatedPrice = () => {
    if (selectedBikes.length === 0) return 0;
    
    const totalBikes = selectedBikes.reduce((sum, bike) => sum + bike.count, 0);
    let basePrice = 0;
    
    if (formData.category === "full-day") {
      basePrice = settings.pricing.fullDay * totalBikes;
    } else if (formData.category === "half-day") {
      basePrice = settings.pricing.halfDay * totalBikes;
    } else {
      const startHour = parseInt(formData.startTime.split(':')[0]);
      const endHour = parseInt(formData.endTime.split(':')[0]);
      const hours = endHour - startHour;
      basePrice = settings.pricing.hourly * hours * totalBikes;
    }
    
    const guidePrice = formData.needsGuide ? settings.pricing.guideHourly * (
      formData.category === "full-day" ? 8 : 
      formData.category === "half-day" ? 4 : 
      parseInt(formData.endTime.split(':')[0]) - parseInt(formData.startTime.split(':')[0])
    ) : 0;
    
    return basePrice + guidePrice;
  };

  useEffect(() => {
    setEstimatedPrice(calculateEstimatedPrice());
  }, [selectedBikes, formData.category, formData.needsGuide, formData.startTime, formData.endTime]);

  useEffect(() => {
    if (formData.category === "full-day") {
      setFormData(prev => ({ ...prev, startTime: settings.openingTime, endTime: settings.closingTime }));
    } else if (formData.category === "half-day") {
      const openHour = parseInt(settings.openingTime.split(':')[0]);
      const closeHour = parseInt(settings.closingTime.split(':')[0]);
      const halfPoint = Math.floor((openHour + closeHour) / 2);
      setFormData(prev => ({ 
        ...prev, 
        startTime: settings.openingTime, 
        endTime: `${halfPoint.toString().padStart(2, '0')}:00` 
      }));
    }
  }, [formData.category, settings.openingTime, settings.closingTime]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.customerName.trim()) {
      newErrors.customerName = "Nome cliente obbligatorio";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Numero di telefono obbligatorio";
    }

    if (selectedBikes.length === 0) {
      newErrors.bikes = "Selezionare almeno 1 bici";
    }

    if (formData.category === "hourly" && formData.startTime >= formData.endTime) {
      newErrors.time = "L'orario di fine deve essere dopo quello di inizio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSubmit({
      ...formData,
      bikeDetails: selectedBikes,
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

  const availableBikes = getAvailableBikes(selectedDate, formData.startTime, formData.endTime, formData.category);
  const totalAvailable = availableBikes.reduce((sum, bike) => sum + bike.count, 0);

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
                  {totalAvailable} bici disponibili
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

          {/* Booking Category */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <ClockIcon className="w-4 h-4" />
              Tipologia Prenotazione *
            </Label>
            <Select value={formData.category} onValueChange={(value: BookingCategory) => setFormData({ ...formData, category: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hourly">Oraria</SelectItem>
                <SelectItem value="half-day">Mezza Giornata</SelectItem>
                <SelectItem value="full-day">Giornata Intera</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Guide Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="needsGuide"
              checked={formData.needsGuide}
              onCheckedChange={(checked) => setFormData({ ...formData, needsGuide: !!checked })}
            />
            <Label htmlFor="needsGuide" className="flex items-center gap-2 cursor-pointer">
              <UsersIcon className="w-4 h-4" />
              Richiesta Accompagnatore/Guida
            </Label>
          </div>

          {/* Time Selection */}
          {formData.category === "hourly" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

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
          )}

          {/* Bike Selection */}
          <BikeSelector
            availableBikes={availableBikes}
            selectedBikes={selectedBikes}
            onSelectionChange={setSelectedBikes}
          />
          {errors.bikes && (
            <p className="text-sm text-destructive">{errors.bikes}</p>
          )}

          {/* Price Estimation */}
          {estimatedPrice > 0 && (
            <Card className="bg-gradient-to-r from-electric-green/5 to-electric-green-light/5 border-electric-green/20">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <EuroIcon className="w-4 h-4 text-electric-green" />
                    <span className="font-medium">Totale Stimato</span>
                  </div>
                  <Badge className="bg-electric-green text-white text-lg px-3 py-1">
                    €{estimatedPrice.toFixed(2)}
                  </Badge>
                </div>
                {formData.needsGuide && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Include servizio accompagnatore/guida
                  </p>
                )}
              </CardContent>
            </Card>
          )}

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