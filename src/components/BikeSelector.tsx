import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BikeIcon, PlusIcon, MinusIcon } from "lucide-react";
import type { BikeDetails } from "./Dashboard";

interface BikeSelectorProps {
  availableBikes: BikeDetails[];
  selectedBikes: BikeDetails[];
  onSelectionChange: (bikes: BikeDetails[]) => void;
}

export const BikeSelector = ({ availableBikes, selectedBikes, onSelectionChange }: BikeSelectorProps) => {
  const getBikeTypeLabel = (type: string) => {
    switch (type) {
      case "bambino": return "Bambino";
      case "adulto": return "Adulto";
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
      b => b.type === bike.type && b.size === bike.size && b.suspension === bike.suspension
    );
    return selected?.count || 0;
  };

  const updateSelection = (bike: BikeDetails, newCount: number) => {
    const updated = selectedBikes.filter(
      b => !(b.type === bike.type && b.size === bike.size && b.suspension === bike.suspension)
    );
    
    if (newCount > 0) {
      updated.push({ ...bike, count: newCount });
    }
    
    onSelectionChange(updated);
  };

  if (availableBikes.length === 0) {
    return (
      <Card className="border-destructive/50">
        <CardContent className="pt-4">
          <p className="text-center text-muted-foreground">Nessuna bici disponibile per questo orario</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BikeIcon className="w-5 h-5 text-electric-green" />
          Seleziona Bici Disponibili
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableBikes.map((bike, index) => {
          const selectedCount = getSelectedCount(bike);
          return (
            <div
              key={`${bike.type}-${bike.size}-${bike.suspension}-${index}`}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className="text-xs">
                    {getBikeTypeLabel(bike.type)}
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    Taglia {bike.size}
                  </Badge>
                  <Badge 
                    variant="outline" 
                    className={bike.suspension === "full-suspension" ? "border-electric-green text-electric-green" : ""}
                  >
                    {getSuspensionLabel(bike.suspension)}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Disponibili: {bike.count}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateSelection(bike, Math.max(0, selectedCount - 1))}
                  disabled={selectedCount === 0}
                  className="h-8 w-8 p-0"
                >
                  <MinusIcon className="w-4 h-4" />
                </Button>
                
                <span className="w-8 text-center font-medium">
                  {selectedCount}
                </span>
                
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => updateSelection(bike, Math.min(bike.count, selectedCount + 1))}
                  disabled={selectedCount >= bike.count}
                  className="h-8 w-8 p-0"
                >
                  <PlusIcon className="w-4 h-4" />
                </Button>
              </div>
            </div>
          );
        })}
        
        {selectedBikes.length > 0 && (
          <div className="pt-3 border-t">
            <h4 className="font-medium mb-2">Riepilogo Selezione:</h4>
            <div className="space-y-1">
              {selectedBikes.map((bike, index) => (
                <div key={index} className="text-sm text-muted-foreground">
                  {bike.count}x {getBikeTypeLabel(bike.type)} {bike.size} ({getSuspensionLabel(bike.suspension)})
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};