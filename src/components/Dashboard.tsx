import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, SettingsIcon, PlusIcon, BikeIcon, BarChart3Icon } from "lucide-react";
import rabbiEbikeLogo from "@/assets/rabbi-ebike-logo.png";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { BookingForm } from "./BookingForm";
import { SettingsPanel } from "./SettingsPanel";
import { BookingList } from "./BookingList";
import { Statistics } from "./Statistics";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { useServerStatus } from "@/hooks/useApi";
import { DevPanel } from "./DevPanel";
import { Garage } from "./Garage";

// Import types from dedicated file
import type { BikeType, BikeSize, BikeSuspension, BikeDetails, Bike, MaintenanceRecord } from "@/types/bike";
export type { BikeType, BikeSize, BikeSuspension, BikeDetails, Bike, MaintenanceRecord };

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
    { type: "adulto", size: "S", suspension: "front-only", count: 2 },
    { type: "adulto", size: "M", suspension: "front-only", count: 3 },
    { type: "adulto", size: "L", suspension: "front-only", count: 2 },
    { type: "adulto", size: "M", suspension: "full-suspension", count: 2 },
    { type: "bambino", size: "S", suspension: "front-only", count: 1 },
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
      suspension: "front-only",
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
      suspension: "front-only",
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
  const [showGarage, setShowGarage] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { isOnline } = useServerStatus();

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
        setBookings(bookingsData.map((b: any) => ({ ...b, date: new Date(b.date) })));
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
    setShowBookingForm(false);
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
        const key = `${bike.type}-${bike.size}-${bike.suspension}`;
        bookedByType[key] = (bookedByType[key] || 0) + bike.count;
      });
    });
    
    // Group garage bikes by type/size/suspension/hasTrailerHook and count available
    const bikeGroups: Record<string, BikeDetails> = {};
    settings.bikes.filter(bike => bike.isActive).forEach(bike => {
      const key = `${bike.type}-${bike.size}-${bike.suspension}-${bike.hasTrailerHook}`;
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
      const key = `${bike.type}-${bike.size}-${bike.suspension}-${bike.hasTrailerHook}`;
      const booked = bookedByType[key] || 0;
      return {
        ...bike,
        count: Math.max(0, bike.count - booked)
      };
    }).filter(bike => bike.count > 0);
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
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img 
                src="/logo.png" 
                alt="Rabbi E-Bike Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-2xl font-bold text-foreground">{settings.shopName}</h1>
                <p className="text-sm text-muted-foreground">Gestionale Prenotazioni E-Bike</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowStatistics(true)}
                className="gap-2"
              >
                <BarChart3Icon className="w-4 h-4" />
                Statistiche
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGarage(true)}
                className="gap-2"
              >
                <BikeIcon className="w-4 h-4" />
                Garage
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="gap-2"
              >
                <SettingsIcon className="w-4 h-4" />
                Impostazioni
              </Button>
              <Button
                onClick={() => setShowBookingForm(true)}
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
                />
                
                {/* Quick Stats */}
                <div className="mt-4 space-y-2">
                  {(() => {
                    const availableBikes = getAvailableBikes(selectedDate, "09:00", "19:00", "hourly").filter(bike => bike.type !== "trailer").reduce((sum, bike) => sum + bike.count, 0);
                    const totalBikes = settings.bikes.filter(bike => bike.isActive && bike.type !== "trailer").length;
                    const bikePercentage = totalBikes > 0 ? availableBikes / totalBikes : 0;
                    
                    const availableTrailers = getAvailableBikes(selectedDate, "09:00", "19:00", "hourly").filter(bike => bike.type === "trailer").reduce((sum, bike) => sum + bike.count, 0);
                    const totalTrailers = settings.bikes.filter(bike => bike.isActive && bike.type === "trailer").length;
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
            setShowBookingForm(false);
            setEditingBooking(null);
          }}
          selectedDate={selectedDate}
          settings={settings}
          getAvailableBikes={getAvailableBikes}
          editingBooking={editingBooking}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showStatistics && (
        <Statistics
          bookings={bookings}
          settings={settings}
          onClose={() => setShowStatistics(false)}
        />
      )}

      {showGarage && (
        <Garage
          bikes={settings.bikes || []}
          onUpdateBikes={(bikes) => {
            const updatedSettings = { ...settings, bikes };
            setSettings(updatedSettings);
            handleSaveSettings(updatedSettings);
          }}
          onClose={() => setShowGarage(false)}
        />
      )}
    </div>
  );
};