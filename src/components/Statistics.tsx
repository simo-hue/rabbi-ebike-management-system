import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3Icon, 
  EuroIcon, 
  BikeIcon, 
  TrendingUpIcon, 
  UserIcon,
  CalendarDaysIcon,
  ClockIcon,
  PieChartIcon
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
  Line 
} from "recharts";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays, subWeeks, subMonths, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval } from "date-fns";
import { it } from "date-fns/locale";
import type { Booking, ShopSettings, BikeDetails } from "./Dashboard";

interface StatisticsProps {
  bookings: Booking[];
  settings: ShopSettings;
  onClose: () => void;
}

type StatsPeriod = "today" | "week" | "month" | "year";

export const Statistics = ({ bookings, settings, onClose }: StatisticsProps) => {
  const [selectedPeriod, setSelectedPeriod] = useState<StatsPeriod>("week");

  const getDateRange = (period: StatsPeriod) => {
    const now = new Date();
    switch (period) {
      case "today":
        return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end: now };
      case "week":
        return { start: startOfWeek(now, { locale: it }), end: endOfWeek(now, { locale: it }) };
      case "month":
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case "year":
        return { start: new Date(now.getFullYear(), 0, 1), end: new Date(now.getFullYear(), 11, 31) };
    }
  };

  const getFilteredBookings = (period: StatsPeriod) => {
    const { start, end } = getDateRange(period);
    return bookings.filter(booking => 
      booking.date >= start && 
      booking.date <= end && 
      booking.status === "confirmed"
    );
  };

  const getPreviousPeriodBookings = (period: StatsPeriod) => {
    const now = new Date();
    let previousStart: Date, previousEnd: Date;
    
    switch (period) {
      case "today":
        previousStart = subDays(now, 1);
        previousEnd = subDays(now, 1);
        break;
      case "week":
        previousStart = startOfWeek(subWeeks(now, 1), { locale: it });
        previousEnd = endOfWeek(subWeeks(now, 1), { locale: it });
        break;
      case "month":
        previousStart = startOfMonth(subMonths(now, 1));
        previousEnd = endOfMonth(subMonths(now, 1));
        break;
      case "year":
        previousStart = new Date(now.getFullYear() - 1, 0, 1);
        previousEnd = new Date(now.getFullYear() - 1, 11, 31);
        break;
    }
    
    return bookings.filter(booking => 
      booking.date >= previousStart && 
      booking.date <= previousEnd && 
      booking.status === "confirmed"
    );
  };

  const calculateRevenue = (periodBookings: Booking[]) => {
    return periodBookings.reduce((sum, booking) => sum + booking.totalPrice, 0);
  };

  const calculateGrowthPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const getMostRentedBike = (periodBookings: Booking[]) => {
    const bikeCount: Record<string, { count: number, bike: BikeDetails }> = {};
    
    periodBookings.forEach(booking => {
      booking.bikeDetails.forEach(bike => {
        const key = `${bike.type}-${bike.size}-${bike.suspension}`;
        if (!bikeCount[key]) {
          bikeCount[key] = { count: 0, bike };
        }
        bikeCount[key].count += bike.count;
      });
    });
    
    const sortedBikes = Object.values(bikeCount).sort((a, b) => b.count - a.count);
    return sortedBikes[0] || null;
  };

  const getAverageRentalTime = (periodBookings: Booking[]) => {
    if (periodBookings.length === 0) return 0;
    
    const totalHours = periodBookings.reduce((sum, booking) => {
      if (booking.category === "full-day") return sum + 8;
      if (booking.category === "half-day") return sum + 4;
      
      const startHour = parseInt(booking.startTime.split(':')[0]);
      const endHour = parseInt(booking.endTime.split(':')[0]);
      return sum + (endHour - startHour);
    }, 0);
    
    return totalHours / periodBookings.length;
  };

  // Chart data preparation
  const getRevenueChartData = () => {
    const now = new Date();
    
    if (selectedPeriod === "week") {
      const weekStart = startOfWeek(now, { locale: it });
      const days = eachDayOfInterval({ start: weekStart, end: endOfWeek(now, { locale: it }) });
      
      return days.map(day => {
        const dayBookings = bookings.filter(booking => 
          format(booking.date, "yyyy-MM-dd") === format(day, "yyyy-MM-dd") &&
          booking.status === "confirmed"
        );
        const revenue = calculateRevenue(dayBookings);
        return {
          name: format(day, "EEE", { locale: it }),
          revenue: revenue,
          bookings: dayBookings.length
        };
      });
    } else if (selectedPeriod === "month") {
      const monthStart = startOfMonth(now);
      const weeks = eachWeekOfInterval({ start: monthStart, end: endOfMonth(now) }, { locale: it });
      
      return weeks.map((week, index) => {
        const weekBookings = bookings.filter(booking => {
          const bookingWeekStart = startOfWeek(booking.date, { locale: it });
          return format(bookingWeekStart, "yyyy-MM-dd") === format(week, "yyyy-MM-dd") &&
                 booking.status === "confirmed";
        });
        const revenue = calculateRevenue(weekBookings);
        return {
          name: `Sett. ${index + 1}`,
          revenue: revenue,
          bookings: weekBookings.length
        };
      });
    } else if (selectedPeriod === "year") {
      const yearStart = new Date(now.getFullYear(), 0, 1);
      const months = eachMonthOfInterval({ start: yearStart, end: new Date(now.getFullYear(), 11, 31) });
      
      return months.map(month => {
        const monthBookings = bookings.filter(booking => 
          booking.date.getMonth() === month.getMonth() &&
          booking.date.getFullYear() === month.getFullYear() &&
          booking.status === "confirmed"
        );
        const revenue = calculateRevenue(monthBookings);
        return {
          name: format(month, "MMM", { locale: it }),
          revenue: revenue,
          bookings: monthBookings.length
        };
      });
    }
    
    return [];
  };

  const getCategoryPieData = () => {
    const colors = ['hsl(var(--electric-green))', 'hsl(var(--electric-green-light))', 'hsl(var(--primary))'];
    return [
      { name: 'Orario', value: categoryStats.hourly, color: colors[0] },
      { name: 'Mezza Giornata', value: categoryStats.halfDay, color: colors[1] },
      { name: 'Giornata Intera', value: categoryStats.fullDay, color: colors[2] }
    ].filter(item => item.value > 0);
  };

  const getBikeUsageData = () => {
    return settings.totalBikes.map(bike => {
      const rented = currentBookings.reduce((sum, booking) => {
        const matchingBikes = booking.bikeDetails.filter(
          b => b.type === bike.type && b.size === bike.size && b.suspension === bike.suspension
        );
        return sum + matchingBikes.reduce((bikeSum, b) => bikeSum + b.count, 0);
      }, 0);
      
      return {
        name: `${bike.type === "bambino" ? "Bambino" : "Adulto"} ${bike.size}`,
        rented: rented,
        available: bike.count - rented,
        total: bike.count
      };
    });
  };

  const currentBookings = getFilteredBookings(selectedPeriod);
  const previousBookings = getPreviousPeriodBookings(selectedPeriod);
  
  const currentRevenue = calculateRevenue(currentBookings);
  const previousRevenue = calculateRevenue(previousBookings);
  const revenueGrowth = calculateGrowthPercentage(currentRevenue, previousRevenue);
  
  const bookingGrowth = calculateGrowthPercentage(currentBookings.length, previousBookings.length);
  const mostRentedBike = getMostRentedBike(currentBookings);
  const averageRentalTime = getAverageRentalTime(currentBookings);

  const categoryStats = {
    hourly: currentBookings.filter(b => b.category === "hourly").length,
    halfDay: currentBookings.filter(b => b.category === "half-day").length,
    fullDay: currentBookings.filter(b => b.category === "full-day").length,
  };

  const guidedBookings = currentBookings.filter(b => b.needsGuide).length;
  const guideUtilization = currentBookings.length > 0 ? (guidedBookings / currentBookings.length) * 100 : 0;

  const getPeriodLabel = (period: StatsPeriod) => {
    switch (period) {
      case "today": return "Oggi";
      case "week": return "Questa Settimana";
      case "month": return "Questo Mese";
      case "year": return "Quest'Anno";
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-electric-green to-electric-green-light rounded-lg">
              <BarChart3Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Statistiche Noleggio</h2>
              <p className="text-muted-foreground">Analisi completa delle performance</p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            Chiudi
          </Button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="overview" className="flex items-center gap-2">
                <BarChart3Icon className="w-4 h-4" />
                Panoramica
              </TabsTrigger>
              <TabsTrigger value="charts" className="flex items-center gap-2">
                <PieChartIcon className="w-4 h-4" />
                Grafici
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Period Selector */}
              <div className="flex gap-2">
                {(["today", "week", "month", "year"] as const).map((period) => (
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

              {/* Main Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Fatturato</CardTitle>
                    <EuroIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">€{currentRevenue}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <TrendingUpIcon className={`mr-1 h-3 w-3 ${revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                      {revenueGrowth >= 0 ? '+' : ''}{revenueGrowth.toFixed(1)}% vs periodo precedente
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Prenotazioni</CardTitle>
                    <CalendarDaysIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{currentBookings.length}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      <TrendingUpIcon className={`mr-1 h-3 w-3 ${bookingGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                      {bookingGrowth >= 0 ? '+' : ''}{bookingGrowth.toFixed(1)}% vs periodo precedente
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Durata Media</CardTitle>
                    <ClockIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{averageRentalTime.toFixed(1)}h</div>
                    <p className="text-xs text-muted-foreground">
                      Per prenotazione
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Con Guida</CardTitle>
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{guidedBookings}</div>
                    <div className="flex items-center text-xs text-muted-foreground">
                      {guideUtilization.toFixed(1)}% delle prenotazioni
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Detailed Analysis */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Tipologie di Noleggio</CardTitle>
                    <CardDescription>Distribuzione per categoria</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Orario</span>
                        <span className="text-sm font-medium">{categoryStats.hourly}</span>
                      </div>
                      <Progress value={currentBookings.length > 0 ? (categoryStats.hourly / currentBookings.length) * 100 : 0} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Mezza Giornata</span>
                        <span className="text-sm font-medium">{categoryStats.halfDay}</span>
                      </div>
                      <Progress value={currentBookings.length > 0 ? (categoryStats.halfDay / currentBookings.length) * 100 : 0} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Giornata Intera</span>
                        <span className="text-sm font-medium">{categoryStats.fullDay}</span>
                      </div>
                      <Progress value={currentBookings.length > 0 ? (categoryStats.fullDay / currentBookings.length) * 100 : 0} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                {/* Most Rented Bike */}
                <Card>
                  <CardHeader>
                    <CardTitle>Bici Più Richiesta</CardTitle>
                    <CardDescription>Nel periodo selezionato</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {mostRentedBike ? (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-12 h-12 bg-electric-green/10 rounded-lg">
                            <BikeIcon className="w-6 h-6 text-electric-green" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {mostRentedBike.bike.type === "bambino" ? "Bambino" : "Adulto"} Taglia {mostRentedBike.bike.size}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {mostRentedBike.bike.suspension === "full-suspension" ? "Full-Suspension" : "Ammortizzate Davanti"}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Noleggi totali</span>
                          <Badge className="bg-electric-green text-white">{mostRentedBike.count}</Badge>
                        </div>
                      </div>
                    ) : (
                      <p className="text-muted-foreground">Nessun dato disponibile</p>
                    )}
                  </CardContent>
                </Card>

                {/* Revenue Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Dettaglio Ricavi</CardTitle>
                    <CardDescription>Suddivisione per tipologia</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Noleggi Orari</span>
                      <span className="font-medium">
                        €{currentBookings
                          .filter(b => b.category === "hourly")
                          .reduce((sum, b) => sum + b.totalPrice, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Mezza Giornata</span>
                      <span className="font-medium">
                        €{currentBookings
                          .filter(b => b.category === "half-day")
                          .reduce((sum, b) => sum + b.totalPrice, 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Giornata Intera</span>
                      <span className="font-medium">
                        €{currentBookings
                          .filter(b => b.category === "full-day")
                          .reduce((sum, b) => sum + b.totalPrice, 0)}
                      </span>
                    </div>
                    <div className="border-t pt-2 flex justify-between items-center font-medium">
                      <span>Servizio Guida</span>
                      <span className="text-electric-green">
                        €{currentBookings
                          .filter(b => b.needsGuide)
                          .reduce((sum, b) => {
                            const hours = b.category === "full-day" ? 8 : b.category === "half-day" ? 4 : 
                              parseInt(b.endTime.split(':')[0]) - parseInt(b.startTime.split(':')[0]);
                            return sum + (settings.pricing.guideHourly * hours);
                          }, 0)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Fleet Utilization */}
                <Card>
                  <CardHeader>
                    <CardTitle>Utilizzo Flotta</CardTitle>
                    <CardDescription>Efficienza per tipo di bici</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {settings.totalBikes.map((bike, index) => {
                      const rented = currentBookings.reduce((sum, booking) => {
                        const matchingBikes = booking.bikeDetails.filter(
                          b => b.type === bike.type && b.size === bike.size && b.suspension === bike.suspension
                        );
                        return sum + matchingBikes.reduce((bikeSum, b) => bikeSum + b.count, 0);
                      }, 0);
                      
                      const utilizationRate = bike.count > 0 ? (rented / bike.count) * 100 : 0;
                      
                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>
                              {bike.type === "bambino" ? "Bambino" : "Adulto"} {bike.size} 
                              ({bike.suspension === "full-suspension" ? "Full-Sus" : "Front"})
                            </span>
                            <span>{rented}/{bike.count}</span>
                          </div>
                          <Progress value={utilizationRate} className="h-2" />
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="charts" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Revenue Trend Chart */}
                {selectedPeriod !== "today" && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Trend Fatturato</CardTitle>
                      <CardDescription>Andamento ricavi nel periodo selezionato</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={getRevenueChartData()}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-muted-foreground" />
                            <YAxis className="text-muted-foreground" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Line 
                              type="monotone" 
                              dataKey="revenue" 
                              stroke="hsl(var(--electric-green))" 
                              strokeWidth={3}
                              dot={{ fill: 'hsl(var(--electric-green))', strokeWidth: 2, r: 4 }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Category Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuzione Categorie</CardTitle>
                    <CardDescription>Tipologie di noleggio</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getCategoryPieData()}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            {getCategoryPieData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Bike Usage Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle>Utilizzo Biciclette</CardTitle>
                    <CardDescription>Bici noleggiate vs disponibili</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={getBikeUsageData()}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="name" className="text-muted-foreground" />
                          <YAxis className="text-muted-foreground" />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: 'hsl(var(--card))', 
                              border: '1px solid hsl(var(--border))',
                              borderRadius: '8px'
                            }}
                          />
                          <Bar dataKey="rented" fill="hsl(var(--electric-green))" name="Noleggiate" />
                          <Bar dataKey="available" fill="hsl(var(--muted))" name="Disponibili" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Bookings vs Revenue */}
                {selectedPeriod !== "today" && (
                  <Card className="lg:col-span-2">
                    <CardHeader>
                      <CardTitle>Prenotazioni vs Fatturato</CardTitle>
                      <CardDescription>Correlazione tra numero prenotazioni e ricavi</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={getRevenueChartData()}>
                            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                            <XAxis dataKey="name" className="text-muted-foreground" />
                            <YAxis yAxisId="left" className="text-muted-foreground" />
                            <YAxis yAxisId="right" orientation="right" className="text-muted-foreground" />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: 'hsl(var(--card))', 
                                border: '1px solid hsl(var(--border))',
                                borderRadius: '8px'
                              }}
                            />
                            <Bar yAxisId="left" dataKey="bookings" fill="hsl(var(--primary))" name="Prenotazioni" />
                            <Line yAxisId="right" type="monotone" dataKey="revenue" stroke="hsl(var(--electric-green))" strokeWidth={2} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};