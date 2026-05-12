
import React from 'react';

interface ContributionData {
  year: number;
  amount: number;
  months: number;
}

const mockData: ContributionData[] = [
  { year: 2018, amount: 720000, months: 12 },
  { year: 2019, amount: 756000, months: 12 },
  { year: 2020, amount: 720000, months: 11 },
  { year: 2021, amount: 792000, months: 12 },
  { year: 2022, amount: 825600, months: 12 },
  { year: 2023, amount: 831600, months: 12 },
  { year: 2024, amount: 847500, months: 8 }
];

export const ContributionChart: React.FC = () => {
  const maxAmount = Math.max(...mockData.map(d => d.amount));
  
  return (
    <div className="space-y-6">
      {/* Chart */}
      <div className="relative h-64">
        <div className="absolute inset-0 flex items-end justify-between space-x-2">
          {mockData.map((data, index) => (
            <div key={data.year} className="flex flex-col items-center space-y-2 flex-1">
              <div className="w-full bg-gray-200 rounded-t-lg overflow-hidden">
                <div
                  className="bg-blue-500 rounded-t-lg transition-all duration-500 ease-out"
                  style={{
                    height: `${(data.amount / maxAmount) * 100}%`,
                    minHeight: '4px'
                  }}
                />
              </div>
              <span className="text-xs text-gray-600">{data.year}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-sm" />
          <span className="text-gray-600">Cotisations annuelles</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-sm" />
          <span className="text-gray-600">Mois cotisés</span>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Résumé</h4>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">Total cotisé:</span>
            <p className="font-medium">5 892 700 CFA</p>
          </div>
          <div>
            <span className="text-gray-500">Moyenne annuelle:</span>
            <p className="font-medium">784 360 CFA</p>
          </div>
        </div>
      </div>
    </div>
  );
};
