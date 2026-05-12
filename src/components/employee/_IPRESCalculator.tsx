
import React, { useState } from 'react';

interface CalculationResult {
  pensionAmount: number;
  replacementRate: number;
  yearsToRetirement: number;
}

export const IPRESCalculator: React.FC = () => {
  const [salary, setSalary] = useState<number>(850000);
  const [age, setAge] = useState<number>(32);
  const [yearsContributed, setYearsContributed] = useState<number>(8);
  const [result, setResult] = useState<CalculationResult | null>(null);

  const calculatePension = () => {
    // Simulation simplifiée du calcul IPRES
    const retirementAge = 60;
    const yearsToRetirement = retirementAge - age;
    const totalYearsExpected = yearsContributed + yearsToRetirement;
    
    // Formule simplifiée: 2% par année cotisée jusqu'à 40 ans max
    const maxYears = Math.min(totalYearsExpected, 40);
    const replacementRate = (maxYears * 2) / 100;
    const pensionAmount = salary * replacementRate;

    setResult({
      pensionAmount: Math.round(pensionAmount),
      replacementRate: Math.round(replacementRate * 100),
      yearsToRetirement
    });
  };

  return (
    <div className="space-y-6">
      {/* Form */}
      <div className="space-y-4">
        <div>
          <label htmlFor="salary" className="block text-sm font-medium text-gray-700">
            Salaire mensuel actuel (CFA)
          </label>
          <input
            type="number"
            id="salary"
            value={salary}
            onChange={(e) => setSalary(Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="age" className="block text-sm font-medium text-gray-700">
            Âge actuel
          </label>
          <input
            type="number"
            id="age"
            value={age}
            onChange={(e) => setAge(Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <div>
          <label htmlFor="years" className="block text-sm font-medium text-gray-700">
            Années déjà cotisées
          </label>
          <input
            type="number"
            id="years"
            value={yearsContributed}
            onChange={(e) => setYearsContributed(Number(e.target.value))}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        <button
          onClick={calculatePension}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          Calculer ma retraite
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-blue-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-blue-900 mb-3">Estimation de votre retraite</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-blue-700">Pension mensuelle estimée:</span>
              <span className="font-medium text-blue-900">
                {result.pensionAmount.toLocaleString()} CFA
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Taux de remplacement:</span>
              <span className="font-medium text-blue-900">{result.replacementRate}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-blue-700">Années jusqu'à la retraite:</span>
              <span className="font-medium text-blue-900">{result.yearsToRetirement} ans</span>
            </div>
          </div>
          
          <div className="mt-3 p-3 bg-yellow-100 rounded text-xs text-yellow-800">
            <strong>Note:</strong> Cette estimation est indicative et basée sur la réglementation actuelle IPRES. 
            Consultez l'IPRES pour un calcul officiel.
          </div>
        </div>
      )}
    </div>
  );
};
