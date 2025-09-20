import { useState, useEffect, lazy, Suspense } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { CalendarIcon, SettingsIcon, PlusIcon, BikeIcon, BarChart3Icon, TrendingUpIcon, EuroIcon, EditIcon, TrashIcon, WrenchIcon, SaveIcon } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { BookingForm } from "./BookingForm";
import { BookingList } from "./BookingList";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useServerStatus } from "@/hooks/useApi";

// Lazy load heavy components
const SettingsPanel = lazy(() => import("./SettingsPanel"));
const Statistics = lazy(() => import("./Statistics"));
const AdvancedAnalytics = lazy(() => import("./AdvancedAnalytics"));
const DevPanel = lazy(() => import("./DevPanel"));
const FixedCostsManager = lazy(() => import("./FixedCostsManager"));

// Import Garage directly to test
import Garage from "./Garage";

// Import types from dedicated file
import type { BikeType, BikeSize, BikeSuspension, BikeDetails, Bike, MaintenanceRecord, AvailableBike } from "@/types/bike";
export type { BikeType, BikeSize, BikeSuspension, BikeDetails, Bike, MaintenanceRecord, AvailableBike };

// Full-Featured Garage Component
const MinimalGarage = ({ bikes, onUpdateBikes, onClose }: { bikes: Bike[], onUpdateBikes: (bikes: Bike[]) => void, onClose: () => void }) => {
  const { toast } = useToast();
  const [isAddingBike, setIsAddingBike] = useState(false);
  const [isAddingTrailer, setIsAddingTrailer] = useState(false);
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [editingBike, setEditingBike] = useState<Bike | null>(null);
  
  const [newBike, setNewBike] = useState<Partial<Bike>>({
    name: "",
    brand: "",
    model: "",
    type: "adulto",
    size: "M",
    isActive: true,
    year: new Date().getFullYear(),
    purchasePrice: 0,
    recommendedHeightMin: 150,
    recommendedHeightMax: 200,
    hasTrailerHook: false
  });

  const [newTrailer, setNewTrailer] = useState<Partial<Bike>>({
    name: "",
    brand: "",
    model: "",
    type: "trailer",
    size: "M",
    isActive: true,
    year: new Date().getFullYear(),
    purchasePrice: 0,
    hasTrailerHook: false
  });

  const resetNewBike = () => {
    setNewBike({
      name: "",
      brand: "",
      model: "",
      type: "adulto", 
      size: "M",
      isActive: true,
      year: new Date().getFullYear(),
      purchasePrice: 0,
      recommendedHeightMin: 150,
      recommendedHeightMax: 200,
      hasTrailerHook: false
    });
  };

  const resetNewTrailer = () => {
    setNewTrailer({
      name: "",
      brand: "",
      model: "",
      type: "trailer",
      size: "M",
      isActive: true,
      year: new Date().getFullYear(),
      purchasePrice: 0,
      hasTrailerHook: false
    });
  };

  const handleAddBike = () => {
    if (!newBike.name || !newBike.brand) {
      toast({
        title: "Errore",
        description: "Nome e marca sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    const bikeToAdd: Bike = {
      id: Date.now().toString(),
      name: newBike.name,
      brand: newBike.brand,
      model: newBike.model || "",
      type: newBike.type as BikeType,
      size: newBike.size as BikeSize,
      isActive: newBike.isActive ?? true,
      year: newBike.year,
      purchasePrice: newBike.purchasePrice,
      recommendedHeightMin: newBike.recommendedHeightMin,
      recommendedHeightMax: newBike.recommendedHeightMax,
      hasTrailerHook: newBike.hasTrailerHook ?? false,
      maintenanceHistory: []
    };

    onUpdateBikes([...bikes, bikeToAdd]);
    resetNewBike();
    setIsAddingBike(false);
    
    toast({
      title: "Successo",
      description: `${bikeToAdd.name} è stata aggiunta al garage`
    });
  };

  const handleAddTrailer = () => {
    if (!newTrailer.name || !newTrailer.brand) {
      toast({
        title: "Errore",
        description: "Nome e marca sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    const trailerToAdd: Bike = {
      id: Date.now().toString(),
      name: newTrailer.name,
      brand: newTrailer.brand,
      model: newTrailer.model || "",
      type: "trailer" as BikeType,
      size: newTrailer.size as BikeSize,
      isActive: newTrailer.isActive ?? true,
      year: newTrailer.year,
      purchasePrice: newTrailer.purchasePrice,
      hasTrailerHook: false, // I carrelli non hanno ganci
      maintenanceHistory: []
    };

    onUpdateBikes([...bikes, trailerToAdd]);
    resetNewTrailer();
    setIsAddingTrailer(false);
    
    toast({
      title: "Successo",
      description: `${trailerToAdd.name} è stato aggiunto al garage`
    });
  };

  const handleEditBike = (bike: Bike) => {
    const updatedBikes = bikes.map(b => b.id === bike.id ? bike : b);
    onUpdateBikes(updatedBikes);
    setEditingBike(null);
    toast({
      title: "Successo", 
      description: "Bicicletta modificata con successo"
    });
  };

  const handleDeleteBike = (bikeId: string) => {
    const bikeToDelete = bikes.find(b => b.id === bikeId);
    onUpdateBikes(bikes.filter(b => b.id !== bikeId));
    toast({
      title: "Successo",
      description: `${bikeToDelete?.name} è stata rimossa dal garage`,
      variant: "destructive"
    });
  };

  const toggleBikeStatus = (bikeId: string) => {
    const updatedBikes = bikes.map(bike => 
      bike.id === bikeId ? { ...bike, isActive: !bike.isActive } : bike
    );
    onUpdateBikes(updatedBikes);
    const bike = bikes.find(b => b.id === bikeId);
    toast({
      title: "Status aggiornato",
      description: `${bike?.name} è ora ${bike?.isActive ? 'non attiva' : 'attiva'}`
    });
  };

  return (
    <div className="fixed inset-0 bg-background z-50 p-6 overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-electric-green to-electric-green-light rounded-xl flex items-center justify-center">
              <WrenchIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Garage Biciclette</h1>
              <p className="text-sm text-muted-foreground">Gestisci il tuo inventario di biciclette e carrelli</p>
            </div>
          </div>
          <Button 
            onClick={onClose}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CalendarIcon className="w-4 h-4" />
            Torna alla Dashboard
          </Button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <BikeIcon className="w-4 h-4 text-electric-green" />
                <span className="text-sm font-medium">Totale Bici</span>
              </div>
              <p className="text-2xl font-bold text-electric-green">{bikes.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge className="w-2 h-2 bg-available rounded-full p-0" />
                <span className="text-sm font-medium">Attive</span>
              </div>
              <p className="text-2xl font-bold text-available">{bikes.filter(b => b.isActive).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Badge className="w-2 h-2 bg-unavailable rounded-full p-0" />
                <span className="text-sm font-medium">Non Attive</span>
              </div>
              <p className="text-2xl font-bold text-unavailable">{bikes.filter(b => !b.isActive).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <EuroIcon className="w-4 h-4 text-electric-green" />
                <span className="text-sm font-medium">Valore Totale</span>
              </div>
              <p className="text-2xl font-bold text-electric-green">
                €{bikes.reduce((sum, bike) => sum + (bike.purchasePrice || 0), 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Main Content */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BikeIcon className="w-5 h-5 text-electric-green" />
                  Inventario Biciclette
                </CardTitle>
                <CardDescription>
                  Gestisci le tue biciclette elettriche e i carrelli porta-bambini
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  onClick={() => setIsAddingBike(true)} 
                  className="bg-gradient-to-r from-electric-green to-electric-green-light hover:from-electric-green-dark hover:to-electric-green flex items-center gap-2"
                >
                  <BikeIcon className="w-4 h-4" />
                  Aggiungi E-Bike
                </Button>
                <Button 
                  onClick={() => setIsAddingTrailer(true)} 
                  variant="outline" 
                  className="border-electric-green/30 text-electric-green hover:bg-electric-green/10 flex items-center gap-2"
                >
                  <PlusIcon className="w-4 h-4" />
                  Aggiungi Carrello
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            {bikes && bikes.length > 0 ? (
              <div className="grid gap-4">
                {bikes.map((bike) => (
                  <Card key={bike.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-electric-green to-electric-green-light rounded-lg flex items-center justify-center">
                              <BikeIcon className="w-4 h-4 text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-lg">{bike.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                {bike.brand} {bike.model && `• ${bike.model}`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 mb-3">
                            <Badge variant="secondary" className="text-xs">
                              {bike.type === 'bambino' ? '👶 Bambino' : bike.type === 'adulto' ? '👨 Adulto' : bike.type === 'trailer' ? '🚚 Carrello' : bike.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Taglia {bike.size}
                            </Badge>
                            {bike.year && (
                              <Badge variant="outline" className="text-xs">
                                {bike.year}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            {bike.recommendedHeightMin && bike.recommendedHeightMax && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-electric-green rounded-full"></div>
                                <span>Altezza: {bike.recommendedHeightMin}-{bike.recommendedHeightMax}cm</span>
                              </div>
                            )}
                            {bike.hasTrailerHook && (
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-available rounded-full"></div>
                                <span>Gancio carrello</span>
                              </div>
                            )}
                            {bike.purchasePrice && (
                              <div className="flex items-center gap-2">
                                <EuroIcon className="w-3 h-3 text-electric-green" />
                                <span>€{bike.purchasePrice}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge 
                            className={`cursor-pointer transition-colors ${
                              bike.isActive 
                                ? 'bg-available text-white hover:bg-available/80' 
                                : 'bg-unavailable text-white hover:bg-unavailable/80'
                            }`}
                            onClick={() => toggleBikeStatus(bike.id)}
                          >
                            {bike.isActive ? 'Attiva' : 'Non attiva'}
                          </Badge>
                          <div className="flex gap-1">
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => setEditingBike(bike)}
                              className="h-8 w-8 p-0"
                            >
                              <EditIcon className="w-3 h-3" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              onClick={() => handleDeleteBike(bike.id)} 
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <TrashIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gradient-to-r from-electric-green/20 to-electric-green-light/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BikeIcon className="w-8 h-8 text-electric-green" />
                </div>
                <p className="text-lg font-medium mb-2">Nessuna bicicletta nel garage</p>
                <p className="text-sm text-muted-foreground mb-4">Aggiungi la tua prima bicicletta per iniziare</p>
                <Button onClick={() => setIsAddingBike(true)} className="bg-gradient-to-r from-electric-green to-electric-green-light">
                  <BikeIcon className="w-4 h-4 mr-2" />
                  Aggiungi Prima Bici
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

        {/* Add Bike Dialog */}
        <Dialog open={isAddingBike} onOpenChange={setIsAddingBike}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Aggiungi Nuova Bicicletta</DialogTitle>
              <DialogDescription>
                Inserisci i dettagli della nuova bicicletta
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bikeName">Nome *</Label>
                  <Input
                    id="bikeName"
                    value={newBike.name}
                    onChange={(e) => setNewBike({ ...newBike, name: e.target.value })}
                    placeholder="Es. E-Bike Mountain Pro"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="bikeBrand">Marca *</Label>
                  <Input
                    id="bikeBrand"
                    value={newBike.brand}
                    onChange={(e) => setNewBike({ ...newBike, brand: e.target.value })}
                    placeholder="Es. Trek, Specialized, etc."
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bikeModel">Modello</Label>
                <Input
                  id="bikeModel"
                  value={newBike.model}
                  onChange={(e) => setNewBike({ ...newBike, model: e.target.value })}
                  placeholder="Es. Powerfly 5"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select value={newBike.type} onValueChange={(value: BikeType) => setNewBike({ ...newBike, type: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="adulto">Adulto</SelectItem>
                      <SelectItem value="bambino">Bambino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Taglia</Label>
                  <Select value={newBike.size} onValueChange={(value: BikeSize) => setNewBike({ ...newBike, size: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bikeYear">Anno</Label>
                  <Input
                    id="bikeYear"
                    type="number"
                    value={newBike.year || ""}
                    onChange={(e) => setNewBike({ ...newBike, year: parseInt(e.target.value) || undefined })}
                    placeholder="2024"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="bikePrice">Prezzo Acquisto (€)</Label>
                  <Input
                    id="bikePrice"
                    type="number"
                    step="0.01"
                    value={newBike.purchasePrice || ""}
                    onChange={(e) => setNewBike({ ...newBike, purchasePrice: parseFloat(e.target.value) || undefined })}
                  />
                </div>
                
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="bikeActive"
                    checked={newBike.isActive}
                    onCheckedChange={(checked) => setNewBike({ ...newBike, isActive: checked })}
                  />
                  <Label htmlFor="bikeActive">Attiva</Label>
                </div>
              </div>

              {/* Altezza consigliata */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Range Altezza Consigliata (cm)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="heightMin" className="text-xs text-gray-500">Altezza minima</Label>
                    <Input
                      id="heightMin"
                      type="number"
                      min="50"
                      max="250"
                      value={newBike.recommendedHeightMin || ""}
                      onChange={(e) => setNewBike({ ...newBike, recommendedHeightMin: parseInt(e.target.value) || undefined })}
                      placeholder="150"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="heightMax" className="text-xs text-gray-500">Altezza massima</Label>
                    <Input
                      id="heightMax"
                      type="number"
                      min="50"
                      max="250"
                      value={newBike.recommendedHeightMax || ""}
                      onChange={(e) => setNewBike({ ...newBike, recommendedHeightMax: parseInt(e.target.value) || undefined })}
                      placeholder="200"
                    />
                  </div>
                </div>
                <p className="text-xs text-gray-500">Indica il range di altezza raccomandato per l'uso sicuro della bicicletta</p>
              </div>

              {/* Gancio carrello */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="trailerHook" className="font-medium">Gancio per Carrello</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Questa bicicletta può trainare un carrello porta-bimbi o bagagli
                    </p>
                  </div>
                  <Switch
                    id="trailerHook"
                    checked={newBike.hasTrailerHook ?? false}
                    onCheckedChange={(checked) => setNewBike({ ...newBike, hasTrailerHook: checked })}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddingBike(false)}>
                  Annulla
                </Button>
                <Button onClick={handleAddBike}>
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Salva Bicicletta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Add Trailer Dialog */}
        <Dialog open={isAddingTrailer} onOpenChange={setIsAddingTrailer}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>🚚 Aggiungi Nuovo Carrello</DialogTitle>
              <DialogDescription>
                Inserisci i dettagli del nuovo carrello porta-bimbi o bagagli
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trailerName">Nome *</Label>
                  <Input
                    id="trailerName"
                    value={newTrailer.name}
                    onChange={(e) => setNewTrailer({ ...newTrailer, name: e.target.value })}
                    placeholder="Es. Carrello Porta-Bimbi Deluxe"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="trailerBrand">Marca *</Label>
                  <Input
                    id="trailerBrand"
                    value={newTrailer.brand}
                    onChange={(e) => setNewTrailer({ ...newTrailer, brand: e.target.value })}
                    placeholder="Es. Thule, Burley, Hamax"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="trailerModel">Modello</Label>
                <Input
                  id="trailerModel"
                  value={newTrailer.model}
                  onChange={(e) => setNewTrailer({ ...newTrailer, model: e.target.value })}
                  placeholder="Es. Chariot CX, D'Lite X"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trailerYear">Anno</Label>
                  <Input
                    id="trailerYear"
                    type="number"
                    value={newTrailer.year || ""}
                    onChange={(e) => setNewTrailer({ ...newTrailer, year: parseInt(e.target.value) || undefined })}
                    placeholder="2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="trailerPrice">Prezzo Acquisto (€)</Label>
                  <Input
                    id="trailerPrice"
                    type="number"
                    step="0.01"
                    value={newTrailer.purchasePrice || ""}
                    onChange={(e) => setNewTrailer({ ...newTrailer, purchasePrice: parseFloat(e.target.value) || undefined })}
                  />
                </div>
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="trailerActive" className="font-medium">Carrello Attivo</Label>
                    <p className="text-sm text-gray-600 mt-1">
                      Disponibile per il noleggio e prenotazioni
                    </p>
                  </div>
                  <Switch
                    id="trailerActive"
                    checked={newTrailer.isActive ?? true}
                    onCheckedChange={(checked) => setNewTrailer({ ...newTrailer, isActive: checked })}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700">
                  💡 <strong>Nota:</strong> I carrelli non hanno campi per altezza consigliata o ganci, 
                  in quanto sono progettati per essere trainati dalle biciclette elettriche.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddingTrailer(false)}>
                  Annulla
                </Button>
                <Button onClick={handleAddTrailer} className="bg-orange-500 hover:bg-orange-600">
                  <SaveIcon className="w-4 h-4 mr-2" />
                  Salva Carrello
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
};

export type BookingCategory = "hourly" | "half-day" | "full-day";

export type Booking = {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  bikeDetails: BikeDetails[];
  customers: { name: string; height: number }[]; // Track customer heights
  startTime: string;
  endTime: string;
  date: Date;
  category: BookingCategory;
  needsGuide: boolean;
  status: "confirmed" | "pending" | "cancelled";
  totalPrice: number;
};

export type Pricing = {
  hourly: number;
  halfDay: number;
  fullDay: number;
  guideHourly: number;
  trailerHourly: number;
  trailerHalfDay: number;
  trailerFullDay: number;
};

export type ShopSettings = {
  totalBikes: BikeDetails[]; // Legacy compatibility
  bikes: Bike[]; // New detailed bike management
  openingTime: string;
  closingTime: string;
  shopName: string;
  phone: string;
  email: string;
  pricing: Pricing;
};

const defaultSettings: ShopSettings = {
  totalBikes: [
    { type: "adulto", size: "S", suspension: "front", count: 2 },
    { type: "adulto", size: "M", suspension: "front", count: 3 },
    { type: "adulto", size: "L", suspension: "front", count: 2 },
    { type: "adulto", size: "M", suspension: "full-suspension", count: 2 },
    { type: "bambino", size: "S", suspension: "front", count: 1 },
  ],
  bikes: [
    {
      id: "bike-1",
      name: "E-Mountain Pro",
      brand: "Scott",
      model: "Genius eRIDE",
      type: "adulto",
      size: "M",
      suspension: "full-suspension",
      hasTrailerHook: true,
      description: "E-bike da montagna con sospensioni complete e gancio per carrello",
      minHeight: 165,
      maxHeight: 185,
      purchaseDate: new Date("2024-01-15"),
      purchasePrice: 3500,
      isActive: true,
      maintenance: [],
      totalMaintenanceCost: 0,
      lastMaintenanceDate: new Date("2024-01-15"),
      nextMaintenanceDate: new Date("2024-07-15")
    },
    {
      id: "bike-2", 
      name: "City Explorer",
      brand: "Trek",
      model: "Verve+ 2",
      type: "adulto",
      size: "L",
      suspension: "front",
      hasTrailerHook: false,
      description: "E-bike urbana perfetta per giri in città",
      minHeight: 175,
      maxHeight: 195,
      purchaseDate: new Date("2024-02-01"),
      purchasePrice: 2800,
      isActive: true,
      maintenance: [],
      totalMaintenanceCost: 0,
      lastMaintenanceDate: new Date("2024-02-01"),
      nextMaintenanceDate: new Date("2024-08-01")
    },
    {
      id: "bike-3",
      name: "Kids Adventure",
      brand: "Specialized",
      model: "Turbo Levo SL",
      type: "bambino",
      size: "S",
      suspension: "front",
      description: "E-bike per bambini sicura e divertente",
      minHeight: 120,
      maxHeight: 150,
      purchaseDate: new Date("2024-03-01"),
      purchasePrice: 1800,
      isActive: true,
      maintenance: [],
      totalMaintenanceCost: 0,
      lastMaintenanceDate: new Date("2024-03-01"),
      nextMaintenanceDate: new Date("2024-09-01")
    },
    {
      id: "trailer-1",
      name: "Family Cargo",
      brand: "Thule",
      model: "Chariot Cross",
      type: "carrello-porta-bimbi",
      description: "Carrello per trasporto bambini con sistema di sicurezza avanzato",
      purchaseDate: new Date("2024-02-15"),
      purchasePrice: 850,
      isActive: true,
      maintenance: [],
      totalMaintenanceCost: 0,
      lastMaintenanceDate: new Date("2024-02-15"),
      nextMaintenanceDate: new Date("2024-08-15")
    },
    {
      id: "trailer-2",
      name: "Cargo Express",
      brand: "Burley",
      model: "Nomad",
      type: "trailer",
      description: "Carrello da carico per trasporto merci e bagagli",
      purchaseDate: new Date("2024-01-30"),
      purchasePrice: 650,
      isActive: true,
      maintenance: [],
      totalMaintenanceCost: 0,
      lastMaintenanceDate: new Date("2024-01-30"),
      nextMaintenanceDate: new Date("2024-07-30")
    }
  ], // Will be populated with detailed bike data
  openingTime: "09:00",
  closingTime: "19:00",
  shopName: "Rabbi E-Bike Rent Go & Fun",
  phone: "+39 123 456 7890",
  email: "info@ecoride.it",
  pricing: {
    hourly: 15,
    halfDay: 45,
    fullDay: 70,
    guideHourly: 25,
    trailerHourly: 8,
    trailerHalfDay: 20,
    trailerFullDay: 35
  }
};

export const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showAdvancedAnalytics, setShowAdvancedAnalytics] = useState(false);
  const [showGarage, setShowGarage] = useState(false);
  const [showFixedCostsManager, setShowFixedCostsManager] = useState(false);
  const [showDevPanel, setShowDevPanel] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [individualBikes, setIndividualBikes] = useState<Bike[]>([]);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isOnline } = useServerStatus();

  // Navigation helper functions
  const resetAllViews = () => {
    setShowBookingForm(false);
    setShowSettings(false);
    setShowStatistics(false);
    setShowAdvancedAnalytics(false);
    setShowGarage(false);
    setShowFixedCostsManager(false);
    setShowDevPanel(false);
  };
  
  const navigateToView = (viewName: string) => {
    resetAllViews();
    switch (viewName) {
      case 'booking':
        setShowBookingForm(true);
        break;
      case 'settings':
        setShowSettings(true);
        break;
      case 'statistics':
        setShowStatistics(true);
        break;
      case 'analytics':
        setShowAdvancedAnalytics(true);
        break;
      case 'garage':
        setShowGarage(true);
        break;
      case 'costs':
        setShowFixedCostsManager(true);
        break;
      default:
        break;
    }
  };

  // Load data from server on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!isOnline) {
        setLoading(false);
        return;
      }

      try {
        const [settingsData, bookingsData] = await Promise.all([
          apiService.getSettings(),
          apiService.getBookings()
        ]);
        
        setSettings(settingsData);
        setBookings(bookingsData.map((b: Omit<Booking, 'date'> & { date: string }) => ({ ...b, date: new Date(b.date) })));
      } catch (error) {
        console.error('Failed to load data:', error);
        toast({
          title: "Errore di caricamento",
          description: "Impossibile caricare i dati dal server. Usando i dati di default.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isOnline, toast]);

  // Load individual bikes when garage is opened
  useEffect(() => {
    if (showGarage) {
      loadIndividualBikes();
    }
  }, [showGarage]);

  // Load individual bikes at startup for bookings
  useEffect(() => {
    if (isOnline) {
      loadIndividualBikes();
    }
  }, [isOnline]);

  const addBooking = async (booking: Omit<Booking, "id" | "totalPrice">) => {
    const totalPrice = calculatePrice(booking.bikeDetails, booking.category, booking.needsGuide, booking.startTime, booking.endTime);
    
    if (editingBooking) {
      // Update existing booking
      const updatedBooking = {
        ...booking,
        id: editingBooking.id,
        totalPrice,
      };

      if (isOnline) {
        try {
          await apiService.updateBooking(editingBooking.id, updatedBooking);
          toast({
            title: "Prenotazione aggiornata",
            description: "La prenotazione è stata modificata con successo."
          });
        } catch (error) {
          toast({
            title: "Errore",
            description: "Impossibile aggiornare la prenotazione sul server.",
            variant: "destructive"
          });
          return;
        }
      }

      setBookings(bookings.map(b => b.id === editingBooking.id ? updatedBooking : b));
      setEditingBooking(null);
    } else {
      // Add new booking
      const newBooking = {
        ...booking,
        id: Date.now().toString(),
        totalPrice,
      };

      if (isOnline) {
        try {
          await apiService.createBooking(newBooking);
          toast({
            title: "Prenotazione creata",
            description: "La prenotazione è stata salvata con successo."
          });
        } catch (error) {
          toast({
            title: "Errore",
            description: "Impossibile salvare la prenotazione sul server.",
            variant: "destructive"
          });
          return;
        }
      }

      setBookings([...bookings, newBooking]);
    }
    resetAllViews();
  };

  const handleEditBooking = (booking: Booking) => {
    setEditingBooking(booking);
    setShowBookingForm(true);
  };

  const handleSaveSettings = async (newSettings: ShopSettings) => {
    if (isOnline) {
      try {
        await apiService.updateSettings(newSettings);
        toast({
          title: "Impostazioni salvate",
          description: "Le impostazioni sono state aggiornate con successo."
        });
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile salvare le impostazioni sul server.",
          variant: "destructive"
        });
        return;
      }
    }
    setSettings(newSettings);
  };

  const handleDeleteBooking = async (bookingId: string) => {
    if (isOnline) {
      try {
        await apiService.deleteBooking(bookingId);
        toast({
          title: "Prenotazione eliminata",
          description: "La prenotazione è stata rimossa con successo."
        });
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile eliminare la prenotazione dal server.",
          variant: "destructive"
        });
        return;
      }
    }
    setBookings(bookings.filter(b => b.id !== bookingId));
  };

  // Individual bikes management functions
  const loadIndividualBikes = async () => {
    if (!isOnline) return;
    
    try {
      const bikes = await apiService.getIndividualBikes();
      setIndividualBikes(bikes);
    } catch (error) {
      console.error('Failed to load individual bikes:', error);
    }
  };

  const addIndividualBike = async (bike: Omit<Bike, 'id'>) => {
    if (isOnline) {
      try {
        const newBike = await apiService.createIndividualBike(bike);
        setIndividualBikes([...individualBikes, newBike]);
        toast({
          title: "Bicicletta aggiunta",
          description: "La bicicletta è stata aggiunta al database.",
        });
        return newBike;
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile salvare la bicicletta nel database.",
          variant: "destructive"
        });
        throw error;
      }
    } else {
      // Offline mode - add locally with temporary ID
      const newBike = { ...bike, id: `temp-${Date.now()}` };
      setIndividualBikes([...individualBikes, newBike]);
      return newBike;
    }
  };

  const updateIndividualBike = async (id: string, updates: Partial<Bike>) => {
    if (isOnline) {
      try {
        const updatedBike = await apiService.updateIndividualBike(id, updates);
        setIndividualBikes(individualBikes.map(bike => bike.id === id ? updatedBike : bike));
        toast({
          title: "Bicicletta aggiornata",
          description: "Le modifiche sono state salvate nel database.",
        });
        return updatedBike;
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile aggiornare la bicicletta nel database.",
          variant: "destructive"
        });
        throw error;
      }
    } else {
      // Offline mode - update locally
      const updatedBike = { ...individualBikes.find(b => b.id === id)!, ...updates };
      setIndividualBikes(individualBikes.map(bike => bike.id === id ? updatedBike : bike));
      return updatedBike;
    }
  };

  const deleteIndividualBike = async (id: string) => {
    if (isOnline) {
      try {
        await apiService.deleteIndividualBike(id);
        setIndividualBikes(individualBikes.filter(bike => bike.id !== id));
        toast({
          title: "Bicicletta eliminata",
          description: "La bicicletta è stata rimossa dal database.",
        });
      } catch (error) {
        toast({
          title: "Errore",
          description: "Impossibile eliminare la bicicletta dal database.",
          variant: "destructive"
        });
        throw error;
      }
    } else {
      // Offline mode - delete locally
      setIndividualBikes(individualBikes.filter(bike => bike.id !== id));
    }
  };

  const getAvailableBikes = (date: Date, startTime: string, endTime: string, category: BookingCategory): BikeDetails[] => {
    const dayBookings = bookings.filter(
      booking => 
        format(booking.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") &&
        booking.status === "confirmed" &&
        (category === "full-day" || booking.category === "full-day" ||
         ((startTime >= booking.startTime && startTime < booking.endTime) ||
          (endTime > booking.startTime && endTime <= booking.endTime) ||
          (startTime <= booking.startTime && endTime >= booking.endTime)))
    );
    
    // Calculate booked bikes by type from garage bikes
    const bookedByType: Record<string, number> = {};
    dayBookings.forEach(booking => {
      booking.bikeDetails.forEach(bike => {
        const key = `${bike.type}-${bike.size || 'none'}-${bike.suspension || 'none'}-${bike.hasTrailerHook || false}`;
        bookedByType[key] = (bookedByType[key] || 0) + bike.count;
      });
    });
    
    // Group garage bikes by type/size/suspension/hasTrailerHook and count available
    const bikeGroups: Record<string, BikeDetails> = {};
    
    // Use only individual bikes from garage - settings.bikes are just defaults
    // settings.bikes are no longer used for counting, only individualBikes

    // Add individual bikes (mainly for trailers and specific bikes)
    individualBikes.filter(bike => bike.isActive).forEach(bike => {
      const key = `${bike.type}-${bike.size || 'none'}-${bike.suspension || 'none'}-${bike.hasTrailerHook || false}`;
      if (!bikeGroups[key]) {
        bikeGroups[key] = {
          type: bike.type,
          size: bike.size,
          suspension: bike.suspension,
          hasTrailerHook: bike.hasTrailerHook,
          count: 0
        };
      }
      bikeGroups[key].count++;
    });
    
    // Calculate available bikes
    return Object.values(bikeGroups).map(bike => {
      const key = `${bike.type}-${bike.size || 'none'}-${bike.suspension || 'none'}-${bike.hasTrailerHook || false}`;
      const booked = bookedByType[key] || 0;
      return {
        ...bike,
        count: Math.max(0, bike.count - booked)
      };
    }).filter(bike => bike.count > 0);
  };

  const getAvailableIndividualBikes = (date: Date, startTime: string, endTime: string, category: BookingCategory): AvailableBike[] => {
    const dayBookings = bookings.filter(
      booking =>
        format(booking.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") &&
        booking.status === "confirmed" &&
        (category === "full-day" || booking.category === "full-day" ||
         ((startTime >= booking.startTime && startTime < booking.endTime) ||
          (endTime > booking.startTime && endTime <= booking.endTime) ||
          (startTime <= booking.startTime && endTime >= booking.endTime)))
    );

    // Get all booked bike IDs (we'll need to track individual bike bookings in the future)
    // For now, we'll use the old logic but return individual bikes
    const bookedByType: Record<string, number> = {};
    dayBookings.forEach(booking => {
      booking.bikeDetails.forEach(bike => {
        const key = `${bike.type}-${bike.size || 'none'}-${bike.suspension || 'none'}-${bike.hasTrailerHook || false}`;
        bookedByType[key] = (bookedByType[key] || 0) + bike.count;
      });
    });

    // Return individual bikes with availability status
    return individualBikes.filter(bike => bike.isActive).map(bike => {
      const key = `${bike.type}-${bike.size || 'none'}-${bike.suspension || 'none'}-${bike.hasTrailerHook || false}`;
      const bookedCount = bookedByType[key] || 0;

      // Count how many bikes of this type are already selected
      const bikesOfSameType = individualBikes.filter(b =>
        b.isActive &&
        b.type === bike.type &&
        b.size === bike.size &&
        b.suspension === bike.suspension &&
        b.hasTrailerHook === bike.hasTrailerHook
      );

      const bikeIndexInType = bikesOfSameType.findIndex(b => b.id === bike.id);
      const isAvailable = bikeIndexInType >= bookedCount;

      return {
        id: bike.id,
        name: bike.name,
        brand: bike.brand,
        model: bike.model,
        type: bike.type,
        size: bike.size,
        suspension: bike.suspension,
        hasTrailerHook: bike.hasTrailerHook,
        description: bike.description,
        isAvailable,
        minHeight: bike.minHeight,
        maxHeight: bike.maxHeight
      };
    }).filter(bike => bike.isAvailable);
  };

  const calculatePrice = (bikeDetails: BikeDetails[], category: BookingCategory, needsGuide: boolean, startTime: string, endTime: string): number => {
    const totalBikes = bikeDetails.reduce((sum, bike) => sum + bike.count, 0);
    let basePrice = 0;
    
    if (category === "full-day") {
      basePrice = settings.pricing.fullDay * totalBikes;
    } else if (category === "half-day") {
      basePrice = settings.pricing.halfDay * totalBikes;
    } else {
      const startHour = parseInt(startTime.split(':')[0]);
      const endHour = parseInt(endTime.split(':')[0]);
      const hours = endHour - startHour;
      basePrice = settings.pricing.hourly * hours * totalBikes;
    }
    
    const guidePrice = needsGuide ? settings.pricing.guideHourly * (category === "full-day" ? 8 : category === "half-day" ? 4 : parseInt(endTime.split(':')[0]) - parseInt(startTime.split(':')[0])) : 0;
    
    return basePrice + guidePrice;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-professional-blue/10">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60 shadow-lg">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <img 
                src="/logo.webp" 
                alt="Rabbi E-Bike Logo" 
                className="w-16 h-16 object-contain"
              />
              <div>
                <h1 className="text-3xl font-bold text-foreground">{settings.shopName}</h1>
                <p className="text-base text-muted-foreground">Gestionale Prenotazioni E-Bike</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToView('statistics')}
                className="gap-2"
              >
                <BarChart3Icon className="w-4 h-4" />
                Statistiche
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToView('analytics')}
                className="gap-2"
              >
                <TrendingUpIcon className="w-4 h-4" />
                Analytics 360°
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToView('garage')}
                className="gap-2"
              >
                <BikeIcon className="w-4 h-4" />
                Garage
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToView('costs')}
                className="gap-2"
              >
                <EuroIcon className="w-4 h-4" />
                Costi Fissi
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigateToView('settings')}
                className="gap-2"
              >
                <SettingsIcon className="w-4 h-4" />
                Impostazioni
              </Button>
              <Button
                onClick={() => navigateToView('booking')}
                className="gap-2 bg-gradient-to-r from-electric-green to-electric-green-light hover:from-electric-green-dark hover:to-electric-green shadow-[var(--shadow-button)]"
              >
                <PlusIcon className="w-4 h-4" />
                Nuova Prenotazione
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Calendar Sidebar */}
          <div className="lg:col-span-1">
            <Card className="shadow-[var(--shadow-card)]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-electric-green" />
                  Calendario
                </CardTitle>
                <CardDescription>
                  Seleziona una data per visualizzare le prenotazioni
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  className="rounded-md border pointer-events-auto"
                  locale={it}
                  modifiers={{
                    today: new Date(),
                    selected: selectedDate
                  }}
                  modifiersStyles={{
                    today: { 
                      backgroundColor: 'rgb(34 197 94)', // bg-green-500 - verde intenso per oggi
                      color: 'white',
                      fontWeight: 'bold'
                    },
                    selected: selectedDate && format(selectedDate, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd') ? {
                      backgroundColor: 'rgb(34 197 94 / 0.3)', // bg-green-500/30 - verde trasparente per giorno selezionato diverso da oggi
                      color: 'rgb(22 163 74)', // text-green-600
                      fontWeight: '500'
                    } : undefined
                  }}
                />
                
                {/* Quick Stats */}
                <div className="mt-4 space-y-2">
                  {(() => {
                    const availableBikes = getAvailableBikes(selectedDate, "09:00", "19:00", "hourly").filter(bike => bike.type !== "trailer").reduce((sum, bike) => sum + bike.count, 0);
                    const totalBikes = individualBikes.filter(bike => bike.isActive && bike.type !== "trailer").length;
                    const bikePercentage = totalBikes > 0 ? availableBikes / totalBikes : 0;
                    
                    const availableTrailers = getAvailableBikes(selectedDate, "09:00", "19:00", "hourly").filter(bike => bike.type === "trailer").reduce((sum, bike) => sum + bike.count, 0);
                    const totalTrailers = individualBikes.filter(bike => bike.isActive && bike.type === "trailer").length;
                    const trailerPercentage = totalTrailers > 0 ? availableTrailers / totalTrailers : 0;
                    
                    const getBadgeColor = (available: number, percentage: number) => {
                      if (available === 0) return "bg-red-500 text-white";
                      if (percentage >= 0.8) return "bg-green-500 text-white";
                      if (percentage >= 0.5) return "bg-yellow-500 text-white";
                      return "bg-orange-500 text-white";
                    };
                    
                    return (
                      <>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Bici Disponibili Oggi</span>
                          <Badge className={getBadgeColor(availableBikes, bikePercentage)}>
                            {availableBikes}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-muted-foreground">Carrelli Disponibili Oggi</span>
                          <Badge className={getBadgeColor(availableTrailers, trailerPercentage)}>
                            {availableTrailers}
                          </Badge>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* View Mode Selector */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>
                        Prenotazioni - {format(selectedDate, "EEEE, d MMMM yyyy", { locale: it })}
                      </CardTitle>
                      <CardDescription>
                        Orari: {settings.openingTime} - {settings.closingTime}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {(["day", "week", "month"] as const).map((mode) => (
                        <Button
                          key={mode}
                          variant={viewMode === mode ? "default" : "outline"}
                          size="sm"
                          onClick={() => setViewMode(mode)}
                          className={viewMode === mode ? "bg-electric-green hover:bg-electric-green-dark" : ""}
                        >
                          {mode === "day" ? "Giorno" : mode === "week" ? "Settimana" : "Mese"}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <BookingList
                    bookings={bookings}
                    selectedDate={selectedDate}
                    viewMode={viewMode}
                    settings={settings}
                    onUpdateBooking={handleDeleteBooking}
                    onEditBooking={handleEditBooking}
                    onDateSelect={setSelectedDate}
                    onViewModeChange={setViewMode}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {showBookingForm && (
        <BookingForm
          onSubmit={addBooking}
          onClose={() => {
            resetAllViews();
            setEditingBooking(null);
          }}
          selectedDate={selectedDate}
          settings={settings}
          getAvailableBikes={getAvailableBikes}
          getAvailableIndividualBikes={getAvailableIndividualBikes}
          editingBooking={editingBooking}
        />
      )}

      {showSettings && (
        <Suspense fallback={<div className="p-8 text-center">Caricamento impostazioni...</div>}>
          <SettingsPanel
            settings={settings}
            onSave={handleSaveSettings}
            onClose={() => resetAllViews()}
          />
        </Suspense>
      )}

      {showStatistics && (
        <Suspense fallback={<div className="p-8 text-center">Caricamento statistiche...</div>}>
          <Statistics
            bookings={bookings}
            settings={settings}
            onClose={() => resetAllViews()}
          />
        </Suspense>
      )}

      {showAdvancedAnalytics && (
        <Suspense fallback={<div className="p-8 text-center">Caricamento analitiche...</div>}>
          <AdvancedAnalytics
            bookings={bookings}
            settings={settings}
            onClose={() => resetAllViews()}
          />
        </Suspense>
      )}

      {showGarage && (
        <Garage
          bikes={individualBikes}
          onUpdateBikes={setIndividualBikes}
          onClose={() => resetAllViews()}
          onRefreshData={loadIndividualBikes}
        />
      )}

      {showFixedCostsManager && (
        <Suspense fallback={<div className="p-8 text-center">Caricamento gestione costi...</div>}>
          <FixedCostsManager
            onClose={() => resetAllViews()}
          />
        </Suspense>
      )}

      {showDevPanel && (
        <Suspense fallback={<div className="p-8 text-center">Caricamento pannello sviluppatore...</div>}>
          <DevPanel
            onClose={() => resetAllViews()}
            settings={settings}
            onSettingsUpdate={setSettings}
          />
        </Suspense>
      )}
    </div>
  );
};