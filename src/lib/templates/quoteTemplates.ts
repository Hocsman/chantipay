/**
 * Templates de descriptions par métier
 * Bibliothèque de templates pré-écrits pour accélérer la création de devis
 */

export interface QuoteTemplate {
  id: string
  title: string
  description: string
  trade: 'plomberie' | 'electricite' | 'peinture' | 'menuiserie' | 'autre'
  category: string
}

export const QUOTE_TEMPLATES: QuoteTemplate[] = [
  // ====================================
  // PLOMBERIE
  // ====================================
  {
    id: 'plomberie-fuite-simple',
    title: 'Réparation fuite simple',
    description: 'Intervention pour réparation d\'une fuite d\'eau. Diagnostic, remplacement du joint défectueux ou du raccord, test d\'étanchéité et nettoyage de la zone d\'intervention.',
    trade: 'plomberie',
    category: 'Fuite',
  },
  {
    id: 'plomberie-fuite-complexe',
    title: 'Réparation fuite complexe avec remplacement tuyauterie',
    description: 'Réparation d\'une fuite importante nécessitant le remplacement d\'une section de tuyauterie. Fourniture et pose de nouveaux tubes, raccordement, soudure, test de pression et remise en état.',
    trade: 'plomberie',
    category: 'Fuite',
  },
  {
    id: 'plomberie-wc',
    title: 'Installation complète WC',
    description: 'Dépose de l\'ancien WC, préparation du sol et des arrivées d\'eau. Fourniture et pose d\'un nouveau WC avec mécanisme de chasse, joint, raccordement aux eaux usées et à l\'arrivée d\'eau. Test de fonctionnement et nettoyage du chantier.',
    trade: 'plomberie',
    category: 'Installation sanitaire',
  },
  {
    id: 'plomberie-lavabo',
    title: 'Installation lavabo avec robinetterie',
    description: 'Fourniture et pose d\'un lavabo avec meuble si nécessaire. Installation de la robinetterie mitigeur, raccordement eau chaude et froide, installation du siphon et de l\'évacuation. Étanchéité et mise en service.',
    trade: 'plomberie',
    category: 'Installation sanitaire',
  },
  {
    id: 'plomberie-douche',
    title: 'Installation douche complète',
    description: 'Création ou rénovation d\'une douche complète. Receveur ou douche à l\'italienne, robinetterie thermostatique, colonne de douche, paroi vitrée. Raccordements eau chaude/froide et évacuation, étanchéité et finitions.',
    trade: 'plomberie',
    category: 'Installation sanitaire',
  },
  {
    id: 'plomberie-chaudiere-gaz',
    title: 'Remplacement chaudière gaz',
    description: 'Dépose de l\'ancienne chaudière et évacuation. Fourniture et installation d\'une nouvelle chaudière gaz à condensation. Raccordement gaz, arrivée et retour chauffage, eau chaude sanitaire. Mise en service, réglages et formation de l\'utilisateur.',
    trade: 'plomberie',
    category: 'Remplacement chaudière',
  },
  {
    id: 'plomberie-chauffe-eau',
    title: 'Installation chauffe-eau électrique',
    description: 'Fourniture et pose d\'un chauffe-eau électrique. Installation du support mural, fixation du ballon, raccordement électrique et plomberie (groupe de sécurité, arrivée eau froide, départ eau chaude). Mise en service et vérification.',
    trade: 'plomberie',
    category: 'Installation sanitaire',
  },

  // ====================================
  // ÉLECTRICITÉ
  // ====================================
  {
    id: 'electricite-tableau-renovation',
    title: 'Rénovation tableau électrique',
    description: 'Remplacement complet du tableau électrique. Fourniture et pose d\'un nouveau tableau avec disjoncteurs différentiels, disjoncteurs divisionnaires. Repérage des circuits, raccordement, mise aux normes NF C 15-100 et essais de fonctionnement.',
    trade: 'electricite',
    category: 'Tableau électrique',
  },
  {
    id: 'electricite-mise-aux-normes',
    title: 'Mise aux normes installation électrique',
    description: 'Diagnostic complet de l\'installation existante. Mise en conformité selon NF C 15-100 : remplacement des fils non conformes, ajout de prises de terre, installation différentiels 30mA, mise en place parafoudre si nécessaire. Certification de conformité.',
    trade: 'electricite',
    category: 'Mise aux normes',
  },
  {
    id: 'electricite-prises-interrupteurs',
    title: 'Installation prises et interrupteurs',
    description: 'Création de nouveaux points électriques (prises et interrupteurs). Saignées si nécessaire, passage de câbles, pose des boîtiers d\'encastrement, raccordement et installation des appareillages. Rebouchage et finitions.',
    trade: 'electricite',
    category: 'Installation',
  },
  {
    id: 'electricite-eclairage-led',
    title: 'Installation éclairage LED intérieur',
    description: 'Fourniture et installation d\'éclairages LED. Spots encastrés ou appliques selon besoin. Câblage, raccordement, installation des transformateurs si nécessaire. Réglages et mise en service.',
    trade: 'electricite',
    category: 'Éclairage',
  },
  {
    id: 'electricite-eclairage-exterieur',
    title: 'Installation éclairage extérieur',
    description: 'Installation d\'éclairages extérieurs (appliques, spots, bornes). Câblage enterré ou protégé selon normes extérieures. Étanchéité IP44 minimum. Raccordement, réglage détecteurs de présence si demandé.',
    trade: 'electricite',
    category: 'Éclairage',
  },
  {
    id: 'electricite-volet-roulant',
    title: 'Installation volet roulant électrique',
    description: 'Fourniture et pose d\'un volet roulant électrique avec motorisation. Câblage électrique dédié, installation interrupteur ou télécommande, programmation, tests de fonctionnement et formation utilisateur.',
    trade: 'electricite',
    category: 'Installation',
  },

  // ====================================
  // PEINTURE
  // ====================================
  {
    id: 'peinture-piece-complete',
    title: 'Peinture pièce complète',
    description: 'Préparation des supports (rebouchage, ponçage, lessivage). Protection du mobilier et sols. Application d\'une sous-couche puis deux couches de peinture acrylique sur murs et plafond. Nettoyage et évacuation des protections.',
    trade: 'peinture',
    category: 'Pièce complète',
  },
  {
    id: 'peinture-plafond',
    title: 'Peinture plafond',
    description: 'Préparation du plafond (rebouchage fissures, ponçage). Protection des murs et sols. Application d\'une sous-couche puis deux couches de peinture blanche spécial plafond. Finition soignée et nettoyage.',
    trade: 'peinture',
    category: 'Plafonds',
  },
  {
    id: 'peinture-facade',
    title: 'Ravalement façade',
    description: 'Nettoyage haute pression de la façade. Traitement des fissures et réparation des supports. Application d\'un fixateur puis deux couches de peinture façade adaptée. Échafaudage, protection et nettoyage du chantier inclus.',
    trade: 'peinture',
    category: 'Façade',
  },
  {
    id: 'peinture-volets-bois',
    title: 'Peinture volets bois',
    description: 'Décapage ou ponçage des anciens volets. Traitement du bois si nécessaire. Application d\'une sous-couche bois puis deux couches de peinture microporeuse pour extérieur. Dépose et repose des volets.',
    trade: 'peinture',
    category: 'Menuiseries extérieures',
  },

  // ====================================
  // MENUISERIE
  // ====================================
  {
    id: 'menuiserie-porte-interieure',
    title: 'Pose porte intérieure',
    description: 'Fourniture et pose d\'une porte intérieure isoplane ou postformée avec huisserie. Prise de cotes, dépose ancienne porte si nécessaire. Pose huisserie, calage, fixation, pose de la porte, quincaillerie (poignée, serrure). Finitions et réglages.',
    trade: 'menuiserie',
    category: 'Porte',
  },
  {
    id: 'menuiserie-fenetre-pvc',
    title: 'Remplacement fenêtre PVC',
    description: 'Dépose ancienne fenêtre et évacuation. Fourniture et pose d\'une fenêtre PVC double vitrage. Étanchéité à l\'air et à l\'eau, isolation, pose appui de fenêtre. Finitions intérieures et extérieures, réglages.',
    trade: 'menuiserie',
    category: 'Fenêtre',
  },
  {
    id: 'menuiserie-parquet-flottant',
    title: 'Pose parquet flottant',
    description: 'Préparation du sol (ragréage si nécessaire). Pose d\'une sous-couche isolante. Fourniture et pose de parquet stratifié clipsable. Découpes, plinthes, barres de seuil. Nettoyage final.',
    trade: 'menuiserie',
    category: 'Parquet',
  },
  {
    id: 'menuiserie-placard-sur-mesure',
    title: 'Installation placard sur-mesure',
    description: 'Prise de cotes et conception sur-mesure. Fourniture et pose d\'un placard avec portes coulissantes ou battantes. Aménagement intérieur (étagères, penderie, tiroirs). Fixation murale, réglages et finitions.',
    trade: 'menuiserie',
    category: 'Aménagement',
  },
  {
    id: 'menuiserie-escalier-bois',
    title: 'Rénovation escalier bois',
    description: 'Ponçage complet de l\'escalier existant. Rebouchage et réparations si nécessaire. Application de lasure ou vernis (2 à 3 couches). Protection pendant séchage. Nettoyage final.',
    trade: 'menuiserie',
    category: 'Escalier',
  },
]

/**
 * Obtenir les templates par métier
 */
export function getTemplatesByTrade(trade: string): QuoteTemplate[] {
  return QUOTE_TEMPLATES.filter(t => t.trade === trade)
}

/**
 * Obtenir les catégories uniques par métier
 */
export function getCategoriesByTrade(trade: string): string[] {
  const templates = getTemplatesByTrade(trade)
  const categories = templates.map(t => t.category)
  return Array.from(new Set(categories))
}

/**
 * Obtenir un template par ID
 */
export function getTemplateById(id: string): QuoteTemplate | undefined {
  return QUOTE_TEMPLATES.find(t => t.id === id)
}

/**
 * Métiers disponibles
 */
export const AVAILABLE_TRADES = [
  { value: 'plomberie', label: 'Plomberie' },
  { value: 'electricite', label: 'Électricité' },
  { value: 'peinture', label: 'Peinture' },
  { value: 'menuiserie', label: 'Menuiserie' },
  { value: 'autre', label: 'Autre' },
] as const
