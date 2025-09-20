import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { 
  PlusIcon, 
  WrenchIcon, 
  EditIcon, 
  TrashIcon, 
  CalendarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  BikeIcon,
  XIcon,
  SaveIcon,
  EuroIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Bike, BikeType, BikeSize, BikeSuspension, MaintenanceRecord } from "@/types/bike";
import { apiService } from "@/services/api";

interface GarageProps {
  bikes: Bike[];
  onUpdateBikes: (bikes: Bike[]) => void;
  onClose: () => void;
  onRefreshData?: () => Promise<void>;
}

const Garage = ({ bikes, onUpdateBikes, onClose, onRefreshData }: GarageProps) => {
  const [selectedBike, setSelectedBike] = useState<Bike | null>(null);
  const [isAddingBike, setIsAddingBike] = useState(false);
  const [isAddingTrailer, setIsAddingTrailer] = useState(false);
  const [isAddingMaintenance, setIsAddingMaintenance] = useState(false);
  const [view, setView] = useState<"list" | "stats">("list");
  const [showCostDetails, setShowCostDetails] = useState(false);
  const [isEditingBike, setIsEditingBike] = useState(false);
  const [editingBikeData, setEditingBikeData] = useState<Bike | null>(null);
  const [dialogKey, setDialogKey] = useState(0);
  const { toast } = useToast();

  // Helper function to refresh data and close garage
  const refreshAndClose = async () => {
    console.log('🔄 [REFRESH] Starting refresh and close...');
    try {
      if (onRefreshData) {
        console.log('🔄 [REFRESH] Calling onRefreshData...');
        await onRefreshData();
        console.log('✅ [REFRESH] Data refreshed successfully');
      }
    } catch (error) {
      console.error('❌ [REFRESH] Failed to refresh data:', error);
    } finally {
      console.log('🏠 [REFRESH] Closing garage...');
      onClose();
    }
  };

  const [newBike, setNewBike] = useState<Partial<Bike> & { quantity?: number }>({
    name: "",
    brand: "",
    model: "",
    type: "adulto",
    size: "M",
    suspension: "front",
    hasTrailerHook: false,
    description: "",
    minHeight: 150,
    maxHeight: 190,
    isActive: true,
    maintenance: [],
    totalMaintenanceCost: 0,
    quantity: 1
  });

  const [newTrailer, setNewTrailer] = useState<Partial<Bike> & { quantity?: number }>({
    name: "",
    brand: "",
    model: "",
    type: "trailer",
    description: "",
    isActive: true,
    maintenance: [],
    totalMaintenanceCost: 0,
    quantity: 1
  });

  const [newMaintenance, setNewMaintenance] = useState<Partial<MaintenanceRecord>>({
    type: "",
    description: "",
    cost: 0,
    mechanic: "",
    notes: ""
  });

  const handleAddBike = async () => {
    if (!newBike.name || !newBike.brand) {
      toast({
        title: "Errore",
        description: "Nome e marca sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    const quantity = newBike.quantity || 1;
    const newBikes: Bike[] = [];

    try {
      for (let i = 0; i < quantity; i++) {
        const bikeData = {
          name: quantity > 1 ? `${newBike.name!} #${i + 1}` : newBike.name!,
          brand: newBike.brand!,
          model: newBike.model || "",
          type: newBike.type!,
          size: newBike.type === "trailer" ? undefined : newBike.size!,
          suspension: newBike.type === "trailer" ? undefined : newBike.suspension!,
          hasTrailerHook: newBike.type === "trailer" ? undefined : newBike.hasTrailerHook,
          description: newBike.description!,
          minHeight: newBike.type === "trailer" ? undefined : newBike.minHeight!,
          maxHeight: newBike.type === "trailer" ? undefined : newBike.maxHeight!,
          purchaseDate: newBike.purchaseDate,
          purchasePrice: newBike.purchasePrice,
          isActive: newBike.isActive!,
          maintenance: [],
          totalMaintenanceCost: 0
        };
        
        const savedBike = await apiService.createIndividualBike(bikeData);
        newBikes.push(savedBike);
      }

      onUpdateBikes([...bikes, ...newBikes]);
      setNewBike({
        name: "",
        brand: "",
        model: "",
        type: "adulto",
        size: "M",
        suspension: "front",
        hasTrailerHook: false,
        description: "",
        minHeight: 150,
        maxHeight: 190,
        isActive: true,
        maintenance: [],
        totalMaintenanceCost: 0,
        quantity: 1
      });
      setIsAddingBike(false);

      toast({
        title: "Successo",
        description: `${quantity > 1 ? `${quantity} biciclette aggiunte` : "Bicicletta aggiunta"} al database`
      });

    } catch (error) {
      console.error('Failed to add bike:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare la bicicletta nel database",
        variant: "destructive"
      });
    }
  };

  const handleAddTrailer = async () => {
    if (!newTrailer.name || !newTrailer.brand) {
      toast({
        title: "Errore",
        description: "Nome e marca sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    const quantity = newTrailer.quantity || 1;
    const newTrailers: Bike[] = [];

    try {
      for (let i = 0; i < quantity; i++) {
        const trailerData = {
          name: quantity > 1 ? `${newTrailer.name!} #${i + 1}` : newTrailer.name!,
          brand: newTrailer.brand!,
          model: newTrailer.model || "",
          type: "trailer" as BikeType,
          description: newTrailer.description!,
          purchaseDate: newTrailer.purchaseDate,
          purchasePrice: newTrailer.purchasePrice,
          isActive: newTrailer.isActive!,
          maintenance: [],
          totalMaintenanceCost: 0
        };
        
        const savedTrailer = await apiService.createIndividualBike(trailerData);
        newTrailers.push(savedTrailer);
      }

      onUpdateBikes([...bikes, ...newTrailers]);
      setNewTrailer({
        name: "",
        brand: "",
        model: "",
        type: "trailer",
        description: "",
        isActive: true,
        maintenance: [],
        totalMaintenanceCost: 0,
        quantity: 1
      });
      setIsAddingTrailer(false);

      toast({
        title: "Successo",
        description: `${quantity > 1 ? `${quantity} carrelli aggiunti` : "Carrello aggiunto"} al database`
      });

    } catch (error) {
      console.error('Failed to add trailer:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare il carrello nel database",
        variant: "destructive"
      });
    }
  };

  const handleUpdateBike = async (updatedBike: Bike, updateLocalState = true) => {
    console.log('🔄 [UPDATE_BIKE] Starting handleUpdateBike for bike:', updatedBike.id, 'updateLocalState:', updateLocalState);
    try {
      console.log('📡 [UPDATE_BIKE] Calling API updateIndividualBike...');
      const savedBike = await apiService.updateIndividualBike(updatedBike.id, updatedBike);
      console.log('✅ [UPDATE_BIKE] API call successful, saved bike ID:', savedBike.id);

      // Only update local state if requested (avoids conflicts with save/maintenance flows)
      if (updateLocalState) {
        console.log('🔄 [UPDATE_BIKE] Updating bikes array...');
        // Ensure savedBike has maintenance array initialized
        const bikeWithMaintenance = {
          ...savedBike,
          maintenance: savedBike.maintenance || []
        };
        const updatedBikes = bikes.map(bike =>
          bike.id === updatedBike.id ? bikeWithMaintenance : bike
        );
        console.log('✅ [UPDATE_BIKE] Bikes array updated with maintenance check');

        console.log('🚲 [UPDATE_BIKE] Calling onUpdateBikes...');
        onUpdateBikes(updatedBikes);
        console.log('✅ [UPDATE_BIKE] onUpdateBikes completed');
      } else {
        console.log('🎯 [UPDATE_BIKE] Skipping local state update - caller will handle it');
      }

      console.log('✅ [UPDATE_BIKE] handleUpdateBike completed successfully');
      return savedBike; // Return the saved bike for caller to use
    } catch (error) {
      console.error('❌ [UPDATE_BIKE] ERROR in handleUpdateBike:', error);
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la bicicletta nel database",
        variant: "destructive"
      });
      throw error; // Re-throw to be caught by caller
    }
  };

  const handleDeleteBike = async (bikeId: string) => {
    try {
      await apiService.deleteIndividualBike(bikeId);

      // Update bikes list locally and remove from state
      onUpdateBikes(bikes.filter(bike => bike.id !== bikeId));
      setSelectedBike(null);

      toast({
        title: "Successo",
        description: "Bicicletta eliminata"
      });
    } catch (error) {
      console.error('Failed to delete bike:', error);
      toast({
        title: "Errore",
        description: "Impossibile eliminare la bicicletta dal database",
        variant: "destructive"
      });
    }
  };

  const handleStartEditing = (bike: Bike) => {
    console.log('🔧 Starting edit mode for bike:', bike.name);
    setEditingBikeData({ ...bike });
    setIsEditingBike(true);
    console.log('🔧 Edit mode activated');
  };

  const handleCancelEditing = () => {
    console.log('❌ Cancelling edit mode');
    setIsEditingBike(false);
    setEditingBikeData(null);
    console.log('❌ Edit mode cancelled');
  };

  const handleSaveEditing = async () => {
    console.log('💾 [SAVE] Starting save process');
    if (!editingBikeData || !selectedBike) {
      console.log('❌ [SAVE] No editingBikeData or selectedBike found');
      return;
    }

    console.log('💾 [SAVE] Original bike data:', selectedBike);
    console.log('💾 [SAVE] Edited data:', editingBikeData);

    // Merge original bike data with only the modified fields
    const mergedBikeData = {
      ...selectedBike, // Keep all original data
      ...editingBikeData, // Override with edited fields
      // Ensure critical fields are preserved
      id: selectedBike.id,
      maintenance: selectedBike.maintenance || [],
      totalMaintenanceCost: selectedBike.totalMaintenanceCost || 0,
      lastMaintenanceDate: selectedBike.lastMaintenanceDate
    };

    console.log('💾 [SAVE] Merged data to save:', mergedBikeData);

    try {
      console.log('💾 [SAVE] Calling handleUpdateBike...');
      const savedBike = await handleUpdateBike(mergedBikeData, false); // Don't update state in handleUpdateBike
      console.log('✅ [SAVE] handleUpdateBike completed successfully');

      // Update local state with saved bike from server to ensure UI sync
      console.log('🔄 [SAVE] Updating local bikes state with server data...');
      const bikeWithMaintenance = {
        ...savedBike,
        maintenance: savedBike.maintenance || []
      };
      const updatedBikes = bikes.map(bike =>
        bike.id === selectedBike.id ? bikeWithMaintenance : bike
      );
      onUpdateBikes(updatedBikes);
      console.log('✅ [SAVE] Local bikes state updated with server data');

      // Show success message and return to dashboard
      toast({
        title: "Successo",
        description: "Veicolo aggiornato con successo. Torno alla dashboard..."
      });

      console.log('✅ [SAVE] Success toast shown, returning to dashboard...');

      // Return to dashboard after a short delay to ensure the toast is visible
      setTimeout(() => {
        refreshAndClose();
      }, 1500);
    } catch (error) {
      console.error('❌ [SAVE] Failed to save bike edits:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare le modifiche",
        variant: "destructive"
      });
    }
  };

  const handleAddMaintenance = async () => {
    console.log('🚀 [MAINTENANCE] Starting handleAddMaintenance');
    console.log('🚀 [MAINTENANCE] Current state:', {
      selectedBike: selectedBike ? { id: selectedBike.id, name: selectedBike.name } : null,
      maintenance: newMaintenance,
      isAddingMaintenance,
      showCostDetails
    });

    if (!selectedBike || !newMaintenance.type || !newMaintenance.description) {
      console.log('❌ [MAINTENANCE] Validation failed:', {
        hasSelectedBike: !!selectedBike,
        hasType: !!newMaintenance.type,
        hasDescription: !!newMaintenance.description
      });
      toast({
        title: "Errore",
        description: "Tipo e descrizione sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log('📝 [MAINTENANCE] Creating maintenance record...');
      const maintenance: MaintenanceRecord = {
        id: Date.now().toString(),
        date: new Date(),
        type: newMaintenance.type!,
        description: newMaintenance.description!,
        cost: newMaintenance.cost || 0,
        mechanic: newMaintenance.mechanic || "",
        notes: newMaintenance.notes || ""
      };
      console.log('📝 [MAINTENANCE] Maintenance record created:', maintenance);

      console.log('🚲 [MAINTENANCE] Creating updated bike...');
      const updatedBike: Bike = {
        ...selectedBike,
        maintenance: [...(selectedBike.maintenance || []), maintenance],
        totalMaintenanceCost: (selectedBike.totalMaintenanceCost || 0) + maintenance.cost,
        lastMaintenanceDate: new Date()
      };
      console.log('🚲 [MAINTENANCE] Updated bike created, maintenance count:', updatedBike.maintenance.length);

      console.log('🔄 [MAINTENANCE] Calling handleUpdateBike...');
      const savedBike = await handleUpdateBike(updatedBike, false); // Don't update state in handleUpdateBike
      console.log('✅ [MAINTENANCE] handleUpdateBike completed');

      // Update local state with saved bike from server to ensure UI sync
      console.log('🔄 [MAINTENANCE] Updating local bikes state with server data...');
      const bikeWithMaintenance = {
        ...savedBike,
        maintenance: savedBike.maintenance || []
      };
      const updatedBikes = bikes.map(bike =>
        bike.id === selectedBike.id ? bikeWithMaintenance : bike
      );
      onUpdateBikes(updatedBikes);
      console.log('✅ [MAINTENANCE] Local bikes state updated with server data');

      console.log('🧹 [MAINTENANCE] Resetting form state...');
      setNewMaintenance({
        type: "",
        description: "",
        cost: 0,
        mechanic: "",
        notes: ""
      });
      console.log('✅ [MAINTENANCE] Form reset completed');

      console.log('❌ [MAINTENANCE] Closing dialog...');
      setIsAddingMaintenance(false);
      console.log('✅ [MAINTENANCE] Dialog closed');

      console.log('🎉 [MAINTENANCE] Showing success toast...');
      toast({
        title: "Successo",
        description: "Manutenzione registrata. Torno alla dashboard..."
      });

      // Return to dashboard after maintenance addition with updated state
      setTimeout(() => {
        refreshAndClose();
      }, 1500);

      console.log('✅ [MAINTENANCE] SUCCESS - All operations completed, returning to dashboard');
      
    } catch (error) {
      console.error('❌ [MAINTENANCE] ERROR in handleAddMaintenance:', error);
      toast({
        title: "Errore",
        description: "Impossibile salvare la manutenzione",
        variant: "destructive"
      });
    }
  };

  const calculateProfitability = (bike: Bike) => {
    const totalCost = (bike.purchasePrice || 0) + bike.totalMaintenanceCost;
    // Simple profitability estimate - you could integrate with actual booking revenue
    const estimatedDailyRevenue = 50; // €50 per day average
    const daysSincePurchase = bike.purchaseDate 
      ? Math.floor((Date.now() - bike.purchaseDate.getTime()) / (1000 * 60 * 60 * 24))
      : 365;
    const estimatedRevenue = daysSincePurchase * estimatedDailyRevenue * 0.3; // 30% utilization
    
    return estimatedRevenue - totalCost;
  };

  const getProfitabilityColor = (profitability: number) => {
    if (profitability > 1000) return "text-green-600";
    if (profitability > 0) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-7xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-electric-green to-electric-green-light rounded-lg">
              <BikeIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Garage</h2>
              <p className="text-muted-foreground">Gestione completa del parco bici</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={view === "list" ? "default" : "outline"}
              onClick={() => setView("list")}
              size="sm"
            >
              Elenco
            </Button>
            <Button 
              variant={view === "stats" ? "default" : "outline"}
              onClick={() => setView("stats")}
              size="sm"
            >
              Statistiche
            </Button>
            <Button variant="outline" onClick={onClose}>
              <XIcon className="w-4 h-4 mr-2" />
              Chiudi
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          {view === "list" ? (
            <div className="space-y-6">
              {/* Sezione Biciclette */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Biciclette ({bikes.filter(bike => bike.type !== "trailer").length})</h3>
                  <Button onClick={() => setIsAddingBike(true)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Aggiungi Bici
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bikes.filter(bike => bike.type !== "trailer").map((bike) => {
                    const profitability = calculateProfitability(bike);
                    return (
                      <Card key={bike.id} className="cursor-pointer hover:shadow-md transition-shadow">
                        <CardHeader className="pb-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{bike.name}</CardTitle>
                              <CardDescription>{bike.brand} {bike.model}</CardDescription>
                            </div>
                            <Badge variant={bike.isActive ? "default" : "secondary"}>
                              {bike.isActive ? "Attiva" : "Non attiva"}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Tipo:</span>
                            <span className="capitalize">{bike.type}</span>
                          </div>
                          {bike.size && (
                            <div className="flex justify-between text-sm">
                              <span>Taglia:</span>
                              <span>{bike.size}</span>
                            </div>
                          )}
                          {bike.minHeight && bike.maxHeight && (
                            <div className="flex justify-between text-sm">
                              <span>Altezza:</span>
                              <span>{bike.minHeight}-{bike.maxHeight}cm</span>
                            </div>
                          )}
                          {bike.hasTrailerHook !== undefined && (
                            <div className="flex justify-between text-sm">
                              <span>Gancio carrello:</span>
                              <Badge variant={bike.hasTrailerHook ? "default" : "secondary"}>
                                {bike.hasTrailerHook ? "Sì" : "No"}
                              </Badge>
                            </div>
                          )}
                          <div className="flex justify-between text-sm">
                            <span>Manutenzioni:</span>
                            <span>{bike.maintenance?.length || 0}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Costo manutenzioni:</span>
                            <span>€{bike.totalMaintenanceCost}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span>Profittabilità stimata:</span>
                            <span className={getProfitabilityColor(profitability)}>
                              €{profitability.toFixed(0)}
                            </span>
                          </div>
                          <Separator />
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => setSelectedBike(bike)}
                              className="flex-1"
                            >
                              <EditIcon className="w-3 h-3 mr-1" />
                              Dettagli
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => {
                                setSelectedBike(bike);
                                setIsAddingMaintenance(true);
                              }}
                            >
                              <WrenchIcon className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </div>

              {/* Sezione Carrelli */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Carrelli ({bikes.filter(bike => bike.type === "trailer").length})</h3>
                  <Button onClick={() => setIsAddingTrailer(true)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Aggiungi Carrello
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {bikes.filter(bike => bike.type === "trailer").map((bike) => {
                  const profitability = calculateProfitability(bike);
                  return (
                    <Card key={bike.id} className="cursor-pointer hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{bike.name}</CardTitle>
                            <CardDescription>{bike.brand} {bike.model}</CardDescription>
                          </div>
                          <Badge variant={bike.isActive ? "default" : "secondary"}>
                            {bike.isActive ? "Attiva" : "Non attiva"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Tipo:</span>
                          <span className="capitalize">{bike.type}</span>
                        </div>
                        {bike.size && (
                          <div className="flex justify-between text-sm">
                            <span>Taglia:</span>
                            <span>{bike.size}</span>
                          </div>
                        )}
                        {bike.minHeight && bike.maxHeight && (
                          <div className="flex justify-between text-sm">
                            <span>Altezza:</span>
                            <span>{bike.minHeight}-{bike.maxHeight}cm</span>
                          </div>
                        )}
                        <div className="flex justify-between text-sm">
                          <span>Manutenzioni:</span>
                          <span>{bike.maintenance?.length || 0}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Costo manutenzioni:</span>
                          <span>€{bike.totalMaintenanceCost}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Profittabilità stimata:</span>
                          <span className={getProfitabilityColor(profitability)}>
                            €{profitability.toFixed(0)}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedBike(bike)}
                            className="flex-1"
                          >
                            <EditIcon className="w-3 h-3 mr-1" />
                            Dettagli
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              setSelectedBike(bike);
                              setIsAddingMaintenance(true);
                            }}
                          >
                            <WrenchIcon className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold">Statistiche Garage</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Totale Bici</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bikes.filter(bike => bike.type !== "trailer").length}</div>
                    <p className="text-xs text-muted-foreground">
                      {bikes.filter(b => b.isActive && b.type !== "trailer").length} attive
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Totale Carrelli</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{bikes.filter(bike => bike.type === "trailer").length}</div>
                    <p className="text-xs text-muted-foreground">
                      {bikes.filter(b => b.isActive && b.type === "trailer").length} attivi
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Costo Totale Manutenzioni</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      €{bikes.reduce((sum, bike) => sum + bike.totalMaintenanceCost, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Media per bici: €{bikes.length > 0 ? Math.round(bikes.reduce((sum, bike) => sum + bike.totalMaintenanceCost, 0) / bikes.length) : 0}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Manutenzioni Totali</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {bikes.reduce((sum, bike) => sum + (bike.maintenance?.length || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ultimo mese: {bikes.reduce((sum, bike) => {
                        const lastMonth = new Date();
                        lastMonth.setMonth(lastMonth.getMonth() - 1);
                        return sum + (bike.maintenance?.filter(m => new Date(m.date) > lastMonth).length || 0);
                      }, 0)}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Profittabilità Media</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      €{bikes.length > 0 ? Math.round(bikes.reduce((sum, bike) => sum + calculateProfitability(bike), 0) / bikes.length) : 0}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Per bicicletta
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Dettaglio Biciclette</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                         <TableHead>Nome</TableHead>
                         <TableHead>Marca</TableHead>
                         <TableHead>Tipo</TableHead>
                         <TableHead>Manutenzioni</TableHead>
                         <TableHead>Costo Manutenzioni</TableHead>
                         <TableHead>Profittabilità</TableHead>
                         <TableHead>Stato</TableHead>
                         <TableHead>Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                       {bikes.map((bike) => {
                         const profitability = calculateProfitability(bike);
                        return (
                          <TableRow key={bike.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                            setSelectedBike(bike);
                            setShowCostDetails(true);
                          }}>
                            <TableCell className="font-medium">{bike.name}</TableCell>
                            <TableCell>{bike.brand}</TableCell>
                            <TableCell className="capitalize">{bike.type} {bike.size || ""}</TableCell>
                            <TableCell>{bike.maintenance?.length || 0}</TableCell>
                            <TableCell>€{bike.totalMaintenanceCost}</TableCell>
                            <TableCell className={getProfitabilityColor(profitability)}>
                              €{profitability.toFixed(0)}
                            </TableCell>
                            <TableCell>
                              <Badge variant={bike.isActive ? "default" : "secondary"}>
                                {bike.isActive ? "Attiva" : "Non attiva"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button size="sm" variant="outline" onClick={(e) => {
                                e.stopPropagation();
                                setSelectedBike(bike);
                              }}>
                                Dettagli
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                       })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Add Bike Dialog */}
      <Dialog open={isAddingBike} onOpenChange={setIsAddingBike}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {newBike.type === "trailer" ? "Aggiungi Nuovo Carrello" : "Aggiungi Nuova Bicicletta"}
            </DialogTitle>
            <DialogDescription>
              {newBike.type === "trailer" 
                ? "Inserisci i dettagli del nuovo carrello"
                : "Inserisci i dettagli della nuova bicicletta"
              }
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
              
              {newBike.type !== "trailer" && (
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
              )}
              
              {newBike.type !== "trailer" && (
                <div className="space-y-2">
                  <Label>Sospensioni</Label>
                  <Select value={newBike.suspension} onValueChange={(value: BikeSuspension) => setNewBike({ ...newBike, suspension: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="front">Front</SelectItem>
                      <SelectItem value="full-suspension">Full Suspension</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="bikeDescription">Descrizione</Label>
              <Textarea
                id="bikeDescription"
                value={newBike.description}
                onChange={(e) => setNewBike({ ...newBike, description: e.target.value })}
                placeholder="Descrizione dettagliata della bicicletta..."
                rows={3}
              />
            </div>

            {newBike.type !== "trailer" && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minHeight">Altezza Minima (cm)</Label>
                  <Input
                    id="minHeight"
                    type="number"
                    value={newBike.minHeight}
                    onChange={(e) => setNewBike({ ...newBike, minHeight: parseInt(e.target.value) || 150 })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxHeight">Altezza Massima (cm)</Label>
                  <Input
                    id="maxHeight"
                    type="number"
                    value={newBike.maxHeight}
                    onChange={(e) => setNewBike({ ...newBike, maxHeight: parseInt(e.target.value) || 190 })}
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchaseDate">Data Acquisto</Label>
                <Input
                  id="purchaseDate"
                  type="date"
                  onChange={(e) => setNewBike({ ...newBike, purchaseDate: e.target.value ? new Date(e.target.value) : undefined })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Prezzo Acquisto (€)</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  step="0.01"
                  value={newBike.purchasePrice || ""}
                  onChange={(e) => setNewBike({ ...newBike, purchasePrice: parseFloat(e.target.value) || undefined })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="bikeQuantity">Quantità</Label>
                <Input
                  id="bikeQuantity"
                  type="number"
                  min="1"
                  max="50"
                  value={newBike.quantity || 1}
                  onChange={(e) => setNewBike({ ...newBike, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
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

            {newBike.type !== "trailer" && (
              <div className="flex items-center space-x-2">
                <Switch
                  id="trailerHook"
                  checked={newBike.hasTrailerHook || false}
                  onCheckedChange={(checked) => setNewBike({ ...newBike, hasTrailerHook: checked })}
                />
                <Label htmlFor="trailerHook">Gancio per carrello</Label>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddingBike(false)}>
                Annulla
              </Button>
              <Button onClick={handleAddBike}>
                <SaveIcon className="w-4 h-4 mr-2" />
                {newBike.type === "trailer" ? "Salva Carrello" : "Salva Bicicletta"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bike Details Dialog */}
      {(() => {
        const shouldShowDetailsDialog = !!selectedBike && !isAddingMaintenance && !showCostDetails;
        console.log('🔍 [DIALOG_DETAILS] Render state:', {
          selectedBike: selectedBike ? selectedBike.id : null,
          isAddingMaintenance,
          showCostDetails,
          shouldShow: shouldShowDetailsDialog
        });
        return selectedBike ? (
          <Dialog key={`dialog-${dialogKey}`} open={shouldShowDetailsDialog} onOpenChange={() => {
            setSelectedBike(null);
            handleCancelEditing();
          }}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedBike.name}</DialogTitle>
              <DialogDescription>
                {selectedBike.brand} {selectedBike.model}
              </DialogDescription>
            </DialogHeader>
            
            <Tabs defaultValue="details" className="space-y-4">
              <TabsList>
                <TabsTrigger value="details">Dettagli</TabsTrigger>
                <TabsTrigger value="maintenance">Manutenzioni ({(selectedBike.maintenance || []).length})</TabsTrigger>
                <TabsTrigger value="stats">Statistiche</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Nome</Label>
                      <Input
                        key={`name-${isEditingBike ? 'edit' : 'view'}`}
                        value={isEditingBike ? (editingBikeData?.name || '') : selectedBike.name}
                        readOnly={!isEditingBike}
                        onChange={(e) => isEditingBike && editingBikeData && setEditingBikeData({
                          ...editingBikeData,
                          name: e.target.value
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Marca</Label>
                      <Input
                        key={`brand-${isEditingBike ? 'edit' : 'view'}`}
                        value={isEditingBike ? (editingBikeData?.brand || '') : selectedBike.brand}
                        readOnly={!isEditingBike}
                        onChange={(e) => isEditingBike && editingBikeData && setEditingBikeData({
                          ...editingBikeData,
                          brand: e.target.value
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Modello</Label>
                    <Input
                      key={`model-${isEditingBike ? 'edit' : 'view'}`}
                      value={isEditingBike ? (editingBikeData?.model || '') : selectedBike.model}
                      readOnly={!isEditingBike}
                      onChange={(e) => isEditingBike && editingBikeData && setEditingBikeData({
                        ...editingBikeData,
                        model: e.target.value
                      })}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo</Label>
                      <Select
                        key={`type-${isEditingBike ? 'edit' : 'view'}`}
                        disabled={!isEditingBike}
                        value={isEditingBike ? (editingBikeData?.type || '') : selectedBike.type}
                        onValueChange={(value: BikeType) => isEditingBike && editingBikeData && setEditingBikeData({
                          ...editingBikeData,
                          type: value
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue className="capitalize" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="adulto">Adulto</SelectItem>
                          <SelectItem value="bambino">Bambino</SelectItem>
                          <SelectItem value="trailer">Carrello</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    {(isEditingBike ? editingBikeData?.type : selectedBike.type) !== 'trailer' && (
                      <>
                        <div className="space-y-2">
                          <Label>Taglia</Label>
                          <Select
                            key={`size-${isEditingBike ? 'edit' : 'view'}`}
                            disabled={!isEditingBike}
                            value={isEditingBike ? (editingBikeData?.size || '') : (selectedBike.size || "")}
                            onValueChange={(value: BikeSize) => isEditingBike && editingBikeData && setEditingBikeData({
                              ...editingBikeData,
                              size: value
                            })}
                          >
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
                          <Label>Sospensioni</Label>
                          <Select
                            key={`suspension-${isEditingBike ? 'edit' : 'view'}`}
                            disabled={!isEditingBike}
                            value={isEditingBike ? (editingBikeData?.suspension || '') : (selectedBike.suspension || "")}
                            onValueChange={(value: BikeSuspension) => isEditingBike && editingBikeData && setEditingBikeData({
                              ...editingBikeData,
                              suspension: value
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue className="capitalize" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="front">Front</SelectItem>
                              <SelectItem value="full-suspension">Full Suspension</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Descrizione</Label>
                    <Textarea
                      key={`description-${isEditingBike ? 'edit' : 'view'}`}
                      value={isEditingBike ? (editingBikeData?.description || '') : selectedBike.description}
                      readOnly={!isEditingBike}
                      onChange={(e) => isEditingBike && editingBikeData && setEditingBikeData({
                        ...editingBikeData,
                        description: e.target.value
                      })}
                      rows={3}
                    />
                  </div>

                  {(isEditingBike ? editingBikeData?.type : selectedBike.type) !== 'trailer' && (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Altezza Minima (cm)</Label>
                        <Input
                          key={`minHeight-${isEditingBike ? 'edit' : 'view'}`}
                          value={isEditingBike ? (editingBikeData?.minHeight?.toString() || '') : (selectedBike.minHeight?.toString() || "")}
                          readOnly={!isEditingBike}
                          type="number"
                          onChange={(e) => isEditingBike && editingBikeData && setEditingBikeData({
                            ...editingBikeData,
                            minHeight: parseInt(e.target.value) || undefined
                          })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Altezza Massima (cm)</Label>
                        <Input
                          key={`maxHeight-${isEditingBike ? 'edit' : 'view'}`}
                          value={isEditingBike ? (editingBikeData?.maxHeight?.toString() || '') : (selectedBike.maxHeight?.toString() || "")}
                          readOnly={!isEditingBike}
                          type="number"
                          onChange={(e) => isEditingBike && editingBikeData && setEditingBikeData({
                            ...editingBikeData,
                            maxHeight: parseInt(e.target.value) || undefined
                          })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Data Acquisto</Label>
                      <Input
                        key={`purchaseDate-${isEditingBike ? 'edit' : 'view'}`}
                        value={
                          isEditingBike
                            ? (editingBikeData?.purchaseDate ? new Date(editingBikeData.purchaseDate).toISOString().split('T')[0] : "")
                            : (selectedBike.purchaseDate ? new Date(selectedBike.purchaseDate).toLocaleDateString() : "N/A")
                        }
                        readOnly={!isEditingBike}
                        type={isEditingBike ? "date" : "text"}
                        onChange={(e) => isEditingBike && editingBikeData && setEditingBikeData({
                          ...editingBikeData,
                          purchaseDate: e.target.value ? new Date(e.target.value) : undefined
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Prezzo Acquisto (€)</Label>
                      <Input
                        key={`purchasePrice-${isEditingBike ? 'edit' : 'view'}`}
                        value={
                          isEditingBike
                            ? (editingBikeData?.purchasePrice?.toString() || "")
                            : (selectedBike.purchasePrice?.toString() || "N/A")
                        }
                        readOnly={!isEditingBike}
                        type="number"
                        step="0.01"
                        onChange={(e) => isEditingBike && editingBikeData && setEditingBikeData({
                          ...editingBikeData,
                          purchasePrice: parseFloat(e.target.value) || undefined
                        })}
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Switch
                        key={`isActive-${isEditingBike ? 'edit' : 'view'}`}
                        checked={isEditingBike ? (editingBikeData?.isActive || false) : selectedBike.isActive}
                        disabled={!isEditingBike}
                        onCheckedChange={(checked) => isEditingBike && editingBikeData && setEditingBikeData({
                          ...editingBikeData,
                          isActive: checked
                        })}
                      />
                      <Label>{(isEditingBike ? editingBikeData?.type : selectedBike.type) === 'trailer' ? 'Carrello attivo' : 'Bicicletta attiva'}</Label>
                    </div>

                    {(isEditingBike ? editingBikeData?.type : selectedBike.type) !== 'trailer' && (
                      <div className="flex items-center space-x-2">
                        <Switch
                          key={`hasTrailerHook-${isEditingBike ? 'edit' : 'view'}`}
                          checked={isEditingBike ? (editingBikeData?.hasTrailerHook || false) : (selectedBike.hasTrailerHook || false)}
                          disabled={!isEditingBike}
                          onCheckedChange={(checked) => isEditingBike && editingBikeData && setEditingBikeData({
                            ...editingBikeData,
                            hasTrailerHook: checked
                          })}
                        />
                        <Label>Gancio per carrello</Label>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="maintenance" className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">Storico Manutenzioni</h3>
                  <Button onClick={() => setIsAddingMaintenance(true)}>
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Aggiungi Manutenzione
                  </Button>
                </div>

                <div className="space-y-2">
                  {(selectedBike.maintenance || []).map((maintenance) => (
                    <Card key={maintenance.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{maintenance.type}</Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(maintenance.date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="font-medium">{maintenance.description}</p>
                            {maintenance.mechanic && (
                              <p className="text-sm text-muted-foreground">
                                Meccanico: {maintenance.mechanic}
                              </p>
                            )}
                            {maintenance.notes && (
                              <p className="text-sm">{maintenance.notes}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className="font-bold">€{maintenance.cost}</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="stats" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Costo Totale</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      €{(selectedBike.purchasePrice || 0) + selectedBike.totalMaintenanceCost}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Acquisto: €{selectedBike.purchasePrice || 0}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Manutenzioni: €{selectedBike.totalMaintenanceCost}
                    </p>
                    <div className="mt-2 space-y-1">
                      <h4 className="text-xs font-medium">Dettaglio Costi Manutenzione:</h4>
                      <div className="max-h-20 overflow-y-auto text-xs space-y-1">
                        {(selectedBike.maintenance || []).map((m) => (
                          <div key={m.id} className="flex justify-between">
                            <span>{m.type}</span>
                            <span>€{m.cost}</span>
                          </div>
                        ))}
                        {(selectedBike.maintenance || []).length === 0 && (
                          <span className="text-muted-foreground">Nessuna manutenzione registrata</span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Profittabilità Stimata</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className={`text-2xl font-bold ${getProfitabilityColor(calculateProfitability(selectedBike))}`}>
                        €{calculateProfitability(selectedBike).toFixed(0)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Basata su utilizzo stimato
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              {!isEditingBike ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleStartEditing(selectedBike)}
                  >
                    <EditIcon className="w-4 h-4 mr-2" />
                    Modifica
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => {
                      handleDeleteBike(selectedBike.id);
                    }}
                  >
                    <TrashIcon className="w-4 h-4 mr-2" />
                    Elimina
                  </Button>
                  <Button variant="outline" onClick={() => setSelectedBike(null)}>
                    Chiudi
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={handleCancelEditing}
                  >
                    Annulla
                  </Button>
                  <Button
                    onClick={handleSaveEditing}
                  >
                    <SaveIcon className="w-4 h-4 mr-2" />
                    Salva
                  </Button>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
        ) : null;
      })()}

      {/* Add Maintenance Dialog */}
      <Dialog open={isAddingMaintenance && !!selectedBike} onOpenChange={(open) => {
        console.log('🔄 [DIALOG_MAINTENANCE] onOpenChange called with:', open);
        setIsAddingMaintenance(open);
        if (!open) {
          console.log('🧹 [DIALOG_MAINTENANCE] Resetting form on close');
          // Reset form when dialog closes
          setNewMaintenance({
            type: "",
            description: "",
            cost: 0,
            mechanic: "",
            notes: ""
          });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Aggiungi Manutenzione</DialogTitle>
            <DialogDescription>
              Registra una nuova manutenzione per {selectedBike?.name || 'bicicletta selezionata'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="maintenanceType">Tipo Manutenzione *</Label>
              <Input
                id="maintenanceType"
                value={newMaintenance.type || ""}
                onChange={(e) => setNewMaintenance({ ...newMaintenance, type: e.target.value })}
                placeholder="Es. Tagliando, Riparazione freni, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceDescription">Descrizione *</Label>
              <Textarea
                id="maintenanceDescription"
                value={newMaintenance.description || ""}
                onChange={(e) => setNewMaintenance({ ...newMaintenance, description: e.target.value })}
                placeholder="Descrivi i lavori effettuati..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="maintenanceCost">Costo (€)</Label>
                <Input
                  id="maintenanceCost"
                  type="number"
                  step="0.01"
                  value={newMaintenance.cost || 0}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, cost: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="mechanic">Meccanico</Label>
                <Input
                  id="mechanic"
                  value={newMaintenance.mechanic || ""}
                  onChange={(e) => setNewMaintenance({ ...newMaintenance, mechanic: e.target.value })}
                  placeholder="Nome del meccanico"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="maintenanceNotes">Note</Label>
              <Textarea
                id="maintenanceNotes"
                value={newMaintenance.notes || ""}
                onChange={(e) => setNewMaintenance({ ...newMaintenance, notes: e.target.value })}
                placeholder="Note aggiuntive..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddingMaintenance(false)}>
                Annulla
              </Button>
              <Button onClick={handleAddMaintenance}>
                <SaveIcon className="w-4 h-4 mr-2" />
                Salva Manutenzione
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Cost Details Dialog */}
      <Dialog open={showCostDetails && !!selectedBike} onOpenChange={setShowCostDetails}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Dettaglio Costi - {selectedBike?.name}</DialogTitle>
            <DialogDescription>
              Breakdown completo di tutti i costi sostenuti
            </DialogDescription>
          </DialogHeader>
          
          {selectedBike && (
            <div className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Costo Iniziale</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold">
                    €{selectedBike.purchasePrice || 0}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Prezzo d'acquisto
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Costi Manutenzione</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-lg font-bold mb-3">
                    €{selectedBike.totalMaintenanceCost}
                  </div>
                  
                  {(selectedBike.maintenance || []).length > 0 ? (
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {(selectedBike.maintenance || []).map((maintenance) => (
                        <div key={maintenance.id} className="flex justify-between items-center p-2 bg-muted/50 rounded text-xs">
                          <div>
                            <div className="font-medium">{maintenance.type}</div>
                            <div className="text-muted-foreground">
                              {new Date(maintenance.date).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="font-bold">€{maintenance.cost}</div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      Nessuna manutenzione registrata
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Totale Investimento</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-primary">
                    €{(selectedBike.purchasePrice || 0) + selectedBike.totalMaintenanceCost}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Costo complessivo sostenuto
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Profittabilità Stimata</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className={`text-xl font-bold ${getProfitabilityColor(calculateProfitability(selectedBike))}`}>
                    €{calculateProfitability(selectedBike).toFixed(0)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Guadagno stimato basato su utilizzo
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button variant="outline" onClick={() => setShowCostDetails(false)}>
              Chiudi
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Trailer Dialog */}
      <Dialog open={isAddingTrailer} onOpenChange={setIsAddingTrailer}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Aggiungi Nuovo Carrello</DialogTitle>
            <DialogDescription>
              Inserisci i dettagli del nuovo carrello
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
                  placeholder="Es. Carrello Porta Bambini"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trailerBrand">Marca *</Label>
                <Input
                  id="trailerBrand"
                  value={newTrailer.brand}
                  onChange={(e) => setNewTrailer({ ...newTrailer, brand: e.target.value })}
                  placeholder="Es. Thule, Burley, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="trailerModel">Modello</Label>
              <Input
                id="trailerModel"
                value={newTrailer.model}
                onChange={(e) => setNewTrailer({ ...newTrailer, model: e.target.value })}
                placeholder="Es. D'Lite X"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="trailerDescription">Descrizione</Label>
              <Textarea
                id="trailerDescription"
                value={newTrailer.description}
                onChange={(e) => setNewTrailer({ ...newTrailer, description: e.target.value })}
                placeholder="Descrizione dettagliata del carrello..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trailerPurchaseDate">Data Acquisto</Label>
                <Input
                  id="trailerPurchaseDate"
                  type="date"
                  onChange={(e) => setNewTrailer({ ...newTrailer, purchaseDate: e.target.value ? new Date(e.target.value) : undefined })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="trailerPurchasePrice">Prezzo Acquisto (€)</Label>
                <Input
                  id="trailerPurchasePrice"
                  type="number"
                  step="0.01"
                  value={newTrailer.purchasePrice || ""}
                  onChange={(e) => setNewTrailer({ ...newTrailer, purchasePrice: parseFloat(e.target.value) || undefined })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="trailerQuantity">Quantità</Label>
                <Input
                  id="trailerQuantity"
                  type="number"
                  min="1"
                  max="50"
                  value={newTrailer.quantity || 1}
                  onChange={(e) => setNewTrailer({ ...newTrailer, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                />
              </div>
              
              <div className="flex items-center space-x-2 pt-8">
                <Switch
                  id="trailerActive"
                  checked={newTrailer.isActive}
                  onCheckedChange={(checked) => setNewTrailer({ ...newTrailer, isActive: checked })}
                />
                <Label htmlFor="trailerActive">Attivo</Label>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setIsAddingTrailer(false)}>
                Annulla
              </Button>
              <Button onClick={handleAddTrailer}>
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
export default Garage;
