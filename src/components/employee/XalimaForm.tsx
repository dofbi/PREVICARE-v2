import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getRoleConfig, type UserRole, type XalimaTemplate } from '../../config/roleConfig';

type CourrierType = XalimaTemplate;

const TONE_OPTIONS = [
  { value: 'formel', label: 'Formel', description: 'Professionnel et neutre' },
  { value: 'respectueux', label: 'Respectueux', description: 'Poli et courtois' },
  { value: 'ferme', label: 'Ferme', description: 'Assertif et direct' },
  { value: 'conciliant', label: 'Conciliant', description: 'Diplomate et ouvert' },
];

const colorClasses: Record<string, { border: string; bg: string; text: string; badge: string }> = {
  purple: { border: 'border-purple-200 hover:border-purple-400', bg: 'bg-purple-50', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
  red: { border: 'border-red-200 hover:border-red-400', bg: 'bg-red-50', text: 'text-red-700', badge: 'bg-red-100 text-red-700' },
  blue: { border: 'border-blue-200 hover:border-blue-400', bg: 'bg-blue-50', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
  green: { border: 'border-green-200 hover:border-green-400', bg: 'bg-green-50', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  gray: { border: 'border-gray-200 hover:border-gray-400', bg: 'bg-gray-50', text: 'text-gray-700', badge: 'bg-gray-100 text-gray-700' },
  orange: { border: 'border-orange-200 hover:border-orange-400', bg: 'bg-orange-50', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
  teal: { border: 'border-teal-200 hover:border-teal-400', bg: 'bg-teal-50', text: 'text-teal-700', badge: 'bg-teal-100 text-teal-700' },
  indigo: { border: 'border-indigo-200 hover:border-indigo-400', bg: 'bg-indigo-50', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
};

type UserProfile = {
  employee_name?: string;
  employee_position?: string;
  company_name?: string;
  recipient?: string;
};

type XalimaFormProps = {
  userProfile?: UserProfile;
  userRole?: UserRole;
};

export const XalimaForm: React.FC<XalimaFormProps> = ({ userProfile, userRole = 'employee' }) => {
  const roleConfig = getRoleConfig(userRole);
  const COURRIER_TYPES: CourrierType[] = roleConfig.xalimaTemplates;

  const [step, setStep] = useState<'select' | 'form' | 'result'>('select');
  const [selectedType, setSelectedType] = useState<CourrierType | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [tone, setTone] = useState('formel');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCourrier, setGeneratedCourrier] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCourrier, setEditedCourrier] = useState('');

  const handleTypeSelect = (type: CourrierType) => {
    setSelectedType(type);
    setFormData({
      employee_name: userProfile?.employee_name || '',
      employee_position: userProfile?.employee_position || '',
      company_name: userProfile?.company_name || '',
      recipient: userProfile?.recipient || '',
    });
    setTone('formel');
    setError('');
    setStep('form');
  };

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedType) return;
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/xalima', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courrierType: selectedType.slug,
          formData: { ...formData, tone },
          tone
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Erreur lors de la génération');
      }

      const data = await response.json();
      const text = data.courrier || '';
      setGeneratedCourrier(text);
      setEditedCourrier(text);
      setStep('result');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(isEditing ? editedCourrier : generatedCourrier);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerate = () => {
    setStep('form');
    setIsEditing(false);
  };

  const handleNewCourrier = () => {
    setStep('select');
    setSelectedType(null);
    setFormData({});
    setGeneratedCourrier('');
    setEditedCourrier('');
    setIsEditing(false);
    setError('');
  };

  const renderFormFields = () => {
    if (!selectedType) return null;

    const commonFields = (
      <>
        <div class-="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Votre nom complet *</label>
            <input
              type="text"
              value={formData.employee_name || ''}
              onChange={(e) => handleFieldChange('employee_name', e.target.value)}
              placeholder="Prénom Nom"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Votre poste / fonction *</label>
            <input
              type="text"
              value={formData.employee_position || ''}
              onChange={(e) => handleFieldChange('employee_position', e.target.value)}
              placeholder="Ex : Comptable, Ingénieur..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise *</label>
            <input
              type="text"
              value={formData.company_name || ''}
              onChange={(e) => handleFieldChange('company_name', e.target.value)}
              placeholder="Nom de votre employeur"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Destinataire *</label>
            <input
              type="text"
              value={formData.recipient || ''}
              onChange={(e) => handleFieldChange('recipient', e.target.value)}
              placeholder="Ex : Directeur des Ressources Humaines"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
            />
          </div>
        </div>
      </>
    );

    const typeSpecificFields: Record<string, React.ReactNode> = {
      demande_conge: (
        <>
          {commonFields}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de congé *</label>
              <select
                value={formData.leave_type || ''}
                onChange={(e) => handleFieldChange('leave_type', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm"
              >
                <option value="">Sélectionner...</option>
                <option>Congé annuel</option>
                <option>Congé maladie</option>
                <option>Congé maternité</option>
                <option>Congé paternité</option>
                <option>Congé pour événement familial</option>
                <option>Permission d'absence</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de début *</label>
              <input type="date" value={formData.start_date || ''} onChange={(e) => handleFieldChange('start_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de fin *</label>
              <input type="date" value={formData.end_date || ''} onChange={(e) => handleFieldChange('end_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif de la demande *</label>
            <textarea value={formData.reason || ''} onChange={(e) => handleFieldChange('reason', e.target.value)} rows={3} placeholder="Décrivez brièvement votre situation..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
        </>
      ),
      contestation_sanction: (
        <>
          {commonFields}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de sanction *</label>
              <select value={formData.sanction_type || ''} onChange={(e) => handleFieldChange('sanction_type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                <option value="">Sélectionner...</option>
                <option>Avertissement</option>
                <option>Blâme</option>
                <option>Mise à pied</option>
                <option>Rétrogradation</option>
                <option>Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de la sanction *</label>
              <input type="date" value={formData.sanction_date || ''} onChange={(e) => handleFieldChange('sanction_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Faits qui vous sont reprochés *</label>
            <textarea value={formData.facts_description || ''} onChange={(e) => handleFieldChange('facts_description', e.target.value)} rows={3} placeholder="Décrivez les faits reprochés tels que mentionnés par l'employeur..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vos motifs de contestation *</label>
            <textarea value={formData.contestation_grounds || ''} onChange={(e) => handleFieldChange('contestation_grounds', e.target.value)} rows={3} placeholder="Expliquez pourquoi vous contestez cette sanction..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
        </>
      ),
      reclamation_salaire: (
        <>
          {commonFields}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de réclamation *</label>
              <select value={formData.claim_type || ''} onChange={(e) => handleFieldChange('claim_type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                <option value="">Sélectionner...</option>
                <option>Retard de paiement</option>
                <option>Erreur de calcul</option>
                <option>Heures supplémentaires non payées</option>
                <option>Prime non versée</option>
                <option>Indemnité manquante</option>
                <option>Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Période concernée *</label>
              <input type="text" value={formData.period_concerned || ''} onChange={(e) => handleFieldChange('period_concerned', e.target.value)} placeholder="Ex : janvier 2026, T4 2025" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant réclamé (FCFA)</label>
              <input type="text" value={formData.amount_claimed || ''} onChange={(e) => handleFieldChange('amount_claimed', e.target.value)} placeholder="Montant si connu" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description de la situation *</label>
            <textarea value={formData.situation_description || ''} onChange={(e) => handleFieldChange('situation_description', e.target.value)} rows={3} placeholder="Décrivez votre réclamation en détail..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
        </>
      ),
      lettre_demission: (
        <>
          {commonFields}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de démission *</label>
              <select value={formData.resignation_type || ''} onChange={(e) => handleFieldChange('resignation_type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                <option value="">Sélectionner...</option>
                <option>Démission avec préavis</option>
                <option>Démission immédiate (motif grave)</option>
                <option>Démission pendant période d'essai</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Durée du préavis</label>
              <input type="text" value={formData.notice_period || ''} onChange={(e) => handleFieldChange('notice_period', e.target.value)} placeholder="Ex : 1 mois, 3 mois" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Dernier jour souhaité</label>
              <input type="date" value={formData.last_day || ''} onChange={(e) => handleFieldChange('last_day', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Motif (facultatif)</label>
            <textarea value={formData.reason || ''} onChange={(e) => handleFieldChange('reason', e.target.value)} rows={2} placeholder="Motif de la démission (facultatif mais recommandé)..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input type="checkbox" id="gratitude" checked={formData.gratitude_note === 'true'} onChange={(e) => handleFieldChange('gratitude_note', e.target.checked ? 'true' : 'false')} className="rounded" />
            <label htmlFor="gratitude" className="text-sm text-gray-700">Inclure un paragraphe de remerciements</label>
          </div>
        </>
      ),
      demande_certificat_travail: (
        <>
          {commonFields}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de document *</label>
              <select value={formData.document_type || ''} onChange={(e) => handleFieldChange('document_type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                <option value="">Sélectionner...</option>
                <option>Certificat de travail</option>
                <option>Attestation de travail</option>
                <option>Attestation de présence</option>
                <option>Lettre de recommandation</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Motif de la demande</label>
              <input type="text" value={formData.purpose || ''} onChange={(e) => handleFieldChange('purpose', e.target.value)} placeholder="Ex : recherche d'emploi, démarche administrative" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
          </div>
        </>
      ),
      contestation_licenciement: (
        <>
          {commonFields}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date du licenciement *</label>
              <input type="date" value={formData.dismissal_date || ''} onChange={(e) => handleFieldChange('dismissal_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type de licenciement *</label>
              <select value={formData.dismissal_type || ''} onChange={(e) => handleFieldChange('dismissal_type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                <option value="">Sélectionner...</option>
                <option>Licenciement pour faute</option>
                <option>Licenciement économique</option>
                <option>Licenciement pour inaptitude</option>
                <option>Licenciement sans cause réelle et sérieuse</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ancienneté (années)</label>
              <input type="number" value={formData.seniority_years || ''} onChange={(e) => handleFieldChange('seniority_years', e.target.value)} placeholder="Ex : 5" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Motifs invoqués par l'employeur *</label>
            <textarea value={formData.stated_reasons || ''} onChange={(e) => handleFieldChange('stated_reasons', e.target.value)} rows={2} placeholder="Quels motifs l'employeur a-t-il avancés ?" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vos motifs de contestation *</label>
            <textarea value={formData.contestation_grounds || ''} onChange={(e) => handleFieldChange('contestation_grounds', e.target.value)} rows={3} placeholder="Pourquoi contestez-vous ce licenciement ?" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
        </>
      ),
      demande_avancement: (
        <>
          {commonFields}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type d'avancement *</label>
              <select value={formData.advancement_type || ''} onChange={(e) => handleFieldChange('advancement_type', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm">
                <option value="">Sélectionner...</option>
                <option>Promotion</option>
                <option>Reclassification catégorielle</option>
                <option>Augmentation de salaire</option>
                <option>Changement d'échelon</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Ancienneté dans le poste (années)</label>
              <input type="number" value={formData.seniority_years || ''} onChange={(e) => handleFieldChange('seniority_years', e.target.value)} placeholder="Ex : 3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Vos réalisations principales *</label>
            <textarea value={formData.achievements || ''} onChange={(e) => handleFieldChange('achievements', e.target.value)} rows={3} placeholder="Décrivez vos contributions et réalisations..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Justification de votre demande *</label>
            <textarea value={formData.justification || ''} onChange={(e) => handleFieldChange('justification', e.target.value)} rows={3} placeholder="Pourquoi estimez-vous mériter cet avancement ?" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
        </>
      ),
      reponse_demande_explication: (
        <>
          {commonFields}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date de la demande reçue *</label>
              <input type="date" value={formData.explanation_request_date || ''} onChange={(e) => handleFieldChange('explanation_request_date', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Faits mentionnés dans la demande *</label>
            <textarea value={formData.alleged_facts || ''} onChange={(e) => handleFieldChange('alleged_facts', e.target.value)} rows={3} placeholder="Quels faits vous sont-ils reprochés ?" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Votre explication *</label>
            <textarea value={formData.your_explanation || ''} onChange={(e) => handleFieldChange('your_explanation', e.target.value)} rows={4} placeholder="Votre version des faits et vos explications..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
        </>
      ),
      demande_mutation: (
        <>
          {commonFields}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service / Département actuel *</label>
              <input type="text" value={formData.current_department || ''} onChange={(e) => handleFieldChange('current_department', e.target.value)} placeholder="Ex : Service Comptabilité, Agence de Dakar" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Service / Département souhaité *</label>
              <input type="text" value={formData.desired_department || ''} onChange={(e) => handleFieldChange('desired_department', e.target.value)} placeholder="Ex : Direction RH, Agence de Saint-Louis" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Motivations de votre demande *</label>
            <textarea value={formData.reason || ''} onChange={(e) => handleFieldChange('reason', e.target.value)} rows={3} placeholder="Expliquez les raisons de votre demande de mutation..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
        </>
      ),
      courrier_libre: (
        <>
          {commonFields}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Objet du courrier *</label>
            <input type="text" value={formData.subject || ''} onChange={(e) => handleFieldChange('subject', e.target.value)} placeholder="Ex : Demande de régularisation de situation" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description du contenu souhaité *</label>
            <textarea value={formData.description || ''} onChange={(e) => handleFieldChange('description', e.target.value)} rows={4} placeholder="Décrivez en détail ce que doit contenir votre courrier..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Points clés à inclure</label>
            <textarea value={formData.key_points || ''} onChange={(e) => handleFieldChange('key_points', e.target.value)} rows={2} placeholder="Arguments ou éléments spécifiques à mentionner..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
          </div>
        </>
      ),
    };

    return typeSpecificFields[selectedType.slug] || (
      <>
        {commonFields}
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Description de votre situation *</label>
          <textarea value={formData.description || ''} onChange={(e) => handleFieldChange('description', e.target.value)} rows={4} placeholder="Décrivez votre situation en détail..." className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm" />
        </div>
      </>
    );
  };

  if (step === 'select') {
    return (
      <div>
        <p className="text-gray-600 text-sm mb-6">Sélectionnez le type de courrier que vous souhaitez générer :</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {COURRIER_TYPES.map((type) => {
            const colors = colorClasses[type.color] || colorClasses.gray;
            return (
              <button
                key={type.slug}
                onClick={() => handleTypeSelect(type)}
                className={`text-left p-4 bg-white rounded-xl border-2 ${colors.border} hover:shadow-md transition-all group`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl flex-shrink-0">{type.icon}</span>
                  <div>
                    <p className="font-medium text-gray-900 text-sm group-hover:text-gray-700">{type.label}</p>
                    <p className="text-xs text-gray-500 mt-1">{type.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (step === 'form' && selectedType) {
    return (
      <div>
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => setStep('select')} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xl">{selectedType.icon}</span>
            <h3 className="font-semibold text-gray-900">{selectedType.label}</h3>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          {renderFormFields()}

          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Ton du courrier *</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TONE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTone(option.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    tone === option.value
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-gray-200 hover:border-amber-300'
                  }`}
                >
                  <p className={`text-sm font-medium ${tone === option.value ? 'text-amber-700' : 'text-gray-900'}`}>{option.label}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setStep('select')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
            >
              Retour
            </button>
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:bg-amber-300 text-white px-6 py-2 rounded-lg font-medium transition-colors text-sm"
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Xalima rédige votre courrier…
                </>
              ) : (
                <>
                  <span>✍️</span>
                  Générer le courrier
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'result') {
    const displayText = isEditing ? editedCourrier : generatedCourrier;
    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">{selectedType?.icon}</span>
            <div>
              <h3 className="font-semibold text-gray-900">{selectedType?.label}</h3>
              <p className="text-xs text-gray-500">Courrier généré par Xalima</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-sm transition-colors ${
                isEditing ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              {isEditing ? 'Voir le résultat' : 'Modifier'}
            </button>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm transition-colors"
            >
              {copied ? (
                <>
                  <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <span className="text-green-600">Copié !</span>
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Copier
                </>
              )}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {isEditing ? (
            <textarea
              value={editedCourrier}
              onChange={(e) => setEditedCourrier(e.target.value)}
              rows={20}
              className="w-full p-6 text-sm font-mono text-gray-800 border-0 focus:outline-none focus:ring-0 resize-none"
            />
          ) : (
            <div className="p-6 prose prose-sm max-w-none text-gray-800">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {generatedCourrier}
              </ReactMarkdown>
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-3">
          <button
            onClick={handleNewCourrier}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Nouveau courrier
          </button>
          <button
            onClick={handleRegenerate}
            className="flex items-center gap-1.5 px-4 py-2 border border-amber-300 text-amber-700 rounded-lg hover:bg-amber-50 transition-colors text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Modifier et régénérer
          </button>
        </div>
      </div>
    );
  }

  return null;
};
