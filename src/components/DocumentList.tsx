
import React from 'react';

export function DocumentList() {
  const documents = [
    {
      id: 1,
      name: "Contrat de travail",
      dateAdded: "15/03/2025",
      type: "contract",
      icon: "📄"
    },
    {
      id: 2,
      name: "Bulletins de paie",
      dateAdded: "10/03/2025",
      type: "payslip",
      icon: "💰"
    },
    {
      id: 3,
      name: "Certificat de travail",
      dateAdded: "08/03/2025",
      type: "certificate",
      icon: "📜"
    }
  ];

  return (
    <div className="space-y-4">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
          <div className="flex items-center space-x-3">
            <div className="text-2xl">{doc.icon}</div>
            <div>
              <p className="font-medium">{doc.name}</p>
              <p className="text-sm text-gray-500">Ajouté le {doc.dateAdded}</p>
            </div>
          </div>
          <button className="text-blue-600 hover:underline text-sm font-medium">
            Télécharger
          </button>
        </div>
      ))}
    </div>
  );
}
