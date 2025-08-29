import { format, isSameDay, startOfWeek, endOfWeek, eachDayOfInterval, addDays } from "date-fns";
import { it } from "date-fns/locale";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CalendarIcon, ClockIcon, UserIcon, PhoneIcon, MailIcon, BikeIcon, TrashIcon, EditIcon } from "lucide-react";
import { DailyCalendarView } from "./DailyCalendarView";
import type { Booking, ShopSettings, BikeDetails } from "./Dashboard";

interface BookingListProps {
  bookings: Booking[];
  selectedDate: Date;
  viewMode: "day" | "week" | "month";
  settings: ShopSettings;
  onUpdateBooking: (bookingId: string) => void;
  onEditBooking: (booking: Booking) => void;
  onDateSelect: (date: Date) => void;
  onViewModeChange: (mode: "day" | "week" | "month") => void;
}

export const BookingList = ({ bookings, selectedDate, viewMode, settings, onUpdateBooking, onEditBooking, onDateSelect, onViewModeChange }: BookingListProps) => {

  const handleBookingClick = (bookingDate: Date) => {
    onDateSelect(bookingDate);
    onViewModeChange("day");
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
  const getFilteredBookings = () => {
    switch (viewMode) {
      case "day":
        return bookings.filter(booking => isSameDay(booking.date, selectedDate));
      
      case "week":
        const weekStart = startOfWeek(selectedDate, { locale: it });
        const weekEnd = endOfWeek(selectedDate, { locale: it });
        return bookings.filter(booking => 
          booking.date >= weekStart && booking.date <= weekEnd
        );
      
      case "month":
        return bookings.filter(booking => 
          booking.date.getMonth() === selectedDate.getMonth() &&
          booking.date.getFullYear() === selectedDate.getFullYear()
        );
      
      default:
        return [];
    }
  };

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

  const getBookingForTimeSlot = (date: Date, timeSlot: string) => {
    return bookings.find(booking => 
      isSameDay(booking.date, date) &&
      booking.startTime <= timeSlot &&
      booking.endTime > timeSlot &&
      booking.status === "confirmed"
    );
  };

  const getStatusColor = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return "bg-available text-white";
      case "pending":
        return "bg-booked text-white";
      case "cancelled":
        return "bg-unavailable text-white";
      default:
        return "bg-secondary";
    }
  };

  const getStatusText = (status: Booking["status"]) => {
    switch (status) {
      case "confirmed":
        return "Confermata";
      case "pending":
        return "In Attesa";
      case "cancelled":
        return "Annullata";
      default:
        return status;
    }
  };

  const handleDeleteBooking = (bookingId: string) => {
    onUpdateBooking(bookingId);
  };

  const renderDayView = () => {
    const dayBookings = getFilteredBookings().sort((a, b) => 
      a.startTime.localeCompare(b.startTime)
    );

    if (dayBookings.length === 0) {
      return (
        <div className="text-center py-8">
          <CalendarIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Nessuna prenotazione per oggi</p>
          <p className="text-sm text-muted-foreground mt-1">
            Le prenotazioni appariranno qui quando verranno create
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {dayBookings.map((booking) => (
          <Card key={booking.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="space-y-3 flex-1">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <UserIcon className="w-4 h-4 text-electric-green" />
                      <span className="font-medium">{booking.customerName}</span>
                    </div>
                    <Badge className={getStatusColor(booking.status)}>
                      {getStatusText(booking.status)}
                    </Badge>
                    <Badge variant="outline" className="bg-primary/10">
                      {getCategoryText(booking.category)}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{booking.startTime} - {booking.endTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <BikeIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{getBikeDetailsText(booking.bikeDetails)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <PhoneIcon className="w-4 h-4 text-muted-foreground" />
                      <span>{booking.phone}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    {booking.email && (
                      <div className="flex items-center gap-2 text-sm">
                        <MailIcon className="w-4 h-4 text-muted-foreground" />
                        <span>{booking.email}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-muted-foreground">Totale:</span>
                      <span className="text-primary">€{booking.totalPrice}</span>
                      {booking.needsGuide && <Badge variant="secondary" className="text-xs">Con Guida</Badge>}
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
                    onClick={() => handleDeleteBooking(booking.id)}
                  >
                    <TrashIcon className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderWeekView = () => {
    const weekStart = startOfWeek(selectedDate, { locale: it });
    const weekDays = eachDayOfInterval({
      start: weekStart,
      end: endOfWeek(selectedDate, { locale: it })
    });

    const weekBookings = getFilteredBookings();
    const bookingsByDate = weekBookings.reduce((acc, booking) => {
      const dateKey = format(booking.date, "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(booking);
      return acc;
    }, {} as Record<string, Booking[]>);

    return (
      <div className="space-y-4">
        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-3">
          {/* Header giorni settimana */}
          {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
            <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-b">
              {day}
            </div>
          ))}
          
          {/* Giorni della settimana */}
          {weekDays.map((day) => {
            const dateKey = format(day, "yyyy-MM-dd");
            const dayBookings = bookingsByDate[dateKey] || [];
            const isToday = isSameDay(day, new Date());
            
            return (
              <Card key={day.toISOString()} className={`min-h-[150px] hover:shadow-md transition-shadow ${isToday ? 'ring-2 ring-electric-green/30' : ''}`}>
                <CardContent className="p-3">
                  <div className={`text-sm font-medium mb-2 ${isToday ? 'text-electric-green font-bold' : ''}`}>
                    <div className="flex items-center justify-between">
                      <span>{format(day, "d")}</span>
                      {dayBookings.length > 0 && (
                        <Badge variant="secondary" className="text-xs">
                          {dayBookings.length}
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground font-normal mt-1">
                      {format(day, "MMM", { locale: it })}
                    </div>
                  </div>
                  <div className="space-y-1">
                    {dayBookings.slice(0, 4).map((booking) => (
                      <div 
                        key={booking.id} 
                        className={`text-xs p-2 rounded cursor-pointer transition-colors ${
                          booking.status === 'confirmed' ? 'bg-available/10 hover:bg-available/20 border border-available/20' :
                          booking.status === 'pending' ? 'bg-booked/10 hover:bg-booked/20 border border-booked/20' :
                          'bg-unavailable/10 hover:bg-unavailable/20 border border-unavailable/20'
                        }`}
                        title={`${booking.customerName} - ${booking.startTime}-${booking.endTime} - ${getBikeDetailsText(booking.bikeDetails)}`}
                        onClick={() => handleBookingClick(day)}
                      >
                        <div className="font-medium truncate">{booking.customerName}</div>
                        <div className="text-muted-foreground truncate">
                          {booking.startTime}-{booking.endTime}
                        </div>
                        <div className="text-muted-foreground truncate">
                          {getCategoryText(booking.category)}
                        </div>
                      </div>
                    ))}
                    {dayBookings.length > 4 && (
                      <div className="text-xs text-muted-foreground text-center py-1">
                        +{dayBookings.length - 4} altro/i
                      </div>
                    )}
                    {dayBookings.length === 0 && (
                      <div className="text-xs text-muted-foreground/50 text-center py-8">
                        Nessuna prenotazione
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderMonthView = () => {
    const monthBookings = getFilteredBookings();
    const bookingsByDate = monthBookings.reduce((acc, booking) => {
      const dateKey = format(booking.date, "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(booking);
      return acc;
    }, {} as Record<string, Booking[]>);

    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

    return (
      <div className="grid grid-cols-7 gap-2">
        {/* Header giorni settimana */}
        {['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'].map((day) => (
          <div key={day} className="p-2 text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}
        
        {/* Giorni del mese */}
        {monthDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayBookings = bookingsByDate[dateKey] || [];
          
          return (
            <Card key={day.toISOString()} className="min-h-[100px] hover:shadow-md transition-shadow">
              <CardContent className="p-2">
                <div className="text-sm font-medium mb-1">
                  {format(day, "d")}
                </div>
                <div className="space-y-1">
                  {dayBookings.slice(0, 3).map((booking) => (
                    <div 
                      key={booking.id} 
                      className="text-xs p-1 bg-electric-green/10 rounded truncate cursor-pointer hover:bg-electric-green/20 transition-colors"
                      onClick={() => handleBookingClick(day)}
                      title={`${booking.customerName} - ${booking.startTime}-${booking.endTime}`}
                    >
                      {booking.customerName}
                    </div>
                  ))}
                  {dayBookings.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{dayBookings.length - 3} altro/i
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {viewMode === "day" && (
        <DailyCalendarView
          bookings={bookings}
          selectedDate={selectedDate}
          settings={settings}
          onEditBooking={onEditBooking}
          onDeleteBooking={onUpdateBooking}
        />
      )}
      {viewMode === "week" && renderWeekView()}
      {viewMode === "month" && renderMonthView()}
    </div>
  );
};