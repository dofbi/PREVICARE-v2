
import React from 'react';

export function IPRESStatus() {
  const cotisations = [
    {
      id: 1,
      mois: "Mars 2025",
      statut: "versée",
      montant: "125,000 FCFA",
      status: "success"
    },
    {
      id: 2,
      mois: "Février 2025",
      statut: "versée",
      montant: "125,000 FCFA",
      status: "success"
    },
    {
      id: 3,
      mois: "Janvier 2025",
      statut: "versée",
      montant: "125,000 FCFA",
      status: "success"
    }
  ];

  return (
    <div className="space-y-4">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
          <div>
            <p className="font-medium text-green-800">Statut IPRES : À jour</p>
            <p className="text-sm text-green-600">Toutes vos cotisations sont à jour</p>
          </div>
        </div>
      </div>
      
      {cotisations.map((cotisation) => (
        <div key={cotisation.id} className={`flex items-center justify-between p-4 border rounded-lg ${
          cotisation.status === 'success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              cotisation.status === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}></div>
            <div>
              <p className="font-medium">{cotisation.mois}</p>
              <p className="text-sm text-gray-600">Cotisation {cotisation.statut}</p>
            </div>
          </div>
          <span className={`font-medium ${
            cotisation.status === 'success' ? 'text-green-600' : 'text-red-600'
          }`}>
            {cotisation.montant}
          </span>
        </div>
      ))}
    </div>
  );
}
