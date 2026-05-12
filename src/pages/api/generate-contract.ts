import type { APIRoute } from 'astro';
import { createClient } from '../../lib/supabase';
import { getBillingLabel } from '../../types/subscription';
import { COMPANY_LEGAL, ROLE_PREFIXES, ROLE_LABELS } from '../../lib/legalInfo';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    const supabase = createClient({ request, cookies });
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return new Response('Non authentifié', { status: 401 });
    }

    const subscriptionId = url.searchParams.get('subscriptionId');
    
    if (!subscriptionId) {
      return new Response('ID d\'abonnement manquant', { status: 400 });
    }

    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq('id', subscriptionId)
      .eq('user_id', authData.user.id)
      .single();

    if (subError || !subscription) {
      return new Response('Abonnement non trouvé', { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, phone, address, role, organization')
      .eq('id', authData.user.id)
      .single();

    const userRole = profile?.role || 'employee';
    const rolePrefix = ROLE_PREFIXES[userRole] || 'EMP';
    const roleLabel = ROLE_LABELS[userRole] || 'Espace Employé';

    let delegateDetails: Record<string, any> | null = null;
    if (userRole === 'delegate') {
      const { data: dd } = await supabase
        .from('delegate_details')
        .select('company_name, company_sector, company_headcount, mandate_type, mandate_start_date')
        .eq('id', authData.user.id)
        .single();
      delegateDetails = dd;
    }

    let employerDetails: Record<string, any> | null = null;
    if (userRole === 'employer') {
      const { data: ed } = await supabase
        .from('employer_details')
        .select('company_name, siret_rc, sector, headcount')
        .eq('id', authData.user.id)
        .single();
      employerDetails = ed;
    }

    const { data: cgaAcceptance } = await supabase
      .from('cga_acceptances')
      .select('cga_version, accepted_at')
      .eq('user_id', authData.user.id)
      .eq('subscription_id', subscriptionId)
      .order('accepted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const cgaVersion = cgaAcceptance?.cga_version || subscription.cga_version || COMPANY_LEGAL.cgaVersion;
    const cgaAcceptedAt = cgaAcceptance?.accepted_at || subscription.cga_accepted_at;

    const contractNumber = subscription.contract_number
      || `PREV-${rolePrefix}-${new Date().getFullYear()}-${subscription.id.slice(0, 6)}`;

    const contractDate = new Date(subscription.starts_at).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const expiryDate = new Date(subscription.expires_at).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const billingLabel = getBillingLabel(subscription.plan?.billing_period);
    const amountFormatted = new Intl.NumberFormat('fr-SN').format(subscription.plan?.price);
    const paymentMethodLabel = subscription.payment_method === 'om' ? 'Orange Money'
      : subscription.payment_method === 'wave' ? 'Wave'
      : subscription.payment_method === 'dexchange' ? 'Mobile Money (Dexchange)'
      : subscription.payment_method;

    const mandateTypes: Record<string, string> = {
      titulaire: 'Délégué titulaire',
      suppl\u00e9ant: 'Délégué suppléant',
      delegue_syndical: 'Délégué syndical',
      representant_syndicat: 'Représentant du personnel',
    };

    let mandateSection = '';
    if (userRole === 'delegate' && delegateDetails) {
      const mt = mandateTypes[delegateDetails.mandate_type] || delegateDetails.mandate_type || '-';
      const mandateStart = delegateDetails.mandate_start_date
        ? new Date(delegateDetails.mandate_start_date).toLocaleDateString('fr-FR')
        : '-';
      mandateSection = `
      <div class="section">
        <h2>Mandat de Représentation</h2>
        <div class="info-grid">
          <span class="info-label">Entreprise d'exercice :</span>
          <span class="info-value">${delegateDetails.company_name || '-'}</span>
          <span class="info-label">Secteur :</span>
          <span class="info-value">${delegateDetails.company_sector || '-'}</span>
          <span class="info-label">Effectif :</span>
          <span class="info-value">${delegateDetails.company_headcount || '-'} salariés</span>
          <span class="info-label">Type de mandat :</span>
          <span class="info-value">${mt}</span>
          <span class="info-label">Date de début du mandat :</span>
          <span class="info-value">${mandateStart}</span>
        </div>
      </div>`;
    }

    let employerSection = '';
    if (userRole === 'employer') {
      const company = employerDetails?.company_name || profile?.organization || '-';
      employerSection = `
      <div class="section">
        <h2>Entreprise</h2>
        <div class="info-grid">
          <span class="info-label">Nom de l'entreprise :</span>
          <span class="info-value">${company}</span>
          ${employerDetails?.siret_rc ? `<span class="info-label">SIRET / RCCM :</span>
          <span class="info-value">${employerDetails.siret_rc}</span>` : ''}
          ${employerDetails?.sector ? `<span class="info-label">Secteur :</span>
          <span class="info-value">${employerDetails.sector}</span>` : ''}
          ${employerDetails?.headcount ? `<span class="info-label">Effectif :</span>
          <span class="info-value">${employerDetails.headcount} salariés</span>` : ''}
        </div>
      </div>`;
    }

    const cgaDateFormatted = cgaAcceptedAt
      ? new Date(cgaAcceptedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : 'Date à confirmer';

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Contrat d'Abonnement - ${contractNumber}</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; color: #0B1D3A; }
    .header { text-align: center; border-bottom: 3px solid #0B1D3A; padding-bottom: 24px; margin-bottom: 32px; }
    .logo { font-size: 28px; font-weight: bold; color: #0B1D3A; }
    .logo-accent { color: #C9A961; }
    .contract-number { font-size: 13px; color: #6B7280; margin-top: 8px; letter-spacing: .05em; }
    h1 { color: #0B1D3A; font-size: 22px; }
    h2 { color: #0B1D3A; font-size: 16px; border-bottom: 1px solid #E5E7EB; padding-bottom: 8px; margin-top: 28px; }
    .section { margin-bottom: 24px; }
    .info-grid { display: grid; grid-template-columns: 200px 1fr; gap: 8px; }
    .info-label { font-weight: 600; color: #0B1D3A; font-size: 13px; }
    .info-value { color: #4B5563; font-size: 13px; }
    .features { background: #F6F4EE; padding: 20px; border-radius: 8px; border: 1px solid #E5E7EB; }
    .features ul { margin: 0; padding-left: 20px; }
    .features li { margin-bottom: 6px; font-size: 13px; }
    .gold { color: #C9A961; }
    .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 16px; }
    .signature-section { margin-top: 48px; display: flex; justify-content: space-between; }
    .signature-box { width: 45%; }
    .signature-line { border-top: 1px solid #0B1D3A; margin-top: 60px; padding-top: 8px; text-align: center; font-size: 12px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo"><span class="logo-accent">·</span> PREVICARE EMPLOI</div>
    <p style="margin:4px 0;color:#6B7280;font-size:13px;">Votre partenaire RH au Sénégal</p>
    <div class="contract-number">Contrat N° ${contractNumber}</div>
  </div>

  <h1>CONTRAT D'ABONNEMENT — PREVICARE EMPLOI</h1>
  <p style="color:#6B7280;font-size:13px;margin-top:-8px;">${roleLabel}</p>

  <div class="section">
    <h2>Informations du Souscripteur</h2>
    <div class="info-grid">
      <span class="info-label">Nom complet :</span>
      <span class="info-value">${profile?.first_name || ''} ${profile?.last_name || ''}</span>
      <span class="info-label">Email :</span>
      <span class="info-value">${profile?.email || authData.user.email}</span>
      <span class="info-label">Téléphone :</span>
      <span class="info-value">${profile?.phone || 'Non renseigné'}</span>
      <span class="info-label">Adresse :</span>
      <span class="info-value">${profile?.address || 'Non renseignée'}</span>
    </div>
  </div>

  ${mandateSection}
  ${employerSection}

  <div class="section">
    <h2>Détails de l'Abonnement</h2>
    <div class="info-grid">
      <span class="info-label">Formule :</span>
      <span class="info-value">${subscription.plan?.display_name}</span>
      <span class="info-label">Montant${billingLabel.startsWith('/') ? '' : ' '}${billingLabel} :</span>
      <span class="info-value">${amountFormatted} FCFA</span>
      <span class="info-label">Date de début :</span>
      <span class="info-value">${contractDate}</span>
      <span class="info-label">Date d'expiration :</span>
      <span class="info-value">${expiryDate}</span>
      <span class="info-label">Mode de paiement :</span>
      <span class="info-value">${paymentMethodLabel}</span>
    </div>
  </div>

  <div class="section">
    <h2>Services Inclus</h2>
    <div class="features">
      <ul>
        ${subscription.plan?.features?.map((f: string) => `<li>${f}</li>`).join('') || ''}
      </ul>
    </div>
  </div>

  <div class="section">
    <h2>Conditions Générales d'Abonnement (CGA)</h2>
    <div class="info-grid">
      <span class="info-label">Version CGA acceptée :</span>
      <span class="info-value">${cgaVersion}</span>
      <span class="info-label">Date d'acceptation :</span>
      <span class="info-value">${cgaDateFormatted}</span>
      <span class="info-label">Consultation :</span>
      <span class="info-value">https://previcareemploi.sn/cga-cgu</span>
    </div>
    <p style="font-size:13px;color:#4B5563;margin-top:12px;">Le présent contrat est conclu pour une durée correspondant à la période de facturation souscrite, renouvelable par tacite reconduction. Le souscripteur peut résilier son abonnement à tout moment depuis son espace personnel, avec prise d'effet à la fin de la période en cours. PREVICARE EMPLOI s'engage à fournir les services décrits ci-dessus selon les modalités définies dans les conditions générales d'abonnement.</p>
  </div>

  <div class="signature-section">
    <div class="signature-box">
      <p><strong>Le Souscripteur</strong></p>
      <div class="signature-line">
        ${profile?.first_name || ''} ${profile?.last_name || ''}
      </div>
    </div>
    <div class="signature-box">
      <p><strong>PREVICARE EMPLOI</strong></p>
      <div class="signature-line">
        Signature électronique
      </div>
    </div>
  </div>

  <div class="footer">
    <p>${COMPANY_LEGAL.name} — ${COMPANY_LEGAL.address}</p>
    <p>NIF : ${COMPANY_LEGAL.nif} · STAT : ${COMPANY_LEGAL.stat} · RCCM : ${COMPANY_LEGAL.rccm}</p>
    <p>Tarifs exprimés en FCFA — TVA incluse le cas échéant</p>
    <p>Document généré électroniquement le ${new Date().toLocaleDateString('fr-FR')} — Ce document fait foi de contrat</p>
  </div>
</body>
</html>`;

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="contrat-${contractNumber}.html"`,
      },
    });

  } catch (error) {
    console.error('Contract generation error:', error);
    return new Response('Erreur lors de la génération du contrat', { status: 500 });
  }
};