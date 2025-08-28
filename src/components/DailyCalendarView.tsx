import { format, parse, isSameDay } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { BikeIcon, EditIcon, TrashIcon, ClockIcon, UserIcon, PhoneIcon } from "lucide-react";
import type { Booking, ShopSettings, BikeDetails } from "./Dashboard";

interface DailyCalendarViewProps {
  bookings: Booking[];
  selectedDate: Date;
  settings: ShopSettings;
  onEditBooking: (booking: Booking) => void;
  onDeleteBooking: (bookingId: string) => void;
}

export const DailyCalendarView = ({ 
  bookings, 
  selectedDate, 
  settings, 
  onEditBooking, 
  onDeleteBooking 
}: DailyCalendarViewProps) => {
  
  const generateTimeSlots = () => {
    const slots = [];
    const [openHour] = settings.openingTime.split(':').map(Number);
    const [closeHour] = settings.closingTime.split(':').map(Number);
    
    for (let hour = openHour; hour <= closeHour; hour++) {
      slots.push(`${hour.toString().padStart(2, '0')}:00`);
      if (hour < closeHour) {
        slots.push(`${hour.toString().padStart(2, '0')}:30`);
      }
    }
    return slots;
  };

  const getDayBookings = () => {
    return bookings.filter(booking => isSameDay(booking.date, selectedDate));
  };

  const getBikeDetailsText = (bikeDetails: BikeDetails[]): string => {
    return bikeDetails.map(bike => {
      const type = bike.type === "bambino" ? "Bambino" : "Adulto";
      const suspension = bike.suspension === "full-suspension" ? "Full-Sus" : "Front";
      return `${bike.count}x ${type} ${bike.size} (${suspension})`;
    }).join(", ");
  };

  const getCategoryText = (category: string): string => {
    switch (category) {
      case "hourly": return "Oraria";
      case "half-day": return "Mezza Giornata";
      case "full-day": return "Giornata Intera";
      default: return category;
    }
  };

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-available/20 border-available text-available-foreground";
      case "pending":
        return "bg-booked/20 border-booked text-booked-foreground";
      case "cancelled":
        return "bg-unavailable/20 border-unavailable text-unavailable-foreground";
      default:
        return "bg-muted/20 border-muted text-muted-foreground";
    }
  };

  const getBookingDuration = (startTime: string, endTime: string) => {
    const start = parse(startTime, 'HH:mm', new Date());
    const end = parse(endTime, 'HH:mm', new Date());
    const diffInMinutes = (end.getTime() - start.getTime()) / (1000 * 60);
    return diffInMinutes / 30; // Number of 30-minute slots
  };

  const getTimeSlotIndex = (time: string, timeSlots: string[]) => {
    return timeSlots.findIndex(slot => slot === time);
  };

  const timeSlots = generateTimeSlots();
  const dayBookings = getDayBookings();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {format(selectedDate, "EEEE d MMMM yyyy", { locale: it })}
          </h2>
          <p className="text-muted-foreground">
            {dayBookings.length} prenotazioni per oggi
          </p>
        </div>
        <Badge variant="outline" className="bg-electric-green/10">
          <ClockIcon className="w-4 h-4 mr-2" />
          {settings.openingTime} - {settings.closingTime}
        </Badge>
      </div>

      {/* Calendar Timeline */}
      <Card className="overflow-hidden shadow-lg">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <h3 className="text-lg font-semibold">Programmazione Giornaliera</h3>
            <div className="flex gap-3 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-available/50 border border-available"></div>
                <span>Partenza</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-destructive/50 border border-destructive"></div>
                <span>Rientro</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            {/* Time slots grid */}
            <div className="divide-y divide-border">
              {timeSlots.map((slot, index) => (
                <div key={slot} className="relative flex min-h-[60px]">
                  {/* Time label */}
                  <div className="w-20 flex-shrink-0 p-3 text-sm font-medium text-muted-foreground bg-muted/30 border-r border-border">
                    {slot}
                  </div>
                  
                  {/* Content area */}
                  <div className="flex-1 relative p-3">
                    {/* Find bookings that start or end at this time */}
                    {dayBookings.map((booking) => {
                      const isStartTime = booking.startTime === slot;
                      const isEndTime = booking.endTime === slot;
                      
                      if (!isStartTime && !isEndTime) return null;
                      
                      return (
                        <div key={`${booking.id}-${isStartTime ? 'start' : 'end'}`} className="mb-2">
                          {isStartTime && (
                            <div className={`
                              flex items-center justify-between p-3 rounded-lg border-l-4 
                              ${getStatusColor(booking.status)}
                              hover:shadow-md transition-all duration-200
                              border-l-available
                            `}>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                  <Badge className="bg-available text-white">
                                    PARTENZA
                                  </Badge>
                                  <span className="font-semibold">{booking.customerName}</span>
                                  <Badge variant="outline">
                                    {getCategoryText(booking.category)}
                                  </Badge>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                                  <div className="flex items-center gap-2">
                                    <BikeIcon className="w-4 h-4 text-muted-foreground" />
                                    <span>{getBikeDetailsText(booking.bikeDetails)}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                                    <span>{booking.phone}</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <ClockIcon className="w-4 h-4 text-muted-foreground" />
                                    <span>fino alle {booking.endTime}</span>
                                  </div>
                                  <div className="text-primary font-medium">
                                    €{booking.totalPrice}
                                    {booking.needsGuide && (
                                      <span className="ml-2 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded">
                                        Con Guida
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex gap-2 ml-4">
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 w-8 p-0"
                                  onClick={() => onEditBooking(booking)}
                                >
                                  <EditIcon className="w-3 h-3" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="outline" 
                                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive hover:text-destructive-foreground"
                                  onClick={() => onDeleteBooking(booking.id)}
                                >
                                  <TrashIcon className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          )}
                          
                          {isEndTime && (
                            <div className={`
                              flex items-center justify-between p-3 rounded-lg border-l-4 
                              bg-destructive/10 border-destructive/20 text-destructive-foreground
                              hover:shadow-md transition-all duration-200
                              border-l-destructive
                            `}>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <Badge className="bg-destructive text-white">
                                    RIENTRO
                                  </Badge>
                                  <span className="font-semibold">{booking.customerName}</span>
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  {getBikeDetailsText(booking.bikeDetails)}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    
                    {/* Empty slot indicator */}
                    {!dayBookings.some(booking => 
                      booking.startTime === slot || booking.endTime === slot
                    ) && (
                      <div className="text-muted-foreground/50 text-sm py-4">
                        Nessuna attività
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-available">{dayBookings.filter(b => b.status === 'confirmed').length}</div>
              <div className="text-sm text-muted-foreground">Prenotazioni Confermate</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-booked">{dayBookings.filter(b => b.status === 'pending').length}</div>
              <div className="text-sm text-muted-foreground">In Attesa</div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                €{dayBookings.reduce((sum, booking) => sum + booking.totalPrice, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Ricavi Totali</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};