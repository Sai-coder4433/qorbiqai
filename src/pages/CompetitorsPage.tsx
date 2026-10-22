import React, { useState } from 'react';
import {
  Users2,
  Search,
  Star,
  MapPin,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  TrendingUp
} from 'lucide-react';
import { DashboardLayout } from '../components/layout/DashboardLayout.tsx';
import { useUi } from '../lib/ui-context.tsx';

export const CompetitorsPage: React.FC = () => {
  const { business: uiBiz } = useUi();
  const [scanning, setScanning] = useState(false);

  const competitorList = [
    { name: 'Atharv Electricals (You)', rating: 4.9, reviews: 342, distance: '0.0 km', category: 'Electrical Supply Store', isSelf: true },
    { name: 'Kalyani Electrical & Hardware', rating: 4.6, reviews: 184, distance: '1.2 km', category: 'Electrical Store' },
    { name: 'MIDC Power & Cable Hub', rating: 4.4, reviews: 120, distance: '2.4 km', category: 'Industrial Supplier' },
    { name: 'Shree Ganesh Electrical Works', rating: 4.5, reviews: 92, distance: '3.1 km', category: 'Electrical Contractor' },
    { name: 'Sai Switchgear & Panels', rating: 4.7, reviews: 210, distance: '3.8 km', category: 'Electrical Supply Store' },
    { name: 'Techno Power Solutions Chakan', rating: 4.3, reviews: 68, distance: '4.2 km', category: 'Industrial Equipment' },
    { name: 'Omkar Industrial Cables', rating: 4.6, reviews: 145, distance: '4.5 km', category: 'Wholesaler' },
    { name: 'Prathamesh Electrical Trading', rating: 4.2, reviews: 54, distance: '4.8 km', category: 'Electrical Store' },
    { name: 'Shubham Automation & Controls', rating: 4.8, reviews: 160, distance: '4.9 km', category: 'Industrial Equipment' },
    { name: 'Chakan Electrical Agency', rating: 4.1, reviews: 42, distance: '5.0 km', category: 'Electrical Store' }
  ];

  const avgRating = (competitorList.slice(1).reduce((acc, c) => acc + c.rating, 0) / (competitorList.length - 1)).toFixed(1);

  return (
    <DashboardLayout>
      {/* 26. COMPETITOR PAGE HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
            Competitors
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
            Benchmark nearby local businesses via Google Places API (New).
          </p>
          <p className="text-xs text-[#5F6368] mt-1 font-medium">
            Atharv Electricals · Chakan
          </p>
        </div>

        <button
          onClick={() => {
            setScanning(true);
            setTimeout(() => setScanning(false), 600);
          }}
          disabled={scanning}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
          <span>{scanning ? 'Scanning Nearby...' : 'Scan Nearby'}</span>
        </button>
      </div>

      {/* TOP SUMMARY */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-medium text-[#5F6368]">Your Business</span>
          <h3 className="text-base font-semibold text-[#202124] mt-0.5">Atharv Electricals</h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex items-center gap-1 font-semibold text-sm text-[#202124] font-mono tabular-nums">
              4.9 <Star className="w-3.5 h-3.5 text-[#FBBC04] fill-[#FBBC04]" />
            </span>
            <span className="text-xs text-[#5F6368]">· 342 reviews</span>
          </div>
        </div>

        <div className="sm:text-right">
          <span className="text-xs text-[#5F6368]">Nearby businesses scanned</span>
          <p className="text-2xl font-semibold text-[#202124] font-mono tabular-nums mt-0.5">10</p>
          <span className="text-[11px] text-[#5F6368]">Radius: 5 km in Chakan MIDC</span>
        </div>
      </div>

      {/* COMPARISON TABLE */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl overflow-hidden mb-6">
        <div className="p-4 border-b border-[#E5E7EB]">
          <h3 className="text-sm font-semibold text-[#202124]">Local Visibility Snapshot</h3>
        </div>
        <table className="w-full text-left text-xs">
          <thead className="bg-[#F8FAFC] text-[#5F6368] font-medium border-b border-[#E5E7EB]">
            <tr>
              <th className="py-3 px-4">Business</th>
              <th className="py-3 px-4 text-right">Rating</th>
              <th className="py-3 px-4 text-right">Reviews</th>
              <th className="py-3 px-4 text-right">Distance</th>
              <th className="py-3 px-4">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB]">
            {competitorList.map((item, idx) => (
              <tr key={idx} className={`transition-colors ${item.isSelf ? 'bg-[#F8FAFC] font-medium' : 'hover:bg-[#F8FAFC]'}`}>
                <td className="py-3 px-4 text-[#202124]">
                  {item.name}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-[#202124]">
                  {item.rating} ★
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-[#202124]">
                  {item.reviews}
                </td>
                <td className="py-3 px-4 text-right font-mono tabular-nums text-[#5F6368]">
                  {item.distance}
                </td>
                <td className="py-3 px-4 text-[#5F6368]">
                  {item.category}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* FACTUAL AI ANALYSIS */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5 text-xs text-[#202124]">
        <h4 className="font-semibold text-xs text-[#202124] mb-2">Factual Analysis</h4>
        <p className="text-[#5F6368] leading-relaxed">
          "Your rating is 0.3 higher than the average of the 10 scanned businesses ({avgRating} ★). With 342 verified reviews, Atharv Electricals has 132 more reviews than the next closest supplier in Chakan."
        </p>
      </div>
    </DashboardLayout>
  );
};

export const RankGridPage: React.FC = () => {
  const { business: uiBiz } = useUi();
  const [keyword, setKeyword] = useState('electrical shop chakan');
  const [gridSize, setGridSize] = useState(5);
  const [radiusKm, setRadiusKm] = useState(5);
  const [scanning, setScanning] = useState(false);

  // Generate 5x5 heatmap points centered around Chakan (rank 1-3 green, 4-10 yellow, 10+ red)
  const [gridPoints, setGridPoints] = useState([
    { rank: 1, label: 'MIDC Phase I' }, { rank: 2, label: 'Talegaon Rd' }, { rank: 1, label: 'Main Chowk' }, { rank: 3, label: 'Bhosari Rd' }, { rank: 4, label: 'Mahalunge' },
    { rank: 2, label: 'Phase II' }, { rank: 1, label: 'Flagship' }, { rank: 1, label: 'Khed Chowk' }, { rank: 2, label: 'Nanekarwadi' }, { rank: 5, label: 'Kuruli' },
    { rank: 3, label: 'Sara City' }, { rank: 1, label: 'Market Yard' }, { rank: 1, label: 'Ind. Area' }, { rank: 2, label: 'Akurdi Link' }, { rank: 4, label: 'Chimbali' },
    { rank: 4, label: 'Chakan North' }, { rank: 2, label: 'MIDC Gate' }, { rank: 2, label: 'Expressway' }, { rank: 3, label: 'Spine Rd' }, { rank: 6, label: 'Moshi' },
    { rank: 5, label: 'Talawade' }, { rank: 3, label: 'Alandi Rd' }, { rank: 4, label: 'Bhosari East' }, { rank: 5, label: 'PCMC' }, { rank: 7, label: 'Dighi' }
  ]);

  const handleRunScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
    }, 700);
  };

  return (
    <DashboardLayout>
      {/* 27. VISIBILITY GRID HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-5 border-b border-[#E5E7EB] mb-6 gap-4">
        <div>
          <h1 className="text-2xl sm:text-[28px] font-semibold text-[#202124] tracking-tight">
            Local Visibility
          </h1>
          <p className="text-xs sm:text-sm text-[#5F6368] mt-0.5">
            Geographic proximity rank heatmap based on Google Places API results.
          </p>
          <p className="text-xs text-[#5F6368] mt-1 font-medium">
            Atharv Electricals · Chakan
          </p>
        </div>

        {/* Scan Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            className="text-xs px-3 py-2 bg-white border border-[#E5E7EB] rounded-lg w-52 focus:outline-none focus:ring-1 focus:ring-[#1A73E8]"
          />
          <div className="px-2.5 py-2 bg-white border border-[#E5E7EB] rounded-lg text-xs text-[#5F6368]">
            5 × 5 Grid · 5 km
          </div>
          <button
            onClick={handleRunScan}
            disabled={scanning}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1A73E8] hover:bg-[#1557B0] text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${scanning ? 'animate-spin' : ''}`} />
            <span>{scanning ? 'Scanning...' : 'Run Scan'}</span>
          </button>
        </div>
      </div>

      {/* HEATMAP AS HERO (Occupies most of the screen) */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#E5E7EB] mb-6 text-xs">
          <div>
            <span className="font-semibold text-sm text-[#202124]">
              Heatmap: "{keyword}"
            </span>
            <span className="text-[#5F6368] block mt-0.5">
              Center: Chakan MIDC Phase II (18.7618° N, 73.8587° E)
            </span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 text-xs">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#188038]"></span>
              <span>Rank 1–3 (High)</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#F9AB00]"></span>
              <span>Rank 4–10</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D93025]"></span>
              <span>10+</span>
            </span>
          </div>
        </div>

        {/* 5x5 Heatmap Grid Matrix */}
        <div className="flex justify-center py-6 bg-[#F8FAFC] rounded-xl border border-[#E5E7EB]">
          <div className="grid grid-cols-5 gap-3 max-w-xl w-full p-2">
            {gridPoints.map((pt, i) => {
              const isTop3 = pt.rank <= 3;
              const isTop10 = pt.rank > 3 && pt.rank <= 10;

              return (
                <div
                  key={i}
                  className={`h-16 sm:h-20 rounded-xl border flex flex-col items-center justify-center font-mono transition-transform hover:scale-105 shadow-xs ${
                    isTop3
                      ? 'bg-[#E6F4EA] border-[#CEEAD6] text-[#137333]'
                      : isTop10
                      ? 'bg-[#FEF7E0] border-[#FEEFC3] text-[#B06000]'
                      : 'bg-[#FCE8E6] border-[#FAD2CF] text-[#C5221F]'
                  }`}
                >
                  <span className="text-base sm:text-xl font-bold">#{pt.rank}</span>
                  <span className="text-[10px] font-sans text-[#5F6368] truncate max-w-[80%] text-center mt-0.5">
                    {pt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Methodology notice below map per requirement */}
        <div className="pt-4 mt-4 border-t border-[#E5E7EB] text-[11px] text-[#5F6368]">
          Methodology: "Visibility scan based on Places API results for the selected query and coordinates."
        </div>
      </div>

      {/* SCAN HISTORY */}
      <div className="bg-white border border-[#E5E7EB] rounded-xl p-5">
        <h3 className="font-semibold text-sm text-[#202124] mb-3">Scan History</h3>
        <div className="divide-y divide-[#E5E7EB] text-xs">
          <div className="py-2.5 flex items-center justify-between">
            <span className="font-medium text-[#202124]">27 Sep 2026 · electrical shop chakan</span>
            <span className="text-[#188038] font-medium">Avg Rank #2.1 · 5 km scan</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="font-medium text-[#202124]">24 Sep 2026 · polycab cable dealer chakan</span>
            <span className="text-[#188038] font-medium">Avg Rank #1.8 · 5 km scan</span>
          </div>
          <div className="py-2.5 flex items-center justify-between">
            <span className="font-medium text-[#202124]">20 Sep 2026 · industrial switchgear supplier</span>
            <span className="text-[#188038] font-medium">Avg Rank #2.4 · 5 km scan</span>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};
