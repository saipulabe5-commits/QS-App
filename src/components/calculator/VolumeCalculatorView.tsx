import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RABCategory, RAB_CATEGORIES } from '../../types';
import { formatNumber, formatRupiah } from '../../utils/formatters';
import { calculateGeometryQuantity, calculateItemAmount } from '../../utils/calculations';
import {
  Ruler,
  Box,
  Layers,
  ArrowRight,
  CheckCircle2,
  FileSpreadsheet,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

export const VolumeCalculatorView: React.FC = () => {
  const { selectedProject, addRABItem, priceDatabase, showToast } = useApp();

  // Active Calculator Tab
  const [calcTab, setCalcTab] = useState<
    'rectangle_area' | 'box_volume' | 'concrete' | 'wall' | 'floor' | 'excavation' | 'foundation' | 'rebar'
  >('concrete');

  // Calculator Inputs
  // 1. Luas Persegi Panjang
  const [rectLength, setRectLength] = useState<number | string>(10);
  const [rectWidth, setRectWidth] = useState<number | string>(6);

  // 2. Volume Balok Persegi
  const [boxLength, setBoxLength] = useState<number | string>(6);
  const [boxWidth, setBoxWidth] = useState<number | string>(4);
  const [boxHeight, setBoxHeight] = useState<number | string>(3);

  // 3. Volume Pengecoran Beton
  const [concLength, setConcLength] = useState<number | string>(6);
  const [concWidth, setConcWidth] = useState<number | string>(0.2);
  const [concHeight, setConcHeight] = useState<number | string>(0.3);
  const [concCount, setConcCount] = useState<number | string>(8);

  // 4. Luas Dinding & Plesteran
  const [wallLength, setWallLength] = useState<number | string>(20);
  const [wallHeight, setWallHeight] = useState<number | string>(3.5);
  const [wallOpeningArea, setWallOpeningArea] = useState<number | string>(4.2); // doors/windows

  // 5. Luas Lantai & Keramik
  const [floorLength, setFloorLength] = useState<number | string>(12);
  const [floorWidth, setFloorWidth] = useState<number | string>(8);
  const [floorWastePercent, setFloorWastePercent] = useState<number | string>(5); // 5% waste

  // 6. Volume Galian Tanah
  const [excavLength, setExcavLength] = useState<number | string>(15);
  const [excavWidth, setExcavWidth] = useState<number | string>(0.8);
  const [excavDepth, setExcavDepth] = useState<number | string>(1.0);

  // 7. Pondasi Batu Kali (Trapesium)
  const [fndTopWidth, setFndTopWidth] = useState<number | string>(0.3);
  const [fndBottomWidth, setFndBottomWidth] = useState<number | string>(0.7);
  const [fndHeight, setFndHeight] = useState<number | string>(0.8);
  const [fndLength, setFndLength] = useState<number | string>(35);

  // 8. Pembesian Tulangan
  const [rebarDiameter, setRebarDiameter] = useState<number | string>(12); // mm
  const [rebarLengthTotal, setRebarLengthTotal] = useState<number | string>(120); // meter total

  // Insert to RAB form parameters
  const [itemName, setItemName] = useState('');
  const [itemCategory, setItemCategory] = useState<RABCategory>('Pekerjaan Struktur');
  const [itemUnitPrice, setItemUnitPrice] = useState<number | string>(0);

  // Compute results using Canonical Geometry Quantity Engine
  let geomResult = {
    volume: 0,
    unit: 'm²',
    suggestedName: '',
    suggestedCategory: 'Pekerjaan Struktur' as RABCategory,
    formulaDescription: '',
  };

  switch (calcTab) {
    case 'rectangle_area':
      geomResult = calculateGeometryQuantity('rectangle_area', {
        length: rectLength,
        width: rectWidth,
      });
      break;
    case 'box_volume':
      geomResult = calculateGeometryQuantity('box_volume', {
        length: boxLength,
        width: boxWidth,
        height: boxHeight,
      });
      break;
    case 'concrete':
      geomResult = calculateGeometryQuantity('concrete', {
        length: concLength,
        width: concWidth,
        height: concHeight,
        count: concCount,
      });
      break;
    case 'wall':
      geomResult = calculateGeometryQuantity('wall', {
        length: wallLength,
        height: wallHeight,
        openingArea: wallOpeningArea,
      });
      break;
    case 'floor':
      geomResult = calculateGeometryQuantity('floor', {
        length: floorLength,
        width: floorWidth,
        wastePercent: floorWastePercent,
      });
      break;
    case 'excavation':
      geomResult = calculateGeometryQuantity('excavation', {
        length: excavLength,
        width: excavWidth,
        depth: excavDepth,
      });
      break;
    case 'foundation':
      geomResult = calculateGeometryQuantity('foundation_trapezoid', {
        topWidth: fndTopWidth,
        bottomWidth: fndBottomWidth,
        height: fndHeight,
        length: fndLength,
      });
      break;
    case 'rebar':
      geomResult = calculateGeometryQuantity('rebar_weight', {
        diameterMm: rebarDiameter,
        totalLengthM: rebarLengthTotal,
      });
      break;
  }

  const computedVolume = geomResult.volume;
  const computedUnit = geomResult.unit;
  const defaultTitle = geomResult.suggestedName;
  const defaultCat = geomResult.suggestedCategory;


  const handleDirectInsertToRAB = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) {
      showToast('Pilih Proyek', 'Silakan buat atau pilih proyek terlebih dahulu.', 'warning');
      return;
    }

    const finalName = itemName.trim() || defaultTitle;
    const finalPrice = Number(itemUnitPrice) || 0;

    addRABItem({
      projectId: selectedProject.id,
      code: 'VOL-' + Math.floor(Math.random() * 900 + 100),
      name: finalName,
      category: itemCategory || defaultCat,
      unit: computedUnit,
      volume: computedVolume,
      unitPrice: finalPrice,
      notes: `Dihitung otomatis via Kalkulator Volume (${calcTab})`,
    });

    showToast(
      'Berhasil Ditambahkan ke RAB',
      `"${finalName}" dengan volume ${formatNumber(computedVolume, 2)} ${computedUnit} berhasil dimasukkan ke RAB ${selectedProject.name}.`,
      'success'
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Kalkulator Volume & Kubikasi Konstruksi
        </h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Hitung volume luasan, pengecoran beton, dinding, galian, dan tulangan dengan rumus SNI, lalu masukkan langsung ke RAB
        </p>
      </div>

      {/* Tabs Selector */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 border-b border-slate-200">
        {[
          { id: 'concrete', label: 'Beton Bertulang (m³)', icon: Box },
          { id: 'wall', label: 'Dinding & Plesteran (m²)', icon: Layers },
          { id: 'floor', label: 'Lantai & Keramik (m²)', icon: Ruler },
          { id: 'excavation', label: 'Galian Tanah (m³)', icon: Box },
          { id: 'foundation', label: 'Pondasi Batu Kali (m³)', icon: Box },
          { id: 'rebar', label: 'Besi Tulangan (kg)', icon: Layers },
          { id: 'rectangle_area', label: 'Luas Bidang (m²)', icon: Ruler },
          { id: 'box_volume', label: 'Kubikasi Umum (m³)', icon: Box },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = calcTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setCalcTab(tab.id as any);
                setItemName('');
              }}
              className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Calculator Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Dynamic Parameters Form */}
        <div className="lg:col-span-7 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          {/* Concrete Tab */}
          {calcTab === 'concrete' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Perhitungan Volume Pengecoran Beton (m³)
                </h3>
                <span className="text-[11px] text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-md">
                  V = P &times; L &times; T &times; Jumlah Titik
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Panjang (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={concLength}
                    onChange={(e) => setConcLength(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lebar (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={concWidth}
                    onChange={(e) => setConcWidth(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tinggi/Tebal (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={concHeight}
                    onChange={(e) => setConcHeight(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Pos/Titik
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={concCount}
                    onChange={(e) => setConcCount(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Wall Tab */}
          {calcTab === 'wall' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Perhitungan Luas Dinding & Plesteran Netto (m²)
                </h3>
                <span className="text-[11px] text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-md">
                  Luas = (P &times; T) - Luas Bukaan Pintu/Jendela
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Panjang Total Dinding (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={wallLength}
                    onChange={(e) => setWallLength(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tinggi Dinding (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={wallHeight}
                    onChange={(e) => setWallHeight(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Luas Bukaan Kusen/Pintu (m²)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={wallOpeningArea}
                    onChange={(e) => setWallOpeningArea(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Floor Tab */}
          {calcTab === 'floor' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Perhitungan Luas Lantai & Keramik Granit (m²)
                </h3>
                <span className="text-[11px] text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-md">
                  Luas = (P &times; L) &times; (1 + % Waste Pemotongan)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Panjang Ruangan (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={floorLength}
                    onChange={(e) => setFloorLength(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lebar Ruangan (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={floorWidth}
                    onChange={(e) => setFloorWidth(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Faktor Waste / Sisa Potong (%)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={floorWastePercent}
                    onChange={(e) => setFloorWastePercent(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Excavation Tab */}
          {calcTab === 'excavation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Perhitungan Volume Galian Tanah (m³)
                </h3>
                <span className="text-[11px] text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-md">
                  V = Panjang &times; Lebar &times; Kedalaman
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Panjang Jalur Galian (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={excavLength}
                    onChange={(e) => setExcavLength(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lebar Galian (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={excavWidth}
                    onChange={(e) => setExcavWidth(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kedalaman Galian (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={excavDepth}
                    onChange={(e) => setExcavDepth(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Foundation Tab */}
          {calcTab === 'foundation' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Perhitungan Volume Pondasi Batu Kali Trapesium (m³)
                </h3>
                <span className="text-[11px] text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-md">
                  V = ((Lebar Atas + Bawah)/2) &times; Tinggi &times; Panjang
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lebar Atas (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={fndTopWidth}
                    onChange={(e) => setFndTopWidth(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lebar Bawah (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={fndBottomWidth}
                    onChange={(e) => setFndBottomWidth(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tinggi Pondasi (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={fndHeight}
                    onChange={(e) => setFndHeight(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Panjang Total (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={fndLength}
                    onChange={(e) => setFndLength(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rebar Tab */}
          {calcTab === 'rebar' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  Perhitungan Berat Besi Tulangan (kg)
                </h3>
                <span className="text-[11px] text-blue-600 font-mono bg-blue-50 px-2 py-0.5 rounded-md">
                  Berat (kg) = 0.006165 &times; D² &times; Total Panjang (m)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diameter Besi Tulangan (mm)
                  </label>
                  <select
                    value={rebarDiameter}
                    onChange={(e) => setRebarDiameter(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium"
                  >
                    {[6, 8, 10, 12, 13, 16, 19, 22, 25].map((d) => (
                      <option key={d} value={d}>
                        D{d} (Berat nominal: {formatNumber(0.006165 * d * d, 3)} kg/m)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Total Panjang Kumulatif (meter)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={rebarLengthTotal}
                    onChange={(e) => setRebarLengthTotal(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-medium"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Rectangle Area & Box Volume Generic */}
          {(calcTab === 'rectangle_area' || calcTab === 'box_volume') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <h3 className="text-sm font-bold text-slate-900">
                  {calcTab === 'rectangle_area' ? 'Luas Bidang Persegi (m²)' : 'Kubikasi Balok (m³)'}
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Panjang (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={calcTab === 'rectangle_area' ? rectLength : boxLength}
                    onChange={(e) =>
                      calcTab === 'rectangle_area'
                        ? setRectLength(e.target.value)
                        : setBoxLength(e.target.value)
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Lebar (m)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={calcTab === 'rectangle_area' ? rectWidth : boxWidth}
                    onChange={(e) =>
                      calcTab === 'rectangle_area'
                        ? setRectWidth(e.target.value)
                        : setBoxWidth(e.target.value)
                    }
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right"
                  />
                </div>

                {calcTab === 'box_volume' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tinggi (m)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={boxHeight}
                      onChange={(e) => setBoxHeight(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Large Result Box */}
          <div className="p-5 bg-slate-900 text-white rounded-2xl flex items-center justify-between">
            <div>
              <div className="text-xs font-bold uppercase text-blue-400">
                Hasil Perhitungan Volume
              </div>
              <div className="text-xs text-slate-300 mt-0.5">
                Formula siap dimasukkan langsung ke item RAB
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl sm:text-3xl font-black font-mono text-blue-400">
                {formatNumber(computedVolume, 3)}{' '}
                <span className="text-base font-normal text-white">{computedUnit}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Direct Insert to RAB Form Card */}
        <div className="lg:col-span-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
              <FileSpreadsheet className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Masukkan Hasil ke RAB Proyek
              </h3>
            </div>

            {selectedProject ? (
              <form onSubmit={handleDirectInsertToRAB} className="mt-4 space-y-3.5">
                <div className="text-xs text-slate-500">
                  Target Proyek:{' '}
                  <strong className="text-slate-800">{selectedProject.name}</strong>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Uraian Pekerjaan di RAB
                  </label>
                  <input
                    type="text"
                    placeholder={defaultTitle}
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Kategori
                    </label>
                    <select
                      value={itemCategory || defaultCat}
                      onChange={(e) => setItemCategory(e.target.value as RABCategory)}
                      className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl"
                    >
                      {RAB_CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Harga Satuan (Rp)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={itemUnitPrice}
                      onChange={(e) => setItemUnitPrice(e.target.value)}
                      placeholder="0"
                      className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl font-mono text-right font-bold"
                    />
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
                  <span className="font-semibold text-blue-900">Total Biaya Pos:</span>
                  <span className="font-black text-blue-900 font-mono">
                    {formatRupiah(computedVolume * (Number(itemUnitPrice) || 0))}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tambahkan ke RAB Sekarang</span>
                </button>
              </form>
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                Belum ada proyek aktif terpilih. Silakan buat atau pilih proyek di menu Proyek.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
