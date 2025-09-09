import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  EuroIcon,
  SaveIcon,
  HomeIcon,
  ShieldIcon,
  ZapIcon,
  WifiIcon,
  PackageIcon,
  AlertCircleIcon
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";

interface FixedCost {
  id?: number;
  name: string;
  description: string;
  amount: number;
  category: string;
  frequency: 'monthly' | 'yearly' | 'one-time';
  startDate: string;
  isActive: boolean;
}

interface FixedCostsManagerProps {
  onClose: () => void;
}

const CATEGORIES = [
  { value: 'rent', label: 'Affitto', icon: HomeIcon, color: 'text-blue-600' },
  { value: 'insurance', label: 'Assicurazione', icon: ShieldIcon, color: 'text-green-600' },
  { value: 'utilities', label: 'Utenze', icon: ZapIcon, color: 'text-yellow-600' },
  { value: 'internet', label: 'Internet/Telefono', icon: WifiIcon, color: 'text-purple-600' },
  { value: 'maintenance', label: 'Manutenzione', icon: PackageIcon, color: 'text-orange-600' },
  { value: 'general', label: 'Generale', icon: PackageIcon, color: 'text-gray-600' }
];

const FREQUENCIES = [
  { value: 'monthly', label: 'Mensile' },
  { value: 'yearly', label: 'Annuale' },
  { value: 'one-time', label: 'Una Tantum' }
];

