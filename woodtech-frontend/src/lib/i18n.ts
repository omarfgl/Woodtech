import { useCallback, useEffect, useState } from "react";
import { getCurrentLang, subscribeToLang } from "@/store/lang";
import type { Lang } from "@/store/lang";

// Dictionnaire francais simplifie (sans accents pour rester compatible partout).
const fr = {
  "common.loading": "Chargement...",

  "navbar.realisations": "Realisations",
  "navbar.cart": "Panier",
  "navbar.contact": "Contact",
  "navbar.assistant": "Assistant IA",
  "navbar.greeting": "Bonjour",
  "navbar.logout": "Deconnexion",
  "navbar.login": "Connexion",
  "navbar.signup": "Inscription",
  "navbar.switchToEn": "Passer le site en anglais",
  "navbar.switchToFr": "Passer le site en francais",
  "navbar.theme.noyer": "Noyer",
  "navbar.theme.frene": "Frene",
  "navbar.switchTheme": "Activer la teinte {theme}",

  "footer.brand": "WoodTech",
  "footer.about":
    "Atelier de menuiserie artisanale en Normandie. Realisations sur mesure en chene, noyer et essences locales.",
  "footer.contactTitle": "Coordonnees",
  "footer.address": "15 rue des Metiers, 14000 Caen",
  "footer.email": "contact@woodtech.fr",
  "footer.phone": "02 00 00 00 00",
  "footer.hoursTitle": "Horaires atelier",
  "footer.hoursWeek": "Lundi - Vendredi : 9h00 - 18h30",
  "footer.hoursWeekend": "Samedi : sur rendez-vous.",
  "footer.copy": "(c) {year} WoodTech - Omar Filali, Ousmane Tall. Tous droits reserves.",

  "home.hero.tagline": "Atelier WoodTech",
  "home.hero.title": "Meubles en bois massif",
  "home.hero.description.prefix": "Chene, noyer, frene... A partir de",
  "home.hero.description.price": "$1700",
  "home.hero.description.unit": "le m",
  "home.hero.description.details":
    "Conception, fabrication et pose par notre equipe d'artisans.",
  "home.hero.cta": "Voir le catalogue",
  "home.hero.secondaryCta": "Prendre rendez-vous",

  "home.materials.sectionTag": "Materiaux nobles",
  "home.materials.sectionTitle": "Les essences que nous travaillons",
  "home.materials.oak.name": "Chene",
  "home.materials.oak.trait.durability": "Durabilite",
  "home.materials.oak.trait.texture": "Texture chaleureuse",
  "home.materials.oak.trait.resistance": "Resistant a l'eau",
  "home.materials.oak.note": "Investissement premium",
  "home.materials.walnut.name": "Noyer",
  "home.materials.walnut.trait.grain": "Grain elegant",
  "home.materials.walnut.trait.touch": "Toucher soyeux",
  "home.materials.walnut.trait.stability": "Stabilite elevee",
  "home.materials.walnut.note": "Travail minutieux",
  "home.materials.ash.name": "Frene",
  "home.materials.ash.trait.flexibility": "Flexibilite",
  "home.materials.ash.trait.lightness": "Legerete",
  "home.materials.ash.trait.finish": "Finition satinee",
  "home.materials.ash.note": "Fibrage a maitriser",

  "home.featured.sectionTag": "Nos realisations",
  "home.featured.sectionTitle": "L'exigence artisanale sur chaque projet",
  "home.featured.description":
    "Du dessin initial a la pose finale, nous pilotons toutes les etapes : selection du bois, usinage, finitions et installation sur site.",
  "home.featured.previous": "Voir la realisation precedente",
  "home.featured.next": "Voir la realisation suivante",

  "home.portfolio.sectionTag": "Portfolio",
  "home.portfolio.sectionTitle": "Plus de realisations WoodTech",
  "home.portfolio.description":
    "Chaque projet est documente et suivi en atelier. Parcourez une selection recente et contactez-nous pour imaginer la realisation qui repondra a vos contraintes techniques et esthetiques.",

  "home.advantages.sectionTag": "Pourquoi WoodTech",
  "home.advantages.sectionTitle": "Les avantages a travailler avec nous",
  "home.advantages.consultationCta": "Recevoir une consultation",
  "home.advantages.inHouse.title": "Menuiserie maison",
  "home.advantages.inHouse.description":
    "Fabrication et finitions realisees dans notre atelier normand.",
  "home.advantages.sustainable.title": "Bois responsables",
  "home.advantages.sustainable.description":
    "Essences locales certifiees PEFC et traitements a base d'huiles naturelles.",
  "home.advantages.fairPricing.title": "Prix atelier",
  "home.advantages.fairPricing.description":
    "Circuit court : pas d'intermediaires, dialogue direct avec l'artisan.",

  "home.about.sectionTag": "A propos",
  "home.about.sectionTitle": "WoodTech, atelier normand d'agencement",
  "home.about.description":
    "Nous faconnons pieces uniques, mobilier sur mesure et agencements complets depuis plus de 20 ans. Notre atelier est equipe de machines numeriques et d'outils traditionnels pour conjuguer precision et savoir-faire artisanal.",
  "home.about.point.design": "- Accompagnement design et plans 3D.",
  "home.about.point.installation": "- Montage et pose par nos menuisiers.",
  "home.about.point.finish": "- Finitions huilees, vitrifees ou laquees.",
  "home.about.point.delivery": "- Livraison partout en Normandie et Paris.",

  "home.contact.sectionTag": "location",
  "home.contact.sectionTitle": "location",
  "home.contact.placeholder.name": "Votre nom",
  "home.contact.placeholder.phone": "Votre telephone",
  "home.contact.placeholder.project": "Votre projet",
  "home.contact.submit": "Envoyer",
  "home.contact.info.phone": "location",
  "home.contact.info.address": "location",
  "home.contact.info.schedule": "location",

  "home.projects.kitchen.title": "Cuisine en chene fume",
  "home.projects.kitchen.description":
    "Meubles suspendus, plan de travail massif et credence realisee sur mesure.",
  "home.projects.staircase.title": "Escalier flottant en noyer",
  "home.projects.staircase.description":
    "Marches integrees dans un mur porteur avec garde-corps en verre trempe.",
  "home.projects.library.title": "Bibliotheque murale XL",
  "home.projects.library.description":
    "Combinaison d'etageres et de niches lumineuses pour un salon ouvert.",
  "home.projects.masterSuite.title": "Suite parentale en frene blond",
  "home.projects.masterSuite.description":
    "Tete de lit, rangements integres et portes coulissantes en frene.",
  "home.projects.diningTable.title": "Table de reception 12 couverts",
  "home.projects.diningTable.description":
    "Plateau assemble a la main avec renforts invisibles et pieds en acier.",
  "home.projects.showroom.title": "Showroom boutique artisanale",
  "home.projects.showroom.description":
    "Comptoir, etageres et presentation produits en chene brosse et metal noir.",
  "home.projects.entryway.title": "Vestiaire d'entree sur mesure",
  "home.projects.entryway.description":
    "Banquette, penderies et modules chaussures adaptes a l'espace exigu.",
  "home.projects.studio.title": "Atelier creatif lumineux",
  "home.projects.studio.description":
    "Plans de travail en hetre, rangements modulaires et panneaux perfores.",
  "home.projects.tvWall.title": "Mur television boiserie",
  "home.projects.tvWall.description":
    "Habillage acoustique, niches decoratives et passage cables dissimule.",

  "pagination.previous": "Page precedente",
  "pagination.next": "Page suivante",
  "pagination.goToPage": "Aller a la page {page}",

  "catalogue.title": "Realisations",
  "catalogue.subtitle": "Catalogue et recherche en temps reel",
  "catalogue.searchPlaceholder": "Rechercher",
  "catalogue.error": "Impossible de charger le catalogue pour le moment.",
  "catalogue.loading": "Chargement des creations...",
  "catalogue.empty": "Aucun resultat pour \"{query}\".",

  "cart.empty.title": "Votre panier est vide",
  "cart.empty.description":
    "Parcourez nos realisations artisanales et ajoutez vos coups de coeur.",
  "cart.empty.cta": "Explorer le catalogue",
  "cart.title": "Panier",
  "cart.subtitle": "Verifiez votre selection avant validation de commande.",
  "cart.quantity": "Quantite : {qty}",
  "cart.remove": "Retirer",
  "cart.total": "Total : {total}",
  "cart.clear": "Vider le panier",
  "cart.checkout.done": "Commande simulee",
  "cart.checkout.submitting": "Validation...",
  "cart.checkout.submit": "Valider la commande",
  "cart.checkout.successMessage":
    "Merci pour votre commande ! Nous revenons vers vous sous 24 heures avec les prochaines etapes.",
  "cart.checkout.successTitle": "Paiement confirmé !",
  "cart.checkout.successBody":
    "Votre commande est enregistrée. Un email de confirmation et les prochaines étapes arrivent sous 24h.",
  "cart.payment.title": "Mode de paiement",
  "cart.payment.card": "Carte bancaire",
  "cart.payment.paypal": "PayPal",
  "cart.payment.stripe": "Stripe",
  "cart.payment.note": "Selectionnez un mode de paiement avant de valider la commande.",
  "cart.payment.card.name": "Nom sur la carte",
  "cart.payment.card.number": "Numero de carte",
  "cart.payment.card.expiry": "Expiration (MM/AA)",
  "cart.payment.card.cvc": "CVC",
  "cart.payment.paypal.email": "Email PayPal",
  "cart.payment.stripe.email": "Email Stripe",
  "cart.payment.error": "Veuillez renseigner les champs obligatoires pour ce mode de paiement.",

  "productDetail.loading": "Chargement du produit...",
  "productDetail.errorTitle": "Produit introuvable",
  "productDetail.errorMessage":
    "Ce meuble n'est plus disponible ou l'identifiant est invalide.",
  "productDetail.addToCart": "Ajouter au panier",
  "productDetail.quantityLabel": "Quantite",
  "productDetail.added": "Ajoute au panier !",
  "productDetail.contact": "Demander un devis",
  "productDetail.benefit.warranty": "Garantie 5 ans - finition huilee durable",
  "productDetail.benefit.sourcing": "Bois issu de forets gerees durablement",
  "productDetail.benefit.delivery":
    "Livraison et installation dans toute la Normandie",

  "contact.title": "Contact",
  "contact.subtitle":
    "Decrivez votre projet : nous reviendrons vers vous sous 48 heures avec un devis personnalise.",
  "contact.form.nameLabel": "Nom complet",
  "contact.form.emailLabel": "Adresse e-mail",
  "contact.form.messageLabel": "Message",
  "contact.form.namePlaceholder": "Ex. Jeanne Dupont",
  "contact.form.emailPlaceholder": "vous@exemple.fr",
  "contact.form.messagePlaceholder":
    "Decrivez vos dimensions, essences souhaitees, delais...",
  "contact.form.submit": "Envoyer la demande",
  "contact.success":
    "Merci ! Votre message a bien ete envoye. Nous vous repondrons rapidement.",
  "contact.error": "Impossible d'envoyer votre message. Merci de reessayer dans un instant.",
  "contact.validation.name": "Veuillez indiquer votre nom.",
  "contact.validation.email": "Adresse e-mail invalide.",
  "contact.validation.messageLength":
    "Le message doit contenir au moins 20 caracteres.",

  "assistant.badge": "Assistant IA",
  "assistant.title": "Discutez avec WoodTech",
  "assistant.subtitle":
    "Posez vos questions sur nos realisations, materiaux ou delais - l'assistant repond en quelques secondes.",
  "assistant.emptyState":
    "Commencez la conversation en posant une question sur un projet, un materiau ou nos services.",
  "assistant.loading": "L'assistant redige une reponse...",
  "assistant.promptLabel": "Votre question",
  "assistant.inputPlaceholder": "Ex. Quels delais pour une table en chene massif ?",
  "assistant.disclaimer":
    "Les reponses sont generees automatiquement a partir des informations publiques WoodTech.",
  "assistant.sending": "Envoi...",
  "assistant.submit": "Envoyer",
  "assistant.examplesTitle": "Idees de questions",
  "assistant.example.quote.title": "Estimation rapide",
  "assistant.example.quote.body":
    "\"Quel budget prevoir pour un dressing sur mesure de 3 metres ?\"",
  "assistant.example.material.title": "Choix des materiaux",
  "assistant.example.material.body":
    "\"Quel bois recommandez-vous pour une salle de bain ?\"",
  "assistant.example.delivery.title": "Logistique et pose",
  "assistant.example.delivery.body":
    "\"Livrez-vous et installez-vous a Paris ?\"",
  "assistant.error.missingKey": "Assistant indisponible : cle API manquante.",
  "assistant.error.generic":
    "Assistant indisponible pour le moment. Veuillez reessayer plus tard.",

  "serviceStatus.microserviceDown":
    "Un service est indisponible pour le moment. Certaines fonctionnalites peuvent etre degradees.",

  "login.title": "Connexion",
  "login.subtitle":
    "Accedez a votre espace pour suivre commandes et devis.",
  "login.form.emailLabel": "Email",
  "login.form.emailPlaceholder": "vous@exemple.fr",
  "login.form.passwordLabel": "Mot de passe",
  "login.form.passwordPlaceholder": "******",
  "login.form.error": "Impossible de vous connecter pour le moment.",
  "login.form.submitLoading": "Connexion...",
  "login.form.submit": "Se connecter",
  "login.registerPrompt": "Pas encore de compte ?",
  "login.registerLink": "Creer un compte",
  "login.validation.email": "Adresse e-mail invalide.",
  "login.validation.password":
    "Votre mot de passe doit contenir 6 caracteres.",

  "register.title": "Creer un compte",
  "register.subtitle":
    "Inscrivez-vous pour sauvegarder vos projets et suivre vos commandes.",
  "register.form.nameLabel": "Nom complet",
  "register.form.namePlaceholder": "Ex. Camille Dupuis",
  "register.form.emailLabel": "Adresse e-mail",
  "register.form.emailPlaceholder": "vous@exemple.fr",
  "register.form.passwordLabel": "Mot de passe",
  "register.form.passwordPlaceholder": "******",
  "register.form.confirmLabel": "Confirmer le mot de passe",
  "register.form.confirmPlaceholder": "******",
  "register.form.error":
    "Impossible de creer votre compte pour le moment.",
  "register.form.submitLoading": "Creation...",
  "register.form.submit": "Creer mon compte",
  "register.loginPrompt": "Deja inscrit ?",
  "register.loginLink": "Se connecter",
  "register.validation.name": "Merci d'indiquer un nom complet.",
  "register.validation.email": "Adresse e-mail invalide.",
  "register.validation.password": "Mot de passe trop court (8 caracteres).",
  "register.validation.confirm": "Les mots de passe ne correspondent pas.",
  "auth.required": "Vous devez etre connecté pour utiliser cette fonctionnalité."
} as const;

