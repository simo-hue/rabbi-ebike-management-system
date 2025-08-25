import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { SettingsIcon, BikeIcon, ClockIcon, StoreIcon, PhoneIcon, MailIcon, SaveIcon } from "lucide-react";
import type { ShopSettings } from "./Dashboard";

interface SettingsPanelProps {
  settings: ShopSettings;
  onSave: (settings: ShopSettings) => void;
  onClose: () => void;
}

export const SettingsPanel = ({ settings, onSave, onClose }: SettingsPanelProps) => {
  const [formData, setFormData] = useState<ShopSettings>(settings);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.shopName.trim()) {
      newErrors.shopName = "Nome negozio obbligatorio";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Numero di telefono obbligatorio";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email obbligatoria";
    }

    if (formData.totalBikes < 1) {
      newErrors.totalBikes = "Deve esserci almeno 1 bici";
    }

    if (formData.openingTime >= formData.closingTime) {
      newErrors.time = "L'orario di chiusura deve essere dopo quello di apertura";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    onSave(formData);
    onClose();
  };

  const generateTimeOptions = () => {
    const options = [];
    for (let hour = 6; hour <= 23; hour++) {
      const timeStr = `${hour.toString().padStart(2, '0')}:00`;
      options.push(timeStr);
      if (hour < 23) {
        const halfHour = `${hour.toString().padStart(2, '0')}:30`;
        options.push(halfHour);
      }
    }
    return options;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="w-8 h-8 bg-gradient-to-r from-electric-green to-electric-green-light rounded-lg flex items-center justify-center">
              <SettingsIcon className="w-4 h-4 text-white" />
            </div>
            Impostazioni Negozio
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Shop Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <StoreIcon className="w-5 h-5 text-electric-green" />
                Informazioni Negozio
              </CardTitle>
              <CardDescription>
                Configura i dati principali del tuo negozio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="shopName">Nome Negozio *</Label>
                <Input
                  id="shopName"
                  value={formData.shopName}
                  onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                  placeholder="EcoRide E-Bike"
                  className={errors.shopName ? "border-destructive" : ""}
                />
                {errors.shopName && (
                  <p className="text-sm text-destructive">{errors.shopName}</p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <MailIcon className="w-4 h-4" />
                    Email *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="info@ecoride.it"
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <BikeIcon className="w-5 h-5 text-electric-green" />
                Configurazione Operativa
              </CardTitle>
              <CardDescription>
                Imposta i parametri di funzionamento del negozio
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="totalBikes" className="flex items-center gap-2">
                  <BikeIcon className="w-4 h-4" />
                  Numero Totale E-Bike *
                </Label>
                <Input
                  id="totalBikes"
                  type="number"
                  min="1"
                  max="100"
                  value={formData.totalBikes}
                  onChange={(e) => setFormData({ ...formData, totalBikes: parseInt(e.target.value) || 1 })}
                  className={errors.totalBikes ? "border-destructive" : ""}
                />
                {errors.totalBikes && (
                  <p className="text-sm text-destructive">{errors.totalBikes}</p>
                )}
                <p className="text-sm text-muted-foreground">
                  Numero di e-bike disponibili per il noleggio
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="openingTime" className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Orario Apertura *
                  </Label>
                  <select
                    id="openingTime"
                    value={formData.openingTime}
                    onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generateTimeOptions().slice(0, -6).map((time) => (
                      <option key={time} value={time}>
                        {time}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="closingTime" className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4" />
                    Orario Chiusura *
                  </Label>
                  <select
                    id="closingTime"
                    value={formData.closingTime}
                    onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {generateTimeOptions().slice(6).map((time) => (
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

              <p className="text-sm text-muted-foreground">
                Gli orari definiscono quando è possibile effettuare prenotazioni
              </p>
            </CardContent>
          </Card>

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
              className="flex-1 bg-gradient-to-r from-electric-green to-electric-green-light hover:from-electric-green-dark hover:to-electric-green gap-2"
            >
              <SaveIcon className="w-4 h-4" />
              Salva Impostazioni
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};