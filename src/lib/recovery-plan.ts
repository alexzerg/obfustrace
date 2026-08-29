import type { EmergencyCaseData } from "./case-model";

export type IncidentData = {
  nationality: string;
  currentCity: string;
  currentCountry: string;
  lostItem: "passport" | "identity-card" | "passport-and-wallet";
  incidentDate: string;
  plannedDeparture: string;
};

export type OfficialSource = {
  label: string;
  url: string;
  authority: string;
  verifiedDate: string;
};

export type RecoveryPlan = {
  authorityName: string;
  address: string;
  emergencyPhone: string;
  serviceHours: string;
  contactUrl: string;
  appointmentRequired: boolean;
  actions: Array<{
    id: string;
    title: string;
    description: string;
    sourceUrl?: string;
  }>;
  sources: OfficialSource[];
};

export const DEMO_INCIDENT: IncidentData = {
  nationality: "French",
  currentCity: "Barcelona",
  currentCountry: "Spain",
  lostItem: "passport-and-wallet",
  incidentDate: "2026-08-29",
  plannedDeparture: "2026-08-31",
};

const franceBarcelonaPlan: RecoveryPlan = {
  authorityName: "Consulat général de France à Barcelone",
  address: "Ronda Universitat, 22B, 4th floor, 08007 Barcelona",
  emergencyPhone: "+34 93 028 99 20",
  serviceHours: "Monday–Friday, 09:00–17:00",
  contactUrl: "https://es.diplomatie.gouv.fr/fr/contact",
  appointmentRequired: true,
  actions: [
    {
      id: "police-report",
      title: "Report the loss to local police",
      description:
        "The official French procedure requires a loss abroad to be reported to local police and to the nearest French embassy or consulate.",
      sourceUrl: "https://www.service-public.fr/particuliers/vosdroits/F21246",
    },
    {
      id: "consulate-contact",
      title: "Contact the French consulate",
      description:
        "Use the official contact channel or emergency telephone number. Micro-Embassy prepares the message but does not claim it was delivered.",
      sourceUrl: "https://es.diplomatie.gouv.fr/fr/consulat-general-de-france-barcelone",
    },
    {
      id: "appointment",
      title: "Confirm the required appointment",
      description:
        "Passport and national identity applications at the Barcelona consulate require an appointment in advance.",
      sourceUrl: "https://es.diplomatie.gouv.fr/fr/consulat-general-de-france-barcelone",
    },
    {
      id: "prepare-originals",
      title: "Prepare original supporting documents",
      description:
        "Official guidance requires original supporting documents. Scans help prepare the case but do not replace the originals requested by the authority.",
      sourceUrl: "https://www.service-public.fr/particuliers/vosdroits/F21246",
    },
    {
      id: "temporary-passport",
      title: "Check emergency-document eligibility",
      description:
        "A temporary emergency passport is exceptional and is not issued automatically. The consulate decides eligibility.",
      sourceUrl: "https://www.service-public.fr/particuliers/vosdroits/F1373",
    },
  ],
  sources: [
    {
      label: "French Consulate General in Barcelona",
      url: "https://es.diplomatie.gouv.fr/fr/consulat-general-de-france-barcelone",
      authority: "Ministry for Europe and Foreign Affairs",
      verifiedDate: "2026-08-29",
    },
    {
      label: "Passport renewal after loss abroad",
      url: "https://www.service-public.fr/particuliers/vosdroits/F21246",
      authority: "Service-Public.fr",
      verifiedDate: "2026-08-29",
    },
    {
      label: "Emergency temporary passport eligibility",
      url: "https://www.service-public.fr/particuliers/vosdroits/F1373",
      authority: "Service-Public.fr",
      verifiedDate: "2026-08-29",
    },
  ],
};

export function getRecoveryPlan(incident: IncidentData): RecoveryPlan {
  if (
    incident.nationality.toLocaleLowerCase() === "french" &&
    incident.currentCity.toLocaleLowerCase() === "barcelona" &&
    incident.currentCountry.toLocaleLowerCase() === "spain"
  ) {
    return franceBarcelonaPlan;
  }

  return {
    authorityName: `${incident.nationality} consular services`,
    address: "Use the official diplomatic directory to locate the competent office.",
    emergencyPhone: "Not verified for this demo route",
    serviceHours: "Verify on the official authority website",
    contactUrl: "https://www.diplomatie.gouv.fr/fr/le-ministere/reseau-diplomatique",
    appointmentRequired: true,
    actions: [
      {
        id: "official-directory",
        title: "Locate the competent official authority",
        description:
          "This location is outside the curated demo route. Continue only through the official diplomatic directory.",
        sourceUrl: "https://www.diplomatie.gouv.fr/fr/le-ministere/reseau-diplomatique",
      },
    ],
    sources: [
      {
        label: "French diplomatic network directory",
        url: "https://www.diplomatie.gouv.fr/fr/le-ministere/reseau-diplomatique",
        authority: "Ministry for Europe and Foreign Affairs",
        verifiedDate: "2026-08-29",
      },
    ],
  };
}

export function buildPreparedContactMessage(
  incident: IncidentData,
  caseData: EmergencyCaseData,
) {
  const flight = caseData.facts["FLIGHT NUMBER"]?.value;
  const booking = caseData.facts["BOOKING REF."]?.value;
  const documentNumber = caseData.facts["DOCUMENT NO."]?.value;

  return [
    "Subject: Lost passport abroad — request for official recovery instructions",
    "",
    "Bonjour,",
    "",
    `My name is ${caseData.travelerName}. I am a ${incident.nationality} national currently in ${incident.currentCity}, ${incident.currentCountry}.`,
    `I reported that my ${incident.lostItem.replaceAll("-", " ")} was lost on ${incident.incidentDate}.`,
    documentNumber
      ? `A reviewed copy references document number ${documentNumber}.`
      : "I have reviewed identity evidence available in my temporary case.",
    flight
      ? `My planned return flight is ${flight}${booking ? `, booking ${booking}` : ""}, departing ${incident.plannedDeparture}.`
      : `My planned departure is ${incident.plannedDeparture}.`,
    "",
    "Please confirm the official procedure, required originals, and whether an appointment or emergency travel document is appropriate.",
    "",
    `Micro-Embassy case reference: ${caseData.caseId}`,
    "",
    "Cordialement,",
    caseData.travelerName,
  ].join("\n");
}
