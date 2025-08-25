import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, SettingsIcon, PlusIcon, BikeIcon } from "lucide-react";
import { format } from "date-fns";
import { it } from "date-fns/locale";
import { BookingForm } from "./BookingForm";
import { SettingsPanel } from "./SettingsPanel";
import { BookingList } from "./BookingList";

export type Booking = {
  id: string;
  customerName: string;
  phone: string;
  email?: string;
  bikeCount: number;
  startTime: string;
  endTime: string;
  date: Date;
  status: "confirmed" | "pending" | "cancelled";
};

export type ShopSettings = {
  totalBikes: number;
  openingTime: string;
  closingTime: string;
  shopName: string;
  phone: string;
  email: string;
};

const defaultSettings: ShopSettings = {
  totalBikes: 10,
  openingTime: "09:00",
  closingTime: "19:00",
  shopName: "EcoRide E-Bike",
  phone: "+39 123 456 7890",
  email: "info@ecoride.it"
};

export const Dashboard = () => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<"day" | "week" | "month">("day");
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [settings, setSettings] = useState<ShopSettings>(defaultSettings);

  const addBooking = (booking: Omit<Booking, "id">) => {
    const newBooking = {
      ...booking,
      id: Date.now().toString(),
    };
    setBookings([...bookings, newBooking]);
    setShowBookingForm(false);
  };

  const getAvailableBikes = (date: Date, startTime: string, endTime: string) => {
    const dayBookings = bookings.filter(
      booking => 
        format(booking.date, "yyyy-MM-dd") === format(date, "yyyy-MM-dd") &&
        booking.status === "confirmed" &&
        ((startTime >= booking.startTime && startTime < booking.endTime) ||
         (endTime > booking.startTime && endTime <= booking.endTime) ||
         (startTime <= booking.startTime && endTime >= booking.endTime))
    );
    
    const bookedBikes = dayBookings.reduce((sum, booking) => sum + booking.bikeCount, 0);
    return settings.totalBikes - bookedBikes;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-professional-blue/10">
      {/* Header */}
      <header className="border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-electric-green to-electric-green-light rounded-lg">
                <BikeIcon className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">{settings.shopName}</h1>
                <p className="text-sm text-muted-foreground">Gestionale Prenotazioni E-Bike</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Bici Totali</span>
                    <Badge variant="secondary">{settings.totalBikes}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Disponibili Oggi</span>
                    <Badge className="bg-available text-white">
                      {getAvailableBikes(selectedDate, "09:00", "19:00")}
                    </Badge>
                  </div>
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
          onClose={() => setShowBookingForm(false)}
          selectedDate={selectedDate}
          settings={settings}
          getAvailableBikes={getAvailableBikes}
        />
      )}

      {showSettings && (
        <SettingsPanel
          settings={settings}
          onSave={setSettings}
          onClose={() => setShowSettings(false)}
        />
      )}
    </div>
  );
};