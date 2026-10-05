import React, { useState, useMemo } from 'react';
import { InspectedNodeInfo, ModelMode } from '../heart/HeartModelLoader';
import { useAppStore } from '../../store/useAppStore';
import {
  Search,
  Layers,
  X,
  Crosshair,
  ChevronRight,
  Eye,
} from 'lucide-react';

interface ModelInspectorOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: InspectedNodeInfo[];
  detectedMode: ModelMode;
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string | null) => void;
}

export const ModelInspectorOverlay: React.FC<ModelInspectorOverlayProps> = ({
  isOpen,
  onClose,
  nodes,
  detectedMode,
  selectedNodeId,
  onSelectNode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const { selectedVessel, selectVessel } = useAppStore();

  const categories = useMemo(() => {
    const cats: Record<string, number> = {
      ALL: nodes.length,
      LAD: 0,
      LCX: 0,
      RCA: 0,
      VESSEL: 0,
      VALVE: 0,
      MYOCARDIUM: 0,
      SEPTUM: 0,
      OTHER: 0,
    };
    nodes.forEach((n) => {
      if (cats[n.category] !== undefined) {
        cats[n.category]++;
      } else {
        cats.OTHER++;
      }
    });
    return cats;
  }, [nodes]);

  const filteredNodes = useMemo(() => {
    return nodes.filter((n) => {
      const matchesSearch = n.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || n.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [nodes, searchQuery, selectedCategory]);

  const selectedNode = useMemo(() => {
    return nodes.find((n) => n.id === selectedNodeId);
  }, [nodes, selectedNodeId]);

  if (!isOpen) return null;

  return (
    <div className="absolute top-16 right-4 bottom-16 z-30 w-80 sm:w-96 flex flex-col rounded-2xl bg-slate-950/90 border border-teal-500/30 shadow-2xl backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-right duration-200 pointer-events-auto">
      {/* Header */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-teal-400" />
          <h3 className="text-xs font-bold font-mono text-slate-200 uppercase tracking-wider">
            3D Model Inspector
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border ${
              detectedMode === 'MODE_A'
                ? 'bg-teal-950/80 text-teal-300 border-teal-500/40'
                : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
            }`}
          >
            {detectedMode}
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mode Status Banner */}
      <div className="px-4 py-2.5 bg-slate-900/40 border-b border-white/5 flex flex-col gap-1 text-[11px] font-mono">
        <div className="flex items-center justify-between">
          <span className="text-slate-400">Active Pipeline:</span>
          <span className="text-teal-400 font-bold">
            {detectedMode === 'MODE_A' ? 'MODE_A (Named Meshes)' : 'MODE_B (Spline Tubes)'}
          </span>
        </div>
        <div className="text-[10px] text-slate-400 flex items-center gap-2">
          <span>{nodes.length} Meshes</span>
          <span>•</span>
          <span>LAD ({categories.LAD})</span>
          <span>LCX ({categories.LCX})</span>
          <span>RCA ({categories.RCA})</span>
        </div>
      </div>

      {/* Quick Vessel Isolation Bar */}
      <div className="px-3 py-2 bg-slate-950/60 border-b border-white/10 flex items-center justify-between gap-1.5 text-xs font-mono">
        <span className="text-[10px] text-slate-400 uppercase tracking-wider">Target:</span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => selectVessel(null)}
            className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
              selectedVessel === null
                ? 'bg-teal-900/60 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All
          </button>
          {(['LAD', 'LCX', 'RCA'] as const).map((vKey) => (
            <button
              key={vKey}
              onClick={() => selectVessel(selectedVessel === vKey ? null : vKey)}
              className={`px-2 py-0.5 rounded text-[10px] transition-colors ${
                selectedVessel === vKey
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-300 bg-slate-900/80 hover:bg-slate-800'
              }`}
            >
              {vKey}
            </button>
          ))}
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="p-3 border-b border-white/10 space-y-2.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search anatomy nodes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900/80 border border-white/10 text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto pr-1">
          {Object.entries(categories).map(([cat, count]) => {
            if (count === 0 && cat !== 'ALL') return null;
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono transition-all ${
                  isSelected
                    ? 'bg-teal-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-white/5'
                }`}
              >
                {cat} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Node Details Card */}
      {selectedNode && (
        <div className="p-3 bg-teal-950/40 border-b border-teal-500/30 flex flex-col gap-1.5 text-xs font-mono">
          <div className="flex items-center justify-between">
            <span className="text-teal-300 font-bold flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-teal-400" /> Isolated Node
            </span>
            <button
              onClick={() => onSelectNode(null)}
              className="text-[10px] text-slate-400 hover:text-white underline"
            >
              Reset Isolation
            </button>
          </div>
          <p className="text-slate-200 text-[11px] font-semibold break-words">
            {selectedNode.name}
          </p>
          <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400 pt-1 border-t border-white/5">
            <div>Category: <span className="text-slate-200">{selectedNode.category}</span></div>
            <div>Vertices: <span className="text-slate-200">{selectedNode.vertexCount.toLocaleString()}</span></div>
            <div className="col-span-2">
              Center: <span className="text-slate-200 font-mono">[{selectedNode.center.join(', ')}]</span>
            </div>
          </div>
        </div>
      )}

      {/* Node List */}
      <div className="flex-1 overflow-y-auto divide-y divide-white/5 p-2 space-y-1">
        {filteredNodes.length === 0 ? (
          <div className="p-4 text-center text-xs text-slate-500 font-mono">
            No matching nodes found.
          </div>
        ) : (
          filteredNodes.map((node) => {
            const isSelected = selectedNodeId === node.id;
            return (
              <button
                key={node.id}
                onClick={() => {
                  const newId = isSelected ? null : node.id;
                  onSelectNode(newId);
                  console.log(
                    `%c[Inspector Pick] %c${node.name} %c(Center: [${node.center.join(', ')}], Verts: ${node.vertexCount})`,
                    'color: #14b8a6; font-weight: bold;',
                    'color: #38bdf8; font-weight: bold;',
                    'color: #94a3b8;'
                  );
                }}
                className={`w-full text-left p-2 rounded-xl transition-all flex items-start justify-between gap-2 text-xs font-mono group ${
                  isSelected
                    ? 'bg-teal-950/80 border border-teal-500/50 shadow-sm text-white'
                    : 'bg-slate-900/40 hover:bg-slate-900/80 border border-transparent text-slate-300'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        node.category === 'LAD'
                          ? 'bg-rose-400'
                          : node.category === 'LCX'
                          ? 'bg-amber-400'
                          : node.category === 'RCA'
                          ? 'bg-sky-400'
                          : node.category === 'VALVE'
                          ? 'bg-emerald-400'
                          : 'bg-slate-500'
                      }`}
                    />
                    <span className="font-semibold text-[11px] truncate block group-hover:text-teal-300">
                      {node.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1">
                    <span>{node.category}</span>
                    <span>•</span>
                    <span>{node.vertexCount} verts</span>
                    <span>•</span>
                    <span>[{node.center.map((c) => Math.round(c)).join(',')}]</span>
                  </div>
                </div>

                <div className="shrink-0 pt-0.5">
                  {isSelected ? (
                    <Eye className="w-3.5 h-3.5 text-teal-400" />
                  ) : (
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300" />
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-slate-900/80 border-t border-white/10 flex items-center justify-between text-[10px] font-mono text-slate-400">
        <span>Click node to isolate in 3D</span>
        <span>Key shortcut: <kbd className="px-1 py-0.5 rounded bg-slate-800 border border-white/10 text-slate-300">I</kbd></span>
      </div>
    </div>
  );
};
