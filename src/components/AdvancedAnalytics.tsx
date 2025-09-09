import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3Icon, 
  EuroIcon, 
  BikeIcon, 
  TrendingUpIcon,
  TrendingDownIcon,
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  PieChartIcon,
  DownloadIcon,
  WrenchIcon,
  AlertTriangleIcon,
  Target,
  Activity,
  DollarSignIcon
} from "lucide-react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line,
  RechartsTooltipProps
} from "recharts";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import type { Booking, ShopSettings } from "./Dashboard";

interface AdvancedAnalyticsProps {
  bookings: Booking[];
  settings: ShopSettings;
  onClose: () => void;
}

interface BikePerformance {
  bike_type: string;
  bike_size: string;
  bike_suspension: string;
  has_trailer_hook: boolean;
  total_bookings: number;
  total_units_rented: number;
  estimated_revenue: number;
  avg_revenue_per_booking: number;
  total_hours: number;
}

interface FixedCost {
  id: number;
  name: string;
  description: string;
  amount: number;
  category: string;
  frequency: string;
  start_date: string;
  is_active: boolean;
  annual_cost: number;
}

interface RevenueBreakdown {
  byCategory: Array<{
    category: string;
    bookings: number;
    revenue: number;
    avg_booking_value: number;
  }>;
  byGuide: Array<{
    needs_guide: boolean;
    bookings: number;
    revenue: number;
  }>;
  fixedCosts: FixedCost[];
  summary: {
    totalRevenue: number;
    totalFixedCosts: number;
    netProfit: number;
    profitMargin: number;
  };
}

type AnalyticsPeriod = "week" | "month" | "year";

