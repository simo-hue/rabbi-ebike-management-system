import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
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
  FileTextIcon
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

export const DevPanel = () => {
  const [apiConfig, setApiConfig] = useState(apiService.getConfig());
  const [isTestingConnection, setIsTestingConnection] = useState(false);
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

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
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

      {/* Server Configuration */}
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

      {/* Database Management */}
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

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Azioni Rapide</CardTitle>
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
              Cancella Cache Browser
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                window.location.reload();
              }}
            >
              Ricarica Applicazione
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                const data = {
                  config: apiConfig,
                  serverStatus: isOnline,
                  timestamp: new Date().toISOString()
                };
                navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                toast({
                  title: "Info copiate",
                  description: "Informazioni di debug copiate negli appunti."
                });
              }}
            >
              Copia Info Debug
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};