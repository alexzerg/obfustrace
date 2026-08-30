export type FindingType =
  | "aws-access-key"
  | "aws-arn"
  | "aws-account"
  | "bearer-token"
  | "credential"
  | "database-user"
  | "database-password"
  | "email"
  | "hostname"
  | "ip-address"
  | "jwt"
  | "uuid";

export type MappingEntry = {
  type: FindingType;
  original: string;
  alias: string;
  occurrences: number;
};

export type SanitizationCertificate = {
  lineCountPreserved: boolean;
  stackFrameCountPreserved: boolean;
  fingerprintPreserved: boolean;
  residualFindings: number;
  safeToCopy: boolean;
  fingerprint: string;
};

export type SanitizationResult = {
  sanitized: string;
  mappings: MappingEntry[];
  certificate: SanitizationCertificate;
};

export const SAMPLE_TRACE = `2026-08-29T19:12:44.201Z ERROR payment-service request failed
request_id=3f2504e0-4f89-41d3-9a0c-0305e82c3301
customer_email=alice@acme-corp.com
POST https://api.partner-payments.com/v1/settlements
Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhbGljZSIsInJvbGUiOiJhZG1pbiJ9.fake-signature
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
resource=arn:aws:rds:us-east-1:123456789012:db:prod-payments
database_url=postgres://prod_admin:SuperSecret123!@10.42.7.18:5432/payments
upstream=payments-db.internal.acme.local
Error: connection refused by 10.42.7.18
    at connectDatabase (/srv/payment-service/db.ts:84:17)
    at settleInvoice (/srv/payment-service/settlement.ts:219:11)
    at processTicksAndRejections (node:internal/process/task_queues:95:5)`;

const RESERVED_IPS = [
  ["192.0.2.", 1],
  ["198.51.100.", 1],
  ["203.0.113.", 1],
] as const;