export const AdvancedAnalytics = ({ bookings, settings, onClose }: AdvancedAnalyticsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<AnalyticsPeriod>("month");
  const [bikePerformance, setBikePerformance] = useState<BikePerformance[]>([]);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const [bikeData, revenueData] = await Promise.all([
        apiService.getBikePerformance(selectedPeriod),
        apiService.getRevenueBreakdown(selectedPeriod)
      ]);

      setBikePerformance(bikeData);
      setRevenueBreakdown(revenueData);
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile caricare le analytics",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const getBikeDisplayName = (bike: BikePerformance) => {
    const type = bike.bike_type === "bambino" ? "Bambino" : 
                 bike.bike_type === "trailer" ? "Carrello" : "Adulto";
    const size = bike.bike_size ? ` ${bike.bike_size}` : "";
    const suspension = bike.bike_suspension === "full-suspension" ? " Full-Sus" : " Front";
    const hook = bike.has_trailer_hook ? " +Gancio" : "";
    
    return `${type}${size}${bike.bike_type !== "trailer" ? suspension : ""}${hook}`;
  };

  const getPeriodLabel = (period: AnalyticsPeriod) => {
    switch (period) {
      case "week": return "Settimana";
      case "month": return "Mese";
      case "year": return "Anno";
    }
  };

  const getPerformanceColor = (value: number, max: number) => {
    const percentage = (value / max) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    if (percentage >= 40) return "text-orange-600";
    return "text-red-600";
  };

  const calculateUtilizationRate = (bike: BikePerformance) => {
    // Stima del tasso di utilizzo basato su ore totali vs ore disponibili nel periodo
    const daysInPeriod = selectedPeriod === "week" ? 7 : selectedPeriod === "month" ? 30 : 365;
    const availableHours = daysInPeriod * 10 * bike.total_units_rented; // 10 ore al giorno
    return availableHours > 0 ? (bike.total_hours / availableHours) * 100 : 0;
  };

  const exportDetailedReport = () => {
    if (!revenueBreakdown) return;

    const reportData = {
      periodo: getPeriodLabel(selectedPeriod),
      dataGenerazione: new Date().toISOString(),
      riepilogoFinanziario: revenueBreakdown.summary,
      performanceBici: bikePerformance.map(bike => ({
        bicicletta: getBikeDisplayName(bike),
        prenotazioni: bike.total_bookings,
        unitaNolegiate: bike.total_units_rented,
        ricavoStimato: bike.estimated_revenue,
        oreTotali: bike.total_hours,
        tassoUtilizzo: `${calculateUtilizationRate(bike).toFixed(1)}%`
      })),
      costisFissi: revenueBreakdown.fixedCosts,
      dettaglioCategorie: revenueBreakdown.byCategory
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${selectedPeriod}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);

    toast({
      title: "Report Esportato",
      description: "Report dettagliato scaricato con successo"
    });
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-7xl max-h-[95vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-electric-green to-electric-green-light rounded-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Analytics Avanzate</h2>
              <p className="text-muted-foreground">Vista a 360° delle performance del business</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportDetailedReport} disabled={!revenueBreakdown}>
              <DownloadIcon className="w-4 h-4 mr-2" />
              Esporta Report
            </Button>
            <Button variant="outline" onClick={onClose}>
              Chiudi
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(95vh-120px)]">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <Target className="w-4 h-4 mr-2" />
                Panoramica
              </TabsTrigger>
              <TabsTrigger value="bikes">
                <BikeIcon className="w-4 h-4 mr-2" />
                Performance Bici
              </TabsTrigger>
              <TabsTrigger value="revenue">
                <EuroIcon className="w-4 h-4 mr-2" />
                Analisi Ricavi
              </TabsTrigger>
              <TabsTrigger value="costs">
                <DollarSignIcon className="w-4 h-4 mr-2" />
                Costi & Profittabilità
              </TabsTrigger>
            </TabsList>

            {/* Period Selector */}
            <div className="flex gap-2">
              {(["week", "month", "year"] as const).map((period) => (
                <Button
                  key={period}
                  variant={selectedPeriod === period ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedPeriod(period)}
                  className={selectedPeriod === period ? "bg-electric-green hover:bg-electric-green-dark" : ""}
                >
                  {getPeriodLabel(period)}
                </Button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Activity className="w-8 h-8 animate-spin mx-auto mb-4" />
                  <p>Caricamento analytics...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                  {revenueBreakdown && (
                    <>
                      {/* KPI Cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Ricavi Totali</CardTitle>
                            <EuroIcon className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold">€{revenueBreakdown.summary.totalRevenue.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                              Nel periodo selezionato
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Costi Fissi</CardTitle>
                            <AlertTriangleIcon className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className="text-2xl font-bold text-red-600">€{revenueBreakdown.summary.totalFixedCosts.toFixed(2)}</div>
                            <p className="text-xs text-muted-foreground">
                              Annualizzati
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Profitto Netto</CardTitle>
                            <TrendingUpIcon className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className={`text-2xl font-bold ${revenueBreakdown.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                              €{revenueBreakdown.summary.netProfit.toFixed(2)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {revenueBreakdown.summary.netProfit >= 0 ? 'Profitto' : 'Perdita'}
                            </p>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Margine di Profitto</CardTitle>
                            <Target className="h-4 w-4 text-muted-foreground" />
                          </CardHeader>
                          <CardContent>
                            <div className={`text-2xl font-bold ${revenueBreakdown.summary.profitMargin >= 20 ? 'text-green-600' : revenueBreakdown.summary.profitMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                              {revenueBreakdown.summary.profitMargin.toFixed(1)}%
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Target: 20%+
                            </p>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Top Performers */}
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Top 5 Bici per Ricavi</CardTitle>
                            <CardDescription>Le biciclette più profittevoli</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {bikePerformance.slice(0, 5).map((bike, index) => (
                                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-600' : 'bg-electric-green'}`}>
                                      {index + 1}
                                    </div>
                                    <div>
                                      <p className="font-medium">{getBikeDisplayName(bike)}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {bike.total_bookings} prenotazioni • {bike.total_hours}h
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold text-green-600">€{bike.estimated_revenue.toFixed(2)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {calculateUtilizationRate(bike).toFixed(1)}% utilizzo
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Distribuzione Ricavi per Categoria</CardTitle>
                            <CardDescription>Breakdown per tipologia di noleggio</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="h-[300px]">
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie
                                    data={revenueBreakdown.byCategory.map(cat => ({
                                      name: cat.category === "hourly" ? "Orario" : 
                                            cat.category === "half-day" ? "Mezza Giornata" : "Giornata Intera",
                                      value: cat.revenue,
                                      bookings: cat.bookings
                                    }))}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    dataKey="value"
                                    label={({ name, value, bookings }) => `${name}: €${value.toFixed(0)} (${bookings})`}
                                  >
                                    {revenueBreakdown.byCategory.map((_, index) => (
                                      <Cell key={`cell-${index}`} fill={['hsl(var(--electric-green))', 'hsl(var(--electric-green-light))', 'hsl(var(--primary))'][index]} />
                                    ))}
                                  </Pie>
                                  <Tooltip formatter={(value: number) => [`€${value.toFixed(2)}`, 'Ricavo']} />
                                </PieChart>
                              </ResponsiveContainer>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Bikes Performance Tab */}
                <TabsContent value="bikes" className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle>Performance Dettagliata per Bicicletta</CardTitle>
                      <CardDescription>
                        Analisi completa dell'utilizzo e profittabilità di ogni tipologia di bici
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Bicicletta</TableHead>
                            <TableHead className="text-right">Prenotazioni</TableHead>
                            <TableHead className="text-right">Unità Noleggiate</TableHead>
                            <TableHead className="text-right">Ore Totali</TableHead>
                            <TableHead className="text-right">Ricavo Stimato</TableHead>
                            <TableHead className="text-right">€/Prenotazione</TableHead>
                            <TableHead className="text-right">Utilizzo %</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {bikePerformance.map((bike, index) => {
                            const utilization = calculateUtilizationRate(bike);
                            const maxRevenue = Math.max(...bikePerformance.map(b => b.estimated_revenue));
                            
                            return (
                              <TableRow key={index}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center gap-2">
                                    <BikeIcon className="w-4 h-4" />
                                    {getBikeDisplayName(bike)}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">{bike.total_bookings}</TableCell>
                                <TableCell className="text-right">{bike.total_units_rented}</TableCell>
                                <TableCell className="text-right">{bike.total_hours}h</TableCell>
                                <TableCell className="text-right">
                                  <span className={getPerformanceColor(bike.estimated_revenue, maxRevenue)}>
                                    €{bike.estimated_revenue.toFixed(2)}
                                  </span>
                                </TableCell>
                                <TableCell className="text-right">€{bike.avg_revenue_per_booking.toFixed(2)}</TableCell>
                                <TableCell className="text-right">
                                  <div className="flex items-center gap-2">
                                    <Progress value={Math.min(utilization, 100)} className="w-16 h-2" />
                                    <span className={getPerformanceColor(utilization, 100)}>
                                      {utilization.toFixed(1)}%
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>

                  {/* Utilization Chart */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Tasso di Utilizzo per Tipologia</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[400px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={bikePerformance.map(bike => ({
                            name: getBikeDisplayName(bike).substring(0, 15),
                            utilizzo: calculateUtilizationRate(bike),
                            ricavo: bike.estimated_revenue
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                            <YAxis />
                            <Tooltip formatter={(value: number, name: string) => [
                              name === 'utilizzo' ? `${value.toFixed(1)}%` : `€${value.toFixed(2)}`,
                              name === 'utilizzo' ? 'Tasso di Utilizzo' : 'Ricavo'
                            ]} />
                            <Bar dataKey="utilizzo" fill="hsl(var(--electric-green))" name="utilizzo" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Revenue Analysis Tab */}
                <TabsContent value="revenue" className="space-y-6">
                  {revenueBreakdown && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle>Ricavi per Categoria</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {revenueBreakdown.byCategory.map((cat, index) => (
                                <div key={index} className="space-y-2">
                                  <div className="flex justify-between">
                                    <span className="text-sm font-medium">
                                      {cat.category === "hourly" ? "Noleggio Orario" : 
                                       cat.category === "half-day" ? "Mezza Giornata" : "Giornata Intera"}
                                    </span>
                                    <span className="text-sm font-bold">€{cat.revenue.toFixed(2)}</span>
                                  </div>
                                  <div className="flex justify-between text-xs text-muted-foreground">
                                    <span>{cat.bookings} prenotazioni</span>
                                    <span>Media: €{cat.avg_booking_value.toFixed(2)}</span>
                                  </div>
                                  <Progress 
                                    value={(cat.revenue / revenueBreakdown.summary.totalRevenue) * 100} 
                                    className="h-2" 
                                  />
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>

                        <Card>
                          <CardHeader>
                            <CardTitle>Servizio Guida</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              {revenueBreakdown.byGuide.map((guide, index) => (
                                <div key={index} className="flex justify-between items-center p-3 border rounded-lg">
                                  <div>
                                    <p className="font-medium">
                                      {guide.needs_guide ? "Con Guida" : "Senza Guida"}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                      {guide.bookings} prenotazioni
                                    </p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-bold">€{guide.revenue.toFixed(2)}</p>
                                    <p className="text-sm text-muted-foreground">
                                      {((guide.revenue / revenueBreakdown.summary.totalRevenue) * 100).toFixed(1)}%
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </>
                  )}
                </TabsContent>

                {/* Costs & Profitability Tab */}
                <TabsContent value="costs" className="space-y-6">
                  {revenueBreakdown && (
                    <>
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card>
                          <CardHeader>
                            <CardTitle className="text-lg">Riepilogo Finanziario</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="flex justify-between items-center">
                              <span>Ricavi Totali:</span>
                              <span className="font-bold text-green-600">€{revenueBreakdown.summary.totalRevenue.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Costi Fissi Annui:</span>
                              <span className="font-bold text-red-600">-€{revenueBreakdown.summary.totalFixedCosts.toFixed(2)}</span>
                            </div>
                            <hr />
                            <div className="flex justify-between items-center text-lg">
                              <span className="font-medium">Profitto Netto:</span>
                              <span className={`font-bold ${revenueBreakdown.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                €{revenueBreakdown.summary.netProfit.toFixed(2)}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span>Margine:</span>
                              <Badge variant={revenueBreakdown.summary.profitMargin >= 20 ? "default" : revenueBreakdown.summary.profitMargin >= 10 ? "secondary" : "destructive"}>
                                {revenueBreakdown.summary.profitMargin.toFixed(1)}%
                              </Badge>
                            </div>
                          </CardContent>
                        </Card>

                        <Card className="lg:col-span-2">
                          <CardHeader>
                            <CardTitle>Dettaglio Costi Fissi</CardTitle>
                            <CardDescription>Tutti i costi fissi attivi</CardDescription>
                          </CardHeader>
                          <CardContent>
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead>Nome</TableHead>
                                  <TableHead>Categoria</TableHead>
                                  <TableHead>Frequenza</TableHead>
                                  <TableHead className="text-right">Importo</TableHead>
                                  <TableHead className="text-right">Costo Annuo</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {revenueBreakdown.fixedCosts.map((cost, index) => (
                                  <TableRow key={index}>
                                    <TableCell>
                                      <div>
                                        <p className="font-medium">{cost.name}</p>
                                        {cost.description && (
                                          <p className="text-xs text-muted-foreground">{cost.description}</p>
                                        )}
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <Badge variant="outline" className="capitalize">{cost.category}</Badge>
                                    </TableCell>
                                    <TableCell className="capitalize">{cost.frequency}</TableCell>
                                    <TableCell className="text-right">€{cost.amount.toFixed(2)}</TableCell>
                                    <TableCell className="text-right font-medium">€{cost.annual_cost.toFixed(2)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </CardContent>
                        </Card>
                      </div>

                      {/* Break-even Analysis */}
                      <Card>
                        <CardHeader>
                          <CardTitle>Analisi Break-Even</CardTitle>
                          <CardDescription>Quanto fatturato serve per coprire i costi fissi</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Break-Even Mensile</Label>
                              <div className="text-2xl font-bold text-orange-600">
                                €{(revenueBreakdown.summary.totalFixedCosts / 12).toFixed(2)}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Fatturato minimo mensile per coprire i costi
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Break-Even Giornaliero</Label>
                              <div className="text-2xl font-bold text-orange-600">
                                €{(revenueBreakdown.summary.totalFixedCosts / 365).toFixed(2)}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                Fatturato minimo giornaliero
                              </p>
                            </div>
                            
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Status</Label>
                              <div className={`text-2xl font-bold ${revenueBreakdown.summary.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {revenueBreakdown.summary.netProfit >= 0 ? '✅ Raggiunto' : '❌ Non Raggiunto'}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {revenueBreakdown.summary.netProfit >= 0 
                                  ? 'I ricavi superano i costi fissi' 
                                  : `Mancano €${Math.abs(revenueBreakdown.summary.netProfit).toFixed(2)}`
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <label className={className}>{children}</label>;
}