import { useState } from "react";
import { useTheme } from "next-themes";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PlusIcon, MinusIcon, SaveIcon, XIcon, MoonIcon, SunIcon } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { ShopSettings } from "./Dashboard";
import type { BikeDetails, BikeType, BikeSize, BikeSuspension } from "@/types/bike";
import { DevPanel } from "./DevPanel";

interface SettingsPanelProps {
  settings: ShopSettings;
  onSave: (settings: ShopSettings) => void;
  onClose: () => void;
}

export const SettingsPanel = ({ settings, onSave, onClose }: SettingsPanelProps) => {
  const [formData, setFormData] = useState<ShopSettings>(settings);
  const { theme, setTheme } = useTheme();

  const handleSave = () => {
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
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-5xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-electric-green to-electric-green-light rounded-lg">
              <SaveIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Impostazioni</h2>
              <p className="text-muted-foreground">Configura il tuo negozio</p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            <XIcon className="w-4 h-4 mr-2" />
            Chiudi
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="general" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="general">Generale</TabsTrigger>
              <TabsTrigger value="pricing">Prezzi</TabsTrigger>
              <TabsTrigger value="appearance">Aspetto</TabsTrigger>
              <TabsTrigger value="developer">Dev</TabsTrigger>
            </TabsList>

            <TabsContent value="general" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Informazioni Negozio</CardTitle>
                  <CardDescription>Dati di base del tuo negozio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="shopName">Nome Negozio</Label>
                    <Input
                      id="shopName"
                      value={formData.shopName}
                      onChange={(e) => setFormData({ ...formData, shopName: e.target.value })}
                      placeholder="EcoRide E-Bike"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefono</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="+39 123 456 7890"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="info@ecoride.it"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="openingTime">Orario Apertura</Label>
                      <Select value={formData.openingTime} onValueChange={(value) => setFormData({ ...formData, openingTime: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeOptions().slice(0, -6).map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="closingTime">Orario Chiusura</Label>
                      <Select value={formData.closingTime} onValueChange={(value) => setFormData({ ...formData, closingTime: value })}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {generateTimeOptions().slice(6).map((time) => (
                            <SelectItem key={time} value={time}>
                              {time}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

{/* Bikes tab removed - moved to Garage */}

            <TabsContent value="pricing" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Configurazione Tariffe</CardTitle>
                  <CardDescription>Imposta i prezzi per i diversi tipi di noleggio</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="hourlyRate">Tariffa Oraria (€)</Label>
                      <Input
                        id="hourlyRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricing.hourly}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing: { ...formData.pricing, hourly: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="halfDayRate">Tariffa Mezza Giornata (€)</Label>
                      <Input
                        id="halfDayRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricing.halfDay}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing: { ...formData.pricing, halfDay: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fullDayRate">Tariffa Giornata Intera (€)</Label>
                      <Input
                        id="fullDayRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricing.fullDay}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing: { ...formData.pricing, fullDay: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="guideRate">Tariffa Guida (€/ora)</Label>
                      <Input
                        id="guideRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricing.guideHourly}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing: { ...formData.pricing, guideHourly: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="trailerHourlyRate">Tariffa Carrello Oraria (€)</Label>
                      <Input
                        id="trailerHourlyRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricing.trailerHourly}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing: { ...formData.pricing, trailerHourly: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="trailerHalfDayRate">Tariffa Carrello Mezza Giornata (€)</Label>
                      <Input
                        id="trailerHalfDayRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricing.trailerHalfDay}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing: { ...formData.pricing, trailerHalfDay: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="trailerFullDayRate">Tariffa Carrello Giornata Intera (€)</Label>
                      <Input
                        id="trailerFullDayRate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.pricing.trailerFullDay}
                        onChange={(e) => setFormData({ 
                          ...formData, 
                          pricing: { ...formData.pricing, trailerFullDay: parseFloat(e.target.value) || 0 }
                        })}
                      />
                    </div>
                  </div>

                  <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                    <h4 className="font-medium mb-2">Anteprima Prezzi</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>1 bici per 1 ora:</span>
                        <span>€{formData.pricing.hourly}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1 bici mezza giornata:</span>
                        <span>€{formData.pricing.halfDay}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1 bici giornata intera:</span>
                        <span>€{formData.pricing.fullDay}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Guida per 1 ora:</span>
                        <span>€{formData.pricing.guideHourly}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1 carrello per 1 ora:</span>
                        <span>€{formData.pricing.trailerHourly}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1 carrello mezza giornata:</span>
                        <span>€{formData.pricing.trailerHalfDay}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>1 carrello giornata intera:</span>
                        <span>€{formData.pricing.trailerFullDay}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Tema Applicazione</CardTitle>
                  <CardDescription>Personalizza l'aspetto dell'interfaccia</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="dark-mode">Modalità Scura</Label>
                      <p className="text-sm text-muted-foreground">
                        Attiva il tema scuro per ridurre l'affaticamento degli occhi
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <SunIcon className="h-4 w-4" />
                      <Switch
                        id="dark-mode"
                        checked={theme === "dark"}
                        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
                      />
                      <MoonIcon className="h-4 w-4" />
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label>Anteprima Tema</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Chiaro</p>
                        <div className="h-20 rounded-lg border-2 bg-white border-gray-200 p-3 cursor-pointer" onClick={() => setTheme("light")}>
                          <div className="h-2 w-full bg-gray-200 rounded mb-2"></div>
                          <div className="h-2 w-3/4 bg-gray-300 rounded"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Scuro</p>
                        <div className="h-20 rounded-lg border-2 bg-gray-900 border-gray-700 p-3 cursor-pointer" onClick={() => setTheme("dark")}>
                          <div className="h-2 w-full bg-gray-700 rounded mb-2"></div>
                          <div className="h-2 w-3/4 bg-gray-600 rounded"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="developer" className="space-y-4">
              <DevPanel />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Annulla
            </Button>
            <Button onClick={handleSave} className="bg-gradient-to-r from-electric-green to-electric-green-light hover:from-electric-green-dark hover:to-electric-green">
              <SaveIcon className="w-4 h-4 mr-2" />
              Salva Impostazioni
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPanel;