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
    }
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
        debugMode: updates.debug_mode ?? serverConfig.debug_mode
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
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({
        title: "Export completato",
        description: "I dati sono stati esportati con successo."
      });
    } catch (error) {
      toast({
        title: "Errore export",
        description: "Impossibile esportare i dati.",
        variant: "destructive"
      });
    }
  };

  const handleImportData = async (file: File) => {
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      await apiService.importAllData(data);
      
      toast({
        title: "Import completato",
        description: "I dati sono stati importati con successo."
      });
      
      refetchStats();
      refetchConfig();
    } catch (error) {
      toast({
        title: "Errore import",
        description: "Impossibile importare i dati. Verifica il formato del file.",
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
        <TabsList className="grid w-full grid-cols-6">
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

          {/* Data Management */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderIcon className="w-5 h-5" />
                Gestione Dati
              </CardTitle>
              <CardDescription>
                Export, import e backup dei dati
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button onClick={handleExportData} variant="outline">
                  <DownloadIcon className="w-4 h-4 mr-2" />
                  Export Dati
                </Button>
                
                <div>
                  <input
                    type="file"
                    accept=".json"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImportData(file);
                    }}
                    className="hidden"
                    id="import-file"
                  />
                  <Button asChild variant="outline">
                    <label htmlFor="import-file" className="cursor-pointer">
                      <UploadIcon className="w-4 h-4 mr-2" />
                      Import Dati
                    </label>
                  </Button>
                </div>
                
                <Button onClick={handleCreateBackup} variant="outline">
                  <DatabaseIcon className="w-4 h-4 mr-2" />
                  Backup Manuale
                </Button>
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
                  }}
                >
                  <RefreshCwIcon className="w-4 h-4 mr-2" />
                  Aggiorna Tutto
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => {
                    const endpoint = `${apiConfig.baseUrl}/docs`;
                    window.open(endpoint, '_blank');
                  }}
                >
                  <InfoIcon className="w-4 h-4 mr-2" />
                  API Docs
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};