"use client";

import { useState } from "react";

type Props = {
  coveragePerBoxSqm: number;
  pricePerBox: number;
};

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export function TileCalculator({ coveragePerBoxSqm, pricePerBox }: Props) {
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");

  const lengthNum = parseFloat(length) || 0;
  const widthNum = parseFloat(width) || 0;
  const areaSqm = lengthNum * widthNum;
  const areaWithWaste = areaSqm * 1.1; // 10% waste
  const boxesNeeded = Math.ceil(areaWithWaste / coveragePerBoxSqm);
  const totalCost = boxesNeeded * pricePerBox;

  return (
    <div className="rounded-lg border border-[#14262B]/20 p-6">
      <h3 className="text-lg font-medium text-[#14262B]">Tile Calculator</h3>
      <p className="mt-1 text-sm text-[#14262B]/70">
        Calculate how many boxes you need for your space
      </p>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="length" className="block text-sm font-medium text-[#14262B]">
            Room Length (m)
          </label>
          <input
            type="number"
            id="length"
            min="0"
            step="0.1"
            value={length}
            onChange={(e) => setLength(e.target.value)}
            placeholder="e.g. 4.5"
            className="mt-1 w-full rounded border border-[#14262B]/20 bg-white px-3 py-2 text-[#14262B]"
          />
        </div>

        <div>
          <label htmlFor="width" className="block text-sm font-medium text-[#14262B]">
            Room Width (m)
          </label>
          <input
            type="number"
            id="width"
            min="0"
            step="0.1"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            placeholder="e.g. 3.2"
            className="mt-1 w-full rounded border border-[#14262B]/20 bg-white px-3 py-2 text-[#14262B]"
          />
        </div>
      </div>

      {areaSqm > 0 && (
        <div className="mt-6 space-y-2 rounded bg-[#0F6B6B]/10 p-4">
          <div className="flex justify-between text-sm">
            <span className="text-[#14262B]/70">Room area:</span>
            <span className="font-medium text-[#14262B]">{areaSqm.toFixed(2)} m²</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#14262B]/70">With 10% waste:</span>
            <span className="font-medium text-[#14262B]">{areaWithWaste.toFixed(2)} m²</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-[#14262B]/70">Coverage per box:</span>
            <span className="font-medium text-[#14262B]">{coveragePerBoxSqm} m²</span>
          </div>
          <div className="flex justify-between border-t border-[#14262B]/20 pt-2">
            <span className="font-medium text-[#14262B]">Boxes needed:</span>
            <span className="text-lg font-bold text-[#14262B]">{boxesNeeded}</span>
          </div>
          <div className="flex justify-between border-t border-[#14262B]/20 pt-2">
            <span className="font-medium text-[#14262B]">Total cost:</span>
            <span className="text-xl font-bold text-[#0F6B6B]">
              {formatPrice(totalCost)}
            </span>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-[#14262B]/60">
        * This calculator includes 10% waste allowance. Actual requirements may vary based on your
        specific installation.
      </p>
    </div>
  );
}