export type TranslationKey = keyof typeof fr;

const en: Record<TranslationKey, string> = {
  "common.loading": "Loading...",

  "navbar.realisations": "Projects",
  "navbar.cart": "Cart",
  "navbar.contact": "Contact",
  "navbar.assistant": "AI assistant",
  "navbar.greeting": "Hello",
  "navbar.logout": "Log out",
  "navbar.login": "Sign in",
  "navbar.signup": "Sign up",
  "navbar.switchToEn": "Switch site to English",
  "navbar.switchToFr": "Switch site to French",
  "navbar.theme.noyer": "Noyer",
  "navbar.theme.frene": "Frene",
  "navbar.switchTheme": "Switch to the {theme} palette",

  "footer.brand": "WoodTech",
  "footer.about":
    "Handcrafted woodworking studio in Normandy. Custom pieces in oak, walnut and local species.",
  "footer.contactTitle": "Contact details",
  "footer.address": "15 rue des Metiers, 14000 Caen",
  "footer.email": "contact@woodtech.fr",
  "footer.phone": "02 00 00 00 00",
  "footer.hoursTitle": "Workshop hours",
  "footer.hoursWeek": "Monday - Friday: 9:00 AM - 6:30 PM",
  "footer.hoursWeekend": "Saturday: by appointment.",
  "footer.copy":
    "(c) {year} WoodTech - Omar Filali, Ousmane Tall. All rights reserved.",

  "home.hero.tagline": "WoodTech workshop",
  "home.hero.title": "Solid wood furniture",
  "home.hero.description.prefix": "Oak, walnut, ash... Starting at",
  "home.hero.description.price": "$1700",
  "home.hero.description.unit": "per m",
  "home.hero.description.details":
    "Design, fabrication and installation by our team of artisans.",
  "home.hero.cta": "View the catalogue",
  "home.hero.secondaryCta": "Book an appointment",

  "home.materials.sectionTag": "Premium woods",
  "home.materials.sectionTitle": "The species we craft",
  "home.materials.oak.name": "Oak",
  "home.materials.oak.trait.durability": "Durability",
  "home.materials.oak.trait.texture": "Warm texture",
  "home.materials.oak.trait.resistance": "Water resistant",
  "home.materials.oak.note": "Premium investment",
  "home.materials.walnut.name": "Walnut",
  "home.materials.walnut.trait.grain": "Elegant grain",
  "home.materials.walnut.trait.touch": "Silky touch",
  "home.materials.walnut.trait.stability": "High stability",
  "home.materials.walnut.note": "Meticulous work",
  "home.materials.ash.name": "Ash",
  "home.materials.ash.trait.flexibility": "Flexibility",
  "home.materials.ash.trait.lightness": "Lightweight",
  "home.materials.ash.trait.finish": "Satin finish",
  "home.materials.ash.note": "Fiber control required",

  "home.featured.sectionTag": "Our projects",
  "home.featured.sectionTitle": "Craftsmanship on every build",
  "home.featured.description":
    "From the first sketch to final installation, we handle every step: wood selection, machining, finishing and on-site setup.",
  "home.featured.previous": "View previous project",
  "home.featured.next": "View next project",

  "home.portfolio.sectionTag": "Portfolio",
  "home.portfolio.sectionTitle": "More WoodTech projects",
  "home.portfolio.description":
    "Each project is documented and tracked in the workshop. Browse recent work and contact us to design the solution that fits your technical and aesthetic requirements.",

  "home.advantages.sectionTag": "Why WoodTech",
  "home.advantages.sectionTitle": "The benefits of working with us",
  "home.advantages.consultationCta": "Request a consultation",
  "home.advantages.inHouse.title": "In-house joinery",
  "home.advantages.inHouse.description":
    "Manufacturing and finishing handled in our Normandy workshop.",
  "home.advantages.sustainable.title": "Responsible wood",
  "home.advantages.sustainable.description":
    "Local species certified PEFC with natural oil treatments.",
  "home.advantages.fairPricing.title": "Workshop pricing",
  "home.advantages.fairPricing.description":
    "Short supply chain: no intermediaries, direct dialogue with the craftsman.",

  "home.about.sectionTag": "About",
  "home.about.sectionTitle": "WoodTech, bespoke interiors from Normandy",
  "home.about.description":
    "We craft unique pieces, custom furniture and full fitouts for over 20 years. Our workshop mixes CNC machinery and traditional tools for precise, artisanal results.",
  "home.about.point.design": "- Design support and 3D plans.",
  "home.about.point.installation": "- Assembly and installation by our carpenters.",
  "home.about.point.finish": "- Oiled, varnished or lacquered finishes.",
  "home.about.point.delivery": "- Delivery across Normandy and Paris.",

  "home.contact.sectionTag": "location",
  "home.contact.sectionTitle": "location",
  "home.contact.placeholder.name": "Your name",
  "home.contact.placeholder.phone": "Your phone",
  "home.contact.placeholder.project": "Your project",
  "home.contact.submit": "Send",
  "home.contact.info.phone": "location",
  "home.contact.info.address": "location",
  "home.contact.info.schedule": "location",

  "home.projects.kitchen.title": "Smoked oak kitchen",
  "home.projects.kitchen.description":
    "Hanging cabinets, solid countertop and custom backsplash.",
  "home.projects.staircase.title": "Floating walnut staircase",
  "home.projects.staircase.description":
    "Steps built into a load-bearing wall with tempered glass railing.",
  "home.projects.library.title": "XL wall library",
  "home.projects.library.description":
    "Mix of shelves and backlit niches for an open living room.",
  "home.projects.masterSuite.title": "Ash master suite",
  "home.projects.masterSuite.description":
    "Headboard, built-in storage and sliding ash doors.",
  "home.projects.diningTable.title": "12-seat dining table",
  "home.projects.diningTable.description":
    "Hand-assembled top with hidden reinforcements and steel legs.",
  "home.projects.showroom.title": "Artisan boutique showroom",
  "home.projects.showroom.description":
    "Counter, shelving and displays in brushed oak with black steel.",
  "home.projects.entryway.title": "Made-to-measure entryway",
  "home.projects.entryway.description":
    "Bench, wardrobes and shoe modules sized for tight spaces.",
  "home.projects.studio.title": "Bright creative studio",
  "home.projects.studio.description":
    "Beech worktops, modular storage and pegboards.",
  "home.projects.tvWall.title": "Timber media wall",
  "home.projects.tvWall.description":
    "Acoustic cladding, decorative niches and hidden cable management.",

  "pagination.previous": "Previous page",
  "pagination.next": "Next page",
  "pagination.goToPage": "Go to page {page}",

  "catalogue.title": "Projects",
  "catalogue.subtitle": "Catalogue with real-time search",
  "catalogue.searchPlaceholder": "Search",
  "catalogue.error": "Unable to load the catalogue right now.",
  "catalogue.loading": "Loading creations...",
  "catalogue.empty": "No results for \"{query}\".",

  "cart.empty.title": "Your cart is empty",
  "cart.empty.description":
    "Explore our handcrafted projects and add your favourites.",
  "cart.empty.cta": "Browse the catalogue",
  "cart.title": "Cart",
  "cart.subtitle": "Check your selection before confirming the order.",
  "cart.quantity": "Quantity: {qty}",
  "cart.remove": "Remove",
  "cart.total": "Total: {total}",
  "cart.clear": "Empty the cart",
  "cart.checkout.done": "Order simulated",
  "cart.checkout.submitting": "Processing...",
  "cart.checkout.submit": "Confirm the order",
  "cart.checkout.successMessage":
    "Thank you for your order! We will contact you within 24 hours with next steps.",
  "cart.checkout.successTitle": "Payment confirmed!",
  "cart.checkout.successBody":
    "Your order is recorded. A confirmation email and next steps are on the way within 24 hours.",
  "cart.payment.title": "Payment method",
  "cart.payment.card": "Card",
  "cart.payment.paypal": "PayPal",
  "cart.payment.stripe": "Stripe",
  "cart.payment.note": "Choose a payment option before confirming.",
  "cart.payment.card.name": "Name on card",
  "cart.payment.card.number": "Card number",
  "cart.payment.card.expiry": "Expiry (MM/YY)",
  "cart.payment.card.cvc": "CVC",
  "cart.payment.paypal.email": "PayPal email",
  "cart.payment.stripe.email": "Stripe email",
  "cart.payment.error": "Please fill in the required fields for this payment method.",

  "productDetail.loading": "Loading product...",
  "productDetail.errorTitle": "Product not found",
  "productDetail.errorMessage":
    "This piece is no longer available or the identifier is invalid.",
  "productDetail.addToCart": "Add to cart",
  "productDetail.quantityLabel": "Quantity",
  "productDetail.added": "Added to cart!",
  "productDetail.contact": "Request a quote",
  "productDetail.benefit.warranty": "5-year warranty - durable oiled finish",
  "productDetail.benefit.sourcing":
    "Wood sourced from sustainably managed forests",
  "productDetail.benefit.delivery":
    "Delivery and installation across Normandy",

  "contact.title": "Contact",
  "contact.subtitle":
    "Tell us about your project: we will get back within 48 hours with a tailored quote.",
  "contact.form.nameLabel": "Full name",
  "contact.form.emailLabel": "Email address",
  "contact.form.messageLabel": "Message",
  "contact.form.namePlaceholder": "e.g. Jane Smith",
  "contact.form.emailPlaceholder": "you@example.com",
  "contact.form.messagePlaceholder":
    "Describe dimensions, preferred species, timelines...",
  "contact.form.submit": "Send request",
  "contact.success":
    "Thank you! Your message has been sent. We will reply shortly.",
  "contact.error": "We could not send your message. Please try again in a moment.",
  "contact.validation.name": "Please provide your name.",
  "contact.validation.email": "Invalid email address.",
  "contact.validation.messageLength":
    "The message must contain at least 20 characters.",

  "assistant.badge": "AI assistant",
  "assistant.title": "Chat with WoodTech",
  "assistant.subtitle":
    "Ask about projects, materials or timelines - the assistant replies in seconds.",
  "assistant.emptyState":
    "Start the conversation with a question about a build, a material or WoodTech services.",
  "assistant.loading": "Assistant is drafting an answer...",
  "assistant.promptLabel": "Your question",
  "assistant.inputPlaceholder": "e.g. What is the lead time for a solid oak table?",
  "assistant.disclaimer":
    "Answers are generated automatically from WoodTech's public information.",
  "assistant.sending": "Sending...",
  "assistant.submit": "Send",
  "assistant.examplesTitle": "Question ideas",
  "assistant.example.quote.title": "Quick estimate",
  "assistant.example.quote.body":
    "\"What budget should I plan for a 3m custom wardrobe?\"",
  "assistant.example.material.title": "Materials",
  "assistant.example.material.body":
    "\"Which wood do you recommend for a bathroom?\"",
  "assistant.example.delivery.title": "Logistics & fitting",
  "assistant.example.delivery.body":
    "\"Do you deliver and install in Paris?\"",
  "assistant.error.missingKey": "Assistant unavailable: missing API key.",
  "assistant.error.generic":
      "Assistant is temporarily unavailable. Please try again later.",

  "serviceStatus.microserviceDown":
    "One service is currently unavailable. Some features may not work as expected.",

  "login.title": "Sign in",
  "login.subtitle":
    "Access your account to track orders and quotes.",
  "login.form.emailLabel": "Email",
  "login.form.emailPlaceholder": "you@example.com",
  "login.form.passwordLabel": "Password",
  "login.form.passwordPlaceholder": "******",
  "login.form.error": "Unable to sign you in right now.",
  "login.form.submitLoading": "Signing in...",
  "login.form.submit": "Sign in",
  "login.registerPrompt": "Don't have an account yet?",
  "login.registerLink": "Create an account",
  "login.validation.email": "Invalid email address.",
  "login.validation.password": "Your password must contain 6 characters.",

  "register.title": "Create an account",
  "register.subtitle":
    "Register to save your projects and track your orders.",
  "register.form.nameLabel": "Full name",
  "register.form.namePlaceholder": "e.g. Alex Martin",
  "register.form.emailLabel": "Email address",
  "register.form.emailPlaceholder": "you@example.com",
  "register.form.passwordLabel": "Password",
  "register.form.passwordPlaceholder": "******",
  "register.form.confirmLabel": "Confirm password",
  "register.form.confirmPlaceholder": "******",
  "register.form.error":
    "Unable to create your account right now.",
  "register.form.submitLoading": "Creating...",
  "register.form.submit": "Create my account",
  "register.loginPrompt": "Already registered?",
  "register.loginLink": "Sign in",
  "register.validation.name": "Please provide a full name.",
  "register.validation.email": "Invalid email address.",
  "register.validation.password": "Password too short (8 characters).",
  "register.validation.confirm": "Passwords do not match.",
  "auth.required": "You must be logged in to use this feature."
};