export const FixedCostsManager = ({ onClose }: FixedCostsManagerProps) => {
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [isAddingCost, setIsAddingCost] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const [newCost, setNewCost] = useState<FixedCost>({
    name: "",
    description: "",
    amount: 0,
    category: "general",
    frequency: "monthly",
    startDate: new Date().toISOString().split('T')[0],
    isActive: true
  });

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiService.getFixedCosts();
      setCosts(data);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare i costi fissi",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  const handleSaveCost = async () => {
    if (!newCost.name || newCost.amount <= 0) {
      toast({
        title: "Errore",
        description: "Nome e importo sono obbligatori",
        variant: "destructive"
      });
      return;
    }

    try {
      if (editingCost) {
        await apiService.updateFixedCost(editingCost.id!.toString(), newCost);
        toast({
          title: "Successo",
          description: "Costo fisso aggiornato"
        });
      } else {
        await apiService.createFixedCost(newCost);
        toast({
          title: "Successo",
          description: "Costo fisso aggiunto"
        });
      }

      setNewCost({
        name: "",
        description: "",
        amount: 0,
        category: "general",
        frequency: "monthly",
        startDate: new Date().toISOString().split('T')[0],
        isActive: true
      });
      setIsAddingCost(false);
      setEditingCost(null);
      fetchCosts();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile salvare il costo fisso",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCost = async (id: number) => {
    if (!confirm("Sei sicuro di voler eliminare questo costo fisso?")) return;

    try {
      await apiService.deleteFixedCost(id.toString());
      toast({
        title: "Successo",
        description: "Costo fisso eliminato"
      });
      fetchCosts();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile eliminare il costo fisso",
        variant: "destructive"
      });
    }
  };

  const handleEditCost = (cost: FixedCost) => {
    setEditingCost(cost);
    setNewCost({
      name: cost.name,
      description: cost.description,
      amount: cost.amount,
      category: cost.category,
      frequency: cost.frequency,
      startDate: cost.startDate,
      isActive: cost.isActive
    });
    setIsAddingCost(true);
  };

  const getCategoryInfo = (category: string) => {
    return CATEGORIES.find(cat => cat.value === category) || CATEGORIES[CATEGORIES.length - 1];
  };

  const getFrequencyLabel = (frequency: string) => {
    return FREQUENCIES.find(freq => freq.value === frequency)?.label || frequency;
  };

  const calculateAnnualCost = (cost: FixedCost) => {
    switch (cost.frequency) {
      case 'monthly':
        return cost.amount * 12;
      case 'yearly':
        return cost.amount;
      case 'one-time':
        return cost.amount;
      default:
        return cost.amount;
    }
  };

  const calculateMonthlyCost = (cost: FixedCost) => {
    switch (cost.frequency) {
      case 'monthly':
        return cost.amount;
      case 'yearly':
        return cost.amount / 12;
      case 'one-time':
        return cost.amount / 12; // Spalma su 12 mesi per la visualizzazione
      default:
        return cost.amount;
    }
  };

  const totalAnnualCosts = costs
    .filter(cost => cost.isActive)
    .reduce((sum, cost) => sum + calculateAnnualCost(cost), 0);

  const totalMonthlyCosts = costs
    .filter(cost => cost.isActive)
    .reduce((sum, cost) => sum + calculateMonthlyCost(cost), 0);

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-electric-green to-electric-green-light rounded-lg">
              <EuroIcon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Gestione Costi Fissi</h2>
              <p className="text-muted-foreground">Configura e monitora i costi fissi dell'attività</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsAddingCost(true)}>
              <PlusIcon className="w-4 h-4 mr-2" />
              Aggiungi Costo
            </Button>
            <Button variant="outline" onClick={onClose}>
              Chiudi
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Costi Mensili</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">€{totalMonthlyCosts.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  {costs.filter(c => c.isActive).length} costi attivi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Costi Annuali</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">€{totalAnnualCosts.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Proiettati su 12 mesi
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium">Break-Even Giornaliero</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">€{(totalAnnualCosts / 365).toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  Fatturato minimo per coprire costi
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Costs Table */}
          <Card>
            <CardHeader>
              <CardTitle>Elenco Costi Fissi</CardTitle>
              <CardDescription>Tutti i costi fissi configurati per l'attività</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <EuroIcon className="w-8 h-8 animate-pulse mx-auto mb-4" />
                    <p>Caricamento costi...</p>
                  </div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Frequenza</TableHead>
                      <TableHead className="text-right">Importo</TableHead>
                      <TableHead className="text-right">Mensile</TableHead>
                      <TableHead className="text-right">Annuale</TableHead>
                      <TableHead>Stato</TableHead>
                      <TableHead className="text-right">Azioni</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costs.map((cost) => {
                      const categoryInfo = getCategoryInfo(cost.category);
                      const CategoryIcon = categoryInfo.icon;
                      
                      return (
                        <TableRow key={cost.id} className={!cost.isActive ? "opacity-50" : ""}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <CategoryIcon className={`w-4 h-4 ${categoryInfo.color}`} />
                              <div>
                                <p className="font-medium">{cost.name}</p>
                                {cost.description && (
                                  <p className="text-xs text-muted-foreground">{cost.description}</p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {categoryInfo.label}
                            </Badge>
                          </TableCell>
                          <TableCell>{getFrequencyLabel(cost.frequency)}</TableCell>
                          <TableCell className="text-right font-medium">€{cost.amount.toFixed(2)}</TableCell>
                          <TableCell className="text-right">€{calculateMonthlyCost(cost).toFixed(2)}</TableCell>
                          <TableCell className="text-right">€{calculateAnnualCost(cost).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={cost.isActive ? "default" : "secondary"}>
                              {cost.isActive ? "Attivo" : "Inattivo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditCost(cost)}
                              >
                                <EditIcon className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteCost(cost.id!)}
                              >
                                <TrashIcon className="w-3 h-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Warning Card */}
          <Card className="border-orange-200 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <AlertCircleIcon className="w-5 h-5 text-orange-600 mt-0.5" />
                <div className="space-y-2">
                  <p className="text-sm font-medium text-orange-800">
                    Consigli per la gestione dei costi fissi
                  </p>
                  <ul className="text-sm text-orange-700 space-y-1">
                    <li>• Mantieni aggiornati tutti i costi per un calcolo accurato della profittabilità</li>
                    <li>• Il break-even giornaliero ti indica il fatturato minimo per coprire i costi</li>
                    <li>• Disattiva i costi temporaneamente sospesi invece di eliminarli</li>
                    <li>• Aggiungi una descrizione dettagliata per tenere traccia delle variazioni</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add/Edit Cost Dialog */}
      <Dialog open={isAddingCost} onOpenChange={setIsAddingCost}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingCost ? "Modifica Costo Fisso" : "Aggiungi Nuovo Costo Fisso"}
            </DialogTitle>
            <DialogDescription>
              {editingCost 
                ? "Aggiorna le informazioni del costo fisso" 
                : "Inserisci i dettagli del nuovo costo fisso"
              }
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costName">Nome *</Label>
                <Input
                  id="costName"
                  value={newCost.name}
                  onChange={(e) => setNewCost({ ...newCost, name: e.target.value })}
                  placeholder="Es. Affitto negozio"
                />
              </div>
              
              <div className="space-y-2">
                <Label>Categoria</Label>
                <Select value={newCost.category} onValueChange={(value) => setNewCost({ ...newCost, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(cat => {
                      const Icon = cat.icon;
                      return (
                        <SelectItem key={cat.value} value={cat.value}>
                          <div className="flex items-center gap-2">
                            <Icon className={`w-4 h-4 ${cat.color}`} />
                            {cat.label}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costDescription">Descrizione</Label>
              <Textarea
                id="costDescription"
                value={newCost.description}
                onChange={(e) => setNewCost({ ...newCost, description: e.target.value })}
                placeholder="Descrizione dettagliata del costo..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="costAmount">Importo (€) *</Label>
                <Input
                  id="costAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newCost.amount}
                  onChange={(e) => setNewCost({ ...newCost, amount: parseFloat(e.target.value) || 0 })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Frequenza</Label>
                <Select value={newCost.frequency} onValueChange={(value: 'monthly' | 'yearly' | 'one-time') => setNewCost({ ...newCost, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FREQUENCIES.map(freq => (
                      <SelectItem key={freq.value} value={freq.value}>
                        {freq.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inizio</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={newCost.startDate}
                  onChange={(e) => setNewCost({ ...newCost, startDate: e.target.value })}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={newCost.isActive}
                onCheckedChange={(checked) => setNewCost({ ...newCost, isActive: checked })}
              />
              <Label htmlFor="isActive">Costo attivo</Label>
            </div>

            {/* Cost Preview */}
            {newCost.amount > 0 && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Anteprima Costi:</p>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Costo mensile:</span>
                    <span className="font-bold ml-2">€{calculateMonthlyCost(newCost).toFixed(2)}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Costo annuale:</span>
                    <span className="font-bold ml-2">€{calculateAnnualCost(newCost).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => {
                setIsAddingCost(false);
                setEditingCost(null);
                setNewCost({
                  name: "",
                  description: "",
                  amount: 0,
                  category: "general",
                  frequency: "monthly",
                  startDate: new Date().toISOString().split('T')[0],
                  isActive: true
                });
              }}>
                Annulla
              </Button>
              <Button onClick={handleSaveCost}>
                <SaveIcon className="w-4 h-4 mr-2" />
                {editingCost ? "Aggiorna" : "Salva"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};export default FixedCostsManager;