function simpleHash(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function isReservedAlias(value: string) {
  return (
    /^\[(?:[A-Z_]+)_\d+\](?:\.\[(?:[A-Z_]+)_\d+\])*$/.test(value) ||
    /^(?:192\.0\.2|198\.51\.100|203\.0\.113)\.\d+$/.test(value) ||
    /@example\.invalid$/i.test(value) ||
    /\.internal\.example$/i.test(value) ||
    /^00000000-0000-4000-8000-\d{12}$/.test(value) ||
    /^000000000\d{3}$/.test(value) ||
    /^AKIA0{13}\d{3}$/.test(value) ||
    /^arn:aws:[^:]+:[^:]*:000000000\d{3}:[^\s]*synthetic-\d+$/.test(value)
  );
}

function stackFrameCount(value: string) {
  return value.split("\n").filter((line) => /^\s*at\s+/.test(line)).length;
}

export function sanitizeTrace(input: string): SanitizationResult {
  const mappingByOriginal = new Map<string, MappingEntry>();
  const counters = new Map<FindingType, number>();
  let sanitized = input;

  function aliasFor(type: FindingType, original: string, factory: (index: number) => string) {
    const existing = mappingByOriginal.get(original);
    if (existing) {
      existing.occurrences += 1;
      return existing.alias;
    }
    const index = (counters.get(type) ?? 0) + 1;
    counters.set(type, index);
    const entry: MappingEntry = {
      type,
      original,
      alias: factory(index),
      occurrences: 1,
    };
    mappingByOriginal.set(original, entry);
    return entry.alias;
  }

  sanitized = sanitized.replace(
    /\b([a-z][a-z0-9+.-]*:\/\/)([^:@/\s]+):([^@/\s]+)@/gi,
    (_match, scheme: string, user: string, password: string) =>
      `${scheme}${aliasFor("database-user", user, (index) => `[DB_USER_${index}]`)}:${aliasFor("database-password", password, (index) => `[DB_PASSWORD_${index}]`)}@`,
  );

  sanitized = sanitized.replace(
    /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{3,}\b/g,
    (value) =>
      aliasFor(
        "jwt",
        value,
        (index) => `[JWT_HEADER_${index}].[JWT_PAYLOAD_${index}].[JWT_SIGNATURE_${index}]`,
      ),
  );

  sanitized = sanitized.replace(
    /\bBearer\s+([^\s,;]+)/gi,
    (match, token: string) => {
      if (token.startsWith("[JWT_HEADER_")) {
        return match;
      }
      return `Bearer ${aliasFor("bearer-token", token, (index) => `[BEARER_TOKEN_${index}]`)}`;
    },
  );

  sanitized = sanitized.replace(/\bAKIA[A-Z0-9]{16}\b/g, (value) =>
    aliasFor("aws-access-key", value, (index) => `AKIA${String(index).padStart(16, "0")}`),
  );

  sanitized = sanitized.replace(
    /\barn:aws:([a-z0-9-]+):([^:\s]*):(\d{12}):([^\s]+)/gi,
    (value, service: string, region: string, _account: string, resource: string) => {
      const resourcePrefix = resource.includes(":")
        ? `${resource.split(":")[0]}:`
        : resource.includes("/")
          ? `${resource.split("/")[0]}/`
          : "resource/";
      return aliasFor(
        "aws-arn",
        value,
        (index) =>
          `arn:aws:${service}:${region || "us-east-1"}:${String(index).padStart(12, "0")}:${resourcePrefix}synthetic-${index}`,
      );
    },
  );

  sanitized = sanitized.replace(/\b\d{12}\b/g, (value) => {
    if (isReservedAlias(value)) return value;
    return aliasFor("aws-account", value, (index) => String(index).padStart(12, "0"));
  });

  sanitized = sanitized.replace(
    /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
    (value) =>
      aliasFor(
        "uuid",
        value,
        (index) => `00000000-0000-4000-8000-${String(index).padStart(12, "0")}`,
      ),
  );

  sanitized = sanitized.replace(
    /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    (value) => {
      if (isReservedAlias(value)) return value;
      return aliasFor("email", value, (index) => `user${index}@example.invalid`);
    },
  );

  let ipIndex = 0;
  sanitized = sanitized.replace(
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    (value) => {
      if (isReservedAlias(value)) return value;
      const [prefix] = RESERVED_IPS[ipIndex % RESERVED_IPS.length];
      ipIndex += 1;
      return aliasFor("ip-address", value, (index) => `${prefix}${Math.min(index, 254)}`);
    },
  );

  sanitized = sanitized.replace(
    /\b(?=[a-z0-9.-]*[a-z])(?:[a-z0-9-]+\.)+(?:internal|local|corp|lan|com|net|org)\b/gi,
    (value) => {
      if (isReservedAlias(value) || value.endsWith("example.invalid")) return value;
      return aliasFor("hostname", value, (index) => `service${index}.internal.example`);
    },
  );

  sanitized = sanitized.replace(
    /\b(password|passwd|pwd|secret|api[_-]?key|token)\s*[:=]\s*([^\s,;]+)/gi,
    (match, key: string, value: string) => {
      if (value.startsWith("[")) return match;
      return `${key}=${aliasFor("credential", value, (index) => `[CREDENTIAL_${index}]`)}`;
    },
  );

  const mappings = [...mappingByOriginal.values()];
  let originalCanonical = input;
  let sanitizedCanonical = sanitized;
  for (const mapping of mappings) {
    originalCanonical = originalCanonical.split(mapping.original).join(`<${mapping.type}>`);
    sanitizedCanonical = sanitizedCanonical.split(mapping.alias).join(`<${mapping.type}>`);
  }

  const residualFindings = detectSensitiveValues(sanitized).length;
  const lineCountPreserved = input.split("\n").length === sanitized.split("\n").length;
  const stackFrameCountPreserved = stackFrameCount(input) === stackFrameCount(sanitized);
  const fingerprint = simpleHash(originalCanonical);
  const fingerprintPreserved = fingerprint === simpleHash(sanitizedCanonical);

  return {
    sanitized,
    mappings,
    certificate: {
      lineCountPreserved,
      stackFrameCountPreserved,
      fingerprintPreserved,
      residualFindings,
      safeToCopy:
        mappings.length > 0 &&
        residualFindings === 0 &&
        lineCountPreserved &&
        stackFrameCountPreserved &&
        fingerprintPreserved,
      fingerprint,
    },
  };
}

export function rehydrateText(value: string, mappings: MappingEntry[]) {
  return [...mappings]
    .sort((left, right) => right.alias.length - left.alias.length)
    .reduce(
      (output, mapping) => output.split(mapping.alias).join(mapping.original),
      value,
    );
}

export function detectSensitiveValues(value: string) {
  const findings: string[] = [];
  const patterns = [
    /\bAKIA[A-Z0-9]{16}\b/g,
    /\beyJ[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{6,}\.[A-Za-z0-9_-]{3,}\b/g,
    /\bBearer\s+(?!\[)[^\s,;]+/gi,
    /\b[A-Z0-9._%+-]+@(?!example\.invalid)[A-Z0-9.-]+\.[A-Z]{2,}\b/gi,
    /\b(?:\d{1,3}\.){3}\d{1,3}\b/g,
    /\barn:aws:[^\s]+/gi,
    /\b(password|passwd|pwd|secret|api[_-]?key|token)\s*[:=]\s*(?!\[)[^\s,;]+/gi,
  ];
  for (const pattern of patterns) {
    for (const match of value.matchAll(pattern)) {
      if (!isReservedAlias(match[0]) && !/^(?:192\.0\.2|198\.51\.100|203\.0\.113)\./.test(match[0])) {
        findings.push(match[0]);
      }
    }
  }
  return findings;
}
