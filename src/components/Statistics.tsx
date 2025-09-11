import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { BarChart3Icon, EuroIcon, BikeIcon, XIcon, ClockIcon, TrendingUpIcon, UserIcon, CalendarIcon, MapPinIcon, PhoneIcon } from "lucide-react";
import type { Booking, ShopSettings, BikeDetails } from "./Dashboard";

interface StatisticsProps {
  bookings: Booking[];
  settings: ShopSettings;
  onClose: () => void;
}

export const Statistics = ({ bookings, settings, onClose }: StatisticsProps) => {
  const totalBookings = bookings ? bookings.length : 0;
  const totalRevenue = bookings ? bookings.reduce((sum, booking) => sum + (booking.totalPrice || 0), 0) : 0;
  
  // Analisi avanzate
  const confirmedBookings = bookings?.filter(b => b.status === 'confirmed') || [];
  const cancelledBookings = bookings?.filter(b => b.status === 'cancelled') || [];
  const pendingBookings = bookings?.filter(b => b.status === 'pending') || [];
  
  // Statistiche per tipo di noleggio
  const hourlyBookings = confirmedBookings.filter(b => b.category === 'hourly').length;
  const halfDayBookings = confirmedBookings.filter(b => b.category === 'half-day').length;
  const fullDayBookings = confirmedBookings.filter(b => b.category === 'full-day').length;
  
  // Statistiche guida
  const guidedBookings = confirmedBookings.filter(b => b.needsGuide).length;
  const guideRevenue = confirmedBookings
    .filter(b => b.needsGuide)
    .reduce((sum, booking) => {
      const hours = booking.category === 'full-day' ? 8 : booking.category === 'half-day' ? 4 : 
        parseInt(booking.endTime?.split(':')[0] || '0') - parseInt(booking.startTime?.split(':')[0] || '0');
      return sum + (settings.pricing?.guideHourly || 0) * hours;
    }, 0);
  
  // Analisi biciclette più richieste
  const bikeStats: Record<string, { count: number, revenue: number, type: string }> = {};
  confirmedBookings.forEach(booking => {
    if (booking.bikes) {
      booking.bikes.forEach(bike => {
        const key = `${bike.type}-${bike.size || 'N/A'}-${bike.suspension || 'N/A'}`;
        if (!bikeStats[key]) {
          bikeStats[key] = { 
            count: 0, 
            revenue: 0, 
            type: `${bike.type === 'bambino' ? 'Bambino' : bike.type === 'adulto' ? 'Adulto' : bike.type === 'trailer' ? 'Carrello' : bike.type} ${bike.size || ''} ${bike.suspension || ''}`.trim()
          };
        }
        bikeStats[key].count += bike.count || 1;
        bikeStats[key].revenue += (booking.totalPrice || 0) * ((bike.count || 1) / (booking.bikes?.reduce((sum, b) => sum + (b.count || 1), 0) || 1));
      });
    }
  });
  
  const sortedBikes = Object.values(bikeStats).sort((a, b) => b.count - a.count);
  const mostRentedBike = sortedBikes[0];
  
  // Analisi temporale
  const today = new Date();
  const thisMonth = bookings?.filter(b => {
    const bookingDate = new Date(b.startDate || b.date);
    return bookingDate.getMonth() === today.getMonth() && bookingDate.getFullYear() === today.getFullYear();
  }) || [];
  
  const thisWeek = bookings?.filter(b => {
    const bookingDate = new Date(b.startDate || b.date);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return bookingDate >= weekAgo;
  }) || [];
  
  // Analisi orari più richiesti
  const hourStats: Record<string, number> = {};
  confirmedBookings.forEach(booking => {
    if (booking.startTime) {
      const hour = booking.startTime.split(':')[0];
      hourStats[hour] = (hourStats[hour] || 0) + 1;
    }
  });
  
  const sortedHours = Object.entries(hourStats).sort(([,a], [,b]) => b - a);
  const mostRequestedHour = sortedHours[0];
  
  // Calcoli utilità flotta
  const totalBikesAvailable = settings.totalBikes?.reduce((sum, bike) => sum + bike.count, 0) || 0;
  const uniqueCustomers = new Set(confirmedBookings.map(b => b.customerName?.toLowerCase().trim())).size;
  
  // Durata media noleggi
  const averageRentalTime = confirmedBookings.length > 0 ? confirmedBookings.reduce((sum, booking) => {
    if (booking.category === 'full-day') return sum + 8;
    if (booking.category === 'half-day') return sum + 4;
    
    const startHour = parseInt(booking.startTime?.split(':')[0] || '0');
    const endHour = parseInt(booking.endTime?.split(':')[0] || '0');
    return sum + Math.max(1, endHour - startHour);
  }, 0) / confirmedBookings.length : 0;
  
  // Tasso di cancellazione
  const cancellationRate = totalBookings > 0 ? (cancelledBookings.length / totalBookings) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card rounded-lg shadow-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-electric-green to-electric-green-light rounded-lg">
              <BarChart3Icon className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Statistiche Noleggio</h2>
              <p className="text-muted-foreground">Riepilogo delle prenotazioni</p>
            </div>
          </div>
          <Button variant="outline" onClick={onClose}>
            <XIcon className="w-4 h-4 mr-2" />
            Chiudi
          </Button>
        </div>

        <div className="p-6 space-y-6 max-h-[calc(90vh-120px)] overflow-y-auto">
          {/* Main Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Prenotazioni Totali</CardTitle>
                <BarChart3Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalBookings}</div>
                <p className="text-xs text-muted-foreground">
                  {confirmedBookings.length} confermate, {cancelledBookings.length} cancellate
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Fatturato Totale</CardTitle>
                <EuroIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">
                  €{totalBookings > 0 ? (totalRevenue / totalBookings).toFixed(2) : '0.00'} per prenotazione
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Durata Media</CardTitle>
                <ClockIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{averageRentalTime.toFixed(1)}h</div>
                <p className="text-xs text-muted-foreground">Per noleggio confermato</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Clienti Unici</CardTitle>
                <UserIcon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{uniqueCustomers}</div>
                <p className="text-xs text-muted-foreground">Clienti diversi serviti</p>
              </CardContent>
            </Card>
          </div>

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Performance Prenotazioni</CardTitle>
                <CardDescription>Tassi di successo e cancellazione</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tasso di Conferma</span>
                    <span className="font-medium">
                      {totalBookings > 0 ? ((confirmedBookings.length / totalBookings) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={totalBookings > 0 ? (confirmedBookings.length / totalBookings) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tasso di Cancellazione</span>
                    <span className="font-medium text-red-600">{cancellationRate.toFixed(1)}%</span>
                  </div>
                  <Progress 
                    value={cancellationRate} 
                    className="h-2" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>In Attesa</span>
                    <span className="font-medium text-orange-600">
                      {totalBookings > 0 ? ((pendingBookings.length / totalBookings) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={totalBookings > 0 ? (pendingBookings.length / totalBookings) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Analisi Periodi</CardTitle>
                <CardDescription>Prenotazioni per fascia temporale</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Questa Settimana</span>
                  </div>
                  <Badge variant="default">{thisWeek.length}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm">Questo Mese</span>
                  </div>
                  <Badge variant="secondary">{thisMonth.length}</Badge>
                </div>
                {mostRequestedHour && (
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm">Orario più Richiesto</span>
                    </div>
                    <Badge variant="outline">{mostRequestedHour[0]}:00 ({mostRequestedHour[1]} volte)</Badge>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rental Categories & Guide Services */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tipologie di Noleggio</CardTitle>
                <CardDescription>Distribuzione per categoria</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Noleggi Orari</span>
                    <span className="text-sm font-medium">{hourlyBookings}</span>
                  </div>
                  <Progress 
                    value={confirmedBookings.length > 0 ? (hourlyBookings / confirmedBookings.length) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Mezza Giornata</span>
                    <span className="text-sm font-medium">{halfDayBookings}</span>
                  </div>
                  <Progress 
                    value={confirmedBookings.length > 0 ? (halfDayBookings / confirmedBookings.length) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Giornata Intera</span>
                    <span className="text-sm font-medium">{fullDayBookings}</span>
                  </div>
                  <Progress 
                    value={confirmedBookings.length > 0 ? (fullDayBookings / confirmedBookings.length) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Servizi Guida</CardTitle>
                <CardDescription>Utilizzo del servizio guida</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-electric-green" />
                    <span className="text-sm">Noleggi con Guida</span>
                  </div>
                  <Badge className="bg-electric-green text-white">{guidedBookings}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Ricavi da Servizio Guida</span>
                  <Badge variant="outline">€{guideRevenue.toFixed(2)}</Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tasso di Utilizzo Guida</span>
                    <span className="font-medium">
                      {confirmedBookings.length > 0 ? ((guidedBookings / confirmedBookings.length) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={confirmedBookings.length > 0 ? (guidedBookings / confirmedBookings.length) * 100 : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Bike Analytics */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Bici Più Richieste</CardTitle>
                <CardDescription>Top 5 biciclette per numero di noleggi</CardDescription>
              </CardHeader>
              <CardContent>
                {sortedBikes.length > 0 ? (
                  <div className="space-y-3">
                    {sortedBikes.slice(0, 5).map((bike, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full ${
                            index === 0 ? 'bg-yellow-500' : 
                            index === 1 ? 'bg-gray-400' : 
                            index === 2 ? 'bg-amber-600' : 'bg-muted'
                          }`} />
                          <span className="text-sm font-medium">{bike.type}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{bike.count} noleggi</Badge>
                          <Badge variant="outline">€{bike.revenue.toFixed(0)}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Nessun dato disponibile</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Utilizzo Flotta</CardTitle>
                <CardDescription>Efficienza delle biciclette disponibili</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Biciclette Totali</span>
                  <Badge variant="default">{totalBikesAvailable}</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Noleggi per Bici</span>
                  <Badge variant="outline">
                    {totalBikesAvailable > 0 ? (confirmedBookings.length / totalBikesAvailable).toFixed(1) : 0}
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tasso di Utilizzo</span>
                    <span className="font-medium">
                      {totalBikesAvailable > 0 ? ((confirmedBookings.length / totalBikesAvailable) * 10).toFixed(1) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={totalBikesAvailable > 0 ? Math.min(100, (confirmedBookings.length / totalBikesAvailable) * 10) : 0} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Revenue Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Dettaglio Ricavi</CardTitle>
              <CardDescription>Suddivisione dei ricavi per tipologia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    €{confirmedBookings.filter(b => b.category === 'hourly').reduce((sum, b) => sum + (b.totalPrice || 0), 0).toFixed(0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Noleggi Orari</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    €{confirmedBookings.filter(b => b.category === 'half-day').reduce((sum, b) => sum + (b.totalPrice || 0), 0).toFixed(0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Mezza Giornata</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    €{confirmedBookings.filter(b => b.category === 'full-day').reduce((sum, b) => sum + (b.totalPrice || 0), 0).toFixed(0)}
                  </div>
                  <p className="text-sm text-muted-foreground">Giornata Intera</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">€{guideRevenue.toFixed(0)}</div>
                  <p className="text-sm text-muted-foreground">Servizi Guida</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