// On regroupe les dictionnaires par langue pour faciliter les recherches.
const translations: Record<Lang, Record<TranslationKey, string>> = {
  fr,
  en
};

const fallbackLang: Lang = "fr";

type TranslateOptions = {
  lang?: Lang;
  values?: Record<string, string | number>;
};

// Permet de remplacer {placeholders} dans les chaines i18n.
const interpolate = (
  template: string,
  values?: Record<string, string | number>
) => {
  if (!values) return template;
  return template.replace(/\{(\w+)\}/g, (match, token) => {
    const replacement = values[token];
    return replacement === undefined ? match : String(replacement);
  });
};

const translate = (lang: Lang, key: TranslationKey, values?: Record<string, string | number>) => {
  const dictionary = translations[lang] ?? translations[fallbackLang];
  const message = dictionary[key] ?? translations[fallbackLang][key] ?? key;
  return interpolate(message, values);
};

// Version statique pratique pour traduire hors React.
export function t(key: TranslationKey, options?: TranslateOptions) {
  const lang = options?.lang ?? getCurrentLang();
  return translate(lang, key, options?.values);
}

// Hook React qui renvoie une fonction memoisee dependant de la langue courante.
export function useTranslate() {
  const [lang, setLang] = useState<Lang>(() => getCurrentLang());

  useEffect(() => {
    return subscribeToLang(setLang);
  }, []);

  return useCallback(
    (key: TranslationKey, options?: Omit<TranslateOptions, "lang">) =>
      translate(lang, key, options?.values),
    [lang]
  );
}
