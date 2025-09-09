import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/services/api";
import { useServerStatus, useApiData } from "@/hooks/useApi";
import { 
  ServerIcon, 
  DatabaseIcon, 
  SettingsIcon, 
  RefreshCwIcon, 
  CheckCircleIcon, 
  XCircleIcon,
  DownloadIcon,
  HardDriveIcon,
  ClockIcon,
  FileTextIcon,
  PlayIcon,
  BookIcon,
  AlertTriangleIcon,
  InfoIcon,
  UploadIcon,
  MonitorIcon,
  ActivityIcon,
  TimerIcon,
  FolderIcon,
  CopyIcon,
  TrashIcon
} from "lucide-react";

interface ServerConfig {
  id: number;
  server_port: number;
  auto_backup: boolean;
  backup_interval_hours: number;
  max_backup_files: number;
  debug_mode: boolean;
  // New e-bike specific settings
  notification_email?: string;
  sms_notifications?: boolean;
  maintenance_reminder_days?: number;
  low_battery_alert?: boolean;
  auto_pricing_updates?: boolean;
  peak_hour_multiplier?: number;
  seasonal_discount?: number;
  minimum_booking_hours?: number;
  max_booking_days?: number;
  weather_integration?: boolean;
  gps_tracking?: boolean;
  insurance_required?: boolean;
}

interface DatabaseStats {
  totalBookings: number;
  totalBikeTypes: number;
  totalBikes: number;
  databaseSize: number;
  lastModified: string;
}

interface PerformanceMetrics {
  avgResponseTime: number;
  totalRequests: number;
  errorRate: number;
  uptime: number;
}

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  details?: string;
}

interface SetupStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

