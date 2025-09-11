import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BikeIcon, PlusIcon, MinusIcon, Zap } from "lucide-react";
import type { BikeDetails } from "./Dashboard";

interface BikeSelectorProps {
  availableBikes: BikeDetails[];
  selectedBikes: BikeDetails[];
  onSelectionChange: (bikes: BikeDetails[]) => void;
}

export const BikeSelector = ({ availableBikes, selectedBikes, onSelectionChange }: BikeSelectorProps) => {
  const getBikeTypeLabel = (type: string) => {
    switch (type) {
      case "trailer": return "Carrello";
      case "carrello-porta-bimbi": return "Carrello Porta-Bimbi";
      default: return type;
    }
  };

  const getSuspensionLabel = (suspension: string) => {
    switch (suspension) {
      case "full-suspension": return "Full Suspension";
      case "front-only": return "Solo Davanti";
      default: return suspension;
    }
  };

  const getSelectedCount = (bike: BikeDetails): number => {
    const selected = selectedBikes.find(
      b => b.type === bike.type && b.size === bike.size && b.suspension === bike.suspension && b.hasTrailerHook === bike.hasTrailerHook
    );
    return selected?.count || 0;
  };

  const updateSelection = (bike: BikeDetails, newCount: number) => {
    const updated = selectedBikes.filter(
      b => !(b.type === bike.type && b.size === bike.size && b.suspension === bike.suspension && b.hasTrailerHook === bike.hasTrailerHook)
    );
    
    if (newCount > 0) {
      updated.push({ ...bike, count: newCount });
    }
    
    onSelectionChange(updated);
  };

  // Separa bici e carrelli
  const bikes = availableBikes.filter(bike => bike.type !== "trailer" && bike.type !== "carrello-porta-bimbi");
  const trailers = availableBikes.filter(bike => bike.type === "trailer" || bike.type === "carrello-porta-bimbi");

  return (
    <div className="space-y-6">
      {/* Sezione Biciclette */}
      {bikes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Bici</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bikes.map((bike, index) => {
              const selectedCount = getSelectedCount(bike);
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                       <BikeIcon className="w-5 h-5" />
                       {getBikeTypeLabel(bike.type)}
                       {bike.hasTrailerHook && (
                         <div className="bg-electric-green/20 px-2 py-1 rounded-md flex items-center gap-1">
                           <span className="text-xs text-electric-green font-medium">Gancio</span>
                         </div>
                       )}
                     </CardTitle>
                    <div className="space-y-1">
                      <Badge variant="outline">Taglia {bike.size}</Badge>
                      <Badge variant="secondary">{getSuspensionLabel(bike.suspension)}</Badge>
                      {bike.hasTrailerHook !== undefined && (
                        <Badge variant={bike.hasTrailerHook ? "default" : "outline"}>
                          {bike.hasTrailerHook ? "Con gancio carrello" : "Senza gancio"}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Disponibili:</span>
                      <Badge variant="default">{bike.count}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Selezionata:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => updateSelection(bike, Math.max(0, selectedCount - 1))}
                          disabled={selectedCount === 0}
                        >
                          <MinusIcon className="w-3 h-3" />
                        </Button>
                        <span className="min-w-[2ch] text-center">{selectedCount}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => updateSelection(bike, Math.min(bike.count, selectedCount + 1))}
                          disabled={selectedCount >= bike.count}
                        >
                          <PlusIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Sezione Carrelli */}
      {trailers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Carrelli</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trailers.map((trailer, index) => {
              const selectedCount = getSelectedCount(trailer);
              return (
                <Card key={index} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BikeIcon className="w-5 h-5" />
                      {getBikeTypeLabel(trailer.type)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Disponibili:</span>
                      <Badge variant="default">{trailer.count}</Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Selezionata:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => updateSelection(trailer, Math.max(0, selectedCount - 1))}
                          disabled={selectedCount === 0}
                        >
                          <MinusIcon className="w-3 h-3" />
                        </Button>
                        <span className="min-w-[2ch] text-center">{selectedCount}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          type="button"
                          onClick={() => updateSelection(trailer, Math.min(trailer.count, selectedCount + 1))}
                          disabled={selectedCount >= trailer.count}
                        >
                          <PlusIcon className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {bikes.length === 0 && trailers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <BikeIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nessuna bicicletta o carrello disponibile per le date selezionate</p>
        </div>
      )}
    </div>
  );
};