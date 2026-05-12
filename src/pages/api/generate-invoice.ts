import type { APIRoute } from 'astro';
import { createClient } from '../../lib/supabase';
import { COMPANY_LEGAL } from '../../lib/legalInfo';

export const GET: APIRoute = async ({ request, cookies, url }) => {
  try {
    const supabase = createClient({ request, cookies });
    
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData.user) {
      return new Response('Non authentifié', { status: 401 });
    }

    const paymentId = url.searchParams.get('paymentId');
    
    if (!paymentId) {
      return new Response('ID de paiement manquant', { status: 400 });
    }

    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .select(`
        *,
        subscription:subscriptions(
          *,
          plan:subscription_plans(*)
        )
      `)
      .eq('id', paymentId)
      .eq('user_id', authData.user.id)
      .single();

    if (paymentError || !payment) {
      return new Response('Paiement non trouvé', { status: 404 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, last_name, email, phone, address, role, organization')
      .eq('id', authData.user.id)
      .single();

    const userRole = profile?.role || 'employee';
    const plan = payment.subscription?.plan;
    const billingPeriodLabel = plan?.billing_period === 'quarterly' ? '1 trimestre'
      : plan?.billing_period === 'yearly' ? '1 an'
      : '1 mois';

    let delegateDetails: Record<string, any> | null = null;
    if (userRole === 'delegate') {
      const { data: dd } = await supabase
        .from('delegate_details')
        .select('company_name, mandate_type')
        .eq('id', authData.user.id)
        .single();
      delegateDetails = dd;
    }

    let employerDetails: Record<string, any> | null = null;
    if (userRole === 'employer') {
      const { data: ed } = await supabase
        .from('employer_details')
        .select('company_name, siret_rc')
        .eq('id', authData.user.id)
        .single();
      employerDetails = ed;
    }

    const { data: cgaAcceptance } = await supabase
      .from('cga_acceptances')
      .select('cga_version, accepted_at')
      .eq('user_id', authData.user.id)
      .eq('subscription_id', payment.subscription_id)
      .order('accepted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const cgaVersion = cgaAcceptance?.cga_version
      || payment.subscription?.cga_version
      || COMPANY_LEGAL.cgaVersion;
    const cgaAcceptedAt = cgaAcceptance?.accepted_at || payment.subscription?.cga_accepted_at;
    const cgaDateFormatted = cgaAcceptedAt
      ? new Date(cgaAcceptedAt).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })
      : null;

    const paymentDate = new Date(payment.created_at).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });

    const mandateTypes: Record<string, string> = {
      titulaire: 'Délégué titulaire',
      suppl\u00e9ant: 'Délégué suppléant',
      delegue_syndical: 'Délégué syndical',
      representant_syndicat: 'Représentant du personnel',
    };

    let clientExtraLines = '';
    if (userRole === 'delegate' && delegateDetails) {
      const mt = mandateTypes[delegateDetails.mandate_type] || delegateDetails.mandate_type || '-';
      clientExtraLines = `
      <span class="info-label">Qualité :</span>
      <span class="info-value">${mt} — ${delegateDetails.company_name || ''}</span>`;
    } else if (userRole === 'employer') {
      const company = employerDetails?.company_name || profile?.organization || '-';
      clientExtraLines = `
      <span class="info-label">Entreprise :</span>
      <span class="info-value">${company}</span>
      ${employerDetails?.siret_rc ? `<span class="info-label">SIRET / RCCM :</span>
      <span class="info-value">${employerDetails.siret_rc}</span>` : ''}`;
    }

    const paymentMethodLabel = payment.payment_method === 'om' ? 'Orange Money'
      : payment.payment_method === 'wave' ? 'Wave'
      : payment.payment_method === 'dexchange' ? 'Mobile Money (Dexchange)'
      : payment.payment_method;

    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Facture - ${payment.invoice_number}</title>
  <style>
    body { font-family: 'Inter', Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; line-height: 1.6; color: #0B1D3A; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #0B1D3A; padding-bottom: 20px; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #0B1D3A; }
    .logo-accent { color: #C9A961; }
    .invoice-info { text-align: right; }
    .invoice-number { font-size: 20px; font-weight: bold; color: #0B1D3A; }
    h2 { color: #0B1D3A; font-size: 16px; margin-bottom: 10px; }
    .section { margin-bottom: 28px; }
    .info-box { background: #F6F4EE; padding: 15px; border-radius: 8px; border: 1px solid #E5E7EB; }
    .info-grid { display: grid; grid-template-columns: 170px 1fr; gap: 8px; }
    .info-label { font-weight: 600; color: #0B1D3A; font-size: 13px; }
    .info-value { color: #4B5563; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; margin-top: 16px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; font-size: 13px; }
    th { background: #0B1D3A; color: #F6F4EE; }
    .total-row { font-weight: bold; font-size: 16px; }
    .total-row td { border-top: 2px solid #C9A961; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
    .status-completed { background: #dcfce7; color: #166534; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .cga-line { margin-top: 12px; font-size: 11px; color: #6B7280; }
    .footer { margin-top: 48px; text-align: center; font-size: 11px; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo"><span class="logo-accent">·</span> PREVICARE EMPLOI</div>
      <p style="margin:4px 0;color:#6B7280;font-size:13px;">Votre partenaire RH au Sénégal</p>
      <p style="margin:4px 0;font-size:11px;color:#9CA3AF;">${COMPANY_LEGAL.address}</p>
    </div>
    <div class="invoice-info">
      <div class="invoice-number">${payment.invoice_number}</div>
      <p style="margin:4px 0;color:#6B7280;font-size:13px;">Date : ${paymentDate}</p>
      <span class="status ${payment.status === 'completed' ? 'status-completed' : 'status-pending'}">
        ${payment.status === 'completed' ? 'PAYÉE' : 'EN ATTENTE'}
      </span>
    </div>
  </div>

  <div class="section">
    <h2>Facturé à</h2>
    <div class="info-box">
      <div class="info-grid">
        <span class="info-label">Nom :</span>
        <span class="info-value">${profile?.first_name || ''} ${profile?.last_name || ''}</span>
        <span class="info-label">Email :</span>
        <span class="info-value">${profile?.email || authData.user.email}</span>
        <span class="info-label">Téléphone :</span>
        <span class="info-value">${profile?.phone || '-'}</span>
        ${clientExtraLines}
      </div>
    </div>
  </div>

  <div class="section">
    <h2>Détails de la Facture</h2>
    <table>
      <thead>
        <tr>
          <th>Description</th>
          <th>Période</th>
          <th style="text-align:right;">Montant</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>
            <strong>Abonnement ${plan?.display_name || 'PREVICARE'}</strong>
            <br><span style="font-size:11px;color:#6B7280;">Contrat : ${payment.subscription?.contract_number || '-'}</span>
          </td>
          <td>${billingPeriodLabel}</td>
          <td style="text-align:right;">${new Intl.NumberFormat('fr-SN').format(payment.amount)} FCFA</td>
        </tr>
        <tr class="total-row">
          <td colspan="2">TOTAL</td>
          <td style="text-align:right;">${new Intl.NumberFormat('fr-SN').format(payment.amount)} FCFA</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Informations de Paiement</h2>
    <div class="info-box">
      <div class="info-grid">
        <span class="info-label">Mode de paiement :</span>
        <span class="info-value">${paymentMethodLabel}</span>
        <span class="info-label">Référence :</span>
        <span class="info-value">${payment.payment_reference || '-'}</span>
        <span class="info-label">Statut :</span>
        <span class="info-value">${payment.status === 'completed' ? 'Paiement reçu' : 'En attente'}</span>
      </div>
      ${cgaDateFormatted ? `<div class="cga-line">CGA version ${cgaVersion} acceptée le ${cgaDateFormatted}</div>` : ''}
    </div>
  </div>

  <div class="footer">
    <p>${COMPANY_LEGAL.name} — ${COMPANY_LEGAL.address}</p>
    <p>NIF : ${COMPANY_LEGAL.nif} · STAT : ${COMPANY_LEGAL.stat} · RCCM : ${COMPANY_LEGAL.rccm}</p>
    <p>Tarifs exprimés en FCFA — TVA incluse le cas échéant</p>
    <p>Document généré électroniquement le ${new Date().toLocaleDateString('fr-FR')}</p>
  </div>
</body>
</html>`;

    return new Response(htmlContent, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="facture-${payment.invoice_number}.html"`,
      },
    });

  } catch (error) {
    console.error('Invoice generation error:', error);
    return new Response('Erreur lors de la génération de la facture', { status: 500 });
  }
};