import type { AppState, Doc, DocLine } from '../types';
import { daysAgo, addDays, todayISO, uid } from './utils';

const line = (
  label: string,
  quantity: number,
  unitPrice: number,
  unit = 'unité',
  vatRate = 20,
  description = '',
): DocLine => ({ id: uid(), label, description, quantity, unit, unitPrice, vatRate });

export const buildSeed = (): AppState => {
  /* -------------------------------- Contacts ------------------------------- */
  const contacts = [
    {
      id: 'ct-atelier', kind: 'client' as const, company: 'Atelier Lumière',
      firstName: 'Camille', lastName: 'Roche', email: 'camille@atelierlumiere.fr',
      phone: '06 12 45 78 90', address: '18 rue de Turenne', zip: '75003', city: 'Paris',
      siret: '512 348 976 00014', createdAt: daysAgo(320),
    },
    {
      id: 'ct-berthelot', kind: 'client' as const, company: 'Maison Berthelot',
      firstName: 'Antoine', lastName: 'Berthelot', email: 'a.berthelot@maisonberthelot.fr',
      phone: '04 78 22 41 63', address: '5 quai Saint-Antoine', zip: '69002', city: 'Lyon',
      siret: '428 993 210 00027', createdAt: daysAgo(280),
    },
    {
      id: 'ct-nordik', kind: 'client' as const, company: 'Studio Nordik',
      firstName: 'Ingrid', lastName: 'Larsen', email: 'ingrid@studionordik.com',
      phone: '03 20 55 18 72', address: '92 rue de Gand', zip: '59800', city: 'Lille',
      siret: '901 442 587 00019', createdAt: daysAgo(210),
    },
    {
      id: 'ct-charlot', kind: 'client' as const, company: 'Boulangerie Charlot',
      firstName: 'Marc', lastName: 'Charlot', email: 'contact@boulangerie-charlot.fr',
      phone: '05 56 81 09 34', address: '27 cours Portal', zip: '33000', city: 'Bordeaux',
      siret: '344 870 122 00031', createdAt: daysAgo(190),
    },
    {
      id: 'ct-aliscamps', kind: 'client' as const, company: 'Hôtel Les Alyscamps',
      firstName: 'Sofia', lastName: 'Mendez', email: 'direction@hotel-aliscamps.fr',
      phone: '04 90 96 27 40', address: '3 allée des Sarcophages', zip: '13200', city: 'Arles',
      siret: '752 118 460 00012', createdAt: daysAgo(160),
    },
    {
      id: 'ct-moreau', kind: 'client' as const, company: 'Cabinet Moreau & Associés',
      firstName: 'Hélène', lastName: 'Moreau', email: 'h.moreau@cabinet-moreau.fr',
      phone: '01 42 68 53 00', address: '41 boulevard Haussmann', zip: '75009', city: 'Paris',
      siret: '619 205 884 00023', createdAt: daysAgo(140),
    },
    {
      id: 'ct-jardin', kind: 'client' as const, company: "Le Jardin d'Adèle",
      firstName: 'Adèle', lastName: 'Fabre', email: 'adele@lejardindadele.fr',
      phone: '06 78 30 12 56', address: '12 chemin des Lavandes', zip: '84000', city: 'Avignon',
      siret: '883 401 296 00017', createdAt: daysAgo(95),
    },
    {
      id: 'ct-papeterie', kind: 'fournisseur' as const, company: 'Papeterie Centrale',
      firstName: 'Julien', lastName: 'Perrot', email: 'pro@papeterie-centrale.fr',
      phone: '01 48 87 20 15', address: '8 rue des Imprimeurs', zip: '93100', city: 'Montreuil',
      siret: '402 555 731 00040', createdAt: daysAgo(300),
    },
  ];

  /* ------------------------------ Bibliothèque ----------------------------- */
  const items = [
    { id: 'it-conseil', reference: 'SRV-001', name: 'Prestation de conseil', description: 'Accompagnement stratégique et opérationnel', kind: 'service' as const, unit: 'jour', price: 650, vatRate: 20, active: true },
    { id: 'it-dev', reference: 'SRV-002', name: 'Développement web', description: 'Développement front-end / back-end sur mesure', kind: 'service' as const, unit: 'heure', price: 85, vatRate: 20, active: true },
    { id: 'it-design', reference: 'SRV-003', name: 'Design UI / UX', description: 'Conception d’interfaces et prototypes', kind: 'service' as const, unit: 'jour', price: 550, vatRate: 20, active: true },
    { id: 'it-maintenance', reference: 'SRV-004', name: 'Forfait maintenance', description: 'Maintenance corrective et évolutive, mises à jour', kind: 'service' as const, unit: 'mois', price: 290, vatRate: 20, active: true },
    { id: 'it-formation', reference: 'SRV-005', name: 'Formation équipe', description: 'Session de formation jusqu’à 8 personnes', kind: 'service' as const, unit: 'jour', price: 890, vatRate: 20, active: true },
    { id: 'it-redaction', reference: 'SRV-006', name: 'Rédaction de contenu', description: 'Rédaction pages web, articles, fiches produits', kind: 'service' as const, unit: 'forfait', price: 450, vatRate: 20, active: true },
    { id: 'it-licence', reference: 'PRD-001', name: 'Licence logiciel annuelle', description: 'Licence d’utilisation, support inclus', kind: 'produit' as const, unit: 'an', price: 1200, vatRate: 20, active: true },
    { id: 'it-hebergement', reference: 'PRD-002', name: 'Hébergement web', description: 'Serveur dédié, sauvegardes quotidiennes', kind: 'produit' as const, unit: 'mois', price: 45, vatRate: 20, active: true },
    { id: 'it-deplacement', reference: 'SRV-007', name: 'Frais de déplacement', description: 'Forfait transport + hébergement', kind: 'service' as const, unit: 'forfait', price: 180, vatRate: 20, active: true },
    { id: 'it-support', reference: 'SRV-008', name: 'Support prioritaire', description: 'Assistance sous 4 h ouvrées', kind: 'service' as const, unit: 'heure', price: 120, vatRate: 20, active: true },
    { id: 'it-cartes', reference: 'PRD-003', name: 'Cartes de visite (x500)', description: 'Impression 350 g, pelliculage mat', kind: 'produit' as const, unit: 'lot', price: 89, vatRate: 20, active: false },
  ];

  /* -------------------------------- Documents ------------------------------ */
  const year = new Date().getFullYear();
  const num = (p: string, n: number) => `${p}-${year}-${String(n).padStart(3, '0')}`;

  const docs: Doc[] = [];

  /* --------------------------------- Banques ------------------------------- */
  const accounts = [

    {
      id: 'bk-sg', name: 'Compte courant', bank: 'Société Générale',
      iban: 'FR76 3000 3032 1122 3344 5566 789', type: 'courant' as const,
      initialBalance: 2300, color: '#6366f1',
    },
    
  ];

  const tx = (
    accountId: string, date: string, label: string, amount: number,
    category: string, reconciled = true, invoiceId?: string,
  ) => ({ id: uid(), accountId, date, label, amount, category, invoiceId, reconciled });

  const transactions = [
    tx('bk-sg', daysAgo(55), 'Assurance RC Pro', -112, 'Assurance'),
    tx('bk-sg', daysAgo(22), 'SNCF — déplacement Lyon', -124, 'Déplacement', false),
    tx('bk-sg', daysAgo(3), 'Déjeuner client — Le Comptoir', -86.5, 'Repas', false),
  ];

  /* ------------------------------- Ressources ------------------------------ */
  const resources = [
    {
      id: 'rs-mentions', title: 'Mentions obligatoires sur une facture', kind: 'guide' as const,
      tag: 'Conformité', updatedAt: daysAgo(12),
      description: 'La liste complète des mentions exigées par le Code de commerce pour qu’une facture soit en règle.',
      content: `Une facture française doit comporter un certain nombre de mentions obligatoires prévues par l'article L441-9 du Code de commerce et l'article 289 du CGI. En cas de manquement, vous risquez une amende fiscale pouvant atteindre 75 000 €.

## Identité des parties
- Nom ou raison sociale, adresse du siège social des deux parties
- Numéro SIREN/SIRET et code APE du vendeur
- Numéro de TVA intracommunautaire (si assujetti)
- Forme juridique et montant du capital social (sociétés)

## Mentions propres à la facture
- Numéro de facture unique, basé sur une séquence chronologique continue
- Date d'émission et date de livraison ou de prestation
- Désignation, quantité et prix unitaire HT de chaque produit ou service
- Taux de TVA applicable et montant total de la TVA par taux
- Total HT et total TTC
- Date d'échéance du paiement et conditions d'escompte éventuel
- Taux des pénalités de retard et mention de l'indemnité forfaitaire de recouvrement de 40 €

> Bon à savoir : la mention « TVA non applicable, art. 293 B du CGI » est requise pour les micro-entrepreneurs en franchise de TVA.`,
    },
    {
      id: 'rs-tva', title: 'Les taux de TVA en France', kind: 'fiche' as const,
      tag: 'TVA', updatedAt: daysAgo(30),
      description: '20 %, 10 %, 5,5 %, 2,1 % : quel taux appliquer selon la nature de votre prestation ?',
      content: `## Le taux normal : 20 %
Il s'applique par défaut à toutes les ventes de biens et prestations de services : conseil, développement, design, formation, produits manufacturés…

## Le taux intermédiaire : 10 %
- Travaux d'amélioration et de rénovation dans les logements anciens
- Restauration sur place
- Transport de voyageurs
- Entrée aux musées, cinémas, zoos…

## Le taux réduit : 5,5 %
- Produits alimentaires (première nécessité)
- Livres (papier et numérique)
- Travaux d'amélioration de la performance énergétique des logements
- Abonnements gaz et électricité

## Le taux super-réduit : 2,1 %
- Médicaments remboursables par la Sécurité sociale
- Publications de presse
- Spectacles vivants (140 premières représentations)

> En cas de doute sur le taux applicable à votre activité, interrogez votre expert-comptable ou le service des impôts : une erreur de taux engage votre responsabilité.`,
    },
    {
      id: 'rs-delais', title: 'Délais de paiement entre professionnels', kind: 'guide' as const,
      tag: 'Encaissement', updatedAt: daysAgo(45),
      description: '30 jours, 45 jours fin de mois, 60 jours : le cadre légal des délais de règlement B2B.',
      content: `## La règle par défaut
En l'absence de conditions convenues, le délai de règlement est de 30 jours à compter de la réception des marchandises ou de l'exécution de la prestation.

## Les délais négociés
- Jusqu'à 45 jours fin de mois à compter de la date d'émission de la facture
- Ou jusqu'à 60 jours à compter de la date d'émission

## Bonnes pratiques pour être payé plus vite
- Indiquez clairement la date d'échéance sur chaque facture
- Demandez un acompte de 30 % à la commande (courant dans les services)
- Facturez dès la livraison, pas en fin de mois
- Relancez par écrit dès le premier jour de retard
- Pour les gros montants, vérifiez la santé financière du client en amont

> L'administration, elle, doit payer sous 30 jours ; tout retard déclenche automatiquement des intérêts moratoires en votre faveur.`,
    },
    {
      id: 'rs-relance', title: 'Modèle de relance de facture impayée', kind: 'modele' as const,
      tag: 'Relances', updatedAt: daysAgo(8),
      description: 'Un e-mail de relance courtois mais ferme, à copier-coller dès le premier jour de retard.',
      content: `## Relance amiable (J+1 à J+7)

Objet : Facture [NUMÉRO] en attente de règlement

Bonjour [PRÉNOM],

Sauf erreur de notre part, la facture [NUMÉRO] d'un montant de [MONTANT] DH TTC, arrivée à échéance le [DATE], n'a pas encore été réglée.

Il s'agit peut-être d'un simple oubli. Vous trouverez la facture en pièce jointe, ainsi que nos coordonnées bancaires.

Merci de bien vouloir procéder au règlement dans les meilleurs délais, ou de nous indiquer la date prévue de paiement.

Bien cordialement,
[VOTRE NOM]

## Relance ferme (J+15)

Objet : Mise en demeure — Facture [NUMÉRO]

Madame, Monsieur,

Malgré notre précédente relance, la facture [NUMÉRO] d'un montant de [MONTANT] DH TTC demeure impayée.

Nous vous mettons en demeure de régler cette somme sous 8 jours, majorée des pénalités de retard prévues et de l'indemnité forfaitaire de recouvrement de 40 €.

À défaut, nous serions contraints de saisir la juridiction compétente.

Cordialement,
[VOTRE NOM]`,
    },
    {
      id: 'rs-numerotation', title: 'Numérotation des factures : les règles', kind: 'fiche' as const,
      tag: 'Conformité', updatedAt: daysAgo(60),
      description: 'Séquence chronologique continue, sans trou : ce que l’administration fiscale attend de vous.',
      content: `## Le principe
Chaque facture doit porter un numéro unique, issu d'une séquence chronologique continue et sans rupture. Vous ne pouvez ni supprimer ni réutiliser un numéro.

## Exemples de formats valides
- 2025-001, 2025-002, 2025-003…
- FAC-2025-0001, FAC-2025-0002…
- A-001, A-002 (préfixe par année ou par point de vente)

## En cas d'erreur
- Ne supprimez jamais une facture émise : annulez-la par une facture d'avoir
- L'avoir porte son propre numéro dans la même séquence et référence la facture d'origine

## Plusieurs séquences
Vous pouvez utiliser des séquences distinctes (par exemple par établissement ou par activité), à condition que chacune soit continue et que la règle de numérotation soit documentée dans votre comptabilité.

> Facturo gère automatiquement une séquence continue par type de document : DEV-AAAA-NNN pour les devis, FAC-AAAA-NNN pour les factures.`,
    },
    {
      id: 'rs-penalites', title: 'Pénalités de retard et indemnité de 40 €', kind: 'guide' as const,
      tag: 'Encaissement', updatedAt: daysAgo(20),
      description: 'Ce que vous pouvez légalement réclamer à un client professionnel qui paie en retard.',
      content: `## L'indemnité forfaitaire de recouvrement
Depuis 2013, tout professionnel en situation de retard de paiement doit de plein droit à son créancier une indemnité forfaitaire de 40 € pour frais de recouvrement (article D441-5 du Code de commerce). Des frais complémentaires peuvent être réclamés sur justificatifs.

## Les pénalités de retard
- Exigibles sans rappel, dès le lendemain de la date d'échéance
- Taux : celui figurant sur vos factures et CGV (au minimum 3 fois le taux d'intérêt légal)
- Calcul : montant TTC × taux annuel × (jours de retard / 365)

## Les mentionner sur vos factures
Pour être applicables, les pénalités et l'indemnité de 400 DH doivent figurer dans vos conditions générales de vente ET sur vos factures. Sans cette mention, vous y renoncez.

> Astuce : menacez rarement, relancez souvent. Une relance téléphonique suivie d'un e-mail dans l'heure reste le canal le plus efficace avant tout contentieux.`,
    },
  ];

  /* --------------------------------- Entreprise ---------------------------- */
  const company = {
    name: 'Syzon',
    legalForm: 'ICE:003832862000086',
    address: 'Boulevard Youssef ibn Tachfine',
    zip: '9053',
    city: 'Tanger',
    ice: '003832862000086',
    vatNumber: 'FR12901234567',
    email: 'syzon2025@gmail.com',
    phone: '06 61 26 46 68',
    iban: 'FR76 1695 8000 0134 5678 9012 345',
  };

  return {
    contacts,
    items,
    docs,
    accounts,
    transactions,
    resources,
    company,
    counters: { quote: 0, invoice: 0 },
    updatedAt: new Date().toISOString(),
  };
};