export const DevPanel = () => {
  const [apiConfig, setApiConfig] = useState(apiService.getConfig());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [activeTab, setActiveTab] = useState("setup");
  const { toast } = useToast();
  const { isOnline, checking, checkStatus } = useServerStatus();
  
  const { data: serverConfig, loading: configLoading, refetch: refetchConfig } = useApiData<ServerConfig>(
    () => apiService.getServerConfig(),
    []
  );
  
  const { data: dbStats, loading: statsLoading, refetch: refetchStats } = useApiData<DatabaseStats>(
    () => apiService.getDatabaseStats(),
    []
  );

  const { data: performanceMetrics, loading: perfLoading, refetch: refetchPerf } = useApiData<PerformanceMetrics>(
    () => apiService.getPerformanceMetrics(),
    []
  );

  const setupSteps: SetupStep[] = [
    {
      id: 'server-install',
      title: 'Installa dipendenze server',
      description: 'Naviga nella cartella server/ ed esegui: npm install',
      completed: false,
      required: true
    },
    {
      id: 'server-start',
      title: 'Avvia il server locale',
      description: 'Esegui: npm start per avviare il server sulla porta 3001',
      completed: isOnline,
      required: true
    },
    {
      id: 'connection-test',
      title: 'Testa la connessione',
      description: 'Verifica che il client possa comunicare con il server',
      completed: isOnline,
      required: true
    },
    {
      id: 'database-setup',
      title: 'Inizializza database',
      description: 'Il database SQLite verrà creato automaticamente al primo avvio',
      completed: !!dbStats,
      required: true
    },
    {
      id: 'backup-config',
      title: 'Configura backup automatici',
      description: 'Imposta i backup automatici per proteggere i tuoi dati',
      completed: serverConfig?.auto_backup ?? false,
      required: false
    },
  ];

  const handleApiConfigUpdate = () => {
    apiService.updateConfig(apiConfig);
    toast({
      title: "Configurazione aggiornata",
      description: "Le impostazioni di connessione sono state salvate."
    });
  };

  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    try {
      await apiService.healthCheck();
      toast({
        title: "Connessione riuscita",
        description: "Il server è raggiungibile e funzionante."
      });
    } catch (error) {
      toast({
        title: "Connessione fallita",
        description: "Impossibile connettersi al server locale.",
        variant: "destructive"
      });
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleServerConfigUpdate = async (updates: Partial<ServerConfig>) => {
    if (!serverConfig) return;
    
    try {
      await apiService.updateServerConfig({
        serverPort: updates.server_port ?? serverConfig.server_port,
        autoBackup: updates.auto_backup ?? serverConfig.auto_backup,
        backupIntervalHours: updates.backup_interval_hours ?? serverConfig.backup_interval_hours,
        maxBackupFiles: updates.max_backup_files ?? serverConfig.max_backup_files,
        debugMode: updates.debug_mode ?? serverConfig.debug_mode,
        notificationEmail: updates.notification_email ?? serverConfig.notification_email,
        smsNotifications: updates.sms_notifications ?? serverConfig.sms_notifications,
        maintenanceReminderDays: updates.maintenance_reminder_days ?? serverConfig.maintenance_reminder_days,
        lowBatteryAlert: updates.low_battery_alert ?? serverConfig.low_battery_alert,
        autoPricingUpdates: updates.auto_pricing_updates ?? serverConfig.auto_pricing_updates,
        peakHourMultiplier: updates.peak_hour_multiplier ?? serverConfig.peak_hour_multiplier,
        seasonalDiscount: updates.seasonal_discount ?? serverConfig.seasonal_discount,
        minimumBookingHours: updates.minimum_booking_hours ?? serverConfig.minimum_booking_hours,
        maxBookingDays: updates.max_booking_days ?? serverConfig.max_booking_days,
        weatherIntegration: updates.weather_integration ?? serverConfig.weather_integration,
        gpsTracking: updates.gps_tracking ?? serverConfig.gps_tracking,
        insuranceRequired: updates.insurance_required ?? serverConfig.insurance_required
      });
      
      toast({
        title: "Configurazione server aggiornata",
        description: "Le impostazioni del server sono state salvate."
      });
      
      refetchConfig();
    } catch (error) {
      toast({
        title: "Errore",
        description: "Impossibile aggiornare la configurazione del server.",
        variant: "destructive"
      });
    }
  };

  const handleCreateBackup = async () => {
    try {
      const result = await apiService.createBackup();
      toast({
        title: "Backup creato",
        description: `Backup salvato con successo.`
      });
      refetchStats();
    } catch (error) {
      toast({
        title: "Errore backup",
        description: "Impossibile creare il backup del database.",
        variant: "destructive"
      });
    }
  };

  const handleExportData = async () => {
    try {
      const data = await apiService.exportAllData();
      
      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
      const filename = `rabbi-ebike-backup-${timestamp}.json`;
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Backup Completo Creato",
        description: `Backup salvato come ${filename}. Include tutti i dati: prenotazioni, bici, impostazioni e configurazioni.`
      });
    } catch (error) {
      toast({
        title: "Errore Backup",
        description: "Impossibile creare il backup completo.",
        variant: "destructive"
      });
    }
  };

  const handleImportData = async (file: File) => {
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      
      // Validate backup structure
      if (!backupData.data || !backupData.version) {
        throw new Error('File di backup non valido o formato non riconosciuto');
      }
      
      // Show confirmation dialog for restore
      const confirmed = window.confirm(
        `⚠️ ATTENZIONE: Questa operazione sostituirà TUTTI i dati esistenti con quelli del backup.\n\n` +
        `Backup del: ${new Date(backupData.exportDate).toLocaleString('it-IT')}\n` +
        `Versione: ${backupData.version}\n` +
        `Prenotazioni: ${backupData.stats?.totalBookings || 'N/A'}\n` +
        `Biciclette: ${backupData.stats?.totalBikes || 'N/A'}\n\n` +
        `Sei sicuro di voler continuare? Questa operazione NON è reversibile.`
      );
      
      if (!confirmed) {
        return;
      }
      
      // Perform restore
      const result = await apiService.importAllData(backupData);
      
      toast({
        title: "Ripristino Completo Riuscito",
        description: `Sistema ripristinato dal backup del ${new Date(backupData.exportDate).toLocaleDateString('it-IT')}. Ricarica la pagina per vedere le modifiche.`
      });
      
      // Refresh all data
      refetchStats();
      refetchConfig();
      refetchPerf();
      
      // Suggest page reload
      setTimeout(() => {
        const shouldReload = window.confirm('Per vedere tutti i cambiamenti, è consigliabile ricaricare la pagina. Ricaricare ora?');
        if (shouldReload) {
          window.location.reload();
        }
      }, 2000);
      
    } catch (error) {
      console.error('Restore error:', error);
      toast({
        title: "Errore Ripristino",
        description: error.message || "Impossibile ripristinare dal backup. Verifica il formato del file.",
        variant: "destructive"
      });
    }
  };

  const fetchLogs = async () => {
    try {
      const serverLogs = await apiService.getLogs();
      setLogs(serverLogs);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const getStepIcon = (step: SetupStep) => {
    if (step.completed) return <CheckCircleIcon className="w-4 h-4 text-green-500" />;
    if (step.required) return <AlertTriangleIcon className="w-4 h-4 text-orange-500" />;
    return <InfoIcon className="w-4 h-4 text-blue-500" />;
  };

  const completedSteps = setupSteps.filter(step => step.completed).length;
  const setupProgress = (completedSteps / setupSteps.length) * 100;

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="setup">
            <BookIcon className="w-4 h-4 mr-2" />
            Setup
          </TabsTrigger>
          <TabsTrigger value="connection">
            <ServerIcon className="w-4 h-4 mr-2" />
            Connessione
          </TabsTrigger>
          <TabsTrigger value="server">
            <SettingsIcon className="w-4 h-4 mr-2" />
            Server
          </TabsTrigger>
          <TabsTrigger value="ebike">
            <InfoIcon className="w-4 h-4 mr-2" />
            E-Bike
          </TabsTrigger>
          <TabsTrigger value="database">
            <DatabaseIcon className="w-4 h-4 mr-2" />
            Database
          </TabsTrigger>
          <TabsTrigger value="monitoring">
            <ActivityIcon className="w-4 h-4 mr-2" />
            Monitoring
          </TabsTrigger>
          <TabsTrigger value="tools">
            <FolderIcon className="w-4 h-4 mr-2" />
            Tools
          </TabsTrigger>
        </TabsList>

        {/* Setup Guide Tab */}
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookIcon className="w-5 h-5" />
                Guida Configurazione Iniziale
              </CardTitle>
              <CardDescription>
                Segui questi passaggi per configurare correttamente l'applicazione
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Progresso Setup</span>
                  <span className="text-sm text-muted-foreground">
                    {completedSteps}/{setupSteps.length} completati
                  </span>
                </div>
                <Progress value={setupProgress} className="w-full" />
              </div>

              <Separator />

              <div className="space-y-4">
                {setupSteps.map((step, index) => (
                  <div key={step.id} className="flex gap-4 p-4 border rounded-lg">
                    <div className="flex-shrink-0 mt-1">
                      {getStepIcon(step)}
                    </div>
                    <div className="flex-grow space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{index + 1}. {step.title}</span>
                        {step.required && <Badge variant="secondary">Richiesto</Badge>}
                        {step.completed && <Badge variant="default">Completato</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground">{step.description}</p>
                      
                      {step.id === 'server-install' && (
                        <div className="mt-2 p-3 bg-muted rounded-md">
                          <code className="text-sm">
                            cd server/<br/>
                            npm install<br/>
                            npm start
                          </code>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {setupProgress === 100 && (
                <Alert>
                  <CheckCircleIcon className="h-4 w-4" />
                  <AlertTitle>Configurazione Completata!</AlertTitle>
                  <AlertDescription>
                    Tutti i passaggi sono stati completati. L'applicazione è pronta per l'uso.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Connection Tab */}
        <TabsContent value="connection" className="space-y-4">
          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ServerIcon className="w-5 h-5" />
            Stato Connessione Server
          </CardTitle>
          <CardDescription>
            Monitoraggio e configurazione della connessione al server locale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {checking ? (
                <RefreshCwIcon className="w-4 h-4 animate-spin" />
              ) : isOnline ? (
                <CheckCircleIcon className="w-4 h-4 text-green-500" />
              ) : (
                <XCircleIcon className="w-4 h-4 text-red-500" />
              )}
              <span className="text-sm">
                Server: {checking ? "Verifica..." : isOnline ? "Online" : "Offline"}
              </span>
              <Badge variant={isOnline ? "default" : "destructive"}>
                {isOnline ? "Connesso" : "Disconnesso"}
              </Badge>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={checkStatus}
              disabled={checking}
            >
              <RefreshCwIcon className="w-4 h-4 mr-2" />
              Aggiorna
            </Button>
          </div>

          <Separator />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">URL Server</Label>
              <Input
                id="baseUrl"
                value={apiConfig.baseUrl}
                onChange={(e) => setApiConfig({ ...apiConfig, baseUrl: e.target.value })}
                placeholder="http://localhost:3001/api"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={apiConfig.timeout}
                onChange={(e) => setApiConfig({ ...apiConfig, timeout: parseInt(e.target.value) || 10000 })}
                placeholder="10000"
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleApiConfigUpdate}
              variant="outline"
            >
              <SettingsIcon className="w-4 h-4 mr-2" />
              Salva Configurazione
            </Button>
            <Button
              onClick={handleTestConnection}
              disabled={isTestingConnection}
              variant="outline"
            >
              {isTestingConnection ? (
                <RefreshCwIcon className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircleIcon className="w-4 h-4 mr-2" />
              )}
              Testa Connessione
            </Button>
          </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Server Configuration Tab */}
        <TabsContent value="server" className="space-y-4">

          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            Configurazione Server
          </CardTitle>
          <CardDescription>
            Impostazioni avanzate del server locale
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {configLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCwIcon className="w-4 h-4 animate-spin" />
              <span>Caricamento configurazione...</span>
            </div>
          ) : serverConfig ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="serverPort">Porta Server</Label>
                  <Input
                    id="serverPort"
                    type="number"
                    value={serverConfig.server_port}
                    onChange={(e) => handleServerConfigUpdate({ 
                      server_port: parseInt(e.target.value) || 3001 
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="backupInterval">Intervallo Backup (ore)</Label>
                  <Input
                    id="backupInterval"
                    type="number"
                    value={serverConfig.backup_interval_hours}
                    onChange={(e) => handleServerConfigUpdate({ 
                      backup_interval_hours: parseInt(e.target.value) || 24 
                    })}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="maxBackups">Max File Backup</Label>
                  <Input
                    id="maxBackups"
                    type="number"
                    value={serverConfig.max_backup_files}
                    onChange={(e) => handleServerConfigUpdate({ 
                      max_backup_files: parseInt(e.target.value) || 30 
                    })}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Backup Automatico</Label>
                    <p className="text-sm text-muted-foreground">
                      Esegue backup automatici del database
                    </p>
                  </div>
                  <Switch
                    checked={serverConfig.auto_backup}
                    onCheckedChange={(checked) => handleServerConfigUpdate({ auto_backup: checked })}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Modalità Debug</Label>
                    <p className="text-sm text-muted-foreground">
                      Abilita logging dettagliato del server
                    </p>
                  </div>
                  <Switch
                    checked={serverConfig.debug_mode}
                    onCheckedChange={(checked) => handleServerConfigUpdate({ debug_mode: checked })}
                  />
                </div>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Server non raggiungibile</p>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* E-Bike Advanced Settings Tab */}
        <TabsContent value="ebike" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <InfoIcon className="w-5 h-5" />
                Configurazione Avanzata E-Bike
              </CardTitle>
              <CardDescription>
                Impostazioni specifiche per il noleggio e-bike
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {configLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  <span>Caricamento configurazione...</span>
                </div>
              ) : serverConfig ? (
                <>
                  {/* Business Rules */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Regole di Business</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="maxBookingDays">Massimo Giorni Prenotazione</Label>
                        <Input
                          id="maxBookingDays"
                          type="number"
                          value={serverConfig.max_booking_days || 7}
                          onChange={(e) => handleServerConfigUpdate({ 
                            max_booking_days: parseInt(e.target.value) || 7 
                          })}
                          placeholder="7"
                        />
                        <p className="text-xs text-muted-foreground">
                          Numero massimo di giorni che un cliente può prenotare in anticipo
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="minimumBookingHours2">Durata Minima Noleggio (ore)</Label>
                        <Input
                          id="minimumBookingHours2"
                          type="number"
                          value={serverConfig.minimum_booking_hours || 1}
                          onChange={(e) => handleServerConfigUpdate({ 
                            minimum_booking_hours: parseInt(e.target.value) || 1 
                          })}
                          placeholder="1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Durata minima per ogni noleggio
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Notification System */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Sistema Notifiche</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="notificationEmail2">Email Amministratore</Label>
                        <Input
                          id="notificationEmail2"
                          type="email"
                          value={serverConfig.notification_email || ''}
                          onChange={(e) => handleServerConfigUpdate({ 
                            notification_email: e.target.value 
                          })}
                          placeholder="admin@rabbibike.com"
                        />
                        <p className="text-xs text-muted-foreground">
                          Email per ricevere notifiche importanti
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="maintenanceReminder2">Promemoria Manutenzione (giorni)</Label>
                        <Input
                          id="maintenanceReminder2"
                          type="number"
                          value={serverConfig.maintenance_reminder_days || 30}
                          onChange={(e) => handleServerConfigUpdate({ 
                            maintenance_reminder_days: parseInt(e.target.value) || 30 
                          })}
                          placeholder="30"
                        />
                        <p className="text-xs text-muted-foreground">
                          Frequenza promemoria per controlli bici
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label>Notifiche SMS</Label>
                          <p className="text-sm text-muted-foreground">
                            Invia SMS di conferma ai clienti
                          </p>
                        </div>
                        <Switch
                          checked={serverConfig.sms_notifications || false}
                          onCheckedChange={(checked) => handleServerConfigUpdate({ sms_notifications: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label>Alert Batteria Scarica</Label>
                          <p className="text-sm text-muted-foreground">
                            Avviso quando batteria inferiore al 20%
                          </p>
                        </div>
                        <Switch
                          checked={serverConfig.low_battery_alert || false}
                          onCheckedChange={(checked) => handleServerConfigUpdate({ low_battery_alert: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Pricing & Revenue */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Prezzi e Ricavi</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="peakHourMultiplier2">Moltiplicatore Ore di Punta</Label>
                        <Input
                          id="peakHourMultiplier2"
                          type="number"
                          step="0.1"
                          value={serverConfig.peak_hour_multiplier || 1.5}
                          onChange={(e) => handleServerConfigUpdate({ 
                            peak_hour_multiplier: parseFloat(e.target.value) || 1.5 
                          })}
                          placeholder="1.5"
                        />
                        <p className="text-xs text-muted-foreground">
                          Es: 1.5 = +50% durante ore di punta
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="seasonalDiscount2">Sconto Stagionale (%)</Label>
                        <Input
                          id="seasonalDiscount2"
                          type="number"
                          value={serverConfig.seasonal_discount || 0}
                          onChange={(e) => handleServerConfigUpdate({ 
                            seasonal_discount: parseInt(e.target.value) || 0 
                          })}
                          placeholder="15"
                        />
                        <p className="text-xs text-muted-foreground">
                          Sconto percentuale per stagione bassa
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label>Prezzi Dinamici</Label>
                          <p className="text-sm text-muted-foreground">
                            Aggiorna automaticamente i prezzi
                          </p>
                        </div>
                        <Switch
                          checked={serverConfig.auto_pricing_updates || false}
                          onCheckedChange={(checked) => handleServerConfigUpdate({ auto_pricing_updates: checked })}
                        />
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Advanced Features */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold">Funzionalità Avanzate</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label>Integrazione Meteo</Label>
                          <p className="text-sm text-muted-foreground">
                            Considera condizioni meteo per suggerimenti
                          </p>
                        </div>
                        <Switch
                          checked={serverConfig.weather_integration || false}
                          onCheckedChange={(checked) => handleServerConfigUpdate({ weather_integration: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label>Tracciamento GPS</Label>
                          <p className="text-sm text-muted-foreground">
                            Monitora posizione bici in tempo reale
                          </p>
                        </div>
                        <Switch
                          checked={serverConfig.gps_tracking || false}
                          onCheckedChange={(checked) => handleServerConfigUpdate({ gps_tracking: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label>Assicurazione Obbligatoria</Label>
                          <p className="text-sm text-muted-foreground">
                            Richiedi assicurazione per ogni noleggio
                          </p>
                        </div>
                        <Switch
                          checked={serverConfig.insurance_required || false}
                          onCheckedChange={(checked) => handleServerConfigUpdate({ insurance_required: checked })}
                        />
                      </div>
                      
                      <div className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="space-y-1">
                          <Label>Modalità Manutenzione</Label>
                          <p className="text-sm text-muted-foreground">
                            Sistema di gestione manutenzioni
                          </p>
                        </div>
                        <Switch
                          checked={false} // Da implementare
                          onCheckedChange={(checked) => {
                            toast({
                              title: "Funzionalità in arrivo",
                              description: "La gestione manutenzioni sarà disponibile presto."
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex gap-2 pt-4">
                    <Button onClick={refetchConfig} variant="outline">
                      <RefreshCwIcon className="w-4 h-4 mr-2" />
                      Ricarica Configurazione
                    </Button>
                    <Button 
                      onClick={() => {
                        toast({
                          title: "Configurazione salvata",
                          description: "Tutte le impostazioni sono state applicate."
                        });
                      }}
                      variant="default"
                    >
                      <CheckCircleIcon className="w-4 h-4 mr-2" />
                      Applica Tutto
                    </Button>
                  </div>
                </>
              ) : (
                <p className="text-muted-foreground">Server non raggiungibile</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Database Management Tab */}
        <TabsContent value="database" className="space-y-4">

          <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseIcon className="w-5 h-5" />
            Gestione Database
          </CardTitle>
          <CardDescription>
            Statistiche e operazioni sul database SQLite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {statsLoading ? (
            <div className="flex items-center gap-2">
              <RefreshCwIcon className="w-4 h-4 animate-spin" />
              <span>Caricamento statistiche...</span>
            </div>
          ) : dbStats ? (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <FileTextIcon className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium">Prenotazioni</span>
                  </div>
                  <p className="text-2xl font-bold">{dbStats.totalBookings}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HardDriveIcon className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium">Biciclette</span>
                  </div>
                  <p className="text-2xl font-bold">{dbStats.totalBikes}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <DatabaseIcon className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-medium">Dimensione DB</span>
                  </div>
                  <p className="text-lg font-bold">{formatFileSize(dbStats.databaseSize)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <ClockIcon className="w-4 h-4 text-orange-500" />
                    <span className="text-sm font-medium">Ultima Modifica</span>
                  </div>
                  <p className="text-sm">
                    {new Date(dbStats.lastModified).toLocaleDateString('it-IT')}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex gap-2">
                <Button
                  onClick={handleCreateBackup}
                  variant="outline"
                >
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Crea Backup
                </Button>
                <Button
                  onClick={refetchStats}
                  variant="outline"
                >
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  Aggiorna Statistiche
                </Button>
              </div>
            </>
          ) : (
            <p className="text-muted-foreground">Database non accessibile</p>
          )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ActivityIcon className="w-5 h-5" />
                Monitoraggio Performance
              </CardTitle>
              <CardDescription>
                Statistiche delle prestazioni del server
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {perfLoading ? (
                <div className="flex items-center gap-2">
                  <RefreshCwIcon className="w-4 h-4 animate-spin" />
                  <span>Caricamento metriche...</span>
                </div>
              ) : performanceMetrics ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <TimerIcon className="w-4 h-4 text-blue-500" />
                      <span className="text-sm font-medium">Tempo Risposta</span>
                    </div>
                    <p className="text-2xl font-bold">{performanceMetrics.avgResponseTime}ms</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MonitorIcon className="w-4 h-4 text-green-500" />
                      <span className="text-sm font-medium">Richieste Totali</span>
                    </div>
                    <p className="text-2xl font-bold">{performanceMetrics.totalRequests}</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <XCircleIcon className="w-4 h-4 text-red-500" />
                      <span className="text-sm font-medium">Tasso Errori</span>
                    </div>
                    <p className="text-2xl font-bold">{(performanceMetrics.errorRate * 100).toFixed(1)}%</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <ClockIcon className="w-4 h-4 text-purple-500" />
                      <span className="text-sm font-medium">Uptime</span>
                    </div>
                    <p className="text-lg font-bold">{formatUptime(performanceMetrics.uptime)}</p>
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground">Metriche non disponibili</p>
              )}

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Log Server</Label>
                  <Button onClick={fetchLogs} variant="outline" size="sm">
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                    Aggiorna Log
                  </Button>
                </div>
                
                <div className="max-h-64 overflow-y-auto border rounded-md p-3 bg-muted/50">
                  {logs.length > 0 ? (
                    <div className="space-y-2">
                      {logs.map((log, index) => (
                        <div key={index} className="text-xs font-mono">
                          <span className="text-muted-foreground">{log.timestamp}</span>
                          <span className={`ml-2 px-2 py-1 rounded text-xs ${
                            log.level === 'error' ? 'bg-red-100 text-red-800' :
                            log.level === 'warn' ? 'bg-yellow-100 text-yellow-800' :
                            log.level === 'info' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {log.level.toUpperCase()}
                          </span>
                          <span className="ml-2">{log.message}</span>
                          {log.details && (
                            <div className="ml-4 mt-1 text-muted-foreground">{log.details}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm">Nessun log disponibile</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tools Tab */}
        <TabsContent value="tools" className="space-y-4">

          {/* Data Management - COMPLETE BACKUP & RESTORE */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DatabaseIcon className="w-5 h-5" />
                Backup e Ripristino Completo
              </CardTitle>
              <CardDescription>
                Sistema completo di backup e ripristino per tutti i dati del sistema
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Backup Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <DownloadIcon className="w-5 h-5 text-green-600" />
                  <h4 className="text-lg font-semibold">Creazione Backup</h4>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <InfoIcon className="w-5 h-5 text-green-600 mt-0.5" />
                    <div className="space-y-2">
                      <p className="text-sm font-medium text-green-800">
                        Il backup completo include:
                      </p>
                      <ul className="text-sm text-green-700 space-y-1 ml-4">
                        <li>• Tutte le prenotazioni e relazioni bici-prenotazioni</li>
                        <li>• Inventario completo delle biciclette</li>
                        <li>• Impostazioni del negozio (prezzi, orari, contatti)</li>
                        <li>• Configurazioni del server</li>
                        <li>• Schema del database per ripristino completo</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button 
                    onClick={handleExportData} 
                    className="bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    <DownloadIcon className="w-5 h-5 mr-2" />
                    Crea Backup Completo
                  </Button>
                  
                  <Button onClick={handleCreateBackup} variant="outline" size="lg">
                    <DatabaseIcon className="w-4 h-4 mr-2" />
                    Backup Database (.db)
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Restore Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <UploadIcon className="w-5 h-5 text-orange-600" />
                  <h4 className="text-lg font-semibold">Ripristino Sistema</h4>
                </div>
                
                <Alert className="border-orange-200 bg-orange-50">
                  <AlertTriangleIcon className="h-4 w-4 text-orange-600" />
                  <AlertTitle className="text-orange-800">Attenzione</AlertTitle>
                  <AlertDescription className="text-orange-700">
                    Il ripristino <strong>sostituirà completamente</strong> tutti i dati esistenti. 
                    Assicurati di aver creato un backup prima di procedere. Questa operazione non è reversibile.
                  </AlertDescription>
                </Alert>

                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportData(file);
                    }}
                    className="hidden"
                    id="restore-file"
                  />
                  <Button 
                    asChild 
                    variant="outline" 
                    size="lg"
                    className="border-orange-300 text-orange-700 hover:bg-orange-50"
                  >
                    <label htmlFor="restore-file" className="cursor-pointer">
                      <UploadIcon className="w-5 h-5 mr-2" />
                      Ripristina da Backup
                    </label>
                  </Button>
                </div>
              </div>

              <Separator />

              {/* Quick Actions */}
              <div className="space-y-4">
                <h4 className="text-lg font-semibold">Azioni Rapide</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    onClick={() => {
                      const confirmed = window.confirm(
                        'Questa azione creerà un backup automatico prima di procedere con la manutenzione. Continuare?'
                      );
                      if (confirmed) {
                        handleExportData();
                        toast({
                          title: "Backup di sicurezza creato",
                          description: "Backup automatico creato per manutenzione."
                        });
                      }
                    }}
                    variant="outline"
                  >
                    <DatabaseIcon className="w-4 h-4 mr-2" />
                    Backup di Sicurezza
                  </Button>
                  
                  <Button
                    onClick={() => {
                      refetchStats();
                      refetchConfig();
                      toast({
                        title: "Dati aggiornati",
                        description: "Statistiche e configurazioni ricaricate."
                      });
                    }}
                    variant="outline"
                  >
                    <RefreshCwIcon className="w-4 h-4 mr-2" />
                    Aggiorna Stato Sistema
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Development Tools */}
          <Card>
            <CardHeader>
              <CardTitle>Strumenti Sviluppo</CardTitle>
              <CardDescription>
                Operazioni di sviluppo e manutenzione
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    localStorage.clear();
                    toast({
                      title: "Cache cancellata",
                      description: "Tutti i dati locali sono stati rimossi."
                    });
                  }}
                >
                  <TrashIcon className="w-4 h-4 mr-2" />
                  Cancella Cache Browser
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    window.location.reload();
                  }}
                >
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  Ricarica Applicazione
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const data = {
                      config: apiConfig,
                      serverStatus: isOnline,
                      serverConfig,
                      dbStats,
                      performanceMetrics,
                      timestamp: new Date().toISOString()
                    };
                    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                    toast({
                      title: "Info copiate",
                      description: "Informazioni di debug copiate negli appunti."
                    });
                  }}
                >
                  <CopyIcon className="w-4 h-4 mr-2" />
                  Copia Info Debug
                </Button>
                
                <Button
                  variant="outline"
                  onClick={refetchPerf}
                >
                  <ActivityIcon className="w-4 h-4 mr-2" />
                  Aggiorna Metriche
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    checkStatus();
                    refetchConfig();
                    refetchStats();
                    refetchPerf();
                    toast({
                      title: "Dati aggiornati",
                      description: "Tutte le informazioni sono state ricaricate."
                    });
                  }}
                >
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  Aggiorna Tutto
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    );
  };
export default DevPanel;
