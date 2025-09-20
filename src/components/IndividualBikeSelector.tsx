import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BikeIcon, PlusIcon, MinusIcon, CheckIcon } from "lucide-react";
import type { AvailableBike, BikeDetails } from "./Dashboard";

interface IndividualBikeSelectorProps {
  availableBikes: AvailableBike[];
  selectedBikes: BikeDetails[]; // Keep for compatibility
  onSelectionChange: (bikes: BikeDetails[]) => void;
}

export const IndividualBikeSelector = ({ availableBikes, selectedBikes, onSelectionChange }: IndividualBikeSelectorProps) => {
  const [selectedBikeIds, setSelectedBikeIds] = useState<Set<string>>(new Set());

  const getBikeTypeLabel = (type: string) => {
    switch (type) {
      case "trailer": return "Carrello";
      case "carrello-porta-bimbi": return "Carrello Porta-Bimbi";
      case "bambino": return "Bambino";
      case "adulto": return "Adulto";
      default: return type;
    }
  };

  const getSuspensionLabel = (suspension?: string) => {
    if (!suspension) return "";
    switch (suspension) {
      case "full-suspension": return "Full Suspension";
      case "front": return "Front";
      default: return suspension;
    }
  };

  const isBikeSelected = (bikeId: string): boolean => {
    return selectedBikeIds.has(bikeId);
  };

  const toggleBikeSelection = (bike: AvailableBike) => {
    const newSelectedIds = new Set(selectedBikeIds);

    if (newSelectedIds.has(bike.id)) {
      newSelectedIds.delete(bike.id);
    } else {
      newSelectedIds.add(bike.id);
    }

    setSelectedBikeIds(newSelectedIds);

    // Convert selected individual bikes back to BikeDetails format for compatibility
    const selectedBikesArray = Array.from(newSelectedIds).map(id =>
      availableBikes.find(b => b.id === id)
    ).filter(Boolean) as AvailableBike[];

    // Group by type/size/suspension to create BikeDetails
    const bikeDetailsMap: Record<string, BikeDetails> = {};

    selectedBikesArray.forEach(bike => {
      const key = `${bike.type}-${bike.size || 'none'}-${bike.suspension || 'none'}-${bike.hasTrailerHook || false}`;
      if (!bikeDetailsMap[key]) {
        bikeDetailsMap[key] = {
          type: bike.type,
          size: bike.size!,
          suspension: bike.suspension!,
          hasTrailerHook: bike.hasTrailerHook,
          count: 0
        };
      }
      bikeDetailsMap[key].count++;
    });

    onSelectionChange(Object.values(bikeDetailsMap));
  };

  // Separate bikes and trailers
  const bikes = availableBikes.filter(bike => bike.type !== "trailer" && bike.type !== "carrello-porta-bimbi");
  const trailers = availableBikes.filter(bike => bike.type === "trailer" || bike.type === "carrello-porta-bimbi");

  const renderBike = (bike: AvailableBike) => {
    const isSelected = isBikeSelected(bike.id);

    return (
      <Card
        key={bike.id}
        className={`hover:shadow-md transition-shadow cursor-pointer border-2 ${
          isSelected ? 'border-electric-green bg-electric-green/5' : 'border-gray-200'
        }`}
        onClick={() => toggleBikeSelection(bike)}
      >
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <BikeIcon className="w-5 h-5" />
            <span className="flex-1">{bike.name}</span>
            {isSelected && (
              <div className="bg-electric-green text-white rounded-full p-1">
                <CheckIcon className="w-4 h-4" />
              </div>
            )}
            {bike.hasTrailerHook && (
              <div className="bg-electric-green/20 px-2 py-1 rounded-md flex items-center gap-1">
                <span className="text-xs text-electric-green font-medium">Gancio</span>
              </div>
            )}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            {bike.brand} {bike.model && `• ${bike.model}`}
          </div>
          <div className="space-y-1">
            <Badge variant="outline">{getBikeTypeLabel(bike.type)}</Badge>
            {bike.size && <Badge variant="outline">Taglia {bike.size}</Badge>}
            {bike.suspension && <Badge variant="secondary">{getSuspensionLabel(bike.suspension)}</Badge>}
            {bike.hasTrailerHook !== undefined && (
              <Badge variant={bike.hasTrailerHook ? "default" : "outline"}>
                {bike.hasTrailerHook ? "Con gancio carrello" : "Senza gancio"}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm text-muted-foreground">
            {bike.description}
          </div>
          {bike.minHeight && bike.maxHeight && (
            <div className="text-xs text-muted-foreground">
              Altezza consigliata: {bike.minHeight}-{bike.maxHeight}cm
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Sezione Biciclette */}
      {bikes.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Biciclette Disponibili</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bikes.map(renderBike)}
          </div>
        </div>
      )}

      {/* Sezione Carrelli */}
      {trailers.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Carrelli Disponibili</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {trailers.map(renderBike)}
          </div>
        </div>
      )}

      {bikes.length === 0 && trailers.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <BikeIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nessuna bicicletta o carrello disponibile per le date selezionate</p>
        </div>
      )}

      {selectedBikeIds.size > 0 && (
        <div className="mt-4 p-4 bg-electric-green/10 rounded-lg">
          <h4 className="font-medium text-electric-green mb-2">
            Bici Selezionate ({selectedBikeIds.size})
          </h4>
          <div className="flex flex-wrap gap-2">
            {Array.from(selectedBikeIds).map(bikeId => {
              const bike = availableBikes.find(b => b.id === bikeId);
              return bike ? (
                <Badge key={bikeId} variant="default" className="bg-electric-green">
                  {bike.name}
                </Badge>
              ) : null;
            })}
          </div>
        </div>
      )}
    </div>
  );
};