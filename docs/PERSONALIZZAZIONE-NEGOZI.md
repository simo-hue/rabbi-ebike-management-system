# 🛠️ Personalizzazione per Negozi Specifici

## 📚 Indice
- [Panoramica Personalizzazione](#-panoramica-personalizzazione)
- [Branding e Interfaccia](#-branding-e-interfaccia)
- [Personalizzazione Funzionalità](#-personalizzazione-funzionalità)
- [Integrazioni Hardware](#-integrazioni-hardware)
- [Automazioni Specifiche](#-automazioni-specifiche)
- [Reporting Personalizzato](#-reporting-personalizzato)
- [Multi-Lingua](#-multi-lingua)

---

## 🎯 Panoramica Personalizzazione

Rabbi E-Bike può essere facilmente personalizzato per adattarsi alle specifiche esigenze di ogni negozio di noleggio biciclette.

### **🏪 Tipologie di Negozi Supportate:**
- **Negozi turistici** - Focus su prenotazioni rapide e lingue multiple
- **Negozi sportivi** - Bici specializzate, equipment tracking
- **Negozi urbani** - E-bike, abbonamenti, clienti business
- **Centri outdoor** - Tour guidati, gruppi, meteo integration
- **Negozi stagionali** - Gestione alta/bassa stagione

---

## 🎨 Branding e Interfaccia

### **Logo e Colori Personalizzati**

#### **Modifica Logo:**
```typescript
// src/components/Layout.tsx
const SHOP_LOGO = "/images/logo-negozio.png"  // Sostituisci con il tuo logo
const SHOP_NAME = "Il Tuo Nome Negozio"       // Nome personalizzato

// public/images/ - aggiungi i tuoi file:
// - logo-negozio.png (180x60px raccomandato)
// - favicon.ico
// - apple-touch-icon.png (192x192px)
```

#### **Schema Colori Personalizzato:**
```css
/* src/styles/custom-theme.css */
:root {
  /* Colori principali negozio */
  --primary-color: #your-brand-color;        /* Es: #2563eb */
  --secondary-color: #your-accent-color;     /* Es: #059669 */ 
  --background-color: #your-bg-color;       /* Es: #f8fafc */
  
  /* Colori funzionali */
  --success-color: #10b981;   /* Prenotazioni confermate */
  --warning-color: #f59e0b;   /* Attenzioni */
  --error-color: #ef4444;     /* Errori/cancellazioni */
  --info-color: #3b82f6;      /* Informazioni */
}

/* Applica ai componenti principali */
.dashboard-header {
  background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
}

.booking-card {
  border-left: 4px solid var(--primary-color);
}
```

#### **Layout Personalizzato per Tablet:**
```typescript
// src/components/TabletLayout.tsx - Per uso tablet reception
export const TabletLayout = () => {
  return (
    <div className="tablet-optimized">
      {/* Pulsanti grandi per touch */}
      <Button size="xl" className="touch-friendly">
        + Nuova Prenotazione
      </Button>
      
      {/* Calendario ingrandito */}
      <Calendar 
        cellSize="large" 
        touchOptimized={true}
        showWeekNumbers={false}  // Meno clutter
      />
      
      {/* Quick actions sempre visibili */}
      <QuickActions 
        actions={['checkin', 'checkout', 'available', 'emergency']}
        position="bottom-fixed"
      />
    </div>
  )
}
```

---

## ⚙️ Personalizzazione Funzionalità

### **Tipi di Biciclette Specifici**

#### **Aggiungere Nuovi Tipi:**
```sql
-- server/database/custom-bike-types.sql
INSERT INTO bikes (type, size, suspension, hasTrailerHitch, quantity, customFields) VALUES
-- Bici specializzate per negozi sportivi
('mountain-pro', 'L', 'full-suspension', 0, 2, '{"brand":"Trek","model":"Fuel EX","year":2024}'),
('road-carbon', 'M', 'none', 0, 1, '{"brand":"Specialized","model":"Tarmac","weight":"7.2kg"}'),
('gravel-adventure', 'L', 'none', 0, 3, '{"brand":"Canyon","model":"Grail","tubeless":true}'),

-- E-bike con specifiche tecniche
('ebike-city', 'M', 'solo-anteriore', 1, 5, '{"battery":"500Wh","range":"80km","charging":"4h"}'),
('ebike-mountain', 'L', 'full-suspension', 0, 2, '{"battery":"625Wh","range":"60km","motor":"Bosch"}'),

-- Bici speciali per turismo
('tandem', 'XL', 'none', 0, 1, '{"capacity":"2 persone","weight":"25kg"}'),
('cargo-bike', 'L', 'none', 1, 2, '{"capacity":"40kg carico","passengers":"2 bambini"}'),
('handcycle', 'adjustable', 'none', 0, 1, '{"accessibility":"disabili","hand-operated":true}');
```

#### **Campi Personalizzati per Biciclette:**
```typescript
// src/types/bike.ts - Estendi interfaccia
interface CustomBike extends Bike {
  // Campi tecnici
  brand?: string
  model?: string
  year?: number
  weight?: string
  
  // E-bike specific
  batteryCapacity?: string
  range?: string
  chargingTime?: string
  motorType?: string
  
  // Caratteristiche speciali
  accessories?: string[]  // ['helmet', 'lock', 'lights', 'basket']
  condition?: 'new' | 'excellent' | 'good' | 'fair'
  lastService?: Date
  nextServiceDue?: Date
  
  // Business logic
  dailyRate?: number      // Tariffa specifica per questa bici
  hourlyRate?: number
  deposit?: number        // Cauzione richiesta
}
```

### **Prezzi Dinamici e Stagionali**

#### **Sistema Prezzi Avanzato:**
```typescript
// src/services/pricing.ts
export class DynamicPricing {
  calculatePrice(bike: Bike, duration: number, season: string, customer: Customer): number {
    let basePrice = this.getBasePrice(bike.type, duration)
    
    // Moltiplicatori stagionali
    const seasonMultiplier = {
      'alta-stagione': 1.3,      // Estate: +30%
      'media-stagione': 1.0,     // Primavera/Autunno
      'bassa-stagione': 0.8      // Inverno: -20%
    }
    
    // Sconti fedeltà
    const loyaltyDiscount = customer.rentalsCount > 10 ? 0.1 : 0
    
    // Weekend premium
    const weekendMultiplier = this.isWeekend() ? 1.2 : 1.0
    
    // Sconto gruppi (5+ bici)
    const groupDiscount = duration >= 5 ? 0.15 : 0
    
    const finalPrice = basePrice 
      * seasonMultiplier[season]
      * weekendMultiplier
      * (1 - loyaltyDiscount)
      * (1 - groupDiscount)
    
    return Math.round(finalPrice * 100) / 100  // 2 decimali
  }
  
  // Prezzi personalizzati per tipo negozio
  getBasePrice(bikeType: string, duration: number): number {
    const priceMatrix = {
      'tourist-shop': {
        'standard': { hourly: 8, daily: 25 },
        'premium': { hourly: 12, daily: 35 },
        'ebike': { hourly: 15, daily: 45 }
      },
      'sport-shop': {
        'road': { hourly: 12, daily: 40 },
        'mountain': { hourly: 15, daily: 50 },
        'professional': { hourly: 25, daily: 80 }
      }
    }
    
    // Logica di calcolo basata su configurazione negozio
    return this.calculateFromMatrix(priceMatrix, bikeType, duration)
  }
}
```

---

## 🔌 Integrazioni Hardware

### **Lettore Codici a Barre/QR per Inventario**

```typescript
// src/services/barcode-scanner.ts
export class BarcodeIntegration {
  private scanner: any
  
  async initializeScanner() {
    // Integrazione con lettori USB comuni
    const scanners = [
      'Honeywell Voyager 1200g',
      'Symbol LS2208',
      'Zebra DS2208'
    ]
    
    this.scanner = await this.detectScanner()
    this.scanner.onScan = this.handleBarcodeScanned
  }
  
  handleBarcodeScanned = (barcode: string) => {
    // Trova bici dal codice
    const bike = this.findBikeByBarcode(barcode)
    
    if (bike) {
      // Auto-compilazione form noleggio
      this.autoFillRentalForm(bike)
      
      // Aggiorna status disponibilità
      this.updateBikeAvailability(bike.id, 'rented')
      
      // Stampa etichetta se necessario
      this.printRentalLabel(bike)
    }
  }
  
  async printRentalLabel(bike: Bike) {
    // Integrazione stampante etichette (Brother, DYMO, etc.)
    const labelData = {
      bikeId: bike.id,
      bikeType: bike.type,
      customerName: this.currentRental.customerName,
      returnTime: this.currentRental.endTime,
      qrCode: this.generateQRCode(bike.id)
    }
    
    await this.labelPrinter.print(labelData)
  }
}
```

### **Sistema POS/Cassa Integration**

```typescript
// src/services/pos-integration.ts
export class POSIntegration {
  // Integrazione con sistemi POS comuni
  private posSystem: 'Square' | 'SumUp' | 'iZettle' | 'Stripe Terminal'
  
  async processPayment(amount: number, paymentMethod: string) {
    switch(this.posSystem) {
      case 'Square':
        return await this.squarePayment(amount)
      case 'SumUp':
        return await this.sumUpPayment(amount)
      case 'Stripe Terminal':
        return await this.stripeTerminalPayment(amount)
    }
  }
  
  async generateReceipt(booking: Booking, payment: Payment) {
    const receipt = {
      shopName: this.shopConfig.name,
      shopAddress: this.shopConfig.address,
      shopPhone: this.shopConfig.phone,
      
      customerName: booking.customerName,
      rentalDate: booking.startDate,
      bikes: booking.bikes,
      amount: payment.amount,
      paymentMethod: payment.method,
      
      // QR code per tracking
      trackingQR: this.generateTrackingQR(booking.id)
    }
    
    // Stampa scontrino
    await this.thermalPrinter.printReceipt(receipt)
    
    // Email opzionale
    if (booking.customerEmail) {
      await this.emailService.sendReceipt(booking.customerEmail, receipt)
    }
  }
}
```

---

## 🤖 Automazioni Specifiche

### **Check-in/Check-out Automatico**

```typescript
// src/services/auto-checkin.ts
export class AutoCheckinService {
  // NFC/RFID per checkin rapido
  async setupNFCReader() {
    this.nfcReader.onTagDetected = async (tagId: string) => {
      const bike = await this.findBikeByNFC(tagId)
      
      if (bike.status === 'rented') {
        // Auto check-out
        await this.processCheckOut(bike)
        this.showMessage(`✅ Bici ${bike.id} restituita automaticamente`)
      } else if (bike.status === 'available') {
        // Quick rent per clienti registrati
        const customer = await this.getFrequentCustomer()
        if (customer) {
          await this.quickRent(bike, customer)
        }
      }
    }
  }
  
  // Reminder automatici via SMS/WhatsApp
  async setupRentalReminders() {
    // Controlla ogni 30 minuti
    setInterval(async () => {
      const overdueRentals = await this.getOverdueRentals()
      
      for (const rental of overdueRentals) {
        if (rental.customerPhone) {
          await this.sendReminderSMS(rental)
        }
        
        // Escalation dopo 2 ore
        if (rental.minutesOverdue > 120) {
          await this.notifyManager(rental)
        }
      }
    }, 30 * 60 * 1000)
  }
  
  async sendReminderSMS(rental: Booking) {
    const message = `
🚴‍♂️ ${this.shopConfig.name}
Ciao ${rental.customerName}, 
la tua bici è in ritardo!
Previsto rientro: ${rental.endTime}
Grazie per il sollecito ritorno.
    `.trim()
    
    await this.smsService.send(rental.customerPhone, message)
  }
}
```

### **Gestione Manutenzione Preventiva**

```typescript
// src/services/maintenance-scheduler.ts
export class MaintenanceScheduler {
  async schedulePreventiveMaintenance() {
    const bikes = await this.getAllBikes()
    
    for (const bike of bikes) {
      const maintenanceNeeded = this.calculateMaintenanceNeeds(bike)
      
      if (maintenanceNeeded.urgent) {
        // Rimuovi dalla disponibilità
        await this.setBikeUnavailable(bike, 'maintenance-required')
        
        // Notifica staff
        await this.notifyMaintenance({
          bike,
          issue: maintenanceNeeded.issues,
          priority: 'urgent'
        })
      } else if (maintenanceNeeded.scheduled) {
        // Pianifica per periodo bassa attività
        await this.scheduleMaintenance(bike, maintenanceNeeded.suggestedDate)
      }
    }
  }
  
  calculateMaintenanceNeeds(bike: Bike) {
    const usage = bike.totalRentalHours || 0
    const daysSinceService = this.daysBetween(bike.lastServiceDate, new Date())
    
    return {
      urgent: usage > 200 || daysSinceService > 60,  // Servizio ogni 200h o 60 giorni
      scheduled: usage > 150 || daysSinceService > 45,
      issues: this.detectIssues(bike),
      suggestedDate: this.findOptimalMaintenanceSlot()
    }
  }
}
```

---

## 📊 Reporting Personalizzato

### **Dashboard Personalizzati per Tipologia Negozio**

```typescript
// src/components/CustomDashboards.tsx
export const TouristShopDashboard = () => {
  return (
    <div className="tourist-dashboard">
      {/* KPI turistici */}
      <MetricsGrid>
        <Metric title="Clienti Stranieri" value="75%" color="blue" />
        <Metric title="Durata Media" value="4.5 ore" color="green" />
        <Metric title="Peak Hours" value="10-16" color="orange" />
        <Metric title="Guide Richieste" value="23%" color="purple" />
      </MetricsGrid>
      
      {/* Mappa heat utilizzo */}
      <UsageHeatMap 
        data={bikingRoutes}
        overlay="tourist-attractions"
      />
      
      {/* Previsioni meteo integrate */}
      <WeatherForecast 
        impact="rental-demand"
        recommendations={true}
      />
      
      {/* Lingue clienti */}
      <LanguageBreakdown />
    </div>
  )
}

export const SportShopDashboard = () => {
  return (
    <div className="sport-dashboard">
      {/* Performance tracking */}
      <BikePerformanceMetrics />
      
      {/* Clienti competitivi */}
      <CompetitiveCustomers />
      
      {/* Equipment upselling */}
      <UpsellOpportunities />
      
      {/* Event calendar */}
      <SportsEventCalendar />
    </div>
  )
}
```

### **Report Automatici Personalizzati**

```typescript
// src/services/custom-reporting.ts
export class CustomReportGenerator {
  async generateMonthlyReport(shopType: string) {
    const reportConfig = {
      'tourist': {
        focus: ['nationality-breakdown', 'seasonal-trends', 'guide-service-uptake'],
        charts: ['heatmap-usage', 'language-pie', 'weather-correlation']
      },
      'sport': {
        focus: ['bike-performance', 'customer-loyalty', 'equipment-rental'],
        charts: ['performance-trends', 'customer-segments', 'upsell-success']
      },
      'urban': {
        focus: ['commuter-patterns', 'subscription-health', 'peak-hour-analysis'],
        charts: ['hourly-usage', 'route-popularity', 'subscription-churn']
      }
    }
    
    const config = reportConfig[shopType]
    const report = await this.buildReport(config)
    
    // Auto-send via email
    await this.emailReport(report)
    
    return report
  }
  
  async generateCustomKPIs(negozio: ShopConfig) {
    // KPI personalizzati basati su business model
    const kpis = {
      // Efficienza operativa
      'bikes-per-day-utilization': await this.calculateBikeUtilization(),
      'average-rental-duration': await this.getAverageRentalDuration(),
      'peak-capacity-usage': await this.getPeakCapacityUsage(),
      
      // Performance finanziaria
      'revenue-per-bike-per-day': await this.getRevenuePerBike(),
      'customer-acquisition-cost': await this.getCustomerAcquisitionCost(),
      'customer-lifetime-value': await this.getCustomerLifetimeValue(),
      
      // Soddisfazione cliente (da feedback)
      'nps-score': await this.calculateNPS(),
      'return-customer-rate': await this.getReturnCustomerRate(),
      'complaint-resolution-time': await this.getComplaintResolutionTime()
    }
    
    return kpis
  }
}
```

---

## 🌍 Multi-Lingua

### **Setup Internazionalizzazione**

```typescript
// src/i18n/languages.ts
export const languages = {
  'it': {
    name: 'Italiano',
    flag: '🇮🇹',
    translations: {
      'booking.new': 'Nuova Prenotazione',
      'bike.available': 'Disponibile',
      'customer.phone': 'Telefono'
    }
  },
  'en': {
    name: 'English', 
    flag: '🇬🇧',
    translations: {
      'booking.new': 'New Booking',
      'bike.available': 'Available', 
      'customer.phone': 'Phone'
    }
  },
  'de': {
    name: 'Deutsch',
    flag: '🇩🇪', 
    translations: {
      'booking.new': 'Neue Buchung',
      'bike.available': 'Verfügbar',
      'customer.phone': 'Telefon'
    }
  },
  'fr': {
    name: 'Français',
    flag: '🇫🇷',
    translations: {
      'booking.new': 'Nouvelle Réservation',
      'bike.available': 'Disponible',
      'customer.phone': 'Téléphone'
    }
  },
  'es': {
    name: 'Español',
    flag: '🇪🇸',
    translations: {
      'booking.new': 'Nueva Reserva',
      'bike.available': 'Disponible',
      'customer.phone': 'Teléfono'
    }
  }
}

// Componente per selezione lingua
export const LanguageSwitcher = () => {
  const { language, setLanguage } = useI18n()
  
  return (
    <Select value={language} onValueChange={setLanguage}>
      {Object.entries(languages).map(([code, lang]) => (
        <SelectItem key={code} value={code}>
          {lang.flag} {lang.name}
        </SelectItem>
      ))}
    </Select>
  )
}
```

### **Template Email Multi-Lingua**

```typescript
// src/services/email-templates.ts
export class MultiLanguageEmails {
  getConfirmationEmail(booking: Booking, language: string) {
    const templates = {
      'it': {
        subject: '✅ Conferma Prenotazione Bici - {{shopName}}',
        body: `
Ciao {{customerName}},

La tua prenotazione è confermata! 🚴‍♂️

📅 Data: {{date}}
⏰ Orario: {{startTime}} - {{endTime}}  
🚲 Biciclette: {{bikeList}}
💰 Totale: €{{total}}

Ti aspettiamo presso:
{{shopAddress}}

Porta un documento d'identità valido.

Buona pedalata! 
{{shopName}}
        `
      },
      'en': {
        subject: '✅ Bike Rental Confirmation - {{shopName}}',
        body: `
Hello {{customerName}},

Your booking is confirmed! 🚴‍♂️

📅 Date: {{date}}
⏰ Time: {{startTime}} - {{endTime}}
🚲 Bikes: {{bikeList}}
💰 Total: €{{total}}

See you at:
{{shopAddress}}

Please bring valid ID.

Happy riding!
{{shopName}}
        `
      }
    }
    
    return this.processTemplate(templates[language], booking)
  }
}
```

---

## 🎯 Checklist Personalizzazione

### ✅ **Branding Base:**
- [ ] Logo negozio sostituito
- [ ] Colori brand applicati
- [ ] Nome negozio personalizzato
- [ ] Favicon e icone aggiornate

### ✅ **Funzionalità Specifiche:**
- [ ] Tipi bici personalizzati aggiunti
- [ ] Prezzi adattati al mercato locale
- [ ] Campi custom per business needs
- [ ] Automazioni specifiche attivate

### ✅ **Integrazioni Hardware:**
- [ ] Lettore barcode configurato (se presente)
- [ ] Stampante ricevute collegata (se presente)
- [ ] Sistema pagamenti integrato (se necessario)

### ✅ **Multi-Lingua (se turistico):**
- [ ] Lingue principali clientela aggiunte
- [ ] Template email tradotti
- [ ] Interfaccia localizzata

---

**🛠️ Per personalizzazioni avanzate:** Contatta su GitHub con tag `customization` specificando tipo negozio e esigenze particolari.

**Made with ❤️ by Simone Mattioli** | Rabbi E-Bike Management System v1.0.0